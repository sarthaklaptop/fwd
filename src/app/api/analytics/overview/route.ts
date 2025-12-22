import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { emails } from '@/db/schema';
import { eq, and, gte, count, sql } from 'drizzle-orm';
import { getDateFilter } from '@/lib/utils';


export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '30d';

    // Calculate date filter
    const dateFilter = getDateFilter(range);

    // Build where conditions
    const whereConditions = dateFilter
        ? and(eq(emails.userId, user.id), gte(emails.createdAt, dateFilter))
        : eq(emails.userId, user.id);

    // Aggregate stats in a single query using conditional counts
    const [stats] = await db
        .select({
            total: count(),
            delivered: count(sql`CASE WHEN ${emails.status} = 'completed' THEN 1 END`),
            opened: count(sql`CASE WHEN ${emails.openedAt} IS NOT NULL THEN 1 END`),
            bounced: count(sql`CASE WHEN ${emails.status} = 'bounced' THEN 1 END`),
            complained: count(sql`CASE WHEN ${emails.status} = 'complained' THEN 1 END`),
            failed: count(sql`CASE WHEN ${emails.status} = 'failed' THEN 1 END`),
            pending: count(sql`CASE WHEN ${emails.status} IN ('pending', 'processing') THEN 1 END`),
        })
        .from(emails)
        .where(whereConditions);

    const total = stats.total || 0;
    const delivered = stats.delivered || 0;
    const opened = stats.opened || 0;

    return NextResponse.json({
        total,
        delivered,
        opened,
        bounced: stats.bounced || 0,
        complained: stats.complained || 0,
        failed: stats.failed || 0,
        pending: stats.pending || 0,
        // Calculated rates
        deliveryRate: total > 0 ? Math.round((delivered / total) * 100 * 10) / 10 : 0,
        openRate: delivered > 0 ? Math.round((opened / delivered) * 100 * 10) / 10 : 0,
        bounceRate: total > 0 ? Math.round((stats.bounced || 0) / total * 100 * 10) / 10 : 0,
        range,
    });
}
