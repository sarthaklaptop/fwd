import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { apiKeys } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { generateApiKey } from '@/lib/api-keys';
import { ApiResponse } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new ApiError(
      401,
      'Please log in to view API keys'
    ).send();
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

  return new ApiResponse(
    200,
    { keys },
    'API keys loaded'
  ).send();
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new ApiError(
      401,
      'Please log in to create API keys'
    ).send();
  }

  const body = await req.json();
  const name = body.name;

  if (!name || typeof name !== 'string') {
    return new ApiError(
      400,
      'Please provide a name for your API key'
    ).send();
  }

  const sanitizedName = name.trim().slice(0, 50);
  const { key, hash, prefix } = generateApiKey();

  const [newKey] = await db
    .insert(apiKeys)
    .values({
      userId: user.id,
      name: sanitizedName,
      keyHash: hash,
      keyPrefix: prefix,
    })
    .returning();

  return new ApiResponse(
    201,
    {
      id: newKey.id,
      name: newKey.name,
      key,
      keyPrefix: newKey.keyPrefix,
      createdAt: newKey.createdAt,
    },
    'API key created successfully'
  ).send();
}
