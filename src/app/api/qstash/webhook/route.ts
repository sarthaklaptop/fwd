import { NextRequest, NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { db } from "@/db";
import { webhooks, webhookEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

async function handler(req: NextRequest) {
    const body = await req.json();
    const { userId, eventType, payload } = body;

    console.log(`📡 Processing webhook event: ${eventType} for user ${userId}`);

    try {
        // Fetch user's webhooks and filter in-memory (JSON parsing) since count is low (<5).
        const userWebhooks = await db.select()
            .from(webhooks)
            .where(eq(webhooks.userId, userId));

        const matchedWebhooks = userWebhooks.filter(w => {
            const events = JSON.parse(w.events);
            return events.includes(eventType) || events.includes('*');
        });

        if (matchedWebhooks.length === 0) {
            return NextResponse.json({ success: true, count: 0 });
        }

        // Dispatch to all subscribers
        const results = await Promise.all(matchedWebhooks.map(async (webhook) => {
            try {
                const timestamp = Math.floor(Date.now() / 1000);
                const signaturePayload = `${timestamp}.${JSON.stringify(payload)}`;
                const signature = crypto
                    .createHmac("sha256", webhook.secret)
                    .update(signaturePayload)
                    .digest("hex");

                const response = await fetch(webhook.url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Fwd-Signature": `t=${timestamp},v1=${signature}`,
                        "X-Fwd-Event": eventType,
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

                return { id: webhook.id, status: response.status };
            } catch (error: any) {
                console.error(`Failed to dispatch to ${webhook.url}:`, error);

                await db.insert(webhookEvents).values({
                    webhookId: webhook.id,
                    eventType,
                    payload: JSON.stringify(payload),
                    responseStatus: 0,
                    responseBody: error.message,
                });

                return { id: webhook.id, error: error.message };
            }
        }));

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
    }
}

export const POST = verifySignatureAppRouter(handler);
