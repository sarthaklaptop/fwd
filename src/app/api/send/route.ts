import { NextResponse } from "next/server";
import { emailQueue } from "@/lib/queue"; // Import the queue we just made

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, subject, html, text } = body;

    // Validation (Keep this the same)
    if (!to || !subject || (!html && !text)) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 🛑 OLD WAY: await ses.send(...) -> Too slow!
    
    // ✅ NEW WAY: Add to Queue -> Instant!
    const job = await emailQueue.add('send-email', {
      to,
      subject,
      html,
      text
    });

    return NextResponse.json({
      success: true,
      messageId: job.id, // Return the Job ID, not the SES ID (we don't have it yet)
      status: "queued", 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}