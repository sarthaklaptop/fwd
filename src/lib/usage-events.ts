// Client-side signal that monthly usage may have changed (an email was sent,
// a campaign was created, a batch was retried). The dashboard sidebar listens
// for it and refetches the counter.
export const USAGE_CHANGED_EVENT = 'fwd:usage-changed';

export function notifyUsageChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(USAGE_CHANGED_EVENT));
  }
}
