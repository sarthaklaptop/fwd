import 'server-only';
import { db } from '@/db';
import { emails } from '@/db/schema';
import { inArray, sql } from 'drizzle-orm';

export type BatchStatus =
  | 'scheduled'
  | 'processing'
  | 'completed'
  | 'partial'
  | 'failed';

export interface BatchEmailCounts {
  sent: number; // completed, bounced or complained: accepted by SES
  failed: number;
  inFlight: number; // pending or processing
}

const FINAL_STATUSES = new Set<BatchStatus>([
  'completed',
  'partial',
  'failed',
]);

/**
 * Batch status implied by its emails. A batch only becomes final once no
 * email is still pending or processing.
 */
export function deriveBatchStatus(
  current: BatchStatus,
  counts: BatchEmailCounts,
): BatchStatus {
  if (counts.inFlight > 0) {
    return current === 'scheduled' ? 'scheduled' : 'processing';
  }
  if (counts.failed === 0) return 'completed';
  if (counts.sent === 0) return 'failed';
  return 'partial';
}

/**
 * Recompute a batch's completed/failed counters and status from the actual
 * status of its emails. Safe to call any number of times (retries, duplicate
 * QStash deliveries, bounces). The batch row is locked so concurrent workers
 * cannot overwrite each other with stale counts.
 */
export async function syncBatchCounts(batchId: string) {
  return db.transaction(async (tx) => {
    const [batch] = (await tx.execute(sql`
      SELECT status FROM batches WHERE id = ${batchId} FOR UPDATE
    `)) as unknown as { status: BatchStatus }[];

    if (!batch) return null;

    const [counts] = (await tx.execute(sql`
      SELECT
        count(*) FILTER (WHERE status IN ('completed', 'bounced', 'complained'))::int AS "sent",
        count(*) FILTER (WHERE status = 'failed')::int AS "failed",
        count(*) FILTER (WHERE status IN ('pending', 'processing'))::int AS "inFlight"
      FROM emails
      WHERE batch_id = ${batchId}
    `)) as unknown as BatchEmailCounts[];

    const status = deriveBatchStatus(batch.status, counts);

    await tx.execute(sql`
      UPDATE batches
      SET completed = ${counts.sent},
          failed = ${counts.failed},
          status = ${status}::batch_status
      WHERE id = ${batchId}
    `);

    return {
      ...counts,
      previousStatus: batch.status,
      status,
      justFinished:
        !FINAL_STATUSES.has(batch.status) &&
        FINAL_STATUSES.has(status),
    };
  });
}

/**
 * Mark emails that never reached the queue as failed, then resync the batch,
 * so a queueing error cannot leave a batch stuck in "processing".
 */
export async function failUnqueuedEmails(
  batchId: string,
  emailIds: string[],
  reason: string,
) {
  if (emailIds.length === 0) return;
  await db
    .update(emails)
    .set({ status: 'failed', errorMessage: reason, updatedAt: new Date() })
    .where(inArray(emails.id, emailIds));
  await syncBatchCounts(batchId);
}
