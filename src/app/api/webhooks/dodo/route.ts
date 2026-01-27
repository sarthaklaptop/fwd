import { NextRequest, NextResponse } from 'next/server';
import DodoPayments from 'dodopayments';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logError, logEvent } from '@/lib/sentry';

// Mode-aware environment variables
const isLiveMode = process.env.DODO_LIVE_MODE === 'true';

const DODO_API_KEY = isLiveMode
  ? process.env.DODO_API_KEY_LIVE
  : process.env.DODO_API_KEY_TEST;

const DODO_WEBHOOK_SECRET = isLiveMode
  ? process.env.DODO_WEBHOOK_SECRET_LIVE
  : process.env.DODO_WEBHOOK_SECRET_TEST;

if (!DODO_API_KEY || !DODO_WEBHOOK_SECRET) {
  const mode = isLiveMode ? 'LIVE' : 'TEST';
  throw new Error(
    `Missing required DodoPayments env vars: DODO_API_KEY_${mode} and/or DODO_WEBHOOK_SECRET_${mode}`,
  );
}

// Initialize DodoPayments client with webhook key for signature verification
const client = new DodoPayments({
  bearerToken: DODO_API_KEY,
  webhookKey: DODO_WEBHOOK_SECRET,
});

// Startup log to confirm webhook configuration
console.log('[DodoWebhook] Initialized:', {
  mode: isLiveMode ? 'LIVE' : 'TEST',
  webhookSecretPrefix:
    DODO_WEBHOOK_SECRET.substring(0, 10) + '...',
});

// Webhook event types
type WebhookEventType =
  | 'subscription.active'
  | 'subscription.renewed'
  | 'subscription.cancelled'
  | 'subscription.on_hold'
  | 'subscription.expired'
  | 'subscription.failed'
  | 'payment.failed';

interface WebhookPayload {
  business_id: string;
  type: WebhookEventType;
  timestamp: string;
  data: {
    payload_type: 'Subscription';
    subscription_id: string;
    customer: {
      customer_id: string;
      email: string;
      name?: string;
    };
    status: string;
    next_billing_date?: string;
    cancel_at_period_end?: boolean;
    metadata?: Record<string, string>;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    // Get headers for verification
    const webhookId = request.headers.get('webhook-id');
    const webhookSignature = request.headers.get(
      'webhook-signature',
    );
    const webhookTimestamp = request.headers.get(
      'webhook-timestamp',
    );

    if (
      !webhookId ||
      !webhookSignature ||
      !webhookTimestamp
    ) {
      console.error('Missing webhook headers');
      return NextResponse.json(
        { error: 'Missing webhook headers' },
        { status: 401 },
      );
    }

    // Verify webhook signature using SDK
    let payload: WebhookPayload;
    try {
      payload = client.webhooks.unwrap(rawBody, {
        headers: {
          'webhook-id': webhookId,
          'webhook-signature': webhookSignature,
          'webhook-timestamp': webhookTimestamp,
        },
      }) as unknown as WebhookPayload;
    } catch (error) {
      console.error('Invalid webhook signature:', error);
      logError(error, {
        source: 'webhook',
        extra: {
          webhookId,
          type: 'dodo_signature_invalid',
        },
      });
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 },
      );
    }

    // Log the event for debugging
    console.log(`[DodoWebhook] Received ${payload.type}`, {
      subscriptionId: payload.data.subscription_id,
      customerId: payload.data.customer.customer_id,
      email: payload.data.customer.email,
    });

    // Handle subscription events
    switch (payload.type) {
      case 'subscription.active':
        await handleSubscriptionActive(payload);
        break;

      case 'subscription.renewed':
        await handleSubscriptionRenewed(payload);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload);
        break;

      case 'subscription.on_hold':
        await handleSubscriptionOnHold(payload);
        break;

      case 'subscription.expired':
        await handleSubscriptionExpired(payload);
        break;

      case 'subscription.failed':
      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;

      default:
        console.log(
          `[DodoWebhook] Unhandled event type: ${payload.type}`,
        );
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(
      '[DodoWebhook] Error processing webhook:',
      error,
    );
    logError(error, {
      source: 'webhook',
      extra: { type: 'dodo_webhook_processing_failed' },
    });
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Event Handlers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * subscription.active - User successfully subscribed or reactivated
 * Update user to Pro plan with active status
 */
async function handleSubscriptionActive(
  payload: WebhookPayload,
) {
  const { subscription_id, customer, next_billing_date } =
    payload.data;
  const userEmail = customer.email;

  await db
    .update(users)
    .set({
      plan: 'pro',
      subscriptionId: subscription_id,
      subscriptionStatus: 'active',
      customerId: customer.customer_id,
      currentPeriodEnd: next_billing_date
        ? new Date(next_billing_date)
        : null,
      cancelAtPeriodEnd: false,
      updatedAt: new Date(),
    })
    .where(eq(users.email, userEmail));

  console.log(
    `[DodoWebhook] User ${userEmail} upgraded to Pro`,
  );
}

/**
 * subscription.renewed - Successfully charged for next billing period
 * Update the next billing date
 */
