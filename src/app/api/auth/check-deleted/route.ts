import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

/**
 * GET /api/auth/check-deleted
 *
 * Checks if the current user's account has been deleted (soft delete).
 * Returns deleted status so the client can sign out if needed.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ isDeleted: false });
  }

  // Check if user is soft-deleted
  const userRecord = await db
    .select({ isDeleted: users.isDeleted })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const isDeleted = userRecord[0]?.isDeleted ?? false;

  if (isDeleted) {
    // Sign out the deleted user
    await supabase.auth.signOut();
  }

  return NextResponse.json({ isDeleted });
}
