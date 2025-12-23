import { qstash } from "@/lib/qstash";
import { db } from "@/db";
import { webhooks, webhookEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

interface EventPayload {
    emailId?: string;
    to?: string;
    templateId?: string;
    [key: string]: any;
}

/**
 * Publishes an event to the QStash webhook worker.
 * In production: Queues job to QStash -> Worker -> User URL
 * In development: Directly fetches User URL (simulating the worker)
 */
export async function publishEvent(
    userId: string,
    eventType: 'email.sent' | 'email.delivered' | 'email.opened' | 'email.bounced' | 'email.complained',
    payload: EventPayload
) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const timestamp = Math.floor(Date.now() / 1000);
        const finalPayload = {
            ...payload,
            timestamp: new Date().toISOString(),
        };

        // DEV MODE: Send directly (Simulate Worker)
        if (!process.env.QSTASH_TOKEN) {
            console.log(`[DEV MODE] 📡 Processing event: ${eventType}`);

            // 1. Find subscribers
            const userWebhooks = await db.select()
                .from(webhooks)
                .where(eq(webhooks.userId, userId));

            const matched = userWebhooks.filter(w => {
                const events = JSON.parse(w.events);
                return events.includes(eventType) || events.includes('*');
            });

            if (matched.length === 0) {
                console.log(`[DEV MODE] No webhooks found for ${eventType}`);
                return;
            }

            // 2. Dispatch directly
            await Promise.all(matched.map(async (webhook) => {
                try {
                    // Sign payload
                    const signaturePayload = `${timestamp}.${JSON.stringify(finalPayload)}`;
                    const signature = crypto
                        .createHmac("sha256", webhook.secret)
                        .update(signaturePayload)
                        .digest("hex");

                    const res = await fetch(webhook.url, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-Fwd-Signature": `t=${timestamp},v1=${signature}`,
                            "X-Fwd-Event": eventType,
                        },
                        body: JSON.stringify(finalPayload),
                    });

                    // Log to DB
                    await db.insert(webhookEvents).values({
                        webhookId: webhook.id,
                        eventType,
                        payload: JSON.stringify(finalPayload),
                        responseStatus: res.status,
                        responseBody: await res.text().catch(() => ""),
                    });

                    console.log(`[DEV MODE] ✅ Sent to ${webhook.url} (${res.status})`);
                } catch (err) {
                    console.error(`[DEV MODE] ❌ Failed to send to ${webhook.url}`, err);
                }
            }));
            return;
        }

        // PROD MODE: Queue via QStash
        await qstash.publishJSON({
            url: `${baseUrl}/api/qstash/webhook`,
            body: {
                userId,
                eventType,
                payload: finalPayload,
            },
            retries: 3,
        });

        console.log(`📡 Event queued via QStash: ${eventType}`);
    } catch (error) {
        console.error(`Failed to publish event ${eventType}:`, error);
    }
}

