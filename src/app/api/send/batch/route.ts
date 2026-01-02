import { NextResponse } from 'next/server';
import { qstash } from '@/lib/qstash';
import {
  SESClient,
  SendEmailCommand,
} from '@aws-sdk/client-ses';
import { db } from '@/db';
import {
  emails,
  apiKeys,
  suppressionList,
  templates,
  batches,
} from '@/db/schema';
import {
  eq,
  and,
  isNull,
  gte,
  count,
  inArray,
} from 'drizzle-orm';
import { hashApiKey } from '@/lib/api-keys';
import { substituteVariables } from '@/lib/templates';
import {
  injectOpenTracking,
  injectUnsubscribeLink,
  extractLinks,
  injectTrackedLinks,
} from '@/lib/tracking';
import {
  createBulkLinks,
  prepareLinksForShrnk,
} from '@/lib/shrnk';

const ses = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BATCH_LIMIT = 500; // Premium feature: max 500 emails per batch
const DAILY_LIMIT = 100; // Shared with single sends

interface Recipient {
  to: string;
  variables?: Record<string, string>;
}

interface DirectEmail {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

interface BatchError {
  index: number;
  to: string;
  error: string;
}

export async function POST(req: Request) {
  try {
    // Validate API key
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'Missing API key. Include x-api-key header.',
        },
        { status: 401 }
      );
    }

    const keyHash = hashApiKey(apiKey);
    const keyRecord = await db.query.apiKeys.findFirst({
      where: and(
        eq(apiKeys.keyHash, keyHash),
        isNull(apiKeys.revokedAt)
      ),
    });

    if (!keyRecord) {
      return NextResponse.json(
        { error: 'Invalid or revoked API key' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      templateId,
      recipients,
      emails: directEmails,
    } = body;

    // Validate request: either (templateId + recipients) or (emails)
    if (templateId && recipients && !directEmails) {
      // Template mode
      return await handleTemplateBatch(
        keyRecord.userId,
        templateId,
        recipients
      );
    } else if (directEmails && !templateId && !recipients) {
      // Direct mode
      return await handleDirectBatch(
        keyRecord.userId,
        directEmails
      );
    } else {
      return NextResponse.json(
        {
          error:
            'Invalid request. Provide either (templateId + recipients) OR (emails), not both.',
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Batch send error:', error);
    return NextResponse.json(
      { error: 'Failed to process batch' },
      { status: 500 }
    );
  }
}

async function handleTemplateBatch(
  userId: string,
  templateId: string,
  recipients: Recipient[]
) {
  // Load template
  const template = await db.query.templates.findFirst({
    where: and(
      eq(templates.id, templateId),
      eq(templates.userId, userId)
    ),
  });

  if (!template) {
    return NextResponse.json(
      { error: 'Template not found or not owned by you' },
      { status: 404 }
    );
  }

  // Validate batch size
  if (!recipients || recipients.length === 0) {
    return NextResponse.json(
      { error: 'Recipients array is empty' },
      { status: 400 }
    );
  }
  if (recipients.length > BATCH_LIMIT) {
    return NextResponse.json(
      {
        error: `Batch size exceeds limit. Maximum ${BATCH_LIMIT} emails per batch.`,
      },
      { status: 400 }
    );
  }

  const errors: BatchError[] = [];
  const validRecipients: Array<{
    to: string;
    subject: string;
    html: string;
    text?: string;
    index: number;
  }> = [];

  // Validate and deduplicate
  const seenEmails = new Set<string>();
  let duplicateCount = 0;

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    const email = recipient.to?.toLowerCase().trim();

    // Validate email format
    if (!email || !isValidEmail(email)) {
      errors.push({
        index: i,
        to: recipient.to || '',
        error: 'Invalid email format',
      });
      continue;
    }

    // Check for duplicates in batch
    if (seenEmails.has(email)) {
      duplicateCount++;
      errors.push({
        index: i,
        to: email,
        error: 'Duplicate email in batch',
      });
      continue;
    }
    seenEmails.add(email);

    // Substitute variables
    const vars = recipient.variables || {};
    const subject = substituteVariables(
      template.subject,
      vars
    );
    const html = substituteVariables(template.html, vars);

    validRecipients.push({
      to: email,
      subject,
      html,
      index: i,
    });
  }

  // Run rate limit and suppression checks in PARALLEL (reduces DB roundtrips)
  const [rateLimitResult, suppressionResult] =
    await Promise.all([
      checkRateLimit(userId, recipients.length),
      filterSuppressed(validRecipients.map((r) => r.to)),
    ]);

  if (rateLimitResult.error) {
    return NextResponse.json(
      { error: rateLimitResult.error },
      { status: 429 }
    );
  }

  const { filtered, suppressedCount } = suppressionResult;
  const filteredSet = new Set(filtered);
  const finalRecipients = validRecipients.filter((r) =>
    filteredSet.has(r.to)
  );

  if (finalRecipients.length === 0) {
    return NextResponse.json(
      {
        error: 'No valid recipients after filtering',
        details: {
          total: recipients.length,
          invalid: errors.length,
          suppressed: suppressedCount,
          duplicates: duplicateCount,
        },
      },
      { status: 400 }
    );
  }

  // Create batch and emails
  const result = await createBatchAndEmails(
    userId,
    templateId,
    finalRecipients,
    {
      total: recipients.length,
      valid: finalRecipients.length,
      suppressed: suppressedCount,
      duplicates: duplicateCount,
    }
  );

  return NextResponse.json({
    batchId: result.batchId,
    status: result.status || 'processing',
    message:
      result.message || 'Batch accepted for processing',
    total: recipients.length,
    queued: result.queued,
    suppressed: suppressedCount,
    duplicates: duplicateCount,
    errors: errors.length > 0 ? errors : undefined,
    rateLimit: {
      limit: DAILY_LIMIT,
      remaining: rateLimitResult.remaining - result.queued,
    },
  });
}

async function handleDirectBatch(
  userId: string,
  directEmails: DirectEmail[]
) {
  // Validate batch size
  if (!directEmails || directEmails.length === 0) {
    return NextResponse.json(
      { error: 'Emails array is empty' },
      { status: 400 }
    );
  }
  if (directEmails.length > BATCH_LIMIT) {
    return NextResponse.json(
      {
        error: `Batch size exceeds limit. Maximum ${BATCH_LIMIT} emails per batch.`,
      },
      { status: 400 }
    );
  }

  const errors: BatchError[] = [];
  const validEmails: Array<{
    to: string;
    subject: string;
    html?: string;
    text?: string;
    index: number;
  }> = [];

  // Validate and deduplicate
  const seenEmails = new Set<string>();
  let duplicateCount = 0;

  for (let i = 0; i < directEmails.length; i++) {
    const email = directEmails[i];
    const toEmail = email.to?.toLowerCase().trim();

    // Validate required fields
    if (!toEmail || !isValidEmail(toEmail)) {
      errors.push({
        index: i,
        to: email.to || '',
        error: 'Invalid email format',
      });
      continue;
    }
    if (!email.subject) {
      errors.push({
        index: i,
        to: toEmail,
        error: 'Missing subject',
      });
      continue;
    }
    if (!email.html && !email.text) {
      errors.push({
        index: i,
        to: toEmail,
        error: 'Missing html or text content',
      });
      continue;
    }

    // Check for duplicates in batch
    if (seenEmails.has(toEmail)) {
      duplicateCount++;
      errors.push({
        index: i,
        to: toEmail,
        error: 'Duplicate email in batch',
      });
      continue;
    }
    seenEmails.add(toEmail);

    validEmails.push({
      to: toEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
      index: i,
    });
  }

  // Run rate limit and suppression checks in PARALLEL (reduces DB roundtrips)
  const [rateLimitResult, suppressionResult] =
    await Promise.all([
      checkRateLimit(userId, directEmails.length),
      filterSuppressed(validEmails.map((e) => e.to)),
    ]);

  if (rateLimitResult.error) {
    return NextResponse.json(
      { error: rateLimitResult.error },
      { status: 429 }
    );
  }

  const { filtered, suppressedCount } = suppressionResult;
  const filteredSet = new Set(filtered);
  const finalEmails = validEmails.filter((e) =>
    filteredSet.has(e.to)
  );

  if (finalEmails.length === 0) {
    return NextResponse.json(
      {
        error: 'No valid recipients after filtering',
        details: {
          total: directEmails.length,
          invalid: errors.length,
          suppressed: suppressedCount,
          duplicates: duplicateCount,
        },
      },
      { status: 400 }
    );
  }

  // Create batch and emails (no templateId for direct mode)
  const result = await createBatchAndEmails(
    userId,
    null,
    finalEmails,
    {
      total: directEmails.length,
      valid: finalEmails.length,
      suppressed: suppressedCount,
      duplicates: duplicateCount,
    }
  );

  return NextResponse.json({
    batchId: result.batchId,
    status: result.status || 'processing',
    message:
      result.message || 'Batch accepted for processing',
    total: directEmails.length,
    queued: result.queued,
    suppressed: suppressedCount,
    duplicates: duplicateCount,
    errors: errors.length > 0 ? errors : undefined,
    rateLimit: {
      limit: DAILY_LIMIT,
      remaining: rateLimitResult.remaining - result.queued,
    },
  });
}

async function checkRateLimit(
  userId: string,
  requestedCount: number
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [emailCount] = await db
    .select({ count: count() })
    .from(emails)
    .where(
      and(
        eq(emails.userId, userId),
        gte(emails.createdAt, today)
      )
    );

  const sentToday = emailCount?.count || 0;
  const remaining = DAILY_LIMIT - sentToday;

  if (sentToday >= DAILY_LIMIT) {
    return {
      error: 'Daily limit reached. Resets at midnight UTC.',
      remaining: 0,
    };
  }

  if (sentToday + requestedCount > DAILY_LIMIT) {
    return {
      error: `Batch would exceed daily limit. ${remaining} emails remaining today.`,
      remaining,
    };
  }

  return { remaining };
}

async function filterSuppressed(emailAddresses: string[]) {
  if (emailAddresses.length === 0) {
    return { filtered: [], suppressedCount: 0 };
  }

  const suppressed = await db
    .select({ email: suppressionList.email })
    .from(suppressionList)
    .where(inArray(suppressionList.email, emailAddresses));

  const suppressedSet = new Set(
    suppressed.map((s) => s.email.toLowerCase())
  );
  const filtered = emailAddresses.filter(
    (e) => !suppressedSet.has(e.toLowerCase())
  );

  return {
    filtered,
    suppressedCount: suppressedSet.size,
  };
}

async function createBatchAndEmails(
  userId: string,
  templateId: string | null,
  recipients: Array<{
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }>,
  stats: {
    total: number;
    valid: number;
    suppressed: number;
    duplicates: number;
  }
) {
  // Create batch record first to get batchId for link tracking
  const [batch] = await db
    .insert(batches)
    .values({
      userId,
      templateId,
      total: stats.total,
      valid: stats.valid,
      suppressed: stats.suppressed,
      duplicates: stats.duplicates,
      queued: recipients.length,
      status: 'processing',
    })
    .returning({ id: batches.id });

  // --- LINK TRACKING INTEGRATION ---
  // Extract unique links from first recipient's HTML (all have same links from template)
  let linkMap = new Map<string, string>();
  const firstHtml = recipients[0]?.html;

  if (firstHtml) {
    const uniqueLinks = extractLinks(firstHtml);

    if (uniqueLinks.length > 0) {
      console.log(
        `🔗 Batch ${batch.id}: Found ${uniqueLinks.length} unique links to track`
      );

      // Create short URLs via Shrnk
      const shrnkLinks = await createBulkLinks(
        prepareLinksForShrnk(uniqueLinks, batch.id, userId)
      );

      if (shrnkLinks.length > 0) {
        linkMap = new Map(
          shrnkLinks.map((l) => [l.originalUrl, l.shortUrl])
        );
        console.log(
          `🔗 Batch ${batch.id}: Created ${shrnkLinks.length} tracked links via Shrnk`
        );
      }
    }
  }

  // Replace links in all recipients' HTML with tracked short URLs
  const processedRecipients = recipients.map((r) => ({
    ...r,
    html:
      r.html && linkMap.size > 0
        ? injectTrackedLinks(r.html, linkMap)
        : r.html,
  }));
  // --- END LINK TRACKING ---

  // Bulk insert email records - only return IDs in prod (we already have content in recipients)
  const isProd = !!process.env.VERCEL;
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000';

  if (isProd) {
    // PROD: Insert and only return IDs (faster)
    const emailIds = await db
      .insert(emails)
      .values(
        processedRecipients.map((r) => ({
          userId,
          batchId: batch.id,
          to: r.to,
          subject: r.subject,
          html: r.html,
          text: r.text,
          status: 'pending' as const,
        }))
      )
      .returning({ id: emails.id });

    // Queue emails via QStash - fire and forget (don't block response)
    const baseUrlForQueue = baseUrl;
    const recipientsForQueue = processedRecipients;
    const emailIdsForQueue = emailIds;
    const userIdForQueue = userId;

    // Start queuing in background, don't await
    (async () => {
      try {
        const chunkSize = 50;
        for (
          let i = 0;
          i < emailIdsForQueue.length;
          i += chunkSize
        ) {
          const chunkIds = emailIdsForQueue.slice(
            i,
            i + chunkSize
          );
          const chunkRecipients = recipientsForQueue.slice(
            i,
            i + chunkSize
          );
          await Promise.all(
            chunkIds.map((record, idx) =>
              qstash.publishJSON({
                url: `${baseUrlForQueue}/api/qstash/email`,
                body: {
                  emailId: record.id,
                  to: chunkRecipients[idx].to,
                  subject: chunkRecipients[idx].subject,
                  html: chunkRecipients[idx].html,
                  text: chunkRecipients[idx].text,
                  userId: userIdForQueue, // For unsubscribe link generation
                },
                retries: 3,
              })
            )
          );
        }
        console.log(
          `✅ Batch ${batch.id}: All ${emailIdsForQueue.length} emails queued to QStash`
        );
      } catch (error) {
        console.error(
          `❌ Batch ${batch.id}: QStash queuing error:`,
          error
        );
      }
    })();

    // Return immediately without waiting for queuing
    return {
      batchId: batch.id,
      queued: emailIds.length,
      status: 'processing',
      message:
        'Batch accepted. Emails are being queued for delivery.',
    };
  }

  // DEV MODE: Full insert with returning for direct sending
  const emailRecords = await db
    .insert(emails)
    .values(
      processedRecipients.map((r) => ({
        userId,
        batchId: batch.id,
        to: r.to,
        subject: r.subject,
        html: r.html,
        text: r.text,
        status: 'pending' as const,
      }))
    )
    .returning({
      id: emails.id,
      to: emails.to,
      subject: emails.subject,
      html: emails.html,
      text: emails.text,
    });

  // DEV MODE: Send directly via SES
  console.log(
    `📧 [DEV MODE] Batch ${batch.id}: Sending ${emailRecords.length} emails via SES...`
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
          baseUrl
        );
        processedHtml = injectUnsubscribeLink(
          processedHtml,
          record.id,
          record.to,
          userId,
          baseUrl
        );
      }

      const command = new SendEmailCommand({
        Source:
          process.env.SES_FROM_EMAIL ||
          'sarthaklaptop402@gmail.com',
        Destination: { ToAddresses: [record.to] },
        Message: {
          Subject: { Data: record.subject },
          Body: {
            Html: processedHtml
              ? { Data: processedHtml }
              : undefined,
            Text: record.text
              ? { Data: record.text }
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
        error.message
      );

      // Update email status to failed
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
    `📧 [DEV MODE] Batch ${batch.id}: ${successCount} sent, ${failCount} failed`
  );

  // Update batch completed/failed counts
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

  return {
    batchId: batch.id,
    queued: emailRecords.length,
    status: 'completed',
    message: 'DEV MODE: All emails sent directly via SES.',
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
