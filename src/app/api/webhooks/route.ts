import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { webhooks } from '@/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import crypto from 'crypto';

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWebhooks = await db.select()
        .from(webhooks)
        .where(eq(webhooks.userId, user.id))
        .orderBy(desc(webhooks.createdAt));

    const parsed = userWebhooks.map(w => ({
        ...w,
        events: JSON.parse(w.events),
    }));

    return NextResponse.json({ webhooks: parsed });
}

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { url, events } = body;

    if (!url || !events || !Array.isArray(events) || events.length === 0) {
        return NextResponse.json({ error: 'Missing required fields: url, events (array)' }, { status: 400 });
    }

    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;

    // Max 5 webhooks per user
    const existingCount = await db
        .select({ count: count() })
        .from(webhooks)
        .where(eq(webhooks.userId, user.id));

    if (existingCount[0].count >= 5) {
        return NextResponse.json({ error: 'Limit reached: Maximum 5 webhooks allowed.' }, { status: 400 });
    }

    // Block SSRF (internal IPs)
    try {
        const parsedUrl = new URL(url);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            throw new Error('Invalid protocol');
        }

        const isProd = process.env.NODE_ENV === 'production';
        if (isProd && (
            parsedUrl.hostname === 'localhost' ||
            parsedUrl.hostname === '127.0.0.1' ||
            parsedUrl.hostname === '::1' ||
            parsedUrl.hostname.startsWith('192.168.') ||
            parsedUrl.hostname.startsWith('10.') ||
            parsedUrl.hostname === '169.254.169.254'
        )) {
            return NextResponse.json({ error: 'Invalid webhook URL: Internal addresses not allowed.' }, { status: 400 });
        }
    } catch (e) {
        return NextResponse.json({ error: 'Invalid URL format.' }, { status: 400 });
    }

    const [webhook] = await db.insert(webhooks).values({
        userId: user.id,
        url,
        events: JSON.stringify(events),
        secret,
    }).returning();

    return NextResponse.json({
        webhook: {
            ...webhook,
            events: JSON.parse(webhook.events)
        }
    }, { status: 201 });
}
