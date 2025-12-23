import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { webhookEvents } from '@/db/schema';
import { lt } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    // Verify cron secret (Vercel sends this automatically for cron jobs)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const result = await db.delete(webhookEvents)
            .where(lt(webhookEvents.createdAt, sevenDaysAgo));

        console.log(`🧹 Cleanup: Deleted old webhook logs`);

        return NextResponse.json({
            success: true,
            message: 'Old logs cleaned up',
            cutoffDate: sevenDaysAgo.toISOString()
        });
    } catch (error: any) {
        console.error('Cleanup error:', error);
        return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
    }
}
