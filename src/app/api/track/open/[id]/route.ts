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
 * 
 * When an email client loads this image, we record the open event.
 * Returns a 1x1 transparent GIF.
 * 
 * @route GET /api/track/open/:id
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: emailId } = await params;

    // Fire-and-forget: Update openedAt if not already set
    // Don't await - return pixel immediately for fast response
    db.update(emails)
        .set({ openedAt: new Date() })
        .where(
            and(
                eq(emails.id, emailId),
                isNull(emails.openedAt)  // Only update if not already opened
            )
        )
        .then(() => {
            console.log(`📬 Email ${emailId} opened`);
        })
        .catch((error) => {
            console.error(`Failed to record open for ${emailId}:`, error);
        });

    // Return 1x1 transparent GIF immediately
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
