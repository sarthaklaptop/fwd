import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { emails } from '@/db/schema';
import { eq, isNull, and } from 'drizzle-orm';

// 1x1 transparent GIF (43 bytes)
const TRANSPARENT_GIF = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
);

/**
 * Open tracking endpoint.
 * Returns a 1x1 transparent GIF and records the open event.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: emailId } = await params;

    try {
        // Update openedAt if not already set
        await db.update(emails)
            .set({ openedAt: new Date() })
            .where(
                and(
                    eq(emails.id, emailId),
                    isNull(emails.openedAt)
                )
            );
        console.log(`📬 Email ${emailId} opened`);
    } catch (error) {
        console.error(`Failed to record open for ${emailId}:`, error);
    }

    // Return 1x1 transparent GIF
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

