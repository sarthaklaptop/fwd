import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { resolveSender } from '@/lib/sender';
import { db } from '@/db';
import { emails } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { syncBatchCounts } from '@/lib/batch-counts';
import { classifySendError } from '@/lib/send-errors';
import { isFinalQStashAttempt } from '@/lib/qstash-config';
import { deliverEmail } from '@/lib/deliver-email';
import { logError } from '@/lib/sentry';

const SENT_STATUSES = new Set(['completed', 'bounced', 'complained']);

async function markFailed(
  emailId: string,
  batchId: string | null | undefined,
  errorMessage: string,
) {
  await db
    .update(emails)
    .set({ status: 'failed', errorMessage, updatedAt: new Date() })
    .where(eq(emails.id, emailId));
  console.log(`📝 Updated email ${emailId} status to 'failed'`);
  if (batchId) await syncBatch(batchId);
}

async function syncBatch(batchId: string) {
  const result = await syncBatchCounts(batchId);
  if (result?.justFinished) {
    console.log(
      `Batch ${batchId} completed with status: ${result.status}`
    );
  }
}

async function handler(req: NextRequest) {
  const body = await req.json();
  const {
    emailId,
    to,
    subject,
    html,
    text,
    userId,
    from,
    replyTo,
  } = body;

  // Malformed job: nothing to send or record, so don't let QStash retry it
  if (typeof emailId !== 'string' || !emailId) {
    console.error('Email job without emailId, dropping:', {
      to,
      subject,
    });
    return NextResponse.json({
      success: false,
      error: 'Missing emailId',
    });
  }

  const emailRecord = await db.query.emails.findFirst({
    where: eq(emails.id, emailId),
    columns: { batchId: true, userId: true, status: true },
  });

  if (!emailRecord) {
    console.error(`Email ${emailId} not found, dropping job`);
    return NextResponse.json({
      success: false,
      error: 'Email not found',
    });
  }

  // QStash delivers at least once: never send the same email twice
  if (SENT_STATUSES.has(emailRecord.status)) {
    console.log(
      `Email ${emailId} already ${emailRecord.status}, skipping duplicate delivery`
    );
    return NextResponse.json({ success: true, duplicate: true });
  }

  const effectiveUserId = userId || emailRecord.userId;

  // Re-check the sender against the owner's verified domains. This also
  // covers messages queued before sender validation existed on every route.
  const fromValidation = await resolveSender(
    from,
    emailRecord.userId ?? userId,
  );
  if (!fromValidation.valid) {
    console.error(
      `Email ${emailId} rejected: ${fromValidation.error}`
    );
    await markFailed(
      emailId,
      emailRecord.batchId,
      fromValidation.error
    );
    // Not retryable: return 200 so QStash doesn't resend
    return NextResponse.json({
      success: false,
      error: fromValidation.error,
    });
  }
  const fromEmail = fromValidation.fromEmail;

  console.log(
    `📧 Processing email ${emailId} to: ${to} from: ${fromEmail}`
  );

  await db
    .update(emails)
    .set({ status: 'processing', updatedAt: new Date() })
    .where(eq(emails.id, emailId));

  try {
    const response = await deliverEmail({
      emailId,
      to,
      subject,
      html,
      text,
      fromEmail,
      replyTo,
      userId: effectiveUserId,
    });
    // TODO: List-Unsubscribe header needs SendRawEmailCommand
    console.log(
      `✅ Email sent! SES ID: ${response.messageId}`
    );

    await db
      .update(emails)
      .set({
        status: 'completed',
        sesMessageId: response.messageId,
        errorMessage: null, // Clears any previous error from failed attempts
        updatedAt: new Date(),
      })
      .where(eq(emails.id, emailId));
    console.log(
      `📝 Updated email ${emailId} status to 'completed'`
    );

    if (emailRecord.batchId) {
      await syncBatch(emailRecord.batchId);
    }

    return NextResponse.json({
      success: true,
      messageId: response.messageId,
    });
  } catch (error: unknown) {
    const err = error as Error;
    const kind = classifySendError(error);
    const finalAttempt =
      kind === 'permanent' || isFinalQStashAttempt(req.headers);
    console.error(
      `Email failed (${kind}${finalAttempt ? ', final' : ', will retry'}): ${err.message}`
    );

    // Log to Sentry with context
    logError(err, {
      source: 'qstash',
      emailId,
      batchId: emailRecord.batchId ?? undefined,
      userId: effectiveUserId ?? undefined,
      extra: { to, subject, from: fromEmail, kind, finalAttempt },
    });

    if (!finalAttempt) {
      // Keep it in flight so the batch isn't finalized while QStash retries
      await db
        .update(emails)
        .set({
          errorMessage: `Attempt failed, retrying: ${err.message}`,
          updatedAt: new Date(),
        })
        .where(eq(emails.id, emailId));
      return NextResponse.json(
        { error: 'Email delivery failed, will retry' },
        { status: 500 }
      );
    }

    await markFailed(emailId, emailRecord.batchId, err.message);

    if (kind === 'permanent') {
      // Retrying cannot succeed: return 200 so QStash stops
      return NextResponse.json({
        success: false,
        error: err.message,
      });
    }

    // Transient error on the last attempt: 500 sends it to the QStash DLQ
    return NextResponse.json(
      { error: 'Email delivery failed' },
      { status: 500 }
    );
  }
}

// Wrap handler with QStash signature verification for security
export const POST = verifySignatureAppRouter(handler);
