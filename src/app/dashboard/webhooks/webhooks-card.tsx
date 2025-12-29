'use client';

import {
  Webhook,
  ClipboardList,
  Zap,
  Trash2,
  Copy,
} from 'lucide-react';
import type { WebhookCardProps } from './webhooks-types';

export function WebhookCard({
  webhook,
  loading,
  onViewLogs,
  onTest,
  onDelete,
  onCopySecret,
}: WebhookCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 mr-4">
          <h3 className="text-foreground font-mono text-sm break-all mb-2">
            {webhook.url}
          </h3>
          <div className="flex flex-wrap gap-2">
            {webhook.events.map((event) => (
              <span
                key={event}
                className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
              >
                {event}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onViewLogs(webhook)}
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm px-2 py-1 rounded hover:bg-secondary transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            Logs
          </button>
          <button
            onClick={() => onTest(webhook.id)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 text-sm px-2 py-1 rounded hover:bg-primary/10 transition-colors disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            Test
          </button>
          <button
            onClick={() => onDelete(webhook)}
            className="inline-flex items-center gap-1.5 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-transparent rounded-lg px-3 py-2 border border-border">
        <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
          Signing Secret:
        </span>
        <code className="text-foreground text-sm font-mono select-all">
          {webhook.secret.slice(0, 8)}...
          {webhook.secret.slice(-4)}
        </code>
        <button
          onClick={() => onCopySecret(webhook.secret)}
          className="ml-auto p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
          title="Copy Secret"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="text-center py-12 border border-border rounded-xl bg-card/50">
      <Webhook className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
      <p className="text-foreground font-medium">
        No webhooks configured
      </p>
      <p className="text-muted-foreground text-sm mt-1">
        Add an endpoint to start receiving events
      </p>
    </div>
  );
}
