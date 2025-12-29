'use client';

import { formatRelativeTime } from '@/lib/utils';
import { Mail } from 'lucide-react';

interface Email {
  id: string;
  to: string;
  subject: string;
  status: string;
  openedAt: Date | null;
  createdAt: Date;
}

export default function EmailsTable({ emails }: { emails: Email[] }) {
  if (emails.length === 0) {
    return (
      <div className="text-center py-12 border border-border rounded-xl bg-card/50">
        <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-foreground font-medium">No emails sent yet</p>
        <p className="text-muted-foreground text-sm mt-1">Create an API key and start sending!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-border rounded-xl">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/30">
            <th className="px-4 py-3">To</th>
            <th className="px-4 py-3">Subject</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Opened</th>
            <th className="px-4 py-3">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {emails.map((email) => (
            <tr key={email.id} className="hover:bg-secondary/30 transition-colors">
              <td className="px-4 py-3 text-sm text-foreground font-medium">{email.to}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">{email.subject}</td>
              <td className="px-4 py-3">
                <StatusBadge status={email.status} />
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground" suppressHydrationWarning>
                {email.openedAt ? formatRelativeTime(email.openedAt) : '—'}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground" suppressHydrationWarning>
                {formatRelativeTime(email.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; dot: string }> = {
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-500 dark:text-yellow-400', dot: 'bg-yellow-500 dark:bg-yellow-400' },
    processing: { bg: 'bg-blue-500/10', text: 'text-blue-500 dark:text-blue-400', dot: 'bg-blue-500 dark:bg-blue-400 animate-pulse' },
    completed: { bg: 'bg-green-500/10', text: 'text-green-500 dark:text-green-400', dot: 'bg-green-500 dark:bg-green-400' },
    failed: { bg: 'bg-red-500/10', text: 'text-red-500 dark:text-red-400', dot: 'bg-red-500 dark:bg-red-400' },
    bounced: { bg: 'bg-orange-500/10', text: 'text-orange-500 dark:text-orange-400', dot: 'bg-orange-500 dark:bg-orange-400' },
    complained: { bg: 'bg-purple-500/10', text: 'text-purple-500 dark:text-purple-400', dot: 'bg-purple-500 dark:bg-purple-400' },
  };

  const style = styles[status] || styles.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
