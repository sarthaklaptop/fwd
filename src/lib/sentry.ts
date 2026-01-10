import * as Sentry from '@sentry/nextjs';

/**
 * Log types for categorizing events
 */
type LogSource =
  | 'qstash'
  | 'campaigns'
  | 'ses'
  | 'webhook'
  | 'api'
  | 'auth';

/**
 * Log an error to Sentry with structured context
 * Use for all caught errors in API routes
 */
export function logError(
  error: Error | unknown,
  context: {
    source: LogSource;
    userId?: string | null;
    batchId?: string | null;
    emailId?: string;
    extra?: Record<string, unknown>;
  }
) {
  const err =
    error instanceof Error
      ? error
      : new Error(String(error));

  Sentry.captureException(err, {
    tags: {
      source: context.source,
      userId: context.userId,
      batchId: context.batchId,
    },
    extra: {
      emailId: context.emailId,
      ...context.extra,
    },
  });
}

/**
 * Add a breadcrumb for important events
 * Breadcrumbs create a trail leading up to errors
 */
export function logEvent(
  category: string,
  message: string,
  data?: Record<string, unknown>,
  level: Sentry.SeverityLevel = 'info'
) {
  Sentry.addBreadcrumb({
    category,
    message,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Log batch/campaign lifecycle events
 * Only logs start and end - not every email (cost efficient)
 */
export function logBatchProgress(
  batchId: string,
  status: 'started' | 'completed' | 'failed',
  data: {
    emailCount?: number;
    userId?: string;
    templateId?: string;
    error?: string;
  }
) {
  const level: Sentry.SeverityLevel =
    status === 'failed' ? 'error' : 'info';

  Sentry.addBreadcrumb({
    category: 'batch',
    message: `Batch ${status}: ${batchId}`,
    level,
    data: {
      batchId,
      status,
      ...data,
    },
  });

  // Also capture as event if failed
  if (status === 'failed') {
    Sentry.captureMessage(`Batch failed: ${batchId}`, {
      level: 'error',
      tags: {
        source: 'campaigns',
        batchId,
        userId: data.userId,
      },
      extra: data,
    });
  }
}

/**
 * Log email delivery events (bounces, complaints)
 * These are important for deliverability monitoring
 */
export function logEmailEvent(
  type: 'bounce' | 'complaint' | 'delivery',
  data: {
    emailId?: string;
    email?: string;
    reason?: string;
    bounceType?: string;
  }
) {
  const level: Sentry.SeverityLevel =
    type === 'delivery' ? 'info' : 'warning';

  Sentry.addBreadcrumb({
    category: 'email-event',
    message: `Email ${type}`,
    level,
    data,
  });

  // Bounces and complaints are important - capture as events
  if (type !== 'delivery') {
    Sentry.captureMessage(`Email ${type}: ${data.email}`, {
      level: 'warning',
      tags: {
        source: 'ses',
        eventType: type,
      },
      extra: data,
    });
  }
}

/**
 * Set user context for all subsequent events
 * Call this after authentication
 */
export function setUserContext(user: {
  id: string;
  email?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
  Sentry.setUser(null);
}
