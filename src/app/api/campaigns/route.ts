import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import {
  emails,
  suppressionList,
  templates,
  batches,
} from '@/db/schema';
import { eq, and, gte, count, inArray } from 'drizzle-orm';
import { ApiResponse } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';
import {
  extractLinks,
  injectTrackedLinks,
  injectOpenTracking,
  injectUnsubscribeLink,
} from '@/lib/tracking';
import {
  createBulkLinks,
  prepareLinksForShrnk,
} from '@/lib/shrnk';
import { qstash } from '@/lib/qstash';
import { ses } from '@/lib/ses';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { logBatchProgress, logError } from '@/lib/sentry';
import { checkEmailLimit } from '@/lib/plan-limits';
import { notifyCampaignComplete } from '@/lib/discord';

const BATCH_LIMIT = 500;

interface Recipient {
  to: string;
  variables?: Record<string, string>;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new ApiError(
      401,
      'Please log in to send campaigns',
    ).send();
  }

  const body = await req.json();
  const { templateId, recipients, from } = body;

  // Default from email if not provided
  const fromAddress =
    from ||
    process.env.SES_FROM_EMAIL ||
    'noreply@fwd.sarthak.online';

  if (
    !templateId ||
    !recipients ||
    !Array.isArray(recipients)
  ) {
    return new ApiError(
      400,
      'Missing templateId or recipients',
    ).send();
  }

  // Load template
  const template = await db.query.templates.findFirst({
    where: and(
      eq(templates.id, templateId),
      eq(templates.userId, user.id),
    ),
  });

  if (!template) {
    return new ApiError(404, 'Template not found').send();
  }

  // Validate batch size
  if (recipients.length === 0) {
    return new ApiError(
      400,
      'Recipients array is empty',
    ).send();
  }
  if (recipients.length > BATCH_LIMIT) {
    return new ApiError(
      400,
      `Maximum ${BATCH_LIMIT} recipients per campaign`,
    ).send();
  }

  // Rate limit check using plan-aware monthly limits
  const limitCheck = await checkEmailLimit(user.id);

  if (!limitCheck.allowed) {
    return new ApiError(
      429,
      limitCheck.error || 'Monthly email limit reached',
    ).send();
  }

  if (recipients.length > limitCheck.remaining) {
    return new ApiError(
      429,
      `Campaign would exceed monthly limit. ${limitCheck.remaining} emails remaining.`,
    ).send();
  }

  // Process recipients
  const validRecipients: Array<{
    to: string;
    subject: string;
    html: string;
    variables: Record<string, string>;
  }> = [];
  const seenEmails = new Set<string>();
  let duplicateCount = 0;

  for (const recipient of recipients as Recipient[]) {
    const email = recipient.to?.toLowerCase().trim();
    if (!email || !isValidEmail(email)) continue;
    if (seenEmails.has(email)) {
      duplicateCount++;
      continue;
    }
    seenEmails.add(email);

    // Simple variable substitution
    let subject = template.subject;
    let html = template.html;
    const vars = recipient.variables || {};
    for (const [key, value] of Object.entries(vars)) {
      subject = subject.replace(
        new RegExp(`{{${key}}}`, 'g'),
        value,
      );
      html = html.replace(
        new RegExp(`{{${key}}}`, 'g'),
        value,
      );
    }

    validRecipients.push({
      to: email,
      subject,
      html,
      variables: vars,
    });
  }

  // Filter suppressed
  const suppressedEmails = await db
    .select({ email: suppressionList.email })
    .from(suppressionList)
    .where(
      inArray(
        suppressionList.email,
        validRecipients.map((r) => r.to),
      ),
    );
  const suppressedSet = new Set(
    suppressedEmails.map((s) => s.email.toLowerCase()),
  );
  const finalRecipients = validRecipients.filter(
    (r) => !suppressedSet.has(r.to),
  );

  if (finalRecipients.length === 0) {
    return new ApiError(
      400,
      'No valid recipients after filtering',
    ).send();
  }

  // Create batch
  const [batch] = await db
    .insert(batches)
    .values({
      userId: user.id,
      templateId,
      fromEmail: fromAddress,
      total: recipients.length,
      valid: finalRecipients.length,
      suppressed: suppressedSet.size,
      duplicates: duplicateCount,
      queued: finalRecipients.length,
      status: 'processing',
    })
    .returning({ id: batches.id });

  // Log batch started to Sentry
  logBatchProgress(batch.id, 'started', {
    emailCount: finalRecipients.length,
    userId: user.id,
    templateId,
  });

  // Link tracking
  let linkMap = new Map<string, string>();
  const firstHtml = finalRecipients[0]?.html;
  if (firstHtml) {
    const uniqueLinks = extractLinks(firstHtml);
    if (uniqueLinks.length > 0) {
      const shrnkLinks = await createBulkLinks(
        prepareLinksForShrnk(
          uniqueLinks,
          batch.id,
          user.id,
        ),
      );
      if (shrnkLinks.length > 0) {
        linkMap = new Map(
          shrnkLinks.map((l) => [
            l.originalUrl,
            l.shortUrl,
          ]),
        );
      }
    }
  }

  // Process recipients with tracked links
  const processedRecipients = finalRecipients.map((r) => ({
    ...r,
    html:
      linkMap.size > 0
        ? injectTrackedLinks(r.html, linkMap)
        : r.html,
  }));

  // Insert emails with tracked links and get IDs
  const isProd = !!process.env.VERCEL;
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000';

  if (isProd) {
    // PROD: Insert and only return IDs for fast response
    const emailIds = await db
      .insert(emails)
      .values(
        processedRecipients.map((r) => ({
          userId: user.id,
          batchId: batch.id,
          to: r.to,
          fromEmail: fromAddress,
          subject: r.subject,
          html: r.html,
          variables: JSON.stringify(r.variables || {}),
          status: 'pending' as const,
        })),
      )
      .returning({ id: emails.id });

    // Queue emails via QStash - fire and forget (background)
    const userIdForQueue = user.id;
    (async () => {
      try {
        const chunkSize = 50;
        for (
          let i = 0;
          i < emailIds.length;
          i += chunkSize
        ) {
          const chunkIds = emailIds.slice(i, i + chunkSize);
          const chunkRecipients = processedRecipients.slice(
            i,
            i + chunkSize,
          );
          await Promise.all(
            chunkIds.map((record, idx) =>
              qstash.publishJSON({
                url: `${baseUrl}/api/qstash/email`,
                body: {
                  emailId: record.id,
                  to: chunkRecipients[idx].to,
                  subject: chunkRecipients[idx].subject,
                  html: chunkRecipients[idx].html,
                  userId: userIdForQueue,
                  from: fromAddress,
                },
                retries: 3,
              }),
            ),
          );
        }
        console.log(
          `✅ Campaign ${batch.id}: All ${emailIds.length} emails queued to QStash`,
        );
      } catch (error) {
        console.error(
          `❌ Campaign ${batch.id}: QStash queuing error:`,
          error,
        );
      }
    })();

    return new ApiResponse(
      200,
      {
        batchId: batch.id,
        queued: finalRecipients.length,
        suppressed: suppressedSet.size,
        duplicates: duplicateCount,
      },
      `Campaign created. ${finalRecipients.length} emails queued for delivery.`,
    ).send();
  }

  // DEV MODE: Insert with full returning for direct SES sending
  const emailRecords = await db
    .insert(emails)
    .values(
      processedRecipients.map((r) => ({
        userId: user.id,
        batchId: batch.id,
        to: r.to,
        fromEmail: fromAddress,
        subject: r.subject,
        html: r.html,
        variables: JSON.stringify(r.variables || {}),
        status: 'pending' as const,
      })),
    )
    .returning({
      id: emails.id,
      to: emails.to,
      subject: emails.subject,
      html: emails.html,
    });

  console.log(
    `📧 [DEV MODE] Campaign ${batch.id}: Sending ${emailRecords.length} emails via SES...`,
  );

  let successCount = 0;
  let failCount = 0;

  for (const record of emailRecords) {
    try {
      // Inject open tracking pixel and unsubscribe link
      let processedHtml = record.html;
      if (processedHtml) {
        processedHtml = injectOpenTracking(
          processedHtml,
          record.id,
          baseUrl,
        );
        processedHtml = injectUnsubscribeLink(
          processedHtml,
          record.id,
          record.to,
          user.id,
          baseUrl,
        );
      }

      const command = new SendEmailCommand({
        Source: fromAddress,
        Destination: { ToAddresses: [record.to] },
        Message: {
          Subject: { Data: record.subject },
          Body: {
            Html: processedHtml
              ? { Data: processedHtml }
              : undefined,
          },
        },
        ConfigurationSetName: 'fwd-notifications',
      });

      const response = await ses.send(command);

      // Update email status to completed
      await db
        .update(emails)
        .set({
          status: 'completed',
          sesMessageId: response.MessageId,
          updatedAt: new Date(),
        })
        .where(eq(emails.id, record.id));

      successCount++;
      console.log(`  ✓ Sent to ${record.to}`);
    } catch (error: any) {
      failCount++;
      console.error(
        `  ✗ Failed to send to ${record.to}:`,
        error.message,
      );

      await db
        .update(emails)
        .set({
          status: 'failed',
          errorMessage: error.message,
          updatedAt: new Date(),
        })
        .where(eq(emails.id, record.id));
    }
  }

  console.log(
    `📧 [DEV MODE] Campaign ${batch.id}: ${successCount} sent, ${failCount} failed`,
  );

  // Update batch status
  await db
    .update(batches)
    .set({
      completed: successCount,
      failed: failCount,
      status:
        failCount === 0
          ? 'completed'
          : failCount === emailRecords.length
            ? 'failed'
            : 'partial',
    })
    .where(eq(batches.id, batch.id));

  // Notify admin via Discord
  await notifyCampaignComplete(batch.id, {
    total: finalRecipients.length,
    sent: successCount,
    failed: failCount,
    suppressed: suppressedSet.size,
  });

  return new ApiResponse(
    200,
    {
      batchId: batch.id,
      queued: finalRecipients.length,
      suppressed: suppressedSet.size,
      duplicates: duplicateCount,
    },
    `Campaign created. ${successCount} emails sent.`,
  ).send();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
