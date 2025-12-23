import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { emails } from '@/db/schema';
import { eq, isNull, and } from 'drizzle-orm';
import { publishEvent } from '@/lib/events';

// 1x1 transparent GIF (43 bytes)
const TRANSPARENT_GIF = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
);

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: emailId } = await params;

    try {
        await db.update(emails)
            .set({ openedAt: new Date() })
            .where(
                and(
                    eq(emails.id, emailId),
                    isNull(emails.openedAt)
                )
            );
        console.log(`📬 Email ${emailId} opened`);

        const email = await db.query.emails.findFirst({
            where: eq(emails.id, emailId),
            columns: { userId: true }
        });

        if (email?.userId) {
            await publishEvent(email.userId, 'email.opened', { emailId });
        }
    } catch (error) {
        console.error(`Failed to record open for ${emailId}:`, error);
    }

    return new NextResponse(TRANSPARENT_GIF, {
        status: 200,
        headers: {
            'Content-Type': 'image/gif',
            'Content-Length': String(TRANSPARENT_GIF.length),
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        },
    });
}
