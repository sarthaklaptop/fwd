import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { batches, templates } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { ApiResponse } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new ApiError(
      401,
      'Please log in to view batches'
    ).send();
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(
    parseInt(searchParams.get('limit') || '20'),
    50
  );

  const batchList = await db
    .select({
      id: batches.id,
      templateId: batches.templateId,
      total: batches.total,
      valid: batches.valid,
      suppressed: batches.suppressed,
      duplicates: batches.duplicates,
      queued: batches.queued,
      completed: batches.completed,
      failed: batches.failed,
      status: batches.status,
      createdAt: batches.createdAt,
    })
    .from(batches)
    .where(eq(batches.userId, user.id))
    .orderBy(desc(batches.createdAt))
    .limit(limit);

  const templateIds = batchList
    .filter((b) => b.templateId)
    .map((b) => b.templateId!);

  let templateMap: Record<string, string> = {};
  if (templateIds.length > 0) {
    const templateList = await db
      .select({ id: templates.id, name: templates.name })
      .from(templates)
      .where(eq(templates.userId, user.id));

    templateMap = Object.fromEntries(
      templateList.map((t) => [t.id, t.name])
    );
  }

  const batchesWithTemplates = batchList.map((batch) => ({
    ...batch,
    templateName: batch.templateId
      ? templateMap[batch.templateId] || null
      : null,
  }));

  return new ApiResponse(
    200,
    { batches: batchesWithTemplates },
    'Batches loaded'
  ).send();
}
