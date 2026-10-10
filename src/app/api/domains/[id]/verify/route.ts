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
import {
  isVerifiedByAnotherUser,
  generateVerificationToken,
  hasOwnershipRecord,
  ownershipRecord,
} from '@/lib/domain-ownership';

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

    // Rows created before ownership tokens existed get one on first check
    let verificationToken = domain.verificationToken;
    if (!verificationToken) {
      verificationToken = generateVerificationToken();
      await db
        .update(domains)
        .set({ verificationToken, updatedAt: new Date() })
        .where(eq(domains.id, id));
    }
    const ownership = ownershipRecord(
      domain.domain,
      verificationToken
    );

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

    // SES verification is account-wide: it doesn't say WHICH user published
    // the DNS records. Require this user's own token as proof of ownership.
    let ownershipVerified = false;
    if (verified) {
      ownershipVerified = await hasOwnershipRecord(
        domain.domain,
        verificationToken
      );
      if (!ownershipVerified) {
        verified = false;
        newStatus = 'verifying';
      }
    }

    // Only one account may own a verified domain. SES reports Success for
    // the whole account, so check nobody else already holds it.
    if (
      verified &&
      (await isVerifiedByAnotherUser(domain.domain, user.id))
    ) {
      await db
        .update(domains)
        .set({
          status: 'failed',
          lastCheckAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(domains.id, id));
      return NextResponse.json(
        {
          error:
            'This domain is already verified by another account. If you own it, contact support.',
        },
        { status: 409 },
      );
    }

    // Update database. The unique index on verified domains turns a
    // concurrent second owner into a constraint error.
    try {
      await db
        .update(domains)
        .set({
          status: newStatus,
          verifiedAt: verified ? new Date() : null,
          lastCheckAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(domains.id, id));
    } catch (updateError) {
      const code = (updateError as { cause?: { code?: string } })?.cause
        ?.code;
      if (code === '23505') {
        return NextResponse.json(
          {
            error:
              'This domain is already verified by another account. If you own it, contact support.',
          },
          { status: 409 }
        );
      }
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      verified,
      status: newStatus,
      checks: {
        domain: verificationStatus || 'Unknown',
        dkim: dkimStatus || 'Unknown',
        ownership: ownershipVerified ? 'Success' : 'Pending',
      },
      ownershipRecord: ownership,
      verificationToken,
      message: verified
        ? 'Domain verified successfully! You can now send emails from this domain.'
        : verificationStatus === 'Success' &&
          dkimStatus === 'Success' &&
          !ownershipVerified
        ? `DKIM is verified, but the ownership TXT record was not found yet. Add TXT ${ownership.name} with value ${ownership.value}, then verify again.`
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
