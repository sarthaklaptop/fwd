import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { ses } from '@/lib/ses';
import { db } from '@/db';
import { emails, batches } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  injectOpenTracking,
  injectUnsubscribeLink,
} from '@/lib/tracking';
import { notifyCampaignComplete } from '@/lib/discord';
import { qstash } from '@/lib/qstash';

const DEFAULT_FROM_EMAIL =
  process.env.SES_FROM_EMAIL ||
  'noreply@fwd.sarthak.online';

/**
 * QStash worker to process scheduled campaigns.
 * Called at the scheduled time to send all emails in the batch.
 */
async function handler(req: NextRequest) {
  const body = await req.json();
  const { batchId } = body;

  if (!batchId) {
    console.error('[ScheduledCampaign] Missing batchId');
    return NextResponse.json(
      { error: 'Missing batchId' },
      { status: 400 },
    );
  }

  console.log(
    `[ScheduledCampaign] Processing batch ${batchId}`,
  );

  // Fetch batch
  const batch = await db.query.batches.findFirst({
    where: eq(batches.id, batchId),
  });

  if (!batch) {
    console.error(
      `[ScheduledCampaign] Batch ${batchId} not found`,
    );
    return NextResponse.json(
      { error: 'Batch not found' },
      { status: 404 },
    );
  }

  // Only process scheduled batches
  if (batch.status !== 'scheduled') {
    console.log(
      `[ScheduledCampaign] Batch ${batchId} is not scheduled (status: ${batch.status})`,
    );
    return NextResponse.json({
      success: true,
      message: 'Batch already processed',
    });
  }

  // Update batch to processing
  await db
    .update(batches)
    .set({ status: 'processing' })
    .where(eq(batches.id, batchId));

  // Fetch all pending emails for this batch
  const emailRecords = await db
    .select()
    .from(emails)
    .where(
      and(
        eq(emails.batchId, batchId),
        eq(emails.status, 'pending'),
      ),
    );

  if (emailRecords.length === 0) {
    console.log(
      `[ScheduledCampaign] No pending emails in batch ${batchId}`,
    );
    await db
      .update(batches)
      .set({ status: 'completed' })
      .where(eq(batches.id, batchId));
    return NextResponse.json({
      success: true,
      sent: 0,
      failed: 0,
    });
  }

  console.log(
    `[ScheduledCampaign] Sending ${emailRecords.length} emails for batch ${batchId}`,
  );

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000';
  const isProd = !!process.env.VERCEL;

  // In production, queue emails via QStash for parallel processing
  if (isProd && process.env.QSTASH_TOKEN) {
    const chunkSize = 50;
    for (
      let i = 0;
      i < emailRecords.length;
      i += chunkSize
    ) {
      const chunk = emailRecords.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map((record) =>
          qstash.publishJSON({
            url: `${baseUrl}/api/qstash/email`,
            body: {
              emailId: record.id,
              to: record.to,
              subject: record.subject,
              html: record.html,
              text: record.text,
              userId: record.userId,
              from: record.fromEmail || batch.fromEmail,
            },
            retries: 3,
          }),
        ),
      );
    }

    console.log(
      `[ScheduledCampaign] Queued ${emailRecords.length} emails via QStash`,
    );

    // Batch status will be updated by the email worker as emails complete

    return NextResponse.json({
      success: true,
      queued: emailRecords.length,
      message: 'Emails queued for sending',
    });
  }

  // DEV MODE: Send directly via SES
  let successCount = 0;
  let failCount = 0;

  for (const record of emailRecords) {
    try {
      // Inject tracking
      let finalHtml = record.html || '';
      finalHtml = injectOpenTracking(
        finalHtml,
        record.id,
        baseUrl,
      );
      if (record.userId) {
        finalHtml = injectUnsubscribeLink(
          finalHtml,
          record.id,
          record.to,
          record.userId,
          baseUrl,
        );
      }

      const fromEmail =
        record.fromEmail ||
        batch.fromEmail ||
        DEFAULT_FROM_EMAIL;

      const command = new SendEmailCommand({
        Source: fromEmail,
        Destination: { ToAddresses: [record.to] },
        Message: {
          Subject: {
            Data: record.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: { Data: finalHtml, Charset: 'UTF-8' },
            ...(record.text && {
              Text: { Data: record.text, Charset: 'UTF-8' },
            }),
          },
        },
        ConfigurationSetName: 'fwd-notifications',
      });

      const response = await ses.send(command);

      await db
        .update(emails)
        .set({
          status: 'completed',
          sesMessageId: response.MessageId,
          updatedAt: new Date(),
        })
        .where(eq(emails.id, record.id));

      successCount++;
      console.log(`  ✓ Sent to ${record.to}`);
    } catch (error: unknown) {
      failCount++;
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error';
      console.error(
        `  ✗ Failed to send to ${record.to}:`,
        errorMessage,
      );

      await db
        .update(emails)
        .set({
          status: 'failed',
          errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(emails.id, record.id));
    }
  }

  // Update batch status
  const finalStatus =
    failCount === 0
      ? 'completed'
      : successCount === 0
        ? 'failed'
        : 'partial';

  await db
    .update(batches)
    .set({
      completed: successCount,
      failed: failCount,
      status: finalStatus,
    })
    .where(eq(batches.id, batchId));

  // Discord notification
  await notifyCampaignComplete(batchId, {
    total: emailRecords.length,
    sent: successCount,
    failed: failCount,
  });

  console.log(
    `[ScheduledCampaign] Batch ${batchId} complete: ${successCount} sent, ${failCount} failed`,
  );

  return NextResponse.json({
    success: true,
    sent: successCount,
    failed: failCount,
    status: finalStatus,
  });
}

// Verify QStash signature in production
export const POST = process.env.QSTASH_TOKEN
  ? verifySignatureAppRouter(handler)
  : handler;
