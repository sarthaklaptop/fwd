export type SendErrorKind = 'permanent' | 'transient';

// AWS client-side error names that a later retry can still succeed for
const TRANSIENT_ERROR_NAMES = new Set([
  'Throttling',
  'ThrottlingException',
  'TooManyRequestsException',
  'RequestTimeout',
  'RequestTimeoutException',
]);

/**
 * Decide whether retrying a failed send can help.
 * Client faults (rejected recipient or sender, bad parameters, missing
 * configuration) fail the same way every time, so they are permanent.
 * Throttling, server faults and network errors are transient.
 */
export function classifySendError(error: unknown): SendErrorKind {
  const err = error as { name?: string; $fault?: string } | null;
  if (err?.name && TRANSIENT_ERROR_NAMES.has(err.name)) {
    return 'transient';
  }
  if (err?.$fault === 'client') return 'permanent';
  return 'transient';
}
