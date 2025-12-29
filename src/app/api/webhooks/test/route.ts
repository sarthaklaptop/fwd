import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { webhooks, webhookEvents } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { ApiResponse } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new ApiError(
      401,
      'Please log in to test webhooks'
    ).send();
  }

  const { webhookId, eventType } = await req.json();

  if (!webhookId || !eventType) {
    return new ApiError(
      400,
      'Please provide webhookId and eventType'
    ).send();
  }

  const webhook = await db.query.webhooks.findFirst({
    where: and(
      eq(webhooks.id, webhookId),
      eq(webhooks.userId, user.id)
    ),
  });

  if (!webhook) {
    return new ApiError(404, 'Webhook not found').send();
  }

  const payload = {
    id: 'test_evt_' + crypto.randomBytes(8).toString('hex'),
    eventType,
    timestamp: new Date().toISOString(),
    data: {
      emailId:
        'test_email_' +
        crypto.randomBytes(8).toString('hex'),
      to: 'test@example.com',
      message:
        'This is a test event triggered from the dashboard.',
    },
  };

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const signaturePayload = `${timestamp}.${JSON.stringify(
      payload
    )}`;
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(signaturePayload)
      .digest('hex');

    console.log(
      `⚡ Sending test webhook to ${webhook.url}`
    );

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Fwd-Signature': `t=${timestamp},v1=${signature}`,
        'X-Fwd-Event': eventType,
        'X-Fwd-Test': 'true',
      },
      body: JSON.stringify(payload),
    });

    const responseBody = await response
      .text()
      .catch(() => '');

    await db.insert(webhookEvents).values({
      webhookId: webhook.id,
      eventType,
      payload: JSON.stringify(payload),
      responseStatus: response.status,
      responseBody: responseBody.substring(0, 1000),
    });

    return new ApiResponse(
      200,
      {
        status: response.status,
        responseBody,
      },
      `Test event sent! Status: ${response.status}`
    ).send();
  } catch (error: any) {
    console.error('Test webhook failed:', error);

    await db.insert(webhookEvents).values({
      webhookId: webhook.id,
      eventType,
      payload: JSON.stringify(payload),
      responseStatus: 0,
      responseBody: error.message,
    });

    return new ApiError(
      500,
      'Failed to send test webhook'
    ).send();
  }
}
