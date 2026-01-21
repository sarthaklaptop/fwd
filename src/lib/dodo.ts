'use server';

import DodoPayments from 'dodopayments';

// DodoPayments client instance
// Uses bearerToken from env for authentication
export const dodo = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY!,
});

// Product ID for FWD Pro subscription
export const FWD_PRO_PRODUCT_ID =
  process.env.DODO_PRODUCT_ID!;
