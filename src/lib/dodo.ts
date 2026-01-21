import 'server-only';
import DodoPayments from 'dodopayments';

// DodoPayments client instance
// Uses bearerToken from env for authentication
export const dodo = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY!,
});

// Product ID for FWD Pro subscription
const productId = process.env.DODO_PRODUCT_ID;
if (!productId) {
  throw new Error(
    'Missing required environment variable: DODO_PRODUCT_ID',
  );
}
export const FWD_PRO_PRODUCT_ID = productId;
