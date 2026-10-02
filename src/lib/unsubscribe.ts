import 'server-only';
import jwt from 'jsonwebtoken';
import { db } from '@/db';
import { emails } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '@/lib/env';

interface UnsubscribePayload {
  emailId: string;
  to: string;
  userId: string;
}

/**
 * Secrets that signed unsubscribe links before UNSUBSCRIBE_SECRET was required.
 * 'fallback-dev-secret' is public in the repo, so tokens signed with these are
 * only honored when they match a real email row (see verifyUnsubscribeToken).
 * Remove this block after LEGACY_TOKENS_ACCEPTED_UNTIL.
 */
const LEGACY_SECRETS = [
  process.env.NEXTAUTH_SECRET,
  'fallback-dev-secret',
].filter((s): s is string => !!s && s !== env.UNSUBSCRIBE_SECRET);
const LEGACY_TOKENS_ACCEPTED_UNTIL = new Date('2026-12-03T00:00:00Z');

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function decode(token: string, secret: string): UnsubscribePayload | null {
  try {
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    if (
      typeof decoded !== 'object' ||
      typeof decoded.emailId !== 'string' ||
      typeof decoded.to !== 'string' ||
      typeof decoded.userId !== 'string'
    ) {
      return null;
    }
    return {
      emailId: decoded.emailId,
      to: decoded.to,
      userId: decoded.userId,
    };
  } catch {
    return null;
  }
}

/**
 * Generate a JWT token for unsubscribe link.
 * Tokens never expire to comply with CAN-SPAM (links must work indefinitely).
 */
export function generateUnsubscribeToken(payload: UnsubscribePayload): string {
  return jwt.sign(payload, env.UNSUBSCRIBE_SECRET, { algorithm: 'HS256' });
}

/**
 * Verify and decode an unsubscribe token.
 * Returns null if token is invalid.
 */
export async function verifyUnsubscribeToken(
  token: string,
): Promise<UnsubscribePayload | null> {
  const payload = decode(token, env.UNSUBSCRIBE_SECRET);
  if (payload) return payload;

  if (new Date() >= LEGACY_TOKENS_ACCEPTED_UNTIL) return null;

  // Legacy secrets are guessable, so the token must describe an email we really sent
  const legacy = LEGACY_SECRETS.map((secret) => decode(token, secret)).find(
    Boolean,
  );
  if (!legacy || !UUID_RE.test(legacy.emailId)) return null;

  const record = await db.query.emails.findFirst({
    where: eq(emails.id, legacy.emailId),
    columns: { to: true, userId: true },
  });

  if (
    !record ||
    record.to !== legacy.to ||
    record.userId !== legacy.userId
  ) {
    return null;
  }

  return legacy;
}

/**
 * Generate full unsubscribe URL for an email.
 */
export function getUnsubscribeUrl(emailId: string, to: string, userId: string, baseUrl: string): string {
  const token = generateUnsubscribeToken({ emailId, to, userId });
  return `${baseUrl}/unsubscribe/${token}`;
}
