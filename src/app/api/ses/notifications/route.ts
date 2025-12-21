import { NextResponse } from 'next/server';
import { db } from '@/db';
import { emails, suppressionList } from '@/db/schema';
import { eq } from 'drizzle-orm';

// SNS Message Types
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

type SESNotification = SESBounceNotification | SESComplaintNotification;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const message: SNSMessage = JSON.parse(body);

    // Handle SNS subscription confirmation
    if (message.Type === 'SubscriptionConfirmation') {
      console.log('📬 SNS Subscription confirmation received');
      if (message.SubscribeURL) {
        // Confirm the subscription by visiting the URL
        await fetch(message.SubscribeURL);
        console.log('✅ SNS Subscription confirmed');
      }
      return NextResponse.json({ success: true });
    }

    // Handle notification
    if (message.Type === 'Notification') {
      const notification: SESNotification = JSON.parse(message.Message);
      
      if (notification.notificationType === 'Bounce') {
        await handleBounce(notification);
      } else if (notification.notificationType === 'Complaint') {
        await handleComplaint(notification);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('SNS notification error:', error);
    return NextResponse.json({ error: 'Failed to process notification' }, { status: 500 });
  }
}

async function handleBounce(notification: SESBounceNotification) {
  const { bounce, mail } = notification;
  console.log(`🔴 Bounce received: ${bounce.bounceType}`);

  // Find the email by SES message ID
  const emailRecords = await db
    .select()
    .from(emails)
    .where(eq(emails.sesMessageId, mail.messageId));

  const emailRecord = emailRecords[0];

  // Update email status
  if (emailRecord) {
    await db.update(emails)
      .set({ 
        status: 'bounced', 
        bounceType: bounce.bounceType,
        updatedAt: new Date() 
      })
      .where(eq(emails.id, emailRecord.id));
  }

  // Add to suppression list for permanent bounces
  if (bounce.bounceType === 'Permanent') {
    for (const recipient of bounce.bouncedRecipients) {
      await db.insert(suppressionList).values({
        email: recipient.emailAddress.toLowerCase(),
        reason: 'bounce',
        userId: emailRecord?.userId || null,
        emailId: emailRecord?.id || null,
      }).onConflictDoNothing();
      
      console.log(`🚫 Added ${recipient.emailAddress} to suppression list (bounce)`);
    }
  }
}

async function handleComplaint(notification: SESComplaintNotification) {
  const { complaint, mail } = notification;
  console.log('🔴 Complaint received');

  // Find the email by SES message ID
  const emailRecords = await db
    .select()
    .from(emails)
    .where(eq(emails.sesMessageId, mail.messageId));

  const emailRecord = emailRecords[0];

  // Update email status
  if (emailRecord) {
    await db.update(emails)
      .set({ status: 'complained', updatedAt: new Date() })
      .where(eq(emails.id, emailRecord.id));
  }

  // Add to suppression list
  for (const recipient of complaint.complainedRecipients) {
    await db.insert(suppressionList).values({
      email: recipient.emailAddress.toLowerCase(),
      reason: 'complaint',
      userId: emailRecord?.userId || null,
      emailId: emailRecord?.id || null,
    }).onConflictDoNothing();
    
    console.log(`🚫 Added ${recipient.emailAddress} to suppression list (complaint)`);
  }
}
