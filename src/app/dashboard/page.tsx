import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { emails, apiKeys, templates, webhooks } from '@/db/schema';
import { eq, desc, count, and, gte } from 'drizzle-orm';
import ApiKeysSection from './api-keys-section';
import TemplatesSection from './templates-section';
import AnalyticsSection from './analytics-section';
import EmailsSection from './emails-section';
import BatchesSection from './batches-section';
import WebhooksSection from './webhooks-section';
import DashboardSidebar from './dashboard-sidebar';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [userApiKeys, userTemplates, userWebhooks, todayStats] = await Promise.all([
    db.select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
      revokedAt: apiKeys.revokedAt,
    }).from(apiKeys).where(eq(apiKeys.userId, user.id)).orderBy(desc(apiKeys.createdAt)),
    db.select().from(templates).where(eq(templates.userId, user.id)).orderBy(desc(templates.createdAt)),
    db.select().from(webhooks).where(eq(webhooks.userId, user.id)).orderBy(desc(webhooks.createdAt)),
    db.select({
      count: count(),
    }).from(emails).where(and(eq(emails.userId, user.id), gte(emails.createdAt, today))),
  ]);

  const emailsToday = todayStats[0]?.count || 0;
  const DAILY_LIMIT = 100;

  const parsedWebhooks = userWebhooks.map(w => ({
    ...w,
    events: JSON.parse(w.events),
  }));

  return (
    <DashboardSidebar emailsToday={emailsToday} dailyLimit={DAILY_LIMIT}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span>Welcome back,</span>
            <span className="text-primary font-medium">{user.user_metadata.full_name || user.email}</span>
          </div>
        </div>

        <section id="analytics" className="bg-card/50 backdrop-blur-sm rounded-xl border border-border p-6">
          <AnalyticsSection />
        </section>

        <section id="api-keys" className="bg-card/50 backdrop-blur-sm rounded-xl border border-border p-6">
          <ApiKeysSection initialKeys={userApiKeys} />
        </section>

        <section id="webhooks" className="bg-card/50 backdrop-blur-sm rounded-xl border border-border p-6">
          <WebhooksSection initialWebhooks={parsedWebhooks} />
        </section>

        <section id="templates" className="bg-card/50 backdrop-blur-sm rounded-xl border border-border p-6">
          <TemplatesSection initialTemplates={userTemplates} />
        </section>

        <section id="batches" className="bg-card/50 backdrop-blur-sm rounded-xl border border-border p-6">
          <BatchesSection />
        </section>

        <section id="emails" className="bg-card/50 backdrop-blur-sm rounded-xl border border-border p-6">
          <EmailsSection />
        </section>
      </div>
    </DashboardSidebar>
  );
}
