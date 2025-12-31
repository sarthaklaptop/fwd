import { Package } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import type {
  Batch,
  BatchesTableProps,
  StatusBadgeProps,
  SuccessRateProps,
} from './batches-types';

export function BatchesTable({
  batches,
  loading,
  onSelectBatch,
}: BatchesTableProps) {
  return (
    <div className="overflow-x-auto border border-border rounded-xl">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/30">
            <th className="px-4 py-3">Template</th>
            <th className="px-4 py-3">Recipients</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Success Rate</th>
            <th className="px-4 py-3">Clicked</th>
            <th className="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-4 py-3">
                  <div className="h-4 bg-secondary rounded w-24"></div>
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-secondary rounded w-16"></div>
                </td>
                <td className="px-4 py-3">
                  <div className="h-6 bg-secondary rounded-full w-20"></div>
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-secondary rounded w-12"></div>
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-secondary rounded w-8"></div>
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-secondary rounded w-20"></div>
                </td>
              </tr>
            ))
          ) : batches.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-12 text-center"
              >
                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-foreground font-medium">
                  No batch sends yet
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Use the API to send batch emails
                </p>
              </td>
            </tr>
          ) : (
            batches.map((batch) => (
              <tr
                key={batch.id}
                onClick={() => onSelectBatch(batch)}
                className="hover:bg-secondary/30 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 text-sm text-foreground font-medium">
                  {batch.templateName || 'Direct Send'}
                </td>
                <td className="px-4 py-3 text-sm text-foreground">
                  <span className="font-medium">
                    {batch.queued}
                  </span>
                  <span className="text-muted-foreground">
                    {' '}
                    / {batch.total}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={batch.status} />
                </td>
                <td className="px-4 py-3 text-sm">
                  <SuccessRate
                    completed={batch.completed}
                    queued={batch.queued}
                  />
                </td>
                <td className="px-4 py-3 text-sm text-orange-500 dark:text-orange-400 font-medium">
                  {batch.clicked || 0}
                </td>
                <td
                  className="px-4 py-3 text-sm text-muted-foreground"
                  suppressHydrationWarning
                >
                  {formatRelativeTime(batch.createdAt)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<
    string,
    { bg: string; text: string }
  > = {
    processing: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-500 dark:text-blue-400',
    },
    completed: {
      bg: 'bg-green-500/10',
      text: 'text-green-500 dark:text-green-400',
    },
    partial: {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-500 dark:text-yellow-400',
    },
    failed: {
      bg: 'bg-red-500/10',
      text: 'text-red-500 dark:text-red-400',
    },
  };

  const style = styles[status] || styles.processing;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function SuccessRate({
  completed,
  queued,
}: SuccessRateProps) {
  if (queued === 0)
    return <span className="text-muted-foreground">—</span>;

  const rate = Math.round((completed / queued) * 100);
  const color =
    rate >= 90
      ? 'text-green-500 dark:text-green-400'
      : rate >= 70
      ? 'text-yellow-500 dark:text-yellow-400'
      : 'text-red-500 dark:text-red-400';

  return (
    <span className={`font-medium ${color}`}>{rate}%</span>
  );
}
