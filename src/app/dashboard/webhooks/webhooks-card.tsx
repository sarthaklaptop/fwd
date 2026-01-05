'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Webhook,
  ClipboardList,
  Zap,
  Trash2,
  Copy,
  Check,
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
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopy = () => {
    onCopySecret(webhook.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhook.url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 mr-4">
          <div className="flex items-start gap-2 mb-2">
            <h3 className="text-foreground font-mono text-sm break-all flex-1">
              {webhook.url}
            </h3>
            <button
              onClick={handleCopyUrl}
              className={`p-1 rounded transition-colors shrink-0 ${
                copiedUrl
                  ? 'text-green-500 dark:text-green-400 bg-green-500/10'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
              }`}
              title={copiedUrl ? 'Copied!' : 'Copy URL'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {copiedUrl ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
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
          onClick={handleCopy}
          className={`ml-auto p-1.5 rounded transition-colors ${
            copied
              ? 'text-green-500 dark:text-green-400 bg-green-500/10'
              : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
          }`}
          title={copied ? 'Copied!' : 'Copy Secret'}
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.div
                key="check"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Check className="w-4 h-4" />
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Copy className="w-4 h-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
}

export function EmptyState({
  onAddClick,
}: {
  onAddClick: () => void;
}) {
  return (
    <div className="text-center py-12 border border-border rounded-xl bg-card/50">
      <Webhook className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
      <p className="text-foreground font-medium">
        No webhooks configured
      </p>
      <p className="text-muted-foreground text-sm mt-1 mb-4">
        Add an endpoint to start receiving events
      </p>
      <button
        onClick={onAddClick}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
      >
        Add Endpoint
      </button>
    </div>
  );
}
