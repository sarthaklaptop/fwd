import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { domains } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { ApiResponse } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';
import { ses } from '@/lib/ses';
import { SendEmailCommand } from '@aws-sdk/client-ses';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new ApiError(401, 'Unauthorized').send();
  }

  const { to, subject, html, variables, from } =
    await req.json();

  // Validate required fields
  if (!to || !subject || !html) {
    return new ApiError(
      400,
      'Missing required fields'
    ).send();
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return new ApiError(
      400,
      'Invalid email address'
    ).send();
  }

  // HTML entity escaping for XSS protection
  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Apply variable substitution with XSS protection
  let finalSubject = subject;
  let finalHtml = html;

  if (variables && typeof variables === 'object') {
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      // Subject doesn't need HTML escaping
      finalSubject = finalSubject.replace(
        regex,
        String(value)
      );
      // HTML content gets escaped to prevent XSS
      finalHtml = finalHtml.replace(
        regex,
        escapeHtml(String(value))
      );
    }
  }

  // Determine from address
  let fromAddress = from;
  if (!fromAddress) {
    // Use first verified domain or fallback
    const [domain] = await db
      .select()
      .from(domains)
      .where(
        and(
          eq(domains.userId, user.id),
          eq(domains.status, 'verified')
        )
      )
      .limit(1);

    if (domain) {
      fromAddress = `test@${domain.domain}`;
    } else {
      // Fallback to environment variable
      fromAddress =
        process.env.SES_FROM_EMAIL || 'noreply@fwd.dev';
    }
  }

  // Add "[TEST]" prefix to subject
  finalSubject = `[TEST] ${finalSubject}`;

  // Send via SES
  try {
    await ses.send(
      new SendEmailCommand({
        Source: fromAddress,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: finalSubject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: finalHtml, Charset: 'UTF-8' },
          },
        },
      })
    );

    return new ApiResponse(
      200,
      { sent: true, to },
      `Test email sent to ${to}`
    ).send();
  } catch (error: unknown) {
    console.error('Failed to send test email:', error);

    // Handle specific SES errors
    const err = error as {
      name?: string;
      message?: string;
    };

    if (err.name === 'MessageRejected') {
      return new ApiError(
        400,
        'Email rejected by SES. Please verify your domain is correctly set up.'
      ).send();
    }

    if (err.name === 'MailFromDomainNotVerified') {
      return new ApiError(
        400,
        'Sending domain not verified. Please add and verify a domain first.'
      ).send();
    }

    if (
      err.message?.includes('Email address is not verified')
    ) {
      return new ApiError(
        400,
        'Email address not verified in SES. Check your domain verification.'
      ).send();
    }

    return new ApiError(
      500,
      'Failed to send test email. Please try again.'
    ).send();
  }
}
