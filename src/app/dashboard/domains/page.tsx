import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { domains } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import DomainsSection from './domains-section';

export default async function DomainsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const userDomains = await db
    .select()
    .from(domains)
    .where(eq(domains.userId, user.id))
    .orderBy(desc(domains.createdAt));

  const parsedDomains = userDomains.map((d) => ({
    ...d,
    dkimTokens: d.dkimTokens
      ? JSON.parse(d.dkimTokens)
      : [],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Custom Domains
        </h1>
        <p className="text-muted-foreground">
          Send emails from your own domain for better
          deliverability
        </p>
      </div>

      <DomainsSection initialDomains={parsedDomains} />
    </div>
  );
}
