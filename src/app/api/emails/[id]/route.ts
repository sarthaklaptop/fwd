import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { emails } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { ApiResponse } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new ApiError(
      401,
      'Please log in to view email details'
    ).send();
  }

  const { id } = await params;

  const [email] = await db
    .select()
    .from(emails)
    .where(
      and(eq(emails.id, id), eq(emails.userId, user.id))
    )
    .limit(1);

  if (!email) {
    return new ApiError(404, 'Email not found').send();
  }

  return new ApiResponse(
    200,
    { email },
    'Email details loaded'
  ).send();
}
