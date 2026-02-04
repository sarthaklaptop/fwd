import { NextResponse } from 'next/server';
import { db } from '@/db';
import { emails, suppressionList } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { publishEvent } from '@/lib/events';
import { logEmailEvent, logError } from '@/lib/sentry';
import {
  notifyBounce,
  notifyComplaint,
} from '@/lib/discord';

interface SNSMessage {
  Type: string;
  MessageId: string;
  TopicArn: string;
  Message: string;
  SubscribeURL?: string;
  Token?: string;
}

interface SESBounceNotification {
  notificationType: 'Bounce';
  bounce: {
    bounceType: 'Permanent' | 'Transient';
    bouncedRecipients: { emailAddress: string }[];
  };
  mail: {
    messageId: string;
  };
}

interface SESComplaintNotification {
  notificationType: 'Complaint';
  complaint: {
    complainedRecipients: { emailAddress: string }[];
  };
  mail: {
    messageId: string;
  };
}

type SESNotification =
  | SESBounceNotification
  | SESComplaintNotification;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const message: SNSMessage = JSON.parse(body);

    // SNS subscription confirmation (one-time setup)
    if (message.Type === 'SubscriptionConfirmation') {
      console.log(
        '📬 SNS Subscription confirmation received',
      );
      if (message.SubscribeURL) {
        await fetch(message.SubscribeURL);
        console.log('✅ SNS Subscription confirmed');
      }
      return NextResponse.json({ success: true });
    }

    if (message.Type === 'Notification') {
      const notification: SESNotification = JSON.parse(
        message.Message,
      );

      if (notification.notificationType === 'Bounce') {
        await handleBounce(notification);
      } else if (
        notification.notificationType === 'Complaint'
      ) {
        await handleComplaint(notification);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('SNS notification error:', err);
    logError(err, { source: 'webhook' });
    return NextResponse.json(
      { error: 'Failed to process notification' },
      { status: 500 },
    );
  }
}

async function handleBounce(
  notification: SESBounceNotification,
) {
  const { bounce, mail } = notification;
  console.log(`🔴 Bounce received: ${bounce.bounceType}`);

  // Log to Sentry for monitoring
  logEmailEvent('bounce', {
    email: bounce.bouncedRecipients[0]?.emailAddress,
    bounceType: bounce.bounceType,
    reason: `${bounce.bounceType} bounce`,
  });

  const emailRecords = await db
    .select()
    .from(emails)
    .where(eq(emails.sesMessageId, mail.messageId));

  const emailRecord = emailRecords[0];

  if (emailRecord) {
    await db
      .update(emails)
      .set({
        status: 'bounced',
        bounceType: bounce.bounceType,
        updatedAt: new Date(),
      })
      .where(eq(emails.id, emailRecord.id));

    if (emailRecord.userId) {
      await publishEvent(
        emailRecord.userId,
        'email.bounced',
        {
          emailId: emailRecord.id,
          bounceType: bounce.bounceType,
          recipients: bounce.bouncedRecipients.map(
            (r) => r.emailAddress,
          ),
        },
      );

      // Notify admin via Discord
      await notifyBounce(
        emailRecord.to,
        bounce.bounceType,
        emailRecord.userId,
      );
    }
  }

  // Only suppress permanent bounces (not transient/soft bounces)
  if (bounce.bounceType === 'Permanent') {
    for (const recipient of bounce.bouncedRecipients) {
      await db
        .insert(suppressionList)
        .values({
          email: recipient.emailAddress.toLowerCase(),
          reason: 'bounce',
          userId: emailRecord?.userId || null,
          emailId: emailRecord?.id || null,
        })
        .onConflictDoNothing();

      console.log(
        `🚫 Added ${recipient.emailAddress} to suppression list (bounce)`,
      );
    }
  }
}

async function handleComplaint(
  notification: SESComplaintNotification,
) {
  const { complaint, mail } = notification;
  console.log('🔴 Complaint received');

  // Log to Sentry for monitoring (complaints are serious!)
  logEmailEvent('complaint', {
    email: complaint.complainedRecipients[0]?.emailAddress,
    reason: 'User marked as spam',
  });

  const emailRecords = await db
    .select()
    .from(emails)
    .where(eq(emails.sesMessageId, mail.messageId));

  const emailRecord = emailRecords[0];

  if (emailRecord) {
    await db
      .update(emails)
      .set({ status: 'complained', updatedAt: new Date() })
      .where(eq(emails.id, emailRecord.id));

    if (emailRecord.userId) {
      await publishEvent(
        emailRecord.userId,
        'email.complained',
        {
          emailId: emailRecord.id,
          recipients: complaint.complainedRecipients.map(
            (r) => r.emailAddress,
          ),
        },
      );

      // Notify admin via Discord (complaints are serious!)
      await notifyComplaint(
        emailRecord.to,
        emailRecord.userId,
      );
    }
  }

  // Always suppress complaints (spam reports are serious)
  for (const recipient of complaint.complainedRecipients) {
    await db
      .insert(suppressionList)
      .values({
        email: recipient.emailAddress.toLowerCase(),
        reason: 'complaint',
        userId: emailRecord?.userId || null,
        emailId: emailRecord?.id || null,
      })
      .onConflictDoNothing();

    console.log(
      `Added ${recipient.emailAddress} to suppression list (complaint)`,
    );
  }
}
