import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import {
  SESClient,
  SendEmailCommand,
} from '@aws-sdk/client-ses';
import { db } from '@/db';
import { emails, batches } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import {
  injectOpenTracking,
  injectUnsubscribeLink,
} from '@/lib/tracking';

// Initialize AWS SES
const ses = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * Atomically increment batch counter - no race condition possible.
 */
async function incrementBatchCounter(
  batchId: string,
  success: boolean
) {
  // Atomic increment - database locks row for microseconds
  const result = await db.execute(sql`
    UPDATE batches 
    SET 
      completed = completed + ${success ? 1 : 0},
      failed = failed + ${success ? 0 : 1}
    WHERE id = ${batchId}
    RETURNING queued, completed, failed
  `);

  const updated = (
    result as unknown as {
      queued: number;
      completed: number;
      failed: number;
    }[]
  )?.[0];

  // Check if all emails are processed
  if (
    updated &&
    updated.completed + updated.failed >= updated.queued
  ) {
    const status =
      updated.failed === 0
        ? 'completed'
        : updated.completed === 0
        ? 'failed'
        : 'partial';

    await db
      .update(batches)
      .set({ status })
      .where(eq(batches.id, batchId));

    console.log(
      `📊 Batch ${batchId} completed with status: ${status}`
    );
  }
}

async function handler(req: NextRequest) {
  const body = await req.json();
  const { emailId, to, subject, html, text, userId } = body;

  console.log(`📧 Processing email ${emailId} to: ${to}`);

  // Get the email record to find batch ID and userId (fallback)
  const emailRecord = await db.query.emails.findFirst({
    where: eq(emails.id, emailId),
    columns: { batchId: true, userId: true },
  });

  const effectiveUserId = userId || emailRecord?.userId;

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';

    // Process HTML: add tracking pixel and unsubscribe link
    let processedHtml = html;
    if (processedHtml) {
      // Inject open tracking pixel
      processedHtml = injectOpenTracking(
        processedHtml,
        emailId,
        baseUrl
      );

      // Inject unsubscribe link footer (only if we have userId)
      if (effectiveUserId) {
        processedHtml = injectUnsubscribeLink(
          processedHtml,
          emailId,
          to,
          effectiveUserId,
          baseUrl
        );
      }
    }

    // Build List-Unsubscribe header (TODO: implement with SendRawEmailCommand for full header support)
    // const listUnsubscribeHeader = effectiveUserId
    //   ? getListUnsubscribeHeader(emailId, to, effectiveUserId, baseUrl)
    //   : undefined;

    // Send via AWS SES with configuration set for bounce/complaint tracking
    const command = new SendEmailCommand({
      Source:
        process.env.SES_FROM_EMAIL ||
        'sarthaklaptop402@gmail.com',
      Destination: {
        ToAddresses: Array.isArray(to) ? to : [to],
      },
      Message: {
        Subject: { Data: subject },
        Body: {
          Html: processedHtml
            ? { Data: processedHtml }
            : undefined,
          Text: text ? { Data: text } : undefined,
        },
      },
      ConfigurationSetName: 'fwd-notifications',
    });

    const response = await ses.send(command);
    console.log(
      `✅ Email sent! SES ID: ${response.MessageId}`
    );

    // Update database: status = completed
    if (emailId) {
      await db
        .update(emails)
        .set({
          status: 'completed',
          sesMessageId: response.MessageId,
          errorMessage: null, // Clears any previous error from failed attempts
          updatedAt: new Date(),
        })
        .where(eq(emails.id, emailId));
      console.log(
        `📝 Updated email ${emailId} status to 'completed'`
      );

      // Update batch counter atomically
      if (emailRecord?.batchId) {
        await incrementBatchCounter(
          emailRecord.batchId,
          true
        );
      }
    }

    return NextResponse.json({
      success: true,
      messageId: response.MessageId,
    });
  } catch (error: any) {
    console.error(`❌ Email failed: ${error.message}`);

    // Update database: status = failed
    if (emailId) {
      await db
        .update(emails)
        .set({
          status: 'failed',
          errorMessage: error.message,
          updatedAt: new Date(),
        })
        .where(eq(emails.id, emailId));
      console.log(
        `📝 Updated email ${emailId} status to 'failed'`
      );

      // Update batch counter atomically
      if (emailRecord?.batchId) {
        await incrementBatchCounter(
          emailRecord.batchId,
          false
        );
      }
    }

    // Return 500 so QStash knows to retry
    return NextResponse.json(
      { error: 'Email delivery failed' },
      { status: 500 }
    );
  }
}

// Wrap handler with QStash signature verification for security
export const POST = verifySignatureAppRouter(handler);
