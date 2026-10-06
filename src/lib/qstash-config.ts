// Retries QStash makes after the first attempt for every email job.
// Publishers and the email worker must agree on this number.
export const QSTASH_EMAIL_RETRIES = 3;

/**
 * True when this delivery is QStash's last attempt. QStash sends the number
 * of retries already made in the Upstash-Retried header. If the header is
 * missing we cannot tell, so we treat the attempt as final: batch counts are
 * derived from email statuses, so a later successful retry still corrects them.
 */
export function isFinalQStashAttempt(
  headers: Headers,
  maxRetries: number = QSTASH_EMAIL_RETRIES,
): boolean {
  const retried = Number.parseInt(
    headers.get('upstash-retried') ?? '',
    10,
  );
  if (Number.isNaN(retried)) return true;
  return retried >= maxRetries;
}
