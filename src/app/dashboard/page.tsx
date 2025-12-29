import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { db } from '@/db';
import { emails, apiKeys, templates, webhooks } from '@/db/schema';
import { eq, count, and, gte, desc } from 'drizzle-orm';
import { Mail, Key, Webhook, FileCode, Send, BarChart3, ArrowRight } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [emailCount, keyCount, templateCount, webhookCount] = await Promise.all([
    db.select({ count: count() }).from(emails).where(and(eq(emails.userId, user.id), gte(emails.createdAt, today))),
    db.select({ count: count() }).from(apiKeys).where(eq(apiKeys.userId, user.id)),
    db.select({ count: count() }).from(templates).where(eq(templates.userId, user.id)),
    db.select({ count: count() }).from(webhooks).where(eq(webhooks.userId, user.id)),
  ]);

  const stats = [
    { name: 'Emails Today', value: emailCount[0]?.count || 0, href: '/dashboard/emails', icon: Mail, color: 'text-blue-500' },
    { name: 'API Keys', value: keyCount[0]?.count || 0, href: '/dashboard/api-keys', icon: Key, color: 'text-green-500' },
    { name: 'Templates', value: templateCount[0]?.count || 0, href: '/dashboard/templates', icon: FileCode, color: 'text-purple-500' },
    { name: 'Webhooks', value: webhookCount[0]?.count || 0, href: '/dashboard/webhooks', icon: Webhook, color: 'text-orange-500' },
  ];

  const quickLinks = [
    { name: 'Analytics', description: 'View email delivery stats', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'API Keys', description: 'Manage your API keys', href: '/dashboard/api-keys', icon: Key },
    { name: 'Templates', description: 'Create email templates', href: '/dashboard/templates', icon: FileCode },
    { name: 'Batches', description: 'Send bulk emails', href: '/dashboard/batches', icon: Send },
    { name: 'Webhooks', description: 'Configure webhooks', href: '/dashboard/webhooks', icon: Webhook },
    { name: 'Emails', description: 'View sent emails', href: '/dashboard/emails', icon: Mail },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, <span className="text-primary font-medium">{user.user_metadata.full_name || user.email}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-5 hover:bg-card/80 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-3xl font-bold text-foreground mt-3">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.name}</p>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 hover:bg-card/80 transition-colors group flex items-center gap-4"
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <link.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{link.name}</p>
                <p className="text-sm text-muted-foreground">{link.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
