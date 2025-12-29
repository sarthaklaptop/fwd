import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { webhooks, webhookEvents } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { ApiResponse } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new ApiError(
      401,
      'Please log in to view webhook events'
    ).send();
  }

  const webhook = await db.query.webhooks.findFirst({
    where: and(
      eq(webhooks.id, id),
      eq(webhooks.userId, user.id)
    ),
  });

  if (!webhook) {
    return new ApiError(404, 'Webhook not found').send();
  }

  const events = await db
    .select({
      id: webhookEvents.id,
      eventType: webhookEvents.eventType,
      responseStatus: webhookEvents.responseStatus,
      createdAt: webhookEvents.createdAt,
    })
    .from(webhookEvents)
    .where(eq(webhookEvents.webhookId, id))
    .orderBy(desc(webhookEvents.createdAt))
    .limit(50);

  return new ApiResponse(
    200,
    { events },
    'Webhook events loaded'
  ).send();
}
