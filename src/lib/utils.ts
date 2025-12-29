import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  // Handle future dates
  if (diffInSeconds < 0) return 'Just now';

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 172800) return 'Yesterday';
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;

  return then.toLocaleDateString();
}

export type DateRange = '7d' | '30d' | '90d' | 'all';

const DATE_RANGE_DAYS: Record<Exclude<DateRange, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export function getDateFilter(range: DateRange): Date | null {
  if (range === 'all') return null;

  const days = DATE_RANGE_DAYS[range] ?? 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export function formatDateISO(date: Date | string | null): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

export function formatTimestampISO(date: Date | string | null): string {
  if (!date) return '';
  return new Date(date).toISOString();
}
