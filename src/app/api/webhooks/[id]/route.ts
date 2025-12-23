import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { webhooks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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

    const existing = await db.query.webhooks.findFirst({
        where: and(eq(webhooks.id, id), eq(webhooks.userId, user.id)),
    });

    if (!existing) {
        return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    await db.delete(webhooks).where(eq(webhooks.id, id));

    return NextResponse.json({ success: true });
}
