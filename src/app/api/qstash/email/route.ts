import { NextRequest, NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { db } from "@/db";
import { emails } from "@/db/schema";
import { eq } from "drizzle-orm";

// Initialize AWS SES
const ses = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function handler(req: NextRequest) {
  const body = await req.json();
  const { emailId, to, subject, html, text } = body;

  console.log(`📧 Processing email ${emailId} to: ${to}`);

  try {
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

    // Update database: status = completed
    if (emailId) {
      await db.update(emails)
        .set({ 
          status: 'completed', 
          sesMessageId: response.MessageId,
          errorMessage: null,  // Clears any previous error from failed attempts
          updatedAt: new Date() 
        })
        .where(eq(emails.id, emailId));
      console.log(`📝 Updated email ${emailId} status to 'completed'`);
    }

    return NextResponse.json({
      success: true,
      messageId: response.MessageId,
    });
  } catch (error: any) {
    console.error(`❌ Email failed: ${error.message}`);

    // Update database: status = failed
    if (emailId) {
      await db.update(emails)
        .set({ 
          status: 'failed', 
          errorMessage: error.message,
          updatedAt: new Date() 
        })
        .where(eq(emails.id, emailId));
      console.log(`📝 Updated email ${emailId} status to 'failed'`);
    }

    // Return 500 so QStash knows to retry
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Wrap handler with QStash signature verification for security
export const POST = verifySignatureAppRouter(handler);
