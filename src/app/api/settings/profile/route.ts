import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ApiResponse } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new ApiError(
      401,
      'Please log in to update your profile'
    ).send();
  }

  const body = await req.json();
  const { name } = body;

  if (typeof name !== 'string') {
    return new ApiError(
      400,
      'Please provide a valid name'
    ).send();
  }

  const trimmedName = name.trim();

  // Update Supabase Auth metadata
  const { error } = await supabase.auth.updateUser({
    data: { full_name: trimmedName },
  });

  if (error) {
    return new ApiError(
      500,
      'Failed to update profile'
    ).send();
  }

  // Sync to users table
  await db
    .update(users)
    .set({
      name: trimmedName,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  return new ApiResponse(
    200,
    { name: trimmedName },
    'Profile updated successfully'
  ).send();
}
