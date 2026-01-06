'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  User,
  BarChart3,
  AlertTriangle,
  Mail,
  Key,
  FileCode,
  Webhook,
  Send,
  Calendar,
  Lock,
  LogOut,
  Trash2,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type {
  SettingsData,
  SettingsTab,
} from './settings-types';

const tabs: {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: <User className="w-4 h-4" />,
  },
  {
    id: 'account',
    label: 'Account',
    icon: <BarChart3 className="w-4 h-4" />,
  },
  {
    id: 'danger',
    label: 'Danger Zone',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
];

export default function SettingsSection() {
  const [activeTab, setActiveTab] =
    useState<SettingsTab>('profile');
  const [data, setData] = useState<SettingsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const response = await res.json();
      if (response.success) {
        setData(response.data);
        setName(response.data.profile.name || '');
      } else {
        toast.error(
          response.message || 'Failed to load settings'
        );
      }
    } catch {
      toast.error('Failed to load settings');
    }
    setLoading(false);
  }

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const response = await res.json();
      if (response.success) {
        toast.success(
          response.message || 'Profile updated successfully'
        );
        // Update local state
        if (data) {
          setData({
            ...data,
            profile: {
              ...data.profile,
              name: response.data.name,
            },
          });
        }
      } else {
        toast.error(
          response.message || 'Failed to update profile'
        );
      }
    } catch {
      toast.error('Failed to update profile');
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    router.push('/auth/login');
    router.refresh();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );
  };

  const getInitials = (
    name: string | null,
    email: string
  ) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  if (loading) {
    return <SettingsSkeleton />;
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Failed to load settings
        </p>
        <button
          onClick={fetchSettings}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-transparent text-foreground/70 border border-border hover:bg-primary/10 hover:border-primary/30 hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'profile' && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-4">
              {data.profile.avatarUrl ? (
                <img
                  src={data.profile.avatarUrl}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">
                    {getInitials(
                      data.profile.name,
                      data.profile.email
                    )}
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {data.profile.name || 'No name set'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {data.profile.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={data.profile.email}
                    disabled
                    className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-foreground/70 cursor-not-allowed pr-10"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2.5 bg-transparent border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                Member since{' '}
                {formatDate(data.profile.createdAt)}
              </span>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={
                  saving ||
                  name === (data.profile.name || '')
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-6">
            {/* Usage Statistics */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Usage Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard
                  icon={<Mail className="w-5 h-5" />}
                  label="Total Emails"
                  value={data.usage.totalEmails}
                  color="blue"
                />
                <StatCard
                  icon={<Key className="w-5 h-5" />}
                  label="API Keys"
                  value={data.usage.apiKeys}
                  color="green"
                />
                <StatCard
                  icon={<FileCode className="w-5 h-5" />}
                  label="Templates"
                  value={data.usage.templates}
                  color="purple"
                />
                <StatCard
                  icon={<Webhook className="w-5 h-5" />}
                  label="Webhooks"
                  value={data.usage.webhooks}
                  color="orange"
                />
                <StatCard
                  icon={<Send className="w-5 h-5" />}
                  label="Batches"
                  value={data.usage.batches}
                  color="pink"
                />
                <StatCard
                  icon={<BarChart3 className="w-5 h-5" />}
                  label="Today"
                  value={`${data.usage.emailsToday}/${data.usage.dailyLimit}`}
                  color="cyan"
                />
              </div>
            </div>

            {/* Plan Information */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Current Plan
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-foreground">
                      Free Tier
                    </span>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                      Active
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {data.usage.dailyLimit} emails per day
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    Daily Usage
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          (data.usage.emailsToday /
                            data.usage.dailyLimit) *
                            100 >=
                          80
                            ? 'bg-red-500'
                            : 'bg-primary'
                        }`}
                        style={{
                          width: `${Math.min(
                            (data.usage.emailsToday /
                              data.usage.dailyLimit) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-mono text-foreground">
                      {Math.round(
                        (data.usage.emailsToday /
                          data.usage.dailyLimit) *
                          100
                      )}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'danger' && (
          <div className="space-y-4">
            {/* Logout */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <LogOut className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Log Out
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sign out of your account on this
                      device
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 font-medium rounded-lg transition-colors"
                >
                  Log Out
                </button>
              </div>
            </div>

            {/* Delete Account (Placeholder) */}
            <div className="bg-card border border-red-500/20 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Delete Account
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Permanently delete your account and
                      all associated data
                    </p>
                  </div>
                </div>
                <button
                  disabled
                  className="px-4 py-2 bg-secondary text-muted-foreground font-medium rounded-lg cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Tabs skeleton */}
      <div className="flex gap-2">
        <div className="h-10 bg-secondary rounded-lg w-24"></div>
        <div className="h-10 bg-secondary rounded-lg w-24"></div>
        <div className="h-10 bg-secondary rounded-lg w-28"></div>
      </div>

      {/* Content skeleton */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-secondary rounded-full"></div>
          <div className="space-y-2">
            <div className="h-4 bg-secondary rounded w-32"></div>
            <div className="h-3 bg-secondary rounded w-48"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-3 bg-secondary rounded w-16"></div>
            <div className="h-10 bg-secondary rounded-lg w-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-secondary rounded w-20"></div>
            <div className="h-10 bg-secondary rounded-lg w-full"></div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <div className="h-10 bg-secondary rounded-lg w-32"></div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color:
    | 'blue'
    | 'green'
    | 'purple'
    | 'orange'
    | 'pink'
    | 'cyan';
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    purple: 'bg-purple-500/10 text-purple-500',
    orange: 'bg-orange-500/10 text-orange-500',
    pink: 'bg-pink-500/10 text-pink-500',
    cyan: 'bg-cyan-500/10 text-cyan-500',
  };

  return (
    <div className="flex flex-col items-center p-4 bg-secondary/30 rounded-xl border border-border hover:border-primary/30 transition-colors">
      <div
        className={`p-2 rounded-lg ${colorClasses[color]} mb-2`}
      >
        {icon}
      </div>
      <span className="text-2xl font-bold text-foreground">
        {value}
      </span>
      <span className="text-xs text-muted-foreground text-center">
        {label}
      </span>
    </div>
  );
}
