import { NextResponse } from "next/server";
import { qstash } from "@/lib/qstash";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// For local dev - send directly without QStash
const ses = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, subject, html, text } = body;

    // Validation
    if (!to || !subject || (!html && !text)) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // DEV MODE: Send directly (no tunnel needed!)
    // PROD MODE: Use QStash for async processing
    // Check for Vercel environment - if not on Vercel, we're in dev
    const isProd = !!process.env.VERCEL;

    if (!isProd) {
      // Direct send in development
      console.log("📧 [DEV MODE] Sending email directly...");
      const command = new SendEmailCommand({
        Source: process.env.SES_FROM_EMAIL || "sarthaklaptop402@gmail.com",
        Destination: { ToAddresses: Array.isArray(to) ? to : [to] },
        Message: {
          Subject: { Data: subject },
          Body: {
            Html: html ? { Data: html } : undefined,
            Text: text ? { Data: text } : undefined,
          },
        },
      });
      const response = await ses.send(command);
      console.log(`✅ [DEV MODE] Email sent! SES ID: ${response.MessageId}`);
      return NextResponse.json({
        success: true,
        messageId: response.MessageId,
        status: "sent",
      });
    }

    // Production: Queue via QStash
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const response = await qstash.publishJSON({
      url: `${baseUrl}/api/qstash/email`,
      body: { to, subject, html, text },
      retries: 3,
    });

    return NextResponse.json({
      success: true,
      messageId: response.messageId,
      status: "queued",
    });
  } catch (error: any) {
    console.error("Email error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}