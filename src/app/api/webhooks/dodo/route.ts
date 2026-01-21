import { NextRequest, NextResponse } from 'next/server';
import DodoPayments from 'dodopayments';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logError, logEvent } from '@/lib/sentry';

// Validate required environment variables
const DODO_API_KEY = process.env.DODO_API_KEY;
const DODO_WEBHOOK_SECRET = process.env.DODO_WEBHOOK_SECRET;

if (!DODO_API_KEY || !DODO_WEBHOOK_SECRET) {
  throw new Error(
    'Missing required DodoPayments environment variables: DODO_API_KEY and/or DODO_WEBHOOK_SECRET',
  );
}

// Initialize DodoPayments client with webhook key for signature verification
const client = new DodoPayments({
  bearerToken: DODO_API_KEY,
  webhookKey: DODO_WEBHOOK_SECRET,
});

// Subscription webhook event types
type SubscriptionEventType =
  | 'subscription.active'
  | 'subscription.renewed'
  | 'subscription.cancelled'
  | 'subscription.on_hold'
  | 'subscription.expired'
  | 'subscription.failed';

interface SubscriptionWebhookPayload {
  business_id: string;
  type: SubscriptionEventType;
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
    let payload: SubscriptionWebhookPayload;
    try {
      payload = client.webhooks.unwrap(rawBody, {
        headers: {
          'webhook-id': webhookId,
          'webhook-signature': webhookSignature,
          'webhook-timestamp': webhookTimestamp,
        },
      }) as unknown as SubscriptionWebhookPayload;
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
        await handleSubscriptionFailed(payload);
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
  payload: SubscriptionWebhookPayload,
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
  payload: SubscriptionWebhookPayload,
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
  payload: SubscriptionWebhookPayload,
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
  payload: SubscriptionWebhookPayload,
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
  payload: SubscriptionWebhookPayload,
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
 * subscription.failed - Payment attempt failed (subscription may still be active with retry)
 * Log for monitoring, actual status change comes via on_hold
 */
async function handleSubscriptionFailed(
  payload: SubscriptionWebhookPayload,
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
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Payment Failed</h2>
            <p>Hi there,</p>
            <p>We were unable to process your payment for FWD Pro subscription.</p>
            <p>Please update your payment method to avoid service interruption:</p>
            <p>
              <a href="${baseUrl}/dashboard/billing" 
                 style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px;">
                Update Payment Method
              </a>
            </p>
            <p>If you have any questions, reply to this email.</p>
            <p>— The FWD Team</p>
          </div>
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
