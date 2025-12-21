import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { apiKeys } from '@/db/schema';
import { eq, isNull, and, desc } from 'drizzle-orm';
import { generateApiKey } from '@/lib/api-keys';

// GET - List user's API keys
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
      revokedAt: apiKeys.revokedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, user.id))
    .orderBy(desc(apiKeys.createdAt));

  return NextResponse.json({ keys });
}

// POST - Create new API key
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const name = body.name;

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  // Sanitize and limit name length
  const sanitizedName = name.trim().slice(0, 50);

  const { key, hash, prefix } = generateApiKey();

  const [newKey] = await db.insert(apiKeys).values({
    userId: user.id,
    name: sanitizedName,
    keyHash: hash,
    keyPrefix: prefix,
  }).returning();

  return NextResponse.json({
    id: newKey.id,
    name: newKey.name,
    key, // Full key - shown only once!
    keyPrefix: newKey.keyPrefix,
    createdAt: newKey.createdAt,
  });
}
