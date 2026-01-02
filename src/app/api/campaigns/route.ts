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
} from '@/lib/tracking';
import {
  createBulkLinks,
  prepareLinksForShrnk,
} from '@/lib/shrnk';

const BATCH_LIMIT = 500;
const DAILY_LIMIT = 100;

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
      'Please log in to send campaigns'
    ).send();
  }

  const body = await req.json();
  const { templateId, recipients } = body;

  if (
    !templateId ||
    !recipients ||
    !Array.isArray(recipients)
  ) {
    return new ApiError(
      400,
      'Missing templateId or recipients'
    ).send();
  }

  // Load template
  const template = await db.query.templates.findFirst({
    where: and(
      eq(templates.id, templateId),
      eq(templates.userId, user.id)
    ),
  });

  if (!template) {
    return new ApiError(404, 'Template not found').send();
  }

  // Validate batch size
  if (recipients.length === 0) {
    return new ApiError(
      400,
      'Recipients array is empty'
    ).send();
  }
  if (recipients.length > BATCH_LIMIT) {
    return new ApiError(
      400,
      `Maximum ${BATCH_LIMIT} recipients per campaign`
    ).send();
  }

  // Rate limit check
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [emailCount] = await db
    .select({ count: count() })
    .from(emails)
    .where(
      and(
        eq(emails.userId, user.id),
        gte(emails.createdAt, today)
      )
    );

  const sentToday = emailCount?.count || 0;
  if (sentToday + recipients.length > DAILY_LIMIT) {
    return new ApiError(
      429,
      `Daily limit exceeded. ${
        DAILY_LIMIT - sentToday
      } remaining.`
    ).send();
  }

  // Process recipients
  const validRecipients: Array<{
    to: string;
    subject: string;
    html: string;
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
        value
      );
      html = html.replace(
        new RegExp(`{{${key}}}`, 'g'),
        value
      );
    }

    validRecipients.push({ to: email, subject, html });
  }

  // Filter suppressed
  const suppressedEmails = await db
    .select({ email: suppressionList.email })
    .from(suppressionList)
    .where(
      inArray(
        suppressionList.email,
        validRecipients.map((r) => r.to)
      )
    );
  const suppressedSet = new Set(
    suppressedEmails.map((s) => s.email.toLowerCase())
  );
  const finalRecipients = validRecipients.filter(
    (r) => !suppressedSet.has(r.to)
  );

  if (finalRecipients.length === 0) {
    return new ApiError(
      400,
      'No valid recipients after filtering'
    ).send();
  }

  // Create batch
  const [batch] = await db
    .insert(batches)
    .values({
      userId: user.id,
      templateId,
      total: recipients.length,
      valid: finalRecipients.length,
      suppressed: suppressedSet.size,
      duplicates: duplicateCount,
      queued: finalRecipients.length,
      status: 'processing',
    })
    .returning({ id: batches.id });

  // Link tracking
  let linkMap = new Map<string, string>();
  const firstHtml = finalRecipients[0]?.html;
  if (firstHtml) {
    const uniqueLinks = extractLinks(firstHtml);
    if (uniqueLinks.length > 0) {
      const shrnkLinks = await createBulkLinks(
        prepareLinksForShrnk(uniqueLinks, batch.id, user.id)
      );
      if (shrnkLinks.length > 0) {
        linkMap = new Map(
          shrnkLinks.map((l) => [l.originalUrl, l.shortUrl])
        );
      }
    }
  }

  // Insert emails with tracked links
  const processedRecipients = finalRecipients.map((r) => ({
    ...r,
    html:
      linkMap.size > 0
        ? injectTrackedLinks(r.html, linkMap)
        : r.html,
  }));

  await db.insert(emails).values(
    processedRecipients.map((r) => ({
      userId: user.id,
      batchId: batch.id,
      to: r.to,
      subject: r.subject,
      html: r.html,
      status: 'pending' as const,
    }))
  );

  // TODO: Queue emails for sending via QStash (for now, marked as pending)

  return new ApiResponse(
    200,
    {
      batchId: batch.id,
      queued: finalRecipients.length,
      suppressed: suppressedSet.size,
      duplicates: duplicateCount,
    },
    `Campaign created. ${finalRecipients.length} emails queued.`
  ).send();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
