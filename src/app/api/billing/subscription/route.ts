import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/billing/subscription
 * Returns current user's subscription status for billing UI.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const [user] = await db
      .select({
        plan: users.plan,
        subscriptionId: users.subscriptionId,
        subscriptionStatus: users.subscriptionStatus,
        currentPeriodEnd: users.currentPeriodEnd,
        cancelAtPeriodEnd: users.cancelAtPeriodEnd,
      })
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        plan: user.plan,
        status: user.subscriptionStatus,
        currentPeriodEnd:
          user.currentPeriodEnd?.toISOString() || null,
        cancelAtPeriodEnd: user.cancelAtPeriodEnd,
        hasSubscription: !!user.subscriptionId,
      },
    });
  } catch (error) {
    console.error(
      '[Subscription] Error fetching status:',
      error,
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch subscription status',
      },
      { status: 500 },
    );
  }
}
