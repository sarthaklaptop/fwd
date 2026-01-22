import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import {
  emails,
  apiKeys,
  templates,
  webhooks,
  batches,
} from '@/db/schema';
import { eq, count, and, gte } from 'drizzle-orm';
import { ApiResponse } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';
import {
  getUserPlan,
  getMonthlyEmailCount,
  PLAN_LIMITS,
} from '@/lib/plan-limits';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new ApiError(
      401,
      'Please log in to view settings',
    ).send();
  }

  // Get plan-aware usage data
  const plan = await getUserPlan(user.id);
  const emailsThisMonth = await getMonthlyEmailCount(
    user.id,
  );
  const monthlyLimit = PLAN_LIMITS[plan].emailsPerMonth;

  // Fetch all usage stats in parallel
  const [
    totalEmailsResult,
    apiKeysResult,
    templatesResult,
    webhooksResult,
    batchesResult,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(emails)
      .where(eq(emails.userId, user.id)),
    db
      .select({ count: count() })
      .from(apiKeys)
      .where(eq(apiKeys.userId, user.id)),
    db
      .select({ count: count() })
      .from(templates)
      .where(eq(templates.userId, user.id)),
    db
      .select({ count: count() })
      .from(webhooks)
      .where(eq(webhooks.userId, user.id)),
    db
      .select({ count: count() })
      .from(batches)
      .where(eq(batches.userId, user.id)),
  ]);

  const settingsData = {
    profile: {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || null,
      avatarUrl: user.user_metadata?.avatar_url || null,
      createdAt: user.created_at,
    },
    usage: {
      totalEmails: totalEmailsResult[0]?.count || 0,
      apiKeys: apiKeysResult[0]?.count || 0,
      templates: templatesResult[0]?.count || 0,
      webhooks: webhooksResult[0]?.count || 0,
      batches: batchesResult[0]?.count || 0,
      emailsThisMonth,
      monthlyLimit,
    },
    plan: {
      name: plan,
      displayName: plan === 'pro' ? 'FWD Pro' : 'Free Tier',
      limits: PLAN_LIMITS[plan],
    },
  };

  return new ApiResponse(
    200,
    settingsData,
    'Settings loaded',
  ).send();
}
