import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import { emails, batches } from '@/db/schema';
import { eq, isNull, and, sql } from 'drizzle-orm';
import { publishEvent } from '@/lib/events';

const WEBHOOK_SECRET =
  process.env.SHRNK_WEBHOOK_SECRET || '';

interface ShrnkClickPayload {
  event: string;
  data: {
    linkId: string;
    shortCode: string;
    originalUrl: string;
    metadata: {
      source: string;
      emailId?: string;
      batchId?: string;
      userId?: string;
    };
    click: {
      timestamp: string;
      userAgent?: string;
      country?: string;
      city?: string;
    };
  };
}

export async function POST(req: NextRequest) {
  // 1. Verify signature
  const signature = req.headers.get('X-Shrnk-Signature');
  const body = await req.text();

  if (!WEBHOOK_SECRET) {
    console.error('SHRNK_WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    );
  }

  const expectedSig =
    'sha256=' +
    crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

  if (signature !== expectedSig) {
    console.error('Invalid Shrnk webhook signature');
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }

  // 2. Parse payload
  let payload: ShrnkClickPayload;
  try {
    payload = JSON.parse(body);
  } catch (e) {
    console.error(
      'Failed to parse Shrnk webhook payload:',
      e
    );
    return NextResponse.json(
      { error: 'Invalid payload' },
      { status: 400 }
    );
  }

  // 3. Only handle link.clicked events
  if (payload.event !== 'link.clicked') {
    return NextResponse.json({
      success: true,
      message: 'Event ignored',
    });
  }

  const { metadata, click } = payload.data;
  const { emailId, batchId, userId } = metadata || {};

  console.log(
    `🔗 Shrnk click webhook: emailId=${emailId}, batchId=${batchId}, url=${payload.data.originalUrl}`
  );

  try {
    // 4. Update email.clickedAt (first click only)
    if (emailId) {
      await db
        .update(emails)
        .set({ clickedAt: new Date() })
        .where(
          and(
            eq(emails.id, emailId),
            isNull(emails.clickedAt)
          )
        );
    }

    // 5. Increment batch.clicked counter
    if (batchId) {
      await db
        .update(batches)
        .set({ clicked: sql`clicked + 1` })
        .where(eq(batches.id, batchId));
    }

    // 6. Publish to user's webhooks
    if (userId) {
      await publishEvent(userId, 'email.clicked', {
        emailId,
        batchId,
        url: payload.data.originalUrl,
        clickedAt: click.timestamp,
      });
    }
  } catch (error) {
    console.error('Error processing Shrnk webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
