import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { emails } from '@/db/schema';
import { eq, count, and, gte } from 'drizzle-orm';
import DashboardSidebar from './dashboard-sidebar';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login');
    }

    // Get daily usage stats for sidebar
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStats = await db.select({
        count: count(),
    }).from(emails).where(and(eq(emails.userId, user.id), gte(emails.createdAt, today)));

    const emailsToday = todayStats[0]?.count || 0;
    const DAILY_LIMIT = 100;

    return (
        <DashboardSidebar emailsToday={emailsToday} dailyLimit={DAILY_LIMIT}>
            <div className="p-6">
                {children}
            </div>
        </DashboardSidebar>
    );
}
