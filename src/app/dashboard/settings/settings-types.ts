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
  emailsThisMonth: number;
  monthlyLimit: number;
}

export interface PlanInfo {
  name: 'free' | 'pro';
  displayName: string;
  limits: {
    emailsPerMonth: number;
    domains: number;
    templates: number;
  };
}

export interface SettingsData {
  profile: UserProfile;
  usage: UsageStats;
  plan: PlanInfo;
}

export type SettingsTab = 'profile' | 'account' | 'danger';
