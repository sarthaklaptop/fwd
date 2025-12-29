import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { templates } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { extractVariables } from '@/lib/templates';
import { ApiResponse } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new ApiError(
      401,
      'Please log in to view template'
    ).send();
  }

  const template = await db.query.templates.findFirst({
    where: and(
      eq(templates.id, id),
      eq(templates.userId, user.id)
    ),
  });

  if (!template) {
    return new ApiError(404, 'Template not found').send();
  }

  return new ApiResponse(
    200,
    { template },
    'Template loaded'
  ).send();
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new ApiError(
      401,
      'Please log in to update template'
    ).send();
  }

  const existing = await db.query.templates.findFirst({
    where: and(
      eq(templates.id, id),
      eq(templates.userId, user.id)
    ),
  });

  if (!existing) {
    return new ApiError(404, 'Template not found').send();
  }

  const body = await req.json();
  const { name, subject, html } = body;

  const subjectVars = extractVariables(
    subject || existing.subject
  );
  const htmlVars = extractVariables(html || existing.html);
  const allVariables = [
    ...new Set([...subjectVars, ...htmlVars]),
  ];

  const [updated] = await db
    .update(templates)
    .set({
      name: name || existing.name,
      subject: subject || existing.subject,
      html: html || existing.html,
      variables: JSON.stringify(allVariables),
      updatedAt: new Date(),
    })
    .where(eq(templates.id, id))
    .returning();

  return new ApiResponse(
    200,
    { template: updated },
    'Template updated successfully'
  ).send();
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new ApiError(
      401,
      'Please log in to delete template'
    ).send();
  }

  const existing = await db.query.templates.findFirst({
    where: and(
      eq(templates.id, id),
      eq(templates.userId, user.id)
    ),
  });

  if (!existing) {
    return new ApiError(404, 'Template not found').send();
  }

  await db.delete(templates).where(eq(templates.id, id));

  return new ApiResponse(
    200,
    { id },
    'Template deleted successfully'
  ).send();
}
