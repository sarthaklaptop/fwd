import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ApiResponse } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';

/**
 * DELETE /api/settings/account
 *
 * Soft deletes a user account by marking it as deleted.
 * All user data is retained for audit/recovery purposes.
 *
 * Security:
 * - Requires valid session
 * - Requires password re-authentication
 *
 * Behavior:
 * - Sets isDeleted = true
 * - Sets deletedAt = current timestamp
 * - Signs out the user
 * - Deleted users cannot log in again
 */
export async function DELETE(request: Request) {
  try {
    // 1. Verify current session
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return new ApiError(
        401,
        'Please log in to delete your account',
      ).send();
    }

    // 2. Get password from request body
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return new ApiError(
        400,
        'Password is required to delete account',
      ).send();
    }

    // 3. Re-authenticate with password
    const { error: authError } =
      await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });

    if (authError) {
      return new ApiError(
        401,
        'Invalid password. Please try again.',
      ).send();
    }

    const userId = user.id;

    // 4. Soft delete - mark user as deleted
    await db
      .update(users)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // 5. Sign out the current session
    await supabase.auth.signOut();

    return new ApiResponse(
      200,
      { deleted: true },
      'Your account has been deleted. You can no longer access this account.',
    ).send();
  } catch (error) {
    console.error('Account deletion error:', error);
    return new ApiError(
      500,
      'Failed to delete account. Please try again or contact support.',
    ).send();
  }
}
