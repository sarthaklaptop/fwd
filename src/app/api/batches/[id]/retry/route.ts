import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { batches, emails } from '@/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { ApiResponse } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';
import { qstash } from '@/lib/qstash';

const isProd = process.env.NODE_ENV === 'production';
const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new ApiError(
      401,
      'Please log in to retry emails',
    ).send();
  }

  const { id: batchId } = await params;

  // Verify batch belongs to user
  const [batch] = await db
    .select()
    .from(batches)
    .where(
      and(
        eq(batches.id, batchId),
        eq(batches.userId, user.id),
      ),
    )
    .limit(1);

  if (!batch) {
    return new ApiError(404, 'Batch not found').send();
  }

  // Get all failed emails for this batch
  const failedEmails = await db
    .select({
      id: emails.id,
      to: emails.to,
      subject: emails.subject,
      html: emails.html,
      text: emails.text,
      userId: emails.userId,
      fromEmail: emails.fromEmail,
    })
    .from(emails)
    .where(
      and(
        eq(emails.batchId, batchId),
        eq(emails.status, 'failed'),
      ),
    );

  if (failedEmails.length === 0) {
    return new ApiResponse(
      200,
      { retried: 0 },
      'No failed emails to retry',
    ).send();
  }

  const emailIds = failedEmails.map((e) => e.id);

  // Reset failed emails to pending
  await db
    .update(emails)
    .set({
      status: 'pending',
      errorMessage: null,
      updatedAt: new Date(),
    })
    .where(inArray(emails.id, emailIds));

  // Update batch status to processing and decrement failed count
  await db
    .update(batches)
    .set({
      status: 'processing',
      failed: sql`failed - ${emailIds.length}`,
    })
    .where(eq(batches.id, batchId));

  if (isProd) {
    // Production: Queue via QStash with full email data
    for (const email of failedEmails) {
      await qstash.publishJSON({
        url: `${baseUrl}/api/qstash/email`,
        body: {
          emailId: email.id,
          to: email.to,
          subject: email.subject,
          html: email.html,
          text: email.text,
          userId: email.userId || user.id,
          from: email.fromEmail || batch.fromEmail,
        },
        retries: 3,
      });
    }

    console.log(
      `[Retry] Queued ${emailIds.length} failed emails for batch ${batchId}`,
    );
  } else {
    // Dev mode: Queue via QStash campaign worker
    await qstash.publishJSON({
      url: `${baseUrl}/api/qstash/campaign`,
      body: { batchId, retryOnly: true, emailIds },
      retries: 3,
    });

    console.log(
      `[Retry] DEV: Triggering retry for ${emailIds.length} emails in batch ${batchId}`,
    );
  }

  return new ApiResponse(
    200,
    { retried: failedEmails.length },
    `Retrying ${failedEmails.length} failed email(s)`,
  ).send();
}
