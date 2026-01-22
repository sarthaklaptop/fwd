import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { emails, users } from '@/db/schema';
import { eq, and, gte, count } from 'drizzle-orm';
import DashboardSidebar from './dashboard-sidebar';
import {
  getUserPlan,
  getMonthlyEmailCount,
  PLAN_LIMITS,
} from '@/lib/plan-limits';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if user is soft-deleted
  const userRecord = await db
    .select({ isDeleted: users.isDeleted })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!userRecord[0] || userRecord[0].isDeleted) {
    // Sign out the deleted user and redirect
    await supabase.auth.signOut();
    redirect(
      '/auth/login?error=' +
        (userRecord[0]
          ? 'account_deleted'
          : 'account_not_found'),
    );
  }

  // Get plan-based monthly usage stats for sidebar
  const plan = await getUserPlan(user.id);
  const emailsThisMonth = await getMonthlyEmailCount(
    user.id,
  );
  const monthlyLimit = PLAN_LIMITS[plan].emailsPerMonth;

  return (
    <DashboardSidebar
      emailsThisMonth={emailsThisMonth}
      monthlyLimit={monthlyLimit}
      plan={plan}
    >
      <div className="p-6">{children}</div>
    </DashboardSidebar>
  );
}
