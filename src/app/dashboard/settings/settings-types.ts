// Settings page types

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface UsageStats {
  totalEmails: number;
  apiKeys: number;
  templates: number;
  webhooks: number;
  batches: number;
  emailsToday: number;
  dailyLimit: number;
}

export interface SettingsData {
  profile: UserProfile;
  usage: UsageStats;
}

export type SettingsTab = 'profile' | 'account' | 'danger';
