import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { webhooks, webhookEvents } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { webhookId, eventType } = await req.json();

    if (!webhookId || !eventType) {
        return NextResponse.json({ error: 'Missing webhookId or eventType' }, { status: 400 });
    }

    const webhook = await db.query.webhooks.findFirst({
        where: and(eq(webhooks.id, webhookId), eq(webhooks.userId, user.id)),
    });

    if (!webhook) {
        return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const payload = {
        id: 'test_evt_' + crypto.randomBytes(8).toString('hex'),
        eventType,
        timestamp: new Date().toISOString(),
        data: {
            emailId: 'test_email_' + crypto.randomBytes(8).toString('hex'),
            to: 'test@example.com',
            message: 'This is a test event triggered from the dashboard.',
        }
    };

    try {
        const timestamp = Math.floor(Date.now() / 1000);
        const signaturePayload = `${timestamp}.${JSON.stringify(payload)}`;
        const signature = crypto
            .createHmac("sha256", webhook.secret)
            .update(signaturePayload)
            .digest("hex");

        console.log(`⚡ Sending test webhook to ${webhook.url}`);

        const response = await fetch(webhook.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Fwd-Signature": `t=${timestamp},v1=${signature}`,
                "X-Fwd-Event": eventType,
                "X-Fwd-Test": "true",
            },
            body: JSON.stringify(payload),
        });

        const responseBody = await response.text().catch(() => "");

        await db.insert(webhookEvents).values({
            webhookId: webhook.id,
            eventType,
            payload: JSON.stringify(payload),
            responseStatus: response.status,
            responseBody: responseBody.substring(0, 1000),
        });

        return NextResponse.json({
            success: true,
            status: response.status,
            responseBody
        });

    } catch (error: any) {
        console.error("Test webhook failed:", error);

        await db.insert(webhookEvents).values({
            webhookId: webhook.id,
            eventType,
            payload: JSON.stringify(payload),
            responseStatus: 0,
            responseBody: error.message,
        });

        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
