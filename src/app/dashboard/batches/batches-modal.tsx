import {
  Package,
  X,
  Check,
  Minus,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useModalKeyboard } from '@/hooks/use-modal-keyboard';
import type {
  Batch,
  BatchDetail,
  BatchDetailModalProps,
  StatCardProps,
  EmailStatusBadgeProps,
} from './batches-types';

export function BatchDetailModal({
  batch,
  pendingBatch,
  loading,
  onClose,
  onDuplicate,
  onRetryFailed,
  retrying,
}: BatchDetailModalProps) {
  const displayBatch = batch || pendingBatch;

  // `queued` is how many emails were accepted for sending when the batch
  // was created; it never goes down, so derive what the user cares about
  const skipped = batch
    ? Math.max(0, batch.total - batch.queued)
    : 0;
  const invalid = batch
    ? Math.max(0, skipped - batch.suppressed - batch.duplicates)
    : 0;
  const inProgress = batch
    ? Math.max(0, batch.queued - batch.completed - batch.failed)
    : 0;

  useModalKeyboard({ onClose, isOpen: true });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Batch Details
              </h3>
              {displayBatch ? (
                <p className="text-muted-foreground text-sm">
                  {displayBatch.templateName ||
                    'Direct Send'}{' '}
                  • {displayBatch.queued} email
                  {displayBatch.queued === 1 ? '' : 's'} sent
                </p>
              ) : (
                <div className="h-4 bg-muted/50 rounded w-32 animate-pulse"></div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)] space-y-6">
          {loading || !batch ? (
            <ModalSkeleton />
          ) : (
            <>
              <div
                className={`grid grid-cols-3 gap-3 ${
                  inProgress > 0 ? 'sm:grid-cols-7' : 'sm:grid-cols-6'
                }`}
              >
                <StatCard
                  label="Total"
                  value={batch.total}
                />
                {/* Only while emails are still waiting to be sent */}
                {inProgress > 0 && (
                  <StatCard
                    label="In queue"
                    value={inProgress}
                    color="blue"
                    pulse
                  />
                )}
                <StatCard
                  label="Skipped"
                  value={skipped}
                  color="yellow"
                />
                <StatCard
                  label="Completed"
                  value={batch.completed}
                  color="green"
                />
                <StatCard
                  label="Failed"
                  value={batch.failed}
                  color="red"
                />
                <StatCard
                  label="Opened"
                  value={batch.opened}
                  color="purple"
                />
                <StatCard
                  label="Clicked"
                  value={
                    batch.linkStats?.totalClicks ??
                    batch.clicked
                  }
                  color="orange"
                />
              </div>

              {batch.fromEmail && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg flex-1">
                    <span className="text-xs text-muted-foreground">
                      From:
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {batch.fromEmail}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => onDuplicate(batch)}
                      className="rounded-lg"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Resend
                    </Button>
                    {batch.failed > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onRetryFailed(batch.id)
                        }
                        disabled={retrying}
                        className="rounded-lg"
                      >
                        <RefreshCw
                          className={`w-4 h-4 mr-1 ${retrying ? 'animate-spin' : ''}`}
                        />
                        {retrying
                          ? 'Retrying…'
                          : `Retry ${batch.failed} Failed`}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {!batch.fromEmail && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onDuplicate(batch)}
                    className="rounded-lg"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Resend Campaign
                  </Button>
                  {batch.failed > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        onRetryFailed(batch.id)
                      }
                      disabled={retrying}
                      className="rounded-lg"
                    >
                      <RefreshCw
                        className={`w-4 h-4 mr-1 ${retrying ? 'animate-spin' : ''}`}
                      />
                      {retrying
                        ? 'Retrying…'
                        : `Retry ${batch.failed} Failed`}
                    </Button>
                  )}
                </div>
              )}

              {skipped > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {batch.suppressed > 0 && (
                    <span className="text-yellow-500 dark:text-yellow-400">
                      {batch.suppressed} suppressed
                    </span>
                  )}
                  {batch.duplicates > 0 && (
                    <span className="text-orange-500 dark:text-orange-400">
                      {batch.duplicates} duplicates
                    </span>
                  )}
                  {invalid > 0 && (
                    <span className="text-muted-foreground">
                      {invalid} invalid
                    </span>
                  )}
                </div>
              )}

              {batch.linkStats &&
                batch.linkStats.topLinks &&
                batch.linkStats.topLinks.length > 0 && (
                  <div className="border border-border rounded-lg p-4">
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      🔗 Top Clicked Links
                    </h4>
                    <ul className="space-y-2">
                      {batch.linkStats.topLinks
                        .slice(0, 5)
                        .map((link, idx) => (
                          <li
                            key={idx}
                            className="flex justify-between items-center text-sm"
                          >
                            <span
                              className="text-muted-foreground truncate max-w-[280px]"
                              title={link.url}
                            >
                              {link.url}
                            </span>
                            <span className="text-orange-500 dark:text-orange-400 font-medium ml-2">
                              {link.clicks} clicks
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">
                  Emails ({batch.emails?.length || 0})
                </h4>
                <div className="rounded-xl overflow-hidden max-h-64 overflow-y-auto border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/20 sticky top-0 border-b border-border">
                      <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                        <th className="px-4 py-2">
                          Recipient
                        </th>
                        <th className="px-4 py-2">
                          Status
                        </th>
                        <th className="px-4 py-2">
                          Opened
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {batch.emails?.map((email) => (
                        <tr
                          key={email.id}
                          className="hover:bg-primary/5 transition-colors"
                        >
                          <td className="px-4 py-2.5 text-foreground">
                            {email.to}
                          </td>
                          <td className="px-4 py-2.5">
                            <EmailStatusBadge
                              status={email.status}
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            {email.openedAt ? (
                              <Check className="w-4 h-4 text-green-500 dark:text-green-400" />
                            ) : (
                              <Minus className="w-4 h-4 text-muted-foreground" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ModalSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="border border-border rounded-lg p-3"
          >
            <div className="h-3 bg-muted/50 rounded w-12 mb-2"></div>
            <div className="h-6 bg-muted/50 rounded w-8"></div>
          </div>
        ))}
      </div>
      <div>
        <div className="h-4 bg-muted/50 rounded w-24 mb-3"></div>
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-muted/20 px-4 py-2 border-b border-border">
            <div className="flex gap-8">
              <div className="h-3 bg-muted/50 rounded w-16"></div>
              <div className="h-3 bg-muted/50 rounded w-12"></div>
              <div className="h-3 bg-muted/50 rounded w-12"></div>
            </div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="px-4 py-3 border-b border-border last:border-0"
            >
              <div className="flex gap-8">
                <div className="h-4 bg-muted/50 rounded w-32"></div>
                <div className="h-4 bg-muted/50 rounded w-16"></div>
                <div className="h-4 bg-muted/50 rounded w-4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  pulse,
}: StatCardProps) {
  const textColors: Record<string, string> = {
    blue: 'text-blue-500 dark:text-blue-400',
    green: 'text-green-500 dark:text-green-400',
    red: 'text-red-500 dark:text-red-400',
    purple: 'text-purple-500 dark:text-purple-400',
    orange: 'text-orange-500 dark:text-orange-400',
    yellow: 'text-yellow-500 dark:text-yellow-400',
  };

  return (
    <div className="bg-transparent rounded-lg p-3 border border-border">
      <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1.5">
        {pulse && (
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        )}
        {label}
      </p>
      <p
        className={`text-xl font-bold ${
          color ? textColors[color] : 'text-foreground'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function EmailStatusBadge({
  status,
}: EmailStatusBadgeProps) {
  const colors: Record<string, string> = {
    pending: 'text-yellow-500 dark:text-yellow-400',
    processing: 'text-blue-500 dark:text-blue-400',
    completed: 'text-green-500 dark:text-green-400',
    failed: 'text-red-500 dark:text-red-400',
    bounced: 'text-orange-500 dark:text-orange-400',
  };

  return (
    <span
      className={`text-xs font-medium ${
        colors[status] || 'text-muted-foreground'
      }`}
    >
      {status}
    </span>
  );
}
