import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { templates } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { extractVariables } from '@/lib/templates';

/**
 * GET /api/templates - List user's templates
 */
export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userTemplates = await db.select()
        .from(templates)
        .where(eq(templates.userId, user.id))
        .orderBy(desc(templates.createdAt));

    return NextResponse.json({ templates: userTemplates });
}

/**
 * POST /api/templates - Create new template
 */
export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, subject, html } = body;

    if (!name || !subject || !html) {
        return NextResponse.json({ error: 'Missing required fields: name, subject, html' }, { status: 400 });
    }

    // Auto-extract variables from subject and html
    const subjectVars = extractVariables(subject);
    const htmlVars = extractVariables(html);
    const allVariables = [...new Set([...subjectVars, ...htmlVars])];

    const [template] = await db.insert(templates).values({
        userId: user.id,
        name,
        subject,
        html,
        variables: JSON.stringify(allVariables),
    }).returning();

    return NextResponse.json({ template }, { status: 201 });
}
