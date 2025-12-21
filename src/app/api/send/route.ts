import { NextResponse } from "next/server";
import { qstash } from "@/lib/qstash";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, subject, html, text } = body;

    // Validation
    if (!to || !subject || (!html && !text)) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Get the base URL for the webhook
    // Set NEXT_PUBLIC_APP_URL to your production domain (e.g., https://your-app.vercel.app)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.QSTASH_CALLBACK_URL;

    // Publish to QStash - it will call our webhook endpoint
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
    console.error("QStash publish error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}