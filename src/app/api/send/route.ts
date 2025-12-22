import { NextResponse } from "next/server";
import { qstash } from "@/lib/qstash";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { db } from "@/db";
import { emails, apiKeys, suppressionList } from "@/db/schema";
import { eq, and, isNull, gte, count } from "drizzle-orm";
import { hashApiKey } from "@/lib/api-keys";
import { injectOpenTracking } from "@/lib/tracking";

const ses = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const DAILY_LIMIT = 100;

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key. Include x-api-key header." }, { status: 401 });
    }

    const body = await req.json();
    const { to, subject, html, text } = body;

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Validate API key
    const keyHash = hashApiKey(apiKey);
    const keyRecord = await db.query.apiKeys.findFirst({
      where: and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt))
    });

    if (!keyRecord) {
      return NextResponse.json({ error: "Invalid or revoked API key" }, { status: 401 });
    }

    // Rate limiting: 100 emails/day per user
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [emailCount] = await db
      .select({ count: count() })
      .from(emails)
      .where(and(
        eq(emails.userId, keyRecord.userId),
        gte(emails.createdAt, today)
      ));

    const emailsSentToday = emailCount?.count || 0;
    const remaining = DAILY_LIMIT - emailsSentToday;

    if (emailsSentToday >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: "Daily limit reached (100 emails/day). Resets at midnight UTC." },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(DAILY_LIMIT),
            'X-RateLimit-Remaining': '0',
          }
        }
      );
    }

    // Check suppression list
    const recipientEmail = (Array.isArray(to) ? to[0] : to).toLowerCase();
    const suppressed = await db.query.suppressionList.findFirst({
      where: eq(suppressionList.email, recipientEmail)
    });

    if (suppressed) {
      return NextResponse.json({
        error: `Email to ${recipientEmail} blocked: recipient is on suppression list (${suppressed.reason})`
      }, { status: 400 });
    }

    // Create email record
    const [emailRecord] = await db.insert(emails).values({
      userId: keyRecord.userId,
      to,
      subject,
      html,
      text,
      status: 'processing',
    }).returning({ id: emails.id });

    const isProd = !!process.env.VERCEL;

    if (!isProd) {
      // DEV MODE: Send directly
      console.log("📧 [DEV MODE] Sending email directly...");

      // Inject open tracking pixel into HTML content
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const trackedHtml = html ? injectOpenTracking(html, emailRecord.id, baseUrl) : undefined;

      const command = new SendEmailCommand({
        Source: process.env.SES_FROM_EMAIL || "sarthaklaptop402@gmail.com",
        Destination: { ToAddresses: Array.isArray(to) ? to : [to] },
        Message: {
          Subject: { Data: subject },
          Body: {
            Html: trackedHtml ? { Data: trackedHtml } : undefined,
            Text: text ? { Data: text } : undefined,
          },
        },
        ConfigurationSetName: "fwd-notifications",
      });
      const response = await ses.send(command);
      console.log(`✅ [DEV MODE] Email sent! SES ID: ${response.MessageId}`);

      // Update status async (don't wait)
      db.update(emails)
        .set({ status: 'completed', sesMessageId: response.MessageId, updatedAt: new Date() })
        .where(eq(emails.id, emailRecord.id))
        .then(() => { })
        .catch(console.error);

      // Update lastUsedAt async (don't wait)
      db.update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, keyRecord.id))
        .then(() => { })
        .catch(console.error);

      return NextResponse.json({
        success: true,
        emailId: emailRecord.id,
        messageId: response.MessageId,
        status: "sent",
        rateLimit: { limit: DAILY_LIMIT, remaining: remaining - 1 },
      }, {
        headers: {
          'X-RateLimit-Limit': String(DAILY_LIMIT),
          'X-RateLimit-Remaining': String(remaining - 1),
        }
      });
    }

    // PROD: Queue via QStash
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const response = await qstash.publishJSON({
      url: `${baseUrl}/api/qstash/email`,
      body: { emailId: emailRecord.id, to, subject, html, text },
      retries: 3,
    });

    // Update status and lastUsedAt async (don't wait for response)
    Promise.all([
      db.update(emails)
        .set({ messageId: response.messageId, updatedAt: new Date() })
        .where(eq(emails.id, emailRecord.id)),
      db.update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, keyRecord.id)),
    ]).catch(console.error);

    return NextResponse.json({
      success: true,
      emailId: emailRecord.id,
      messageId: response.messageId,
      status: "queued",
      rateLimit: { limit: DAILY_LIMIT, remaining: remaining - 1 },
    }, {
      headers: {
        'X-RateLimit-Limit': String(DAILY_LIMIT),
        'X-RateLimit-Remaining': String(remaining - 1),
      }
    });
  } catch (error: any) {
    console.error("Email error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}