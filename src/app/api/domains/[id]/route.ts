import { NextResponse } from 'next/server';
import { db } from '@/db';
import { domains } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { ses } from '@/lib/ses';
import { DeleteIdentityCommand } from '@aws-sdk/client-ses';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Get single domain details
export async function GET(
  req: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
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

    const domain = await db.query.domains.findFirst({
      where: and(
        eq(domains.id, id),
        eq(domains.userId, user.id)
      ),
    });

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    // Parse DKIM tokens safely
    let dkimTokens: string[] = [];
    try {
      dkimTokens = domain.dkimTokens
        ? JSON.parse(domain.dkimTokens)
        : [];
    } catch {
      dkimTokens = [];
    }

    return NextResponse.json({
      success: true,
      data: {
        ...domain,
        dkimTokens,
      },
    });
  } catch (error: any) {
    console.error('Error fetching domain:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domain' },
      { status: 500 }
    );
  }
}

// Delete a domain
export async function DELETE(
  req: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
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

    const domain = await db.query.domains.findFirst({
      where: and(
        eq(domains.id, id),
        eq(domains.userId, user.id)
      ),
    });

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    // Delete from SES
    try {
      await ses.send(
        new DeleteIdentityCommand({
          Identity: domain.domain,
        })
      );
    } catch (sesError) {
      console.error(
        'SES delete error (non-fatal):',
        sesError
      );
    }

    // Delete from database
    await db.delete(domains).where(eq(domains.id, id));

    return NextResponse.json({
      success: true,
      message: 'Domain deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting domain:', error);
    return NextResponse.json(
      { error: 'Failed to delete domain' },
      { status: 500 }
    );
  }
}
