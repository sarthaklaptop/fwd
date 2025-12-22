import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { emails } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { formatTimestampISO } from '@/lib/utils';

/**
 * GET /api/emails/export
 * Streams CSV export of emails with optional filters.
 * Uses streaming to handle large datasets efficiently.
 * 
 * Query params:
 * - status: filter by status
 * - dateFrom: filter from date (ISO string)
 * - dateTo: filter to date (ISO string)
 */
export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build where conditions
    const conditions = [eq(emails.userId, user.id)];

    if (status) {
        conditions.push(eq(emails.status, status as any));
    }
    if (dateFrom) {
        conditions.push(gte(emails.createdAt, new Date(dateFrom)));
    }
    if (dateTo) {
        conditions.push(lte(emails.createdAt, new Date(dateTo)));
    }

    try {
        // Fetch emails (limit to 5,000 for safety in serverless env)
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

        // Build CSV content directly (simpler than streaming for serverless)
        const csvLines: string[] = [];
        
        // CSV Header
        csvLines.push('ID,To,Subject,Status,Bounce Type,Opened At,Created At');

        // CSV Rows
        for (const email of emailList) {
            const row = [
                email.id,
                escapeCSV(email.to),
                escapeCSV(email.subject),
                email.status,
                email.bounceType || '',
                email.openedAt ? formatTimestampISO(email.openedAt) : '',
                formatTimestampISO(email.createdAt),
            ].join(',');
            csvLines.push(row);
        }

        const csvContent = csvLines.join('\n');

        // Generate filename with current date
        const filename = `emails-export-${new Date().toISOString().split('T')[0]}.csv`;

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
        return NextResponse.json(
            { error: 'Failed to export emails. Please try again.' },
            { status: 500 }
        );
    }
}

/**
 * Escape CSV field value (handle commas, quotes, newlines)
 */
function escapeCSV(value: string): string {
    if (!value) return '';
    // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}
