'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { WebhookCard, EmptyState } from './webhooks-card';
import { WebhookModal } from './webhooks-modal';
import { LogsModal } from './webhooks-logs';
import type {
  WebhookData,
  WebhookEvent,
  WebhooksSectionProps,
} from './webhooks-types';

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

  const closeModal = () => {
    setShowModal(false);
  };

  const createWebhook = async (
    url: string,
    events: string[]
  ) => {
    if (!url.trim() || events.length === 0) return;
    setLoading(true);

    const res = await fetch('/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, events }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setWebhooks([data.webhook, ...webhooks]);
      toast.success('Webhook created successfully!');
      closeModal();
    } else {
      toast.error(data.error || 'Failed to create webhook');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    const res = await fetch(
      `/api/webhooks/${deleteTarget.id}`,
      { method: 'DELETE' }
    );
    if (res.ok) {
      setWebhooks(
        webhooks.filter((w) => w.id !== deleteTarget.id)
      );
      toast.success('Webhook deleted');
    } else {
      toast.error('Failed to delete webhook');
    }
    setDeleteTarget(null);
  };

  const testWebhook = async (
    webhookId: string,
    eventType: string = 'email.sent'
  ) => {
    setLoading(true);
    const res = await fetch('/api/webhooks/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookId, eventType }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      toast.success(
        `Test event sent! Status: ${data.status}`
      );
    } else {
      toast.error(data.error || 'Test failed');
    }
  };

  const viewLogs = async (webhook: WebhookData) => {
    setLogsWebhook(webhook);
    setLogsLoading(true);
    try {
      const res = await fetch(
        `/api/webhooks/${webhook.id}/events`
      );
      if (res.ok) {
        const data = await res.json();
        setLogs(data.events);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
    setLogsLoading(false);
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success('Secret copied to clipboard');
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
        <EmptyState />
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
