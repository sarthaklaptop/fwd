import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { users } from '@/db/schema';

export async function POST(req: Request) {
  try {
    // Verify the request is from an authenticated Supabase session
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, email, name } = await req.json();

    // Ensure the user can only create their own record
    if (id !== authUser.id || email !== authUser.email) {
      return NextResponse.json({ error: 'Forbidden: Cannot create record for another user' }, { status: 403 });
    }

    // Insert user into our database
    await db.insert(users).values({
      id,
      email,
      name: name || null,
    }).onConflictDoNothing();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