async function handleSubscriptionRenewed(
  payload: WebhookPayload,
) {
  const { subscription_id, customer, next_billing_date } =
    payload.data;
  const userEmail = customer.email;

  await db
    .update(users)
    .set({
      subscriptionStatus: 'active',
      currentPeriodEnd: next_billing_date
        ? new Date(next_billing_date)
        : null,
      cancelAtPeriodEnd: false,
      updatedAt: new Date(),
    })
    .where(eq(users.subscriptionId, subscription_id));

  console.log(
    `[DodoWebhook] Subscription renewed for ${userEmail}`,
  );
}

/**
 * subscription.cancelled - User cancelled (but still has access until period end)
 * Mark as cancelled, keep Pro access until currentPeriodEnd
 */
async function handleSubscriptionCancelled(
  payload: WebhookPayload,
) {
  const { subscription_id, customer } = payload.data;
  const userEmail = customer.email;

  await db
    .update(users)
    .set({
      subscriptionStatus: 'cancelled',
      cancelAtPeriodEnd: true,
      updatedAt: new Date(),
    })
    .where(eq(users.subscriptionId, subscription_id));

  console.log(
    `[DodoWebhook] Subscription cancelled for ${userEmail} (access until period end)`,
  );
}

/**
 * subscription.on_hold - Payment failed, subscription paused
 * Keep Pro access during grace period (handled in feature gating)
 */
async function handleSubscriptionOnHold(
  payload: WebhookPayload,
) {
  const { subscription_id, customer } = payload.data;
  const userEmail = customer.email;

  await db
    .update(users)
    .set({
      subscriptionStatus: 'on_hold',
      updatedAt: new Date(),
    })
    .where(eq(users.subscriptionId, subscription_id));

  console.log(
    `[DodoWebhook] Subscription on hold for ${userEmail} (payment failed)`,
  );
}

/**
 * subscription.expired - Subscription ended (either cancelled period ended or failed too many times)
 * Downgrade to free plan
 */
async function handleSubscriptionExpired(
  payload: WebhookPayload,
) {
  const { subscription_id, customer } = payload.data;
  const userEmail = customer.email;

  await db
    .update(users)
    .set({
      plan: 'free',
      subscriptionStatus: 'expired',
      cancelAtPeriodEnd: false,
      updatedAt: new Date(),
    })
    .where(eq(users.subscriptionId, subscription_id));

  console.log(
    `[DodoWebhook] Subscription expired for ${userEmail}, downgraded to Free`,
  );
}

/**
 * subscription.failed / payment.failed - Payment attempt failed
 * Send notification email to user
 */
async function handlePaymentFailed(
  payload: WebhookPayload,
) {
  const { subscription_id, customer } = payload.data;
  const userEmail = customer.email;

  // Log the failure
  console.error(
    `[DodoWebhook] Payment failed for ${userEmail} (sub: ${subscription_id})`,
  );

  // Send notification email to user about failed payment
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://fwd.dev';

    await fetch(`${baseUrl}/api/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.FWD_INTERNAL_API_KEY || '',
      },
      body: JSON.stringify({
        to: userEmail,
        from: process.env.FWD_EMAIL,
        subject:
          'Action Required: Payment Failed for FWD Pro',
        html: `
          <!DOCTYPE html>
          <html>
          <body style="margin: 0; padding: 0; background-color: #1c1917; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="max-width: 560px; margin: 0 auto; padding: 48px 24px;">
              
              <!-- Logo -->
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="font-size: 40px; margin-bottom: 8px;">📬</div>
                <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #c2410c; letter-spacing: 2px;">FWD</h1>
              </div>
              
              <!-- Card -->
              <div style="background: #292524; border: 1px solid #44403c; border-radius: 16px; padding: 40px 32px; text-align: center;">
                
                <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                
                <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #fafaf9;">
                  Payment Failed
                </h2>
                
                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.7; color: #a8a29e;">
                  We were unable to process your payment for FWD Pro. Please update your payment method to avoid service interruption.
                </p>
                
                <a href="${baseUrl}/dashboard/billing" 
                   style="display: inline-block; padding: 14px 36px; background-color: #c2410c; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 12px;">
                  Update Payment Method
                </a>
                
                <p style="margin: 24px 0 0 0; font-size: 13px; color: #78716c;">
                  If you have any questions, just reply to this email.
                </p>
                
              </div>
              
              <!-- Footer -->
              <div style="margin-top: 32px; text-align: center;">
                <p style="margin: 0; font-size: 11px; color: #44403c;">
                  © 2024 Fwd · Email for Developers
                </p>
              </div>
              
            </div>
          </body>
          </html>
        `,
      }),
    });

    console.log(
      `[DodoWebhook] Payment failure notification sent to ${userEmail}`,
    );
  } catch (emailError) {
    console.error(
      `[DodoWebhook] Failed to send payment failure notification:`,
      emailError,
    );
    logError(emailError, {
      source: 'webhook',
      extra: {
        type: 'payment_failure_notification_failed',
        userEmail,
        subscription_id,
      },
    });
  }
}
