import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { emails } from '@/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import {
  getDateFilter,
  formatDateISO,
  DateRange,
} from '@/lib/utils';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') || '30d';
  const groupBy = searchParams.get('groupBy') || 'day';

  const dateFilter = getDateFilter(range as DateRange);

  const dateGroup =
    groupBy === 'week'
      ? sql`DATE_TRUNC('week', ${emails.createdAt})`
      : sql`DATE(${emails.createdAt})`;

  // Build where conditions (dateFilter is always defined for timeline since 'all' is not allowed)
  const whereConditions = dateFilter
    ? and(
        eq(emails.userId, user.id),
        gte(emails.createdAt, dateFilter)
      )
    : eq(emails.userId, user.id);

  const data = await db
    .select({
      date: dateGroup,
      sent: sql<number>`COUNT(*)::int`,
      delivered: sql<number>`COUNT(CASE WHEN ${emails.status} = 'completed' THEN 1 END)::int`,
      opened: sql<number>`COUNT(CASE WHEN ${emails.openedAt} IS NOT NULL THEN 1 END)::int`,
      bounced: sql<number>`COUNT(CASE WHEN ${emails.status} = 'bounced' THEN 1 END)::int`,
      failed: sql<number>`COUNT(CASE WHEN ${emails.status} = 'failed' THEN 1 END)::int`,
    })
    .from(emails)
    .where(whereConditions)
    .groupBy(dateGroup)
    .orderBy(sql`${dateGroup} ASC`);

  const formattedData = data.map((row) => ({
    date: formatDateISO(row.date as Date),
    sent: row.sent,
    delivered: row.delivered,
    opened: row.opened,
    bounced: row.bounced,
    failed: row.failed,
  }));

  return NextResponse.json({
    data: formattedData,
    range,
    groupBy,
  });
}
