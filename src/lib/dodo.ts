import 'server-only';
import DodoPayments from 'dodopayments';

/**
 * DodoPayments Configuration
 *
 * Toggle between test and live mode using DODO_LIVE_MODE env var.
 * Each mode uses its own API key, webhook secret, and product ID.
 *
 * Required env vars:
 * - DODO_LIVE_MODE: 'true' for live, 'false' or unset for test
 * - DODO_API_KEY_TEST / DODO_API_KEY_LIVE
 * - DODO_WEBHOOK_SECRET_TEST / DODO_WEBHOOK_SECRET_LIVE
 * - DODO_PRODUCT_ID_TEST / DODO_PRODUCT_ID_LIVE
 */

export const DODO_IS_LIVE_MODE =
  process.env.DODO_LIVE_MODE === 'true';

// Select API key based on mode
const apiKey = DODO_IS_LIVE_MODE
  ? process.env.DODO_API_KEY_LIVE
  : process.env.DODO_API_KEY_TEST;

if (!apiKey) {
  throw new Error(
    `Missing required env var: DODO_API_KEY_${DODO_IS_LIVE_MODE ? 'LIVE' : 'TEST'}`,
  );
}

// DodoPayments client instance
export const dodo = new DodoPayments({
  bearerToken: apiKey,
  environment: DODO_IS_LIVE_MODE
    ? 'live_mode'
    : 'test_mode',
});

// Product ID for FWD Pro subscription
const productId = DODO_IS_LIVE_MODE
  ? process.env.DODO_PRODUCT_ID_LIVE
  : process.env.DODO_PRODUCT_ID_TEST;

if (!productId) {
  throw new Error(
    `Missing required env var: DODO_PRODUCT_ID_${DODO_IS_LIVE_MODE ? 'LIVE' : 'TEST'}`,
  );
}

export const FWD_PRO_PRODUCT_ID = productId;

// Startup log to confirm configuration
console.log('[DodoPayments] Initialized:', {
  mode: DODO_IS_LIVE_MODE ? 'LIVE' : 'TEST',
  productId: FWD_PRO_PRODUCT_ID,
  apiKeyPrefix: apiKey.substring(0, 10) + '...',
});
