import { redirect } from 'next/navigation';
import { db } from '@/db';
import { suppressionList } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyUnsubscribeToken } from '@/lib/unsubscribe';
import { publishEvent } from '@/lib/events';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function UnsubscribePage({ params }: PageProps) {
  const { token } = await params;
  
  // Verify the JWT token
  const payload = verifyUnsubscribeToken(token);
  
  if (!payload) {
    redirect('/unsubscribe/invalid');
  }

  // Check if already unsubscribed
  const existing = await db.query.suppressionList.findFirst({
    where: eq(suppressionList.email, payload.to.toLowerCase())
  });

  if (existing) {
    redirect('/unsubscribe/already');
  }

  // Add to suppression list
  let insertError = null;
  try {
    await db.insert(suppressionList).values({
      email: payload.to.toLowerCase(),
      reason: 'unsubscribe',
      source: 'link',
      userId: payload.userId,
      emailId: payload.emailId,
    });

    console.log(`📭 Unsubscribed: ${payload.to} via link`);

    // Fire webhook event (non-blocking)
    publishEvent(payload.userId, 'email.unsubscribed', {
      emailId: payload.emailId,
      email: payload.to,
    }).catch(e => console.error('Failed to emit unsubscribe event:', e));

  } catch (error: any) {
    console.error('Unsubscribe DB error:', error);
    insertError = error;
  }

  if (insertError) {
    redirect('/unsubscribe/error');
  }

  redirect('/unsubscribe/success');
}
