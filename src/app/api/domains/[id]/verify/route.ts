import { NextResponse } from 'next/server';
import { db } from '@/db';
import { domains } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { ses } from '@/lib/ses';
import {
  GetIdentityVerificationAttributesCommand,
  GetIdentityDkimAttributesCommand,
} from '@aws-sdk/client-ses';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Verify domain DNS records
export async function POST(
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

    // Check domain verification status in SES
    const verificationResponse = await ses.send(
      new GetIdentityVerificationAttributesCommand({
        Identities: [domain.domain],
      })
    );

    const verificationAttrs =
      verificationResponse.VerificationAttributes?.[
        domain.domain
      ];
    const verificationStatus =
      verificationAttrs?.VerificationStatus;

    // Check DKIM status in SES
    const dkimResponse = await ses.send(
      new GetIdentityDkimAttributesCommand({
        Identities: [domain.domain],
      })
    );

    const dkimAttrs =
      dkimResponse.DkimAttributes?.[domain.domain];
    const dkimStatus = dkimAttrs?.DkimVerificationStatus;

    // Determine overall status
    let newStatus:
      | 'pending'
      | 'verifying'
      | 'verified'
      | 'failed' = 'pending';
    let verified = false;

    if (
      verificationStatus === 'Success' &&
      dkimStatus === 'Success'
    ) {
      newStatus = 'verified';
      verified = true;
    } else if (
      verificationStatus === 'Pending' ||
      dkimStatus === 'Pending'
    ) {
      newStatus = 'verifying';
    } else if (
      verificationStatus === 'Failed' ||
      dkimStatus === 'Failed'
    ) {
      newStatus = 'failed';
    }

    // Update database
    await db
      .update(domains)
      .set({
        status: newStatus,
        verifiedAt: verified ? new Date() : null,
        lastCheckAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(domains.id, id));

    return NextResponse.json({
      success: true,
      verified,
      status: newStatus,
      checks: {
        domain: verificationStatus || 'Unknown',
        dkim: dkimStatus || 'Unknown',
      },
      message: verified
        ? 'Domain verified successfully! You can now send emails from this domain.'
        : newStatus === 'verifying'
        ? 'DNS records detected but still propagating. Please wait a few minutes and try again.'
        : 'DNS records not found. Please add the required DNS records and try again.',
    });
  } catch (error: any) {
    console.error('Error verifying domain:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify domain' },
      { status: 500 }
    );
  }
}
