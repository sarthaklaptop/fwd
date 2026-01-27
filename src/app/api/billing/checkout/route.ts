import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { dodo, FWD_PRO_PRODUCT_ID } from '@/lib/dodo';

/**
 * POST /api/billing/checkout
 * Creates a DodoPayments checkout session for upgrading to Pro.
 * Returns checkout URL for frontend redirect.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please log in to upgrade to Pro',
          code: 'UNAUTHORIZED',
          redirect: '/auth/login?redirect=upgrade',
        },
        { status: 401 },
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 },
      );
    }

    // Prevent duplicate subscriptions
    if (
      user.plan === 'pro' &&
      user.subscriptionStatus === 'active'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Already subscribed to Pro',
        },
        { status: 400 },
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://fwd.dev';
    const successUrl = `${baseUrl}/dashboard/billing?payment=success`;

    const session = await dodo.checkoutSessions.create({
      product_cart: [
        { product_id: FWD_PRO_PRODUCT_ID, quantity: 1 },
      ],
      customer: {
        email: user.email,
        name: user.name || undefined,
      },
      return_url: successUrl,
      metadata: {
        user_id: user.id,
        user_email: user.email,
      },
    });

    console.log(
      `[Checkout] Session created for ${user.email}:`,
      session.session_id,
    );

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: session.checkout_url,
        sessionId: session.session_id,
      },
    });
  } catch (error: any) {
    console.error(
      '[Checkout] Error creating session:',
      error,
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create checkout session',
      },
      { status: 500 },
    );
  }
}
