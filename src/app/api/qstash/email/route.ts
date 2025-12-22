import { NextRequest, NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { db } from "@/db";
import { emails, batches } from "@/db/schema";
import { eq, and, count, sql } from "drizzle-orm";
import { injectOpenTracking } from "@/lib/tracking";

// Initialize AWS SES
const ses = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function updateBatchStatus(batchId: string) {
  // Count emails by status for this batch
  const statusCounts = await db
    .select({
      status: emails.status,
      count: count(),
    })
    .from(emails)
    .where(eq(emails.batchId, batchId))
    .groupBy(emails.status);

  const counts = {
    pending: 0,
    completed: 0,
    failed: 0,
    bounced: 0,
    complained: 0,
  };

  for (const row of statusCounts) {
    if (row.status in counts) {
      counts[row.status as keyof typeof counts] = row.count;
    }
  }

  const totalProcessed = counts.completed + counts.failed + counts.bounced + counts.complained;
  const totalEmails = totalProcessed + counts.pending;

  // Only update if all emails are processed
  if (counts.pending === 0 && totalEmails > 0) {
    let batchStatus: 'completed' | 'partial' | 'failed';
    if (counts.failed + counts.bounced + counts.complained === 0) {
      batchStatus = 'completed';
    } else if (counts.completed === 0) {
      batchStatus = 'failed';
    } else {
      batchStatus = 'partial';
    }

    await db.update(batches)
      .set({
        completed: counts.completed,
        failed: counts.failed + counts.bounced + counts.complained,
        status: batchStatus,
      })
      .where(eq(batches.id, batchId));

    console.log(`📊 Batch ${batchId} status updated to '${batchStatus}'`);
  }
}

async function handler(req: NextRequest) {
  const body = await req.json();
  const { emailId, to, subject, html, text } = body;

  console.log(`📧 Processing email ${emailId} to: ${to}`);

  // Get the email record to find batch ID
  const emailRecord = await db.query.emails.findFirst({
    where: eq(emails.id, emailId),
    columns: { batchId: true },
  });

  try {
    // Inject open tracking pixel into HTML content
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const trackedHtml = html ? injectOpenTracking(html, emailId, baseUrl) : undefined;

    // Send via AWS SES with configuration set for bounce/complaint tracking
    const command = new SendEmailCommand({
      Source: process.env.SES_FROM_EMAIL || "sarthaklaptop402@gmail.com",
      Destination: { ToAddresses: Array.isArray(to) ? to : [to] },
      Message: {
        Subject: { Data: subject },
        Body: {
          Html: trackedHtml ? { Data: trackedHtml } : undefined,
          Text: text ? { Data: text } : undefined,
        },
      },
      ConfigurationSetName: "fwd-notifications",
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

      // Update batch status if this email belongs to a batch
      if (emailRecord?.batchId) {
        await updateBatchStatus(emailRecord.batchId);
      }
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

      // Update batch status if this email belongs to a batch
      if (emailRecord?.batchId) {
        await updateBatchStatus(emailRecord.batchId);
      }
    }

    // Return 500 so QStash knows to retry
    return NextResponse.json({ error: "Email delivery failed" }, { status: 500 });
  }
}

// Wrap handler with QStash signature verification for security
export const POST = verifySignatureAppRouter(handler);

