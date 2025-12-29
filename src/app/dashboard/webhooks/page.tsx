import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { webhooks } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import WebhooksSection from './webhooks-section';

export default async function WebhooksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const userWebhooks = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.userId, user.id))
    .orderBy(desc(webhooks.createdAt));

  const parsedWebhooks = userWebhooks.map((w) => ({
    ...w,
    events: JSON.parse(w.events),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Webhooks
        </h1>
        <p className="text-muted-foreground">
          Configure webhook endpoints for real-time
          notifications
        </p>
      </div>

      <WebhooksSection initialWebhooks={parsedWebhooks} />
    </div>
  );
}
