import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { templates } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { extractVariables } from '@/lib/templates';

/**
 * GET /api/templates/:id - Get single template (user protected)
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = await db.query.templates.findFirst({
        where: and(eq(templates.id, id), eq(templates.userId, user.id)),
    });

    if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template });
}

/**
 * PUT /api/templates/:id - Update template (user protected)
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const existing = await db.query.templates.findFirst({
        where: and(eq(templates.id, id), eq(templates.userId, user.id)),
    });

    if (!existing) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, subject, html } = body;

    // Re-extract variables if content changed
    const subjectVars = extractVariables(subject || existing.subject);
    const htmlVars = extractVariables(html || existing.html);
    const allVariables = [...new Set([...subjectVars, ...htmlVars])];

    const [updated] = await db.update(templates)
        .set({
            name: name || existing.name,
            subject: subject || existing.subject,
            html: html || existing.html,
            variables: JSON.stringify(allVariables),
            updatedAt: new Date(),
        })
        .where(eq(templates.id, id))
        .returning();

    return NextResponse.json({ template: updated });
}

/**
 * DELETE /api/templates/:id - Delete template (user protected)
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership before delete
    const existing = await db.query.templates.findFirst({
        where: and(eq(templates.id, id), eq(templates.userId, user.id)),
    });

    if (!existing) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    await db.delete(templates).where(eq(templates.id, id));

    return NextResponse.json({ success: true });
}
