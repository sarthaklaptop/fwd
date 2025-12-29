import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { apiKeys } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { ApiResponse } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new ApiError(
      401,
      'Please log in to revoke API keys'
    ).send();
  }

  const { id } = await params;

  const [revokedKey] = await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(
      and(eq(apiKeys.id, id), eq(apiKeys.userId, user.id))
    )
    .returning();

  if (!revokedKey) {
    return new ApiError(404, 'API key not found').send();
  }

  return new ApiResponse(
    200,
    { id: revokedKey.id },
    'API key revoked successfully'
  ).send();
}
