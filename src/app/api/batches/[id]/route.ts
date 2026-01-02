import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { batches, emails, templates } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { ApiResponse } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';
import { getLinkStats } from '@/lib/shrnk';

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
      'Please log in to view batch details'
    ).send();
  }

  const { id } = await params;

  const [batch] = await db
    .select()
    .from(batches)
    .where(
      and(eq(batches.id, id), eq(batches.userId, user.id))
    )
    .limit(1);

  if (!batch) {
    return new ApiError(404, 'Batch not found').send();
  }

  let templateName = null;
  if (batch.templateId) {
    const [template] = await db
      .select({ name: templates.name })
      .from(templates)
      .where(eq(templates.id, batch.templateId))
      .limit(1);
    templateName = template?.name || null;
  }

  const batchEmails = await db
    .select({
      id: emails.id,
      to: emails.to,
      subject: emails.subject,
      status: emails.status,
      openedAt: emails.openedAt,
      clickedAt: emails.clickedAt,
      createdAt: emails.createdAt,
    })
    .from(emails)
    .where(eq(emails.batchId, id))
    .limit(500);

  // Fetch link stats from Shrnk (optional, may fail if not configured)
  let linkStats = null;
  try {
    linkStats = await getLinkStats(id);
  } catch (e) {
    console.error('Failed to fetch link stats:', e);
  }

  return new ApiResponse(
    200,
    {
      batch: {
        ...batch,
        templateName,
      },
      emails: batchEmails,
      linkStats,
    },
    'Batch details loaded'
  ).send();
}
