import { SESClient } from '@aws-sdk/client-ses';

/**
 * Shared AWS SES client instance.
 * Used across all email sending and domain verification operations.
 */
export const ses = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
