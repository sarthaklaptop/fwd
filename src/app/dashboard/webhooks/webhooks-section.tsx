'use client';

import { useState, useEffect } from 'react';
import { ConfirmDialog } from '@/components/ui';
import {
  Plus,
  Globe,
  Trash2,
  Zap,
  ClipboardCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { WebhookCard, EmptyState } from './webhooks-card';
import { WebhookModal } from './webhooks-modal';
import { LogsModal } from './webhooks-logs';
import type {
  WebhookData,
  WebhookEvent,
  WebhooksSectionProps,
} from './webhooks-types';

function truncateUrl(url: string, max = 36) {
  try {
    const { hostname, pathname } = new URL(url);
    const short = hostname + pathname;
    return short.length > max
      ? short.slice(0, max) + '…'
      : short;
  } catch {
    return url.length > max ? url.slice(0, max) + '…' : url;
  }
}

function toastWebhookCreated(url: string) {
  toast(
    () => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: 320,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            flexShrink: 0,
            background: 'rgba(99,102,241,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Globe size={18} color="#6366f1" />
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <p
            style={{
              margin: 0,
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Webhook created
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              opacity: 0.6,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {truncateUrl(url)}
          </p>
        </div>
      </div>
    ),
    { duration: 4000 },
  );
}

function toastWebhookDeleted(url: string) {
  toast(
    () => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: 320,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            flexShrink: 0,
            background: 'rgba(239,68,68,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Trash2 size={18} color="#ef4444" />
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <p
            style={{
              margin: 0,
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Webhook removed
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              opacity: 0.6,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {truncateUrl(url)} deleted
          </p>
        </div>
      </div>
    ),
    { duration: 4000 },
  );
}

function toastWebhookTested(url: string) {
  toast(
    () => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: 320,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            flexShrink: 0,
            background: 'rgba(234,179,8,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Zap size={18} color="#eab308" />
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <p
            style={{
              margin: 0,
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Test event sent
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              opacity: 0.6,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            Ping delivered to {truncateUrl(url)}
          </p>
        </div>
      </div>
    ),
    { duration: 4000 },
  );
}

function toastSecretCopied() {
  toast(
    () => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: 320,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            flexShrink: 0,
            background: 'rgba(148,163,184,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ClipboardCheck size={18} color="#94a3b8" />
        </div>
        <div>
          <p
            style={{
              margin: 0,
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Secret copied
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              opacity: 0.6,
            }}
          >
            Stored to clipboard
          </p>
        </div>
      </div>
    ),
    { duration: 3000 },
  );
}

export default function WebhooksSection({
  initialWebhooks,
}: WebhooksSectionProps) {
  const [webhooks, setWebhooks] =
    useState<WebhookData[]>(initialWebhooks);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<WebhookData | null>(null);
  const [loading, setLoading] = useState(false);

  const [logsWebhook, setLogsWebhook] =
    useState<WebhookData | null>(null);
  const [logs, setLogs] = useState<WebhookEvent[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const openCreateModal = () => {
    setShowModal(true);
  };

  // Listen for command palette event
  useEffect(() => {
    const handleAddWebhook = () => openCreateModal();
    window.addEventListener(
      'cmd:add-webhook',
      handleAddWebhook,
    );
    return () =>
      window.removeEventListener(
        'cmd:add-webhook',
        handleAddWebhook,
      );
  }, []);

  const closeModal = () => {
    setShowModal(false);
  };

  const createWebhook = async (
    url: string,
    events: string[],
  ) => {
    if (!url.trim() || events.length === 0) return;
    setLoading(true);

    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, events }),
      });

      const response = await res.json();

      if (response.success) {
        setWebhooks([response.data.webhook, ...webhooks]);
        toastWebhookCreated(url);
        closeModal();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Failed to create webhook:', error);
      toast.error('Failed to create webhook');
    }

    setLoading(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(
        `/api/webhooks/${deleteTarget.id}`,
        { method: 'DELETE' },
      );
      const response = await res.json();
      if (response.success) {
        setWebhooks(
          webhooks.filter((w) => w.id !== deleteTarget.id),
        );
        toastWebhookDeleted(deleteTarget.url);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      toast.error('Failed to remove webhook');
    }
    setDeleteTarget(null);
  };

  const testWebhook = async (
    webhookId: string,
    eventType: string = 'email.sent',
  ) => {
    setLoading(true);
    try {
      const res = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookId, eventType }),
      });

      const response = await res.json();

      if (response.success) {
        const webhook = webhooks.find(
          (w) => w.id === webhookId,
        );
        toastWebhookTested(webhook?.url ?? '');
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Failed to test webhook:', error);
      toast.error('Failed to send test event');
    }
    setLoading(false);
  };

  const viewLogs = async (webhook: WebhookData) => {
    setLogsWebhook(webhook);
    setLogsLoading(true);
    try {
      const res = await fetch(
        `/api/webhooks/${webhook.id}/events`,
      );
      const response = await res.json();
      if (response.success) {
        setLogs(response.data.events);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
    setLogsLoading(false);
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toastSecretCopied();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Endpoint
        </button>
      </div>

      {webhooks.length === 0 ? (
        <EmptyState onAddClick={openCreateModal} />
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <WebhookCard
              key={webhook.id}
              webhook={webhook}
              loading={loading}
              onViewLogs={viewLogs}
              onTest={testWebhook}
              onDelete={setDeleteTarget}
              onCopySecret={copySecret}
            />
          ))}
        </div>
      )}

      <WebhookModal
        isOpen={showModal}
        loading={loading}
        onClose={closeModal}
        onSave={createWebhook}
      />

      <LogsModal
        webhook={logsWebhook}
        logs={logs}
        loading={logsLoading}
        onClose={() => setLogsWebhook(null)}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Remove Webhook"
        message="Are you sure you want to remove this webhook? You will stop receiving events at this URL."
        confirmText="Remove"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />
    </div>
  );
}
