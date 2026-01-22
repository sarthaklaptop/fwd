import 'server-only';
import DodoPayments from 'dodopayments';

// DodoPayments client instance
// Uses bearerToken from env for authentication
// Use DODO_LIVE_MODE=true to enable live payments (default: test_mode)
export const dodo = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY!,
  environment:
    process.env.DODO_LIVE_MODE === 'true'
      ? 'live_mode'
      : 'test_mode',
});

// Product ID for FWD Pro subscription
const productId = process.env.DODO_PRODUCT_ID;
if (!productId) {
  throw new Error(
    'Missing required environment variable: DODO_PRODUCT_ID',
  );
}
export const FWD_PRO_PRODUCT_ID = productId;
