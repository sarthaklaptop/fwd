'use client';

import { X, Check, Inbox } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import type { LogsModalProps } from './webhooks-types';

export function LogsModal({
  webhook,
  logs,
  loading,
  onClose,
}: LogsModalProps) {
  if (!webhook) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[70vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Delivery Logs
            </h3>
            <p className="text-muted-foreground text-xs font-mono truncate max-w-md">
              {webhook.url}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(70vh-80px)]">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-secondary rounded"
                ></div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <Inbox className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-foreground font-medium">
                No delivery attempts yet
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Use the Test button to send a test event
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground uppercase border-b border-border">
                  <th className="pb-2">Event</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-secondary/30 transition-colors"
                  >
                    <td className="py-2 text-primary">
                      {log.eventType}
                    </td>
                    <td className="py-2">
                      {log.responseStatus >= 200 &&
                      log.responseStatus < 300 ? (
                        <span className="inline-flex items-center gap-1 text-green-500 dark:text-green-400">
                          {log.responseStatus}
                          <Check className="w-3 h-3" />
                        </span>
                      ) : log.responseStatus === 0 ? (
                        <span className="text-red-500 dark:text-red-400">
                          Failed
                        </span>
                      ) : (
                        <span className="text-yellow-500 dark:text-yellow-400">
                          {log.responseStatus}
                        </span>
                      )}
                    </td>
                    <td
                      className="py-2 text-muted-foreground"
                      suppressHydrationWarning
                    >
                      {formatRelativeTime(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
