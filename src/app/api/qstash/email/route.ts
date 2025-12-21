import { NextRequest, NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Initialize AWS SES
const ses = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function handler(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, html, text } = body;

    console.log(`📧 Processing email to: ${to}`);

    // Send via AWS SES
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
    console.log(`✅ Email sent! SES ID: ${response.MessageId}`);

    return NextResponse.json({
      success: true,
      messageId: response.MessageId,
    });
  } catch (error: any) {
    console.error(`❌ Email failed: ${error.message}`);
    // Return 500 so QStash knows to retry
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Wrap handler with QStash signature verification for security
export const POST = verifySignatureAppRouter(handler);
