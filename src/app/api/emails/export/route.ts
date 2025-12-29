import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { emails } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { formatTimestampISO } from '@/lib/utils';
import { ApiError } from '@/lib/api-error';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new ApiError(
      401,
      'Please log in to export emails'
    ).send();
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  const conditions = [eq(emails.userId, user.id)];

  if (status) {
    conditions.push(eq(emails.status, status as any));
  }
  if (dateFrom) {
    conditions.push(
      gte(emails.createdAt, new Date(dateFrom))
    );
  }
  if (dateTo) {
    conditions.push(
      lte(emails.createdAt, new Date(dateTo))
    );
  }

  try {
    const emailList = await db
      .select({
        id: emails.id,
        to: emails.to,
        subject: emails.subject,
        status: emails.status,
        bounceType: emails.bounceType,
        openedAt: emails.openedAt,
        createdAt: emails.createdAt,
      })
      .from(emails)
      .where(and(...conditions))
      .orderBy(desc(emails.createdAt))
      .limit(5000);

    const csvLines: string[] = [];
    csvLines.push(
      'ID,To,Subject,Status,Bounce Type,Opened At,Created At'
    );

    for (const email of emailList) {
      const row = [
        email.id,
        escapeCSV(email.to),
        escapeCSV(email.subject),
        email.status,
        email.bounceType || '',
        email.openedAt
          ? formatTimestampISO(email.openedAt)
          : '',
        formatTimestampISO(email.createdAt),
      ].join(',');
      csvLines.push(row);
    }

    const csvContent = csvLines.join('\n');
    const filename = `emails-export-${
      new Date().toISOString().split('T')[0]
    }.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('CSV export error:', error);
    return new ApiError(
      500,
      'Failed to export emails. Please try again.'
    ).send();
  }
}

function escapeCSV(value: string): string {
  if (!value) return '';
  if (
    value.includes(',') ||
    value.includes('"') ||
    value.includes('\n')
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
