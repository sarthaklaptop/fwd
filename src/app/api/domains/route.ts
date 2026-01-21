import { NextResponse } from 'next/server';
import { db } from '@/db';
import { domains } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { ses } from '@/lib/ses';
import {
  VerifyDomainIdentityCommand,
  VerifyDomainDkimCommand,
} from '@aws-sdk/client-ses';
import { checkDomainLimit } from '@/lib/plan-limits';

// Get user's domains
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const userDomains = await db
      .select()
      .from(domains)
      .where(eq(domains.userId, user.id))
      .orderBy(domains.createdAt);

    // Parse DKIM tokens from JSON (safely)
    const domainsWithTokens = userDomains.map((d) => {
      let dkimTokens: string[] = [];
      try {
        dkimTokens = d.dkimTokens
          ? JSON.parse(d.dkimTokens)
          : [];
      } catch {
        dkimTokens = [];
      }
      return { ...d, dkimTokens };
    });

    return NextResponse.json({
      success: true,
      data: domainsWithTokens,
    });
  } catch (error: any) {
    console.error('Error fetching domains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 },
    );
  }
}

// Add a new domain
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { domain } = body;

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 },
      );
    }

    // Validate domain format (supports subdomains, multi-level TLDs like co.uk)
    const domainRegex =
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
    const cleanDomain = domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
      .replace(/^www\./, ''); // Also strip www.

    if (!domainRegex.test(cleanDomain)) {
      return NextResponse.json(
        {
          error:
            'Invalid domain format. Example: example.com or mail.example.co.uk',
        },
        { status: 400 },
      );
    }

    // Check plan-based domain limit
    const domainLimitCheck = await checkDomainLimit(
      user.id,
    );
    if (!domainLimitCheck.allowed) {
      return NextResponse.json(
        { error: domainLimitCheck.error },
        { status: 403 },
      );
    }

    // Check if domain already exists for this user
    const existing = await db.query.domains.findFirst({
      where: and(
        eq(domains.userId, user.id),
        eq(domains.domain, cleanDomain),
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Domain already added' },
        { status: 400 },
      );
    }

    // Step 1: Verify domain identity with SES
    await ses.send(
      new VerifyDomainIdentityCommand({
        Domain: cleanDomain,
      }),
    );

    // Step 2: Get DKIM tokens
    const dkimResponse = await ses.send(
      new VerifyDomainDkimCommand({
        Domain: cleanDomain,
      }),
    );

    const dkimTokens = dkimResponse.DkimTokens || [];

    // Step 3: Save to database
    const [newDomain] = await db
      .insert(domains)
      .values({
        userId: user.id,
        domain: cleanDomain,
        status: 'pending',
        dkimTokens: JSON.stringify(dkimTokens),
      })
      .returning();

    // Generate DNS records for user
    const dnsRecords = {
      dkim: dkimTokens.map((token) => ({
        type: 'CNAME',
        name: `${token}._domainkey.${cleanDomain}`,
        value: `${token}.dkim.amazonses.com`,
      })),
      spf: {
        type: 'TXT',
        name: cleanDomain,
        value: 'v=spf1 include:amazonses.com ~all',
      },
    };

    return NextResponse.json({
      success: true,
      message:
        'Domain added. Please add the DNS records below.',
      data: {
        ...newDomain,
        dkimTokens,
        dnsRecords,
      },
    });
  } catch (error: any) {
    console.error('Error adding domain:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add domain' },
      { status: 500 },
    );
  }
}
