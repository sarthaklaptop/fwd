'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Check,
  X,
  Eye,
  EyeOff,
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
    null,
  );
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] =
    useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] =
    useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
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
          response.message || 'Failed to load settings',
        );
      }
    } catch {
      toast.error('Failed to load settings');
    }
    setLoading(false);
  }

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const response = await res.json();
      if (response.success) {
        setSaveSuccess(true);
        toast.success(
          response.message ||
            'Profile updated successfully',
        );
        if (data) {
          setData({
            ...data,
            profile: {
              ...data.profile,
              name: response.data.name,
            },
          });
        }
        // Reset success state after animation
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        toast.error(
          response.message || 'Failed to update profile',
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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm');
      return;
    }
    if (!deletePassword) {
      setDeleteError('Password is required');
      return;
    }

    setDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch('/api/settings/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });

      const response = await res.json();

      if (response.success) {
        toast.success('Account deleted successfully');
        router.push('/auth/login');
        router.refresh();
      } else {
        setDeleteError(
          response.message || 'Failed to delete account',
        );
      }
    } catch {
      setDeleteError(
        'Failed to delete account. Please try again.',
      );
    }
    setDeleting(false);
  };

  const resetDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletePassword('');
    setDeleteConfirmText('');
    setShowPassword(false);
    setDeleteError('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    );
  };

  const getInitials = (
    name: string | null,
    email: string,
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

  const usagePercent =
    ((data.usage.emailsThisMonth || 0) /
      (data.usage.monthlyLimit || 100)) *
    100;

  return (
    <div className="space-y-6">
      {/* Tab Navigation with Animated Indicator */}
      <div className="relative flex gap-1 p-1 bg-muted/50 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors z-10 ${
              activeTab === tab.id
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTabBg"
                className="absolute inset-0 bg-primary rounded-lg shadow-lg"
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 35,
                }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
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
            {/* Avatar with Subtle Ring */}
            <div className="flex items-center gap-4">
              <motion.div
                className="relative group cursor-pointer"
                whileHover={{ scale: 1.03 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 17,
                }}
              >
                {/* Subtle Ring - only visible on hover */}
                <div className="absolute -inset-0.5 bg-primary/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  {data.profile.avatarUrl ? (
                    <img
                      src={data.profile.avatarUrl}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full object-cover border-2 border-border group-hover:border-primary/50 transition-colors"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-border group-hover:border-primary/50 transition-colors flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">
                        {getInitials(
                          data.profile.name,
                          data.profile.email,
                        )}
                      </span>
                    </div>
                  )}
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    Edit
                  </span>
                </div>
              </motion.div>
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
                    className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-lg text-foreground/70 cursor-not-allowed pr-10"
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
              {/* Save Button with Success Animation - Fixed Width */}
              <motion.button
                onClick={handleSaveProfile}
                disabled={
                  saving ||
                  saveSuccess ||
                  name === (data.profile.name || '')
                }
                className={`inline-flex items-center justify-center min-w-[140px] px-5 py-2.5 font-medium rounded-lg transition-all disabled:cursor-not-allowed overflow-hidden ${
                  saveSuccess
                    ? 'bg-green-500 text-white'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <AnimatePresence mode="wait">
                  {saving ? (
                    <motion.div
                      key="saving"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </motion.div>
                  ) : saveSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 15,
                        }}
                      >
                        <Check className="w-4 h-4" />
                      </motion.div>
                      <span>Saved!</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="save"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
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
                  label="This Month"
                  value={`${data.usage.emailsThisMonth || 0}/${(data.usage.monthlyLimit || 100) >= 1000 ? `${((data.usage.monthlyLimit || 100) / 1000).toFixed(0)}k` : data.usage.monthlyLimit || 100}`}
                  color="cyan"
                />
              </div>
            </div>

            {/* Plan Information with Animated Progress Bar */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Current Plan
              </h3>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-foreground">
                      {data.plan?.displayName ||
                        'Free Tier'}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        data.plan?.name === 'pro'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      Active
                    </span>
                    {data.plan?.name === 'pro' && (
                      <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                        PRO
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {data.usage.monthlyLimit?.toLocaleString() ||
                      100}{' '}
                    emails per month
                  </p>
                </div>
                <div className="flex-1 max-w-xs">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">
                      Monthly Usage
                    </p>
                    <span
                      className={`text-sm font-mono font-medium ${
                        usagePercent >= 80
                          ? 'text-red-500'
                          : usagePercent >= 50
                            ? 'text-yellow-500'
                            : 'text-green-500'
                      }`}
                    >
                      {data.usage.emailsThisMonth || 0} /{' '}
                      {data.usage.monthlyLimit?.toLocaleString() ||
                        100}
                    </span>
                  </div>
                  {/* Animated Progress Bar */}
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        usagePercent >= 80
                          ? 'bg-gradient-to-r from-red-500 to-red-600'
                          : usagePercent >= 50
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                            : 'bg-gradient-to-r from-green-500 to-emerald-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(
                          usagePercent,
                          100,
                        )}%`,
                      }}
                      transition={{
                        duration: 1,
                        ease: 'easeOut',
                        delay: 0.2,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {Math.round(usagePercent)}% used
                  </p>
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
                <motion.button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 font-medium rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Log Out
                </motion.button>
              </div>
            </div>

            {/* Delete Account */}
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
                <motion.button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Delete Account
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget)
                resetDeleteModal();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Delete Account
                  </h3>
                </div>
                <button
                  onClick={resetDeleteModal}
                  className="p-1 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Warning Message */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-400">
                  <strong>Warning:</strong> This action
                  cannot be undone. Your account will be
                  permanently deleted and you will lose
                  access to all your data.
                </p>
              </div>

              {/* Password Input */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Enter your password to confirm
                  </label>
                  <div className="relative">
                    <input
                      type={
                        showPassword ? 'text' : 'password'
                      }
                      value={deletePassword}
                      onChange={(e) =>
                        setDeletePassword(e.target.value)
                      }
                      placeholder="Enter your password"
                      className="w-full px-4 py-2.5 pr-10 bg-transparent border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* DELETE Confirmation Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Type{' '}
                    <span className="text-red-500 font-mono">
                      DELETE
                    </span>{' '}
                    to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) =>
                      setDeleteConfirmText(e.target.value)
                    }
                    onPaste={(e) => e.preventDefault()}
                    placeholder="Type DELETE"
                    className="w-full px-4 py-2.5 bg-transparent border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-colors font-mono"
                  />
                </div>

                {/* Error Message */}
                {deleteError && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-500"
                  >
                    {deleteError}
                  </motion.p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={resetDeleteModal}
                  className="flex-1 px-4 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleDeleteAccount}
                  disabled={
                    deleting ||
                    deleteConfirmText !== 'DELETE' ||
                    !deletePassword
                  }
                  className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.98 }}
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Tabs skeleton */}
      <div className="flex gap-1 p-1 bg-muted/30 rounded-xl w-fit">
        <div className="h-10 bg-muted/50 rounded-lg w-24"></div>
        <div className="h-10 bg-muted/50 rounded-lg w-24"></div>
        <div className="h-10 bg-muted/50 rounded-lg w-28"></div>
      </div>

      {/* Content skeleton */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-muted/50 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted/50 rounded w-32"></div>
            <div className="h-3 bg-muted/50 rounded w-48"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-3 bg-muted/50 rounded w-16"></div>
            <div className="h-10 bg-muted/50 rounded-lg w-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-muted/50 rounded w-20"></div>
            <div className="h-10 bg-muted/50 rounded-lg w-full"></div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <div className="h-10 bg-muted/50 rounded-lg w-32"></div>
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
    <motion.div
      className="flex flex-col items-center p-4 bg-muted/20 rounded-xl border border-border hover:border-primary/30 transition-colors"
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 17,
      }}
    >
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
    </motion.div>
  );
}
