import { NextResponse } from 'next/server';
import { qstash } from '@/lib/qstash';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { ses } from '@/lib/ses';
import { db } from '@/db';
import {
  emails,
  apiKeys,
  suppressionList,
  templates,
  domains,
} from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { hashApiKey } from '@/lib/api-keys';
import { injectOpenTracking } from '@/lib/tracking';
import { substituteVariables } from '@/lib/templates';
import { publishEvent } from '@/lib/events';
import { checkEmailLimit } from '@/lib/plan-limits';

// Default sender email for free users
const DEFAULT_FROM_EMAIL =
  process.env.SES_FROM_EMAIL ||
  'noreply@fwd.sarthak.online';

// Validate and get sender email address
async function validateFromAddress(
  fromInput: string | undefined,
  userId: string,
): Promise<{
  valid: boolean;
  fromEmail: string;
  error?: string;
}> {
  // No custom from = use default
  if (!fromInput) {
    return { valid: true, fromEmail: DEFAULT_FROM_EMAIL };
  }

  // Parse "Name <email@domain.com>" or "email@domain.com"
  const emailMatch =
    fromInput.match(/<([^>]+)>/) ||
    fromInput.match(/^([^\s<]+@[^\s>]+)$/);
  const email = emailMatch
    ? emailMatch[1].toLowerCase()
    : fromInput.toLowerCase();

  // Extract domain from email
  const domainMatch = email.match(/@([^@]+)$/);
  if (!domainMatch) {
    return {
      valid: false,
      fromEmail: '',
      error: 'Invalid from email format',
    };
  }

  const domain = domainMatch[1];

  // Check if it's the default domain (allowed for everyone)
  const defaultDomain = DEFAULT_FROM_EMAIL.split('@')[1];
  if (domain === defaultDomain) {
    return { valid: true, fromEmail: fromInput };
  }

  // Check if user has this domain verified
  const verifiedDomain = await db.query.domains.findFirst({
    where: and(
      eq(domains.userId, userId),
      eq(domains.domain, domain),
      eq(domains.status, 'verified'),
    ),
  });

  if (!verifiedDomain) {
    return {
      valid: false,
      fromEmail: '',
      error: `Domain '${domain}' is not verified. Add and verify it in your dashboard first.`,
    };
  }

  return { valid: true, fromEmail: fromInput };
}

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'Missing API key. Include x-api-key header.',
        },
        { status: 401 },
      );
    }

    const body = await req.json();
    let {
      to,
      subject,
      html,
      text,
      templateId,
      variables,
      from,
      replyTo,
    } = body;

    const keyHash = hashApiKey(apiKey);
    const keyRecord = await db.query.apiKeys.findFirst({
      where: and(
        eq(apiKeys.keyHash, keyHash),
        isNull(apiKeys.revokedAt),
      ),
    });

    if (!keyRecord) {
      return NextResponse.json(
        { error: 'Invalid or revoked API key' },
        { status: 401 },
      );
    }

    if (templateId) {
      const template = await db.query.templates.findFirst({
        where: and(
          eq(templates.id, templateId),
          eq(templates.userId, keyRecord.userId),
        ),
      });

      if (!template) {
        return NextResponse.json(
          {
            error: 'Template not found or not owned by you',
          },
          { status: 404 },
        );
      }

      const vars = variables || {};
      subject = substituteVariables(template.subject, vars);
      html = substituteVariables(template.html, vars);
    }

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        {
          error:
            'Missing fields: to, subject, and html or text required',
        },
        { status: 400 },
      );
    }

    // Check plan-based monthly email limit
    const emailLimitCheck = await checkEmailLimit(
      keyRecord.userId,
    );

    if (!emailLimitCheck.allowed) {
      return NextResponse.json(
        { error: emailLimitCheck.error },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(
              emailLimitCheck.limit,
            ),
            'X-RateLimit-Remaining': '0',
          },
        },
      );
    }

    const { limit: rateLimit, remaining } = emailLimitCheck;

    const recipientEmail = (
      Array.isArray(to) ? to[0] : to
    ).toLowerCase();
    const suppressed =
      await db.query.suppressionList.findFirst({
        where: eq(suppressionList.email, recipientEmail),
      });

    if (suppressed) {
      return NextResponse.json(
        {
          error: `Email to ${recipientEmail} blocked: recipient is on suppression list (${suppressed.reason})`,
        },
        { status: 400 },
      );
    }

    // Validate custom from address
    const fromValidation = await validateFromAddress(
      from,
      keyRecord.userId,
    );
    if (!fromValidation.valid) {
      return NextResponse.json(
        { error: fromValidation.error },
        { status: 400 },
      );
    }
    const validatedFrom = fromValidation.fromEmail;

    const [emailRecord] = await db
      .insert(emails)
      .values({
        userId: keyRecord.userId,
        to,
        fromEmail: validatedFrom,
        subject,
        html,
        text,
        status: 'processing',
      })
      .returning({ id: emails.id, userId: emails.userId });

    const isProd = !!process.env.VERCEL;

    if (!isProd) {
      // DEV: Direct Send via SES
      console.log(
        '📧 [DEV MODE] Sending email directly...',
      );

      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        'http://localhost:3000';
      const trackedHtml = html
        ? injectOpenTracking(html, emailRecord.id, baseUrl)
        : undefined;

      const command = new SendEmailCommand({
        Source: validatedFrom,
        Destination: {
          ToAddresses: Array.isArray(to) ? to : [to],
        },
        ReplyToAddresses: replyTo ? [replyTo] : undefined,
        Message: {
          Subject: { Data: subject },
          Body: {
            Html: trackedHtml
              ? { Data: trackedHtml }
              : undefined,
            Text: text ? { Data: text } : undefined,
          },
        },
        ConfigurationSetName: 'fwd-notifications',
      });
      const response = await ses.send(command);
      console.log(
        `✅ [DEV MODE] Email sent! SES ID: ${response.MessageId}`,
      );

      db.update(emails)
        .set({
          status: 'completed',
          sesMessageId: response.MessageId,
          updatedAt: new Date(),
        })
        .where(eq(emails.id, emailRecord.id))
        .then(() => {})
        .catch(console.error);

      db.update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, keyRecord.id))
        .then(() => {})
        .catch(console.error);

      await publishEvent(
        emailRecord.userId!,
        'email.sent',
        {
          emailId: emailRecord.id,
          to: Array.isArray(to) ? to[0] : to,
          templateId,
        },
      );

      return NextResponse.json(
        {
          success: true,
          emailId: emailRecord.id,
          messageId: response.MessageId,
          status: 'sent',
          rateLimit: {
            limit: rateLimit,
            remaining: remaining - 1,
          },
        },
        {
          headers: {
            'X-RateLimit-Limit': String(rateLimit),
            'X-RateLimit-Remaining': String(remaining - 1),
          },
        },
      );
    }

    // PROD: Queue via QStash
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const response = await qstash.publishJSON({
      url: `${baseUrl}/api/qstash/email`,
      body: {
        emailId: emailRecord.id,
        to,
        subject,
        html,
        text,
        from: validatedFrom,
        replyTo,
      },
      retries: 3,
    });

    Promise.all([
      db
        .update(emails)
        .set({
          messageId: response.messageId,
          updatedAt: new Date(),
        })
        .where(eq(emails.id, emailRecord.id)),
      db
        .update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, keyRecord.id)),
    ]).catch(console.error);

    await publishEvent(keyRecord.userId, 'email.sent', {
      emailId: emailRecord.id,
      to: Array.isArray(to) ? to[0] : to,
      templateId,
    });

    return NextResponse.json(
      {
        success: true,
        emailId: emailRecord.id,
        messageId: response.messageId,
        status: 'queued',
        rateLimit: {
          limit: rateLimit,
          remaining: remaining - 1,
        },
      },
      {
        headers: {
          'X-RateLimit-Limit': String(rateLimit),
          'X-RateLimit-Remaining': String(remaining - 1),
        },
      },
    );
  } catch (error: any) {
    console.error('Email error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 },
    );
  }
}
