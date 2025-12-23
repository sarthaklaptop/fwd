import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { emails, apiKeys, templates, webhooks } from '@/db/schema';
import { eq, desc, count, and, gte } from 'drizzle-orm';
import LogoutButton from './logout-button';
import ApiKeysSection from './api-keys-section';
import TemplatesSection from './templates-section';
import AnalyticsSection from './analytics-section';
import EmailsSection from './emails-section';
import BatchesSection from './batches-section';
import WebhooksSection from './webhooks-section';

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
    <div className="min-h-screen bg-gray-900 font-sans selection:bg-blue-500/30">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              FWD
            </span>
            <div className="h-4 w-[1px] bg-gray-700 mx-2"></div>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
              Beta
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Daily Usage</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${emailsToday >= DAILY_LIMIT ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min((emailsToday / DAILY_LIMIT) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className={`text-xs font-mono font-medium ${emailsToday >= DAILY_LIMIT ? 'text-red-400' : 'text-gray-300'}`}>
                  {emailsToday}/{DAILY_LIMIT}
                </span>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span>Welcome back,</span>
            <span className="text-blue-400 font-medium">{user.user_metadata.full_name || user.email}</span>
          </div>
        </div>

        <section className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <AnalyticsSection />
        </section>

        <section className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <ApiKeysSection initialKeys={userApiKeys} />
        </section>

        <section className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <WebhooksSection initialWebhooks={parsedWebhooks} />
        </section>

        <section className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <TemplatesSection initialTemplates={userTemplates} />
        </section>

        <section className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <BatchesSection />
        </section>

        <section className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <EmailsSection />
        </section>
      </main>
    </div>
  );
}
