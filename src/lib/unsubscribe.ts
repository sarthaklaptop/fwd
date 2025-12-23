import jwt from 'jsonwebtoken';

const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-dev-secret';

interface UnsubscribePayload {
  emailId: string;
  to: string;
  userId: string;
}

/**
 * Generate a JWT token for unsubscribe link.
 * Tokens never expire to comply with CAN-SPAM (links must work indefinitely).
 */
export function generateUnsubscribeToken(payload: UnsubscribePayload): string {
  return jwt.sign(payload, UNSUBSCRIBE_SECRET, { algorithm: 'HS256' });
}

/**
 * Verify and decode an unsubscribe token.
 * Returns null if token is invalid.
 */
export function verifyUnsubscribeToken(token: string): UnsubscribePayload | null {
  try {
    return jwt.verify(token, UNSUBSCRIBE_SECRET) as UnsubscribePayload;
  } catch {
    return null;
  }
}

/**
 * Generate full unsubscribe URL for an email.
 */
export function getUnsubscribeUrl(emailId: string, to: string, userId: string, baseUrl: string): string {
  const token = generateUnsubscribeToken({ emailId, to, userId });
  return `${baseUrl}/unsubscribe/${token}`;
}
