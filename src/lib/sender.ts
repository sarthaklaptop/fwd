import 'server-only';
import { db } from '@/db';
import { domains } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Default sender email for free users
export const DEFAULT_FROM_EMAIL =
  process.env.SES_FROM_EMAIL ||
  'noreply@fwd.sarthak.online';

const DEFAULT_FROM_DOMAIN = DEFAULT_FROM_EMAIL.split('@')[1].toLowerCase();

const MAX_FROM_LENGTH = 320;
const MAX_DISPLAY_NAME_LENGTH = 100;

// Unquoted RFC 5322 dot-atom local part, and a plain DNS hostname.
// Quoted local parts, comments and IP-literal domains are rejected on purpose.
const LOCAL_PART_RE = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

// Characters that carry meaning in an address header. A display name holding
// any of them could make SES parse a different mailbox than the one we checked.
const UNSAFE_DISPLAY_NAME_RE = /[<>()"\\@,;:[\]\x00-\x1f\x7f]/;

const CONTROL_CHARS_RE = /[\x00-\x1f\x7f]/;

export interface ParsedSender {
  name: string | null;
  address: string;
  domain: string;
}

/**
 * Strictly parse a From value as exactly one mailbox, either
 * `local@domain` or `Display Name <local@domain>`.
 * Returns null for anything else (multiple mailboxes, quoted strings,
 * comments, CR/LF, group syntax, nested angle brackets).
 */
export function parseSender(input: string): ParsedSender | null {
  if (input.length > MAX_FROM_LENGTH || CONTROL_CHARS_RE.test(input)) {
    return null;
  }

  const trimmed = input.trim();
  let name: string | null = null;
  let address: string;

  const angle = trimmed.match(/^([^<>]*)<([^<>]+)>$/);
  if (angle) {
    const rawName = angle[1].trim();
    if (rawName) {
      if (
        rawName.length > MAX_DISPLAY_NAME_LENGTH ||
        UNSAFE_DISPLAY_NAME_RE.test(rawName)
      ) {
        return null;
      }
      name = rawName;
    }
    address = angle[2].trim();
  } else {
    address = trimmed;
  }

  const at = address.lastIndexOf('@');
  if (at <= 0 || at !== address.indexOf('@')) return null;

  const local = address.slice(0, at);
  const domain = address.slice(at + 1).toLowerCase();

  if (local.length > 64 || !LOCAL_PART_RE.test(local)) return null;
  if (!DOMAIN_RE.test(domain)) return null;

  return { name, address: `${local}@${domain}`, domain };
}

/**
 * Build the SES Source header from already-validated parts, so SES always
 * sends from the exact address whose domain was checked.
 */
export function formatSender({ name, address }: ParsedSender): string {
  if (!name) return address;
  // Non-ASCII names use RFC 2047 encoding; ASCII names are quoted.
  // parseSender has already rejected quotes and backslashes.
  const encodedName = /^[\x20-\x7e]*$/.test(name)
    ? `"${name}"`
    : `=?UTF-8?B?${Buffer.from(name, 'utf8').toString('base64')}?=`;
  return `${encodedName} <${address}>`;
}

export type SenderResult =
  | { valid: true; fromEmail: string }
  | { valid: false; error: string };

/**
 * Validate a user-supplied From value and return the SES Source to use.
 * Allowed senders are the shared default domain, or a domain the user owns
 * and has verified. Every code path that sends mail must use this.
 */
export async function resolveSender(
  fromInput: unknown,
  userId: string | null | undefined,
): Promise<SenderResult> {
  if (fromInput === undefined || fromInput === null || fromInput === '') {
    return { valid: true, fromEmail: DEFAULT_FROM_EMAIL };
  }

  if (typeof fromInput !== 'string') {
    return { valid: false, error: 'Invalid from email format' };
  }

  const parsed = parseSender(fromInput);
  if (!parsed) {
    return {
      valid: false,
      error: 'Invalid from email format. Use "email@domain.com" or "Name <email@domain.com>".',
    };
  }

  if (parsed.domain === DEFAULT_FROM_DOMAIN) {
    return { valid: true, fromEmail: formatSender(parsed) };
  }

  if (!userId) {
    return {
      valid: false,
      error: `Domain '${parsed.domain}' is not verified. Add and verify it in your dashboard first.`,
    };
  }

  const verifiedDomain = await db.query.domains.findFirst({
    where: and(
      eq(domains.userId, userId),
      eq(domains.domain, parsed.domain),
      eq(domains.status, 'verified'),
    ),
    columns: { id: true },
  });

  if (!verifiedDomain) {
    return {
      valid: false,
      error: `Domain '${parsed.domain}' is not verified. Add and verify it in your dashboard first.`,
    };
  }

  return { valid: true, fromEmail: formatSender(parsed) };
}
