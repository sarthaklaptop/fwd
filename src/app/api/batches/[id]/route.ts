import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { batches, emails, templates } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/batches/:id
 * Returns batch details with email breakdown.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get batch
    const [batch] = await db
        .select()
        .from(batches)
        .where(and(eq(batches.id, id), eq(batches.userId, user.id)))
        .limit(1);

    if (!batch) {
        return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Get template name if exists
    let templateName = null;
    if (batch.templateId) {
        const [template] = await db
            .select({ name: templates.name })
            .from(templates)
            .where(eq(templates.id, batch.templateId))
            .limit(1);
        templateName = template?.name || null;
    }

    // Get email stats for this batch
    const batchEmails = await db
        .select({
            id: emails.id,
            to: emails.to,
            subject: emails.subject,
            status: emails.status,
            openedAt: emails.openedAt,
            createdAt: emails.createdAt,
        })
        .from(emails)
        .where(eq(emails.batchId, id))
        .limit(500);

    return NextResponse.json({
        batch: {
            ...batch,
            templateName,
        },
        emails: batchEmails,
    });
}
