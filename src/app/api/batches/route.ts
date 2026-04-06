import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { batches, templates } from '@/db/schema';
import { eq, desc, and, lt } from 'drizzle-orm';
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
  const cursor = searchParams.get('cursor'); // ISO createdAt timestamp
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';

  // Build where conditions
  const conditions = [eq(batches.userId, user.id)];

  if (cursor) {
    conditions.push(lt(batches.createdAt, new Date(cursor)));
  }

  if (status) {
    conditions.push(
      eq(
        batches.status,
        status as typeof batches.status._.data
      )
    );
  }

  // Fetch one extra to determine if there are more pages
  const fetchLimit = limit + 1;

  let batchList = await db
    .select({
      id: batches.id,
      templateId: batches.templateId,
      fromEmail: batches.fromEmail,
      total: batches.total,
      valid: batches.valid,
      suppressed: batches.suppressed,
      duplicates: batches.duplicates,
      queued: batches.queued,
      completed: batches.completed,
      failed: batches.failed,
      opened: batches.opened,
      clicked: batches.clicked,
      status: batches.status,
      scheduledAt: batches.scheduledAt,
      createdAt: batches.createdAt,
    })
    .from(batches)
    .where(and(...conditions))
    .orderBy(desc(batches.createdAt))
    .limit(fetchLimit);

  const hasMore = batchList.length > limit;
  if (hasMore) batchList = batchList.slice(0, limit);

  const nextCursor = hasMore
    ? batchList[batchList.length - 1].createdAt.toISOString()
    : null;

  // Resolve template names
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

  let batchesWithTemplates = batchList.map((batch) => ({
    ...batch,
    templateName: batch.templateId
      ? templateMap[batch.templateId] || null
      : null,
  }));

  // Filter by search on template name / fromEmail (post-join)
  if (search) {
    const q = search.toLowerCase();
    batchesWithTemplates = batchesWithTemplates.filter(
      (b) =>
        b.templateName?.toLowerCase().includes(q) ||
        b.fromEmail?.toLowerCase().includes(q)
    );
  }

  return new ApiResponse(
    200,
    { batches: batchesWithTemplates, nextCursor, hasMore },
    'Batches loaded'
  ).send();
}
