import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { emails, apiKeys, templates } from '@/db/schema';
import { eq, desc, count, and, gte } from 'drizzle-orm';
import LogoutButton from './logout-button';
import ApiKeysSection from './api-keys-section';
import TemplatesSection from './templates-section';
import AnalyticsSection from './analytics-section';
import EmailsSection from './emails-section';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get today's date at midnight for rate limit counting
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch data in parallel - only what's needed for server-rendered parts
  const [userApiKeys, userTemplates, todayStats] = await Promise.all([
    db.select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
      revokedAt: apiKeys.revokedAt,
    }).from(apiKeys).where(eq(apiKeys.userId, user.id)).orderBy(desc(apiKeys.createdAt)),
    db.select().from(templates).where(eq(templates.userId, user.id)).orderBy(desc(templates.createdAt)),
    db.select({
      count: count(),
    }).from(emails).where(and(eq(emails.userId, user.id), gte(emails.createdAt, today))),
  ]);

  const emailsToday = todayStats[0]?.count || 0;
  const DAILY_LIMIT = 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-lg border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <h1 className="text-xl font-bold text-white">FWD</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm hidden sm:block">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Rate Limit Banner */}
        <div className={`rounded-xl border p-4 ${emailsToday >= DAILY_LIMIT
          ? 'bg-red-500/10 border-red-500/30'
          : emailsToday >= 80
            ? 'bg-yellow-500/10 border-yellow-500/30'
            : 'bg-gray-800/50 border-gray-700/50'
          }`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-400">Daily Usage</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-white">{emailsToday}</span>
                <span className="text-gray-400">/ {DAILY_LIMIT} emails</span>
              </div>
            </div>
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${emailsToday >= DAILY_LIMIT ? 'bg-red-500' : emailsToday >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                style={{ width: `${Math.min((emailsToday / DAILY_LIMIT) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <section className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <AnalyticsSection />
        </section>

        {/* API Keys Section */}
        <section className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <ApiKeysSection initialKeys={userApiKeys} />
        </section>

        {/* Templates Section */}
        <section className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <TemplatesSection initialTemplates={userTemplates} />
        </section>

        {/* Emails Section */}
        <section className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <EmailsSection />
        </section>
      </main>
    </div>
  );
}

