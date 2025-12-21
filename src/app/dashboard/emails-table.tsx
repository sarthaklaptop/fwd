'use client';

import { formatRelativeTime } from '@/lib/utils';

interface Email {
  id: string;
  to: string;
  subject: string;
  status: string;
  createdAt: Date;
}

export default function EmailsTable({ emails }: { emails: Email[] }) {
  if (emails.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📭</div>
        <p className="text-gray-400">No emails sent yet</p>
        <p className="text-gray-500 text-sm">Create an API key and start sending!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            <th className="px-4 py-3">To</th>
            <th className="px-4 py-3">Subject</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/50">
          {emails.map((email) => (
            <tr key={email.id} className="hover:bg-gray-700/30 transition-colors">
              <td className="px-4 py-3 text-sm text-white font-medium">{email.to}</td>
              <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">{email.subject}</td>
              <td className="px-4 py-3">
                <StatusBadge status={email.status} />
              </td>
              <td className="px-4 py-3 text-sm text-gray-400" suppressHydrationWarning>
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
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
    processing: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400 animate-pulse' },
    completed: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
    failed: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  };

  const style = styles[status] || styles.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
