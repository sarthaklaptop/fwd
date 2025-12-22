import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { emails } from '@/db/schema';
import { eq, and, gte, lte, lt, ilike, or, desc } from 'drizzle-orm';


export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build where conditions array
    const conditions = [eq(emails.userId, user.id)];

    // Search filter (to and subject)
    if (search) {
        const searchPattern = `%${search}%`;
        conditions.push(
            or(
                ilike(emails.to, searchPattern),
                ilike(emails.subject, searchPattern)
            )!
        );
    }

    // Status filter
    if (status) {
        conditions.push(eq(emails.status, status as any));
    }

    // Date range filters
    if (dateFrom) {
        conditions.push(gte(emails.createdAt, new Date(dateFrom)));
    }
    if (dateTo) {
        conditions.push(lte(emails.createdAt, new Date(dateTo)));
    }

    // Cursor-based pagination: get emails created before cursor's createdAt
    let cursorEmail = null;
    if (cursor) {
        const [found] = await db
            .select({ createdAt: emails.createdAt })
            .from(emails)
            .where(eq(emails.id, cursor))
            .limit(1);
        cursorEmail = found;
    }

    if (cursorEmail) {
        conditions.push(lt(emails.createdAt, cursorEmail.createdAt));
    }

    // Execute query with limit + 1 to check if there are more results
    const results = await db
        .select({
            id: emails.id,
            to: emails.to,
            subject: emails.subject,
            status: emails.status,
            openedAt: emails.openedAt,
            createdAt: emails.createdAt,
        })
        .from(emails)
        .where(and(...conditions))
        .orderBy(desc(emails.createdAt))
        .limit(limit + 1);

    // Check if there are more results
    const hasMore = results.length > limit;
    const emailList = hasMore ? results.slice(0, limit) : results;
    const nextCursor = hasMore && emailList.length > 0 
        ? emailList[emailList.length - 1].id 
        : null;

    return NextResponse.json({
        emails: emailList,
        nextCursor,
        hasMore,
    });
}
