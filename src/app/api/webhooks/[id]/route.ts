import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { webhooks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { ApiResponse } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';

export async function DELETE(
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
      'Please log in to delete webhooks'
    ).send();
  }

  const existing = await db.query.webhooks.findFirst({
    where: and(
      eq(webhooks.id, id),
      eq(webhooks.userId, user.id)
    ),
  });

  if (!existing) {
    return new ApiError(404, 'Webhook not found').send();
  }

  await db.delete(webhooks).where(eq(webhooks.id, id));

  return new ApiResponse(
    200,
    { id },
    'Webhook deleted successfully'
  ).send();
}
