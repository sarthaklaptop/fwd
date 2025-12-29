import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { templates } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { extractVariables } from '@/lib/templates';
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
      'Please log in to view templates'
    ).send();
  }

  const userTemplates = await db
    .select()
    .from(templates)
    .where(eq(templates.userId, user.id))
    .orderBy(desc(templates.createdAt));

  return new ApiResponse(
    200,
    { templates: userTemplates },
    'Templates loaded'
  ).send();
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new ApiError(
      401,
      'Please log in to create templates'
    ).send();
  }

  const body = await req.json();
  const { name, subject, html } = body;

  if (!name || !subject || !html) {
    return new ApiError(
      400,
      'Please provide name, subject, and HTML content'
    ).send();
  }

  const subjectVars = extractVariables(subject);
  const htmlVars = extractVariables(html);
  const allVariables = [
    ...new Set([...subjectVars, ...htmlVars]),
  ];

  const [template] = await db
    .insert(templates)
    .values({
      userId: user.id,
      name,
      subject,
      html,
      variables: JSON.stringify(allVariables),
    })
    .returning();

  return new ApiResponse(
    201,
    { template },
    'Template created successfully'
  ).send();
}
