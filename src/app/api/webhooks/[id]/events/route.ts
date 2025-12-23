import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { webhooks, webhookEvents } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

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

    // Verify webhook ownership
    const webhook = await db.query.webhooks.findFirst({
        where: and(eq(webhooks.id, id), eq(webhooks.userId, user.id)),
    });

    if (!webhook) {
        return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Fetch events (last 50)
    const events = await db.select({
        id: webhookEvents.id,
        eventType: webhookEvents.eventType,
        responseStatus: webhookEvents.responseStatus,
        createdAt: webhookEvents.createdAt,
    })
        .from(webhookEvents)
        .where(eq(webhookEvents.webhookId, id))
        .orderBy(desc(webhookEvents.createdAt))
        .limit(50);

    return NextResponse.json({ events });
}
