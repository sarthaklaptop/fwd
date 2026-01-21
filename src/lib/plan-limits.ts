import { db } from '@/db';
import { users, emails, domains } from '@/db/schema';
import { eq, gte, count, and } from 'drizzle-orm';

/**
 * Plan limits configuration
 * Free: 100 emails/month, 1 domain
 * Pro: 5000 emails/month, 5 domains
 */
export const PLAN_LIMITS = {
  free: {
    emailsPerMonth: 100,
    domains: 1,
    templates: 5,
  },
  pro: {
    emailsPerMonth: 5000,
    domains: 5,
    templates: Infinity,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

/**
 * Get user's plan from database
 */
export async function getUserPlan(
  userId: string,
): Promise<PlanType> {
  const [user] = await db
    .select({
      plan: users.plan,
      subscriptionStatus: users.subscriptionStatus,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // Pro only if active subscription
  if (
    user?.plan === 'pro' &&
    user?.subscriptionStatus === 'active'
  ) {
    return 'pro';
  }

  return 'free';
}

/**
 * Get user's monthly email count (current month)
 */
export async function getMonthlyEmailCount(
  userId: string,
): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [result] = await db
    .select({ count: count() })
    .from(emails)
    .where(
      and(
        eq(emails.userId, userId),
        gte(emails.createdAt, startOfMonth),
      ),
    );

  return result?.count || 0;
}

/**
 * Get user's domain count
 */
export async function getUserDomainCount(
  userId: string,
): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(domains)
    .where(eq(domains.userId, userId));

  return result?.count || 0;
}

/**
 * Check if user can send email (returns remaining or error)
 */
export async function checkEmailLimit(
  userId: string,
): Promise<{
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
  error?: string;
}> {
  const plan = await getUserPlan(userId);
  const limit = PLAN_LIMITS[plan].emailsPerMonth;
  const used = await getMonthlyEmailCount(userId);
  const remaining = Math.max(0, limit - used);

  if (used >= limit) {
    const upgradeMsg =
      plan === 'free'
        ? ' Upgrade to Pro for 5,000 emails/month.'
        : '';
    return {
      allowed: false,
      limit,
      used,
      remaining: 0,
      error: `Monthly email limit reached (${limit}/month).${upgradeMsg}`,
    };
  }

  return { allowed: true, limit, used, remaining };
}

/**
 * Check if user can add domain (returns remaining or error)
 */
export async function checkDomainLimit(
  userId: string,
): Promise<{
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
  error?: string;
}> {
  const plan = await getUserPlan(userId);
  const limit = PLAN_LIMITS[plan].domains;
  const used = await getUserDomainCount(userId);
  const remaining = Math.max(0, limit - used);

  if (used >= limit) {
    const upgradeMsg =
      plan === 'free'
        ? ' Upgrade to Pro for up to 5 domains.'
        : '';
    return {
      allowed: false,
      limit,
      used,
      remaining: 0,
      error: `Domain limit reached (${limit} domain${limit > 1 ? 's' : ''} max).${upgradeMsg}`,
    };
  }

  return { allowed: true, limit, used, remaining };
}
