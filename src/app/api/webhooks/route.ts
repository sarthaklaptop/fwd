import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { webhooks } from '@/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import crypto from 'crypto';
import { ApiResponse } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new ApiError(
      401,
      'Please log in to view webhooks'
    ).send();
  }

  const userWebhooks = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.userId, user.id))
    .orderBy(desc(webhooks.createdAt));

  const parsed = userWebhooks.map((w) => ({
    ...w,
    events: JSON.parse(w.events),
  }));

  return new ApiResponse(
    200,
    { webhooks: parsed },
    'Webhooks loaded'
  ).send();
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new ApiError(
      401,
      'Please log in to create webhooks'
    ).send();
  }

  const body = await req.json();
  const { url, events } = body;

  if (
    !url ||
    !events ||
    !Array.isArray(events) ||
    events.length === 0
  ) {
    return new ApiError(
      400,
      'Please provide URL and at least one event'
    ).send();
  }

  const secret = `whsec_${crypto
    .randomBytes(24)
    .toString('hex')}`;

  const existingCount = await db
    .select({ count: count() })
    .from(webhooks)
    .where(eq(webhooks.userId, user.id));

  if (existingCount[0].count >= 5) {
    return new ApiError(
      400,
      'Maximum 5 webhooks allowed per account'
    ).send();
  }

  try {
    const parsedUrl = new URL(url);
    if (
      parsedUrl.protocol !== 'http:' &&
      parsedUrl.protocol !== 'https:'
    ) {
      throw new Error('Invalid protocol');
    }

    const isProd = process.env.NODE_ENV === 'production';
    if (
      isProd &&
      (parsedUrl.hostname === 'localhost' ||
        parsedUrl.hostname === '127.0.0.1' ||
        parsedUrl.hostname === '::1' ||
        parsedUrl.hostname.startsWith('192.168.') ||
        parsedUrl.hostname.startsWith('10.') ||
        parsedUrl.hostname === '169.254.169.254')
    ) {
      return new ApiError(
        400,
        'Internal addresses are not allowed'
      ).send();
    }
  } catch (e) {
    return new ApiError(
      400,
      'Please provide a valid URL'
    ).send();
  }

  const [webhook] = await db
    .insert(webhooks)
    .values({
      userId: user.id,
      url,
      events: JSON.stringify(events),
      secret,
    })
    .returning();

  return new ApiResponse(
    201,
    {
      webhook: {
        ...webhook,
        events: JSON.parse(webhook.events),
      },
    },
    'Webhook created successfully'
  ).send();
}
