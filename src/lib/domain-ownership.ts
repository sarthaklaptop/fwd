import 'server-only';
import { db } from '@/db';
import { domains } from '@/db/schema';
import { and, eq, ne } from 'drizzle-orm';
import { DEFAULT_FROM_EMAIL } from '@/lib/sender';

// Domain part of "a@b.com" or "Name <a@b.com>"
function domainOf(address: string | undefined): string | null {
  const match = address?.match(/@([^@\s>]+)>?\s*$/);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Domains that belong to the platform itself. All tenants share one SES
 * account, so a tenant who could add one of these could also delete its SES
 * identity and stop platform sending (default sender, billing, auth emails).
 * Extra domains can be listed in RESERVED_DOMAINS (comma-separated).
 */
export function getReservedDomains(): string[] {
  const configured = [
    domainOf(DEFAULT_FROM_EMAIL),
    domainOf(process.env.FWD_EMAIL),
    ...(process.env.RESERVED_DOMAINS ?? '').split(','),
  ];
  return [
    ...new Set(
      configured
        .map((d) => d?.trim().toLowerCase().replace(/\.$/, ''))
        .filter((d): d is string => !!d),
    ),
  ];
}

/** True for a reserved domain or any of its subdomains. */
export function isReservedDomain(domain: string): boolean {
  const d = domain.trim().toLowerCase().replace(/\.$/, '');
  return getReservedDomains().some(
    (reserved) => d === reserved || d.endsWith(`.${reserved}`),
  );
}

/** True if a user other than `userId` already has this domain verified. */
export async function isVerifiedByAnotherUser(
  domain: string,
  userId: string,
): Promise<boolean> {
  const row = await db.query.domains.findFirst({
    where: and(
      eq(domains.domain, domain),
      ne(domains.userId, userId),
      eq(domains.status, 'verified'),
    ),
    columns: { id: true },
  });
  return !!row;
}

/** Number of domain rows for this domain, excluding the given row. */
export async function countOtherDomainRows(
  domain: string,
  excludeRowId: string,
): Promise<number> {
  const rows = await db
    .select({ id: domains.id })
    .from(domains)
    .where(and(eq(domains.domain, domain), ne(domains.id, excludeRowId)));
  return rows.length;
}
