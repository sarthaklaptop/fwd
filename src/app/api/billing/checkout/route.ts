import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  dodo,
  FWD_PRO_PRODUCT_ID,
  DODO_IS_LIVE_MODE,
} from '@/lib/dodo';

/**
 * POST /api/billing/checkout
 * Creates a DodoPayments checkout session for upgrading to Pro.
 * Returns checkout URL for frontend redirect.
 */
export async function POST(request: NextRequest) {
  console.log(
    '[Checkout] ========== Starting checkout flow ==========',
  );
  console.log(
    '[Checkout] Mode:',
    DODO_IS_LIVE_MODE ? 'LIVE' : 'TEST',
  );
  console.log('[Checkout] Product ID:', FWD_PRO_PRODUCT_ID);

  try {
    // Step 1: Authenticate user
    console.log(
      '[Checkout] Step 1: Authenticating user...',
    );
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      console.log(
        '[Checkout] Step 1 FAILED: No authenticated user',
      );
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
    console.log(
      '[Checkout] Step 1 OK: User authenticated:',
      authUser.email,
    );

    // Step 2: Fetch user from database
    console.log(
      '[Checkout] Step 2: Fetching user from database...',
    );
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1);

    if (!user) {
      console.log(
        '[Checkout] Step 2 FAILED: User not found in database',
      );
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 },
      );
    }
    console.log('[Checkout] Step 2 OK: User found:', {
      id: user.id,
      email: user.email,
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
    });

    // Step 3: Check for existing subscription
    console.log(
      '[Checkout] Step 3: Checking for existing subscription...',
    );
    if (
      user.plan === 'pro' &&
      user.subscriptionStatus === 'active'
    ) {
      console.log(
        '[Checkout] Step 3 BLOCKED: User already has active Pro subscription',
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Already subscribed to Pro',
        },
        { status: 400 },
      );
    }
    console.log(
      '[Checkout] Step 3 OK: No active subscription, proceeding',
    );

    // Step 4: Prepare checkout session
    console.log(
      '[Checkout] Step 4: Preparing checkout session...',
    );
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://fwd.dev';
    const successUrl = `${baseUrl}/dashboard/billing?payment=success`;

    const checkoutPayload = {
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
    };

    console.log(
      '[Checkout] Step 4 OK: Checkout payload prepared:',
      JSON.stringify(checkoutPayload, null, 2),
    );

    // Step 5: Create DodoPayments checkout session
    console.log(
      '[Checkout] Step 5: Creating DodoPayments checkout session...',
    );
    const session =
      await dodo.checkoutSessions.create(checkoutPayload);

    console.log(
      '[Checkout] Step 5 OK: Session created successfully',
    );
    console.log('[Checkout] Session details:', {
      session_id: session.session_id,
      checkout_url: session.checkout_url,
      expires_at: session.expires_at,
    });

    // Step 6: Return success response
    console.log(
      '[Checkout] Step 6: Returning success response',
    );
    console.log(
      '[Checkout] ========== Checkout flow complete ==========',
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
      '[Checkout] ========== CHECKOUT FAILED ==========',
    );
    console.error(
      '[Checkout] Error type:',
      error?.constructor?.name,
    );
    console.error(
      '[Checkout] Error message:',
      error?.message,
    );
    console.error(
      '[Checkout] Error status:',
      error?.status,
    );
    console.error('[Checkout] Full error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create checkout session',
      },
      { status: 500 },
    );
  }
}
