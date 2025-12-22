import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { emails, apiKeys, templates } from '@/db/schema';
import { eq, desc, count, and, gte, isNotNull } from 'drizzle-orm';
import LogoutButton from './logout-button';
import ApiKeysSection from './api-keys-section';
import EmailsTable from './emails-table';
import TemplatesSection from './templates-section';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get today's date at midnight for rate limit counting
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch data in parallel
  const [userEmails, userApiKeys, userTemplates, emailStats, todayStats] = await Promise.all([
    db.select().from(emails).where(eq(emails.userId, user.id)).orderBy(desc(emails.createdAt)).limit(50),
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
      total: count(),
    }).from(emails).where(eq(emails.userId, user.id)),
    db.select({
      count: count(),
    }).from(emails).where(and(eq(emails.userId, user.id), gte(emails.createdAt, today))),
  ]);

  const totalEmails = emailStats[0]?.total || 0;
  const sentEmails = userEmails.filter(e => e.status === 'completed').length;
  const failedEmails = userEmails.filter(e => e.status === 'failed').length;
  const openedEmails = userEmails.filter(e => e.openedAt !== null).length;
  const activeKeys = userApiKeys.filter(k => !k.revokedAt).length;
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatsCard title="Total Emails" value={totalEmails} icon="mail" color="blue" />
          <StatsCard title="Delivered" value={sentEmails} icon="check" color="green" />
          <StatsCard title="Opened" value={openedEmails} icon="eye" color="cyan" />
          <StatsCard title="Failed" value={failedEmails} icon="x" color="red" />
          <StatsCard title="Active Keys" value={activeKeys} icon="key" color="purple" />
        </div>

        {/* API Keys Section */}
        <section className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <ApiKeysSection initialKeys={userApiKeys} />
        </section>

        {/* Templates Section */}
        <section className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <TemplatesSection initialTemplates={userTemplates} />
        </section>

        {/* Emails Table */}
        <section className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <h2 className="text-xl font-bold text-white mb-1">Recent Emails</h2>
          <p className="text-gray-400 text-sm mb-4">Last 50 emails sent through your API</p>
          <EmailsTable emails={userEmails} />
        </section>
      </main>
    </div>
  );
}

function StatsCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
  const colors: Record<string, { bg: string; iconBg: string; iconColor: string }> = {
    blue: { bg: 'from-blue-500/20 to-blue-600/10 border-blue-500/30', iconBg: 'bg-blue-500/20', iconColor: 'text-blue-400' },
    green: { bg: 'from-green-500/20 to-green-600/10 border-green-500/30', iconBg: 'bg-green-500/20', iconColor: 'text-green-400' },
    cyan: { bg: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30', iconBg: 'bg-cyan-500/20', iconColor: 'text-cyan-400' },
    red: { bg: 'from-red-500/20 to-red-600/10 border-red-500/30', iconBg: 'bg-red-500/20', iconColor: 'text-red-400' },
    purple: { bg: 'from-purple-500/20 to-purple-600/10 border-purple-500/30', iconBg: 'bg-purple-500/20', iconColor: 'text-purple-400' },
  };

  const style = colors[color];

  return (
    <div className={`bg-gradient-to-br ${style.bg} border rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-sm font-medium">{title}</span>
        <div className={`w-8 h-8 ${style.iconBg} rounded-lg flex items-center justify-center`}>
          <Icon name={icon} className={`w-4 h-4 ${style.iconColor}`} />
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function Icon({ name, className }: { name: string; className?: string }) {
  const icons: Record<string, React.ReactNode> = {
    mail: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    check: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    x: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    key: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
    eye: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  };

  return icons[name] || null;
}

