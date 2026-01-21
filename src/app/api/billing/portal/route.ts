import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { dodo } from '@/lib/dodo';

/**
 * POST /api/billing/portal
 * Creates a DodoPayments Customer Portal session for subscription management.
 * Returns portal URL for frontend redirect.
 */
export async function POST(request: NextRequest) {
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
        customerId: users.customerId,
        email: users.email,
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

    if (!user.customerId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No subscription found. Please subscribe first.',
        },
        { status: 400 },
      );
    }

    const portal =
      await dodo.customers.customerPortal.create(
        user.customerId,
      );

    console.log(
      `[Portal] Session created for ${user.email}`,
    );

    return NextResponse.json({
      success: true,
      data: {
        portalUrl: portal.link,
      },
    });
  } catch (error) {
    console.error(
      '[Portal] Error creating session:',
      error,
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create portal session',
      },
      { status: 500 },
    );
  }
}
