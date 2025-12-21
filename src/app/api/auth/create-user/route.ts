import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';

export async function POST(req: Request) {
  try {
    const { id, email, name } = await req.json();

    if (!id || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert user into our database
    await db.insert(users).values({
      id,
      email,
      name: name || null,
    }).onConflictDoNothing(); // Ignore if user already exists

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
