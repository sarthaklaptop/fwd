'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils';
import { Webhook, Plus, ClipboardList, Zap, Trash2, Copy, X, Check, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';

interface WebhookData {
    id: string;
    url: string;
    events: string[];
    secret: string;
    createdAt: Date;
}

interface WebhookEvent {
    id: string;
    eventType: string;
    responseStatus: number;
    createdAt: Date;
}

const AVAILABLE_EVENTS = [
    { id: 'email.sent', label: 'Email Sent' },
    { id: 'email.delivered', label: 'Email Delivered' },
    { id: 'email.opened', label: 'Email Opened' },
    { id: 'email.bounced', label: 'Email Bounced' },
    { id: 'email.complained', label: 'Spam Complaint' },
];

export default function WebhooksSection({ initialWebhooks }: { initialWebhooks: WebhookData[] }) {
    const [webhooks, setWebhooks] = useState<WebhookData[]>(initialWebhooks);
    const [showModal, setShowModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<WebhookData | null>(null);
    const [loading, setLoading] = useState(false);

    // Form state
    const [url, setUrl] = useState('');
    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

    // Logs state
    const [logsWebhook, setLogsWebhook] = useState<WebhookData | null>(null);
    const [logs, setLogs] = useState<WebhookEvent[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);

    const openCreateModal = () => {
        setUrl('');
        setSelectedEvents([]);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
    };

    const toggleEvent = (eventId: string) => {
        if (selectedEvents.includes(eventId)) {
            setSelectedEvents(selectedEvents.filter(e => e !== eventId));
        } else {
            setSelectedEvents([...selectedEvents, eventId]);
        }
    };

    const createWebhook = async () => {
        if (!url.trim() || selectedEvents.length === 0) return;
        setLoading(true);

        const res = await fetch('/api/webhooks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, events: selectedEvents }),
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

        const res = await fetch(`/api/webhooks/${deleteTarget.id}`, { method: 'DELETE' });
        if (res.ok) {
            setWebhooks(webhooks.filter(w => w.id !== deleteTarget.id));
            toast.success('Webhook deleted');
        } else {
            toast.error('Failed to delete webhook');
        }
        setDeleteTarget(null);
    };

    const testWebhook = async (webhookId: string, eventType: string = 'email.sent') => {
        setLoading(true);
        const res = await fetch('/api/webhooks/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ webhookId, eventType }),
        });

        const data = await res.json();
        setLoading(false);

        if (res.ok) {
            toast.success(`Test event sent! Status: ${data.status}`);
        } else {
            toast.error(data.error || 'Test failed');
        }
    };

    const viewLogs = async (webhook: WebhookData) => {
        setLogsWebhook(webhook);
        setLogsLoading(true);
        try {
            const res = await fetch(`/api/webhooks/${webhook.id}/events`);
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
            {/* Header with Add Button */}
            <div className="flex justify-end">
                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Add Endpoint
                </button>
            </div>

            {/* Webhooks List */}
            {webhooks.length === 0 ? (
                <div className="text-center py-12 border border-border rounded-xl bg-card/50">
                    <Webhook className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-foreground font-medium">No webhooks configured</p>
                    <p className="text-muted-foreground text-sm mt-1">Add an endpoint to start receiving events</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {webhooks.map((webhook) => (
                        <div key={webhook.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1 mr-4">
                                    <h3 className="text-foreground font-mono text-sm break-all mb-2">{webhook.url}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {webhook.events.map((event) => (
                                            <span key={event} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                                                {event}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => viewLogs(webhook)}
                                        className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm px-2 py-1 rounded hover:bg-secondary transition-colors"
                                    >
                                        <ClipboardList className="w-4 h-4" />
                                        Logs
                                    </button>
                                    <button
                                        onClick={() => testWebhook(webhook.id)}
                                        disabled={loading}
                                        className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 text-sm px-2 py-1 rounded hover:bg-primary/10 transition-colors disabled:opacity-50"
                                    >
                                        <Zap className="w-4 h-4" />
                                        Test
                                    </button>
                                    <button
                                        onClick={() => setDeleteTarget(webhook)}
                                        className="inline-flex items-center gap-1.5 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {/* Secret Display */}
                            <div className="flex items-center gap-2 bg-transparent rounded-lg px-3 py-2 border border-border">
                                <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Signing Secret:</span>
                                <code className="text-foreground text-sm font-mono select-all">{webhook.secret.slice(0, 8)}...{webhook.secret.slice(-4)}</code>
                                <button
                                    onClick={() => copySecret(webhook.secret)}
                                    className="ml-auto p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
                                    title="Copy Secret"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-card border border-border p-6 rounded-xl max-w-lg w-full mx-4 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Webhook className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">Add Webhook Endpoint</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Endpoint URL</label>
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://api.your-app.com/webhooks/email"
                                    className="w-full px-4 py-2.5 bg-transparent border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Events to Subscribe</label>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {AVAILABLE_EVENTS.map((event) => (
                                        <div
                                            key={event.id}
                                            onClick={() => toggleEvent(event.id)}
                                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${selectedEvents.includes(event.id)
                                                ? 'bg-primary/10 border-primary/50'
                                                : 'bg-transparent border-border hover:border-primary/30'
                                                }`}
                                        >
                                            <span className={`text-sm font-medium ${selectedEvents.includes(event.id) ? 'text-primary' : 'text-foreground'}`}>
                                                {event.label}
                                            </span>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedEvents.includes(event.id) ? 'bg-primary border-primary' : 'border-muted-foreground'
                                                }`}>
                                                {selectedEvents.includes(event.id) && (
                                                    <Check className="w-3 h-3 text-primary-foreground" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={createWebhook}
                                disabled={loading || !url.trim() || selectedEvents.length === 0}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg disabled:opacity-50 transition-all"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                                        Adding...
                                    </>
                                ) : (
                                    'Add Endpoint'
                                )}
                            </button>
                            <button
                                onClick={closeModal}
                                className="px-4 py-2.5 bg-transparent hover:bg-primary/10 text-foreground font-medium rounded-lg border border-border hover:border-primary/30 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Logs Modal */}
            {logsWebhook && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[70vh] overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Delivery Logs</h3>
                                <p className="text-muted-foreground text-xs font-mono truncate max-w-md">{logsWebhook.url}</p>
                            </div>
                            <button
                                onClick={() => setLogsWebhook(null)}
                                className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto max-h-[calc(70vh-80px)]">
                            {logsLoading ? (
                                <div className="animate-pulse space-y-3">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="h-10 bg-secondary rounded"></div>
                                    ))}
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="text-center py-8">
                                    <Inbox className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                                    <p className="text-foreground font-medium">No delivery attempts yet</p>
                                    <p className="text-muted-foreground text-sm mt-1">Use the Test button to send a test event</p>
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
                                            <tr key={log.id} className="hover:bg-secondary/30 transition-colors">
                                                <td className="py-2 text-primary">{log.eventType}</td>
                                                <td className="py-2">
                                                    {log.responseStatus >= 200 && log.responseStatus < 300 ? (
                                                        <span className="inline-flex items-center gap-1 text-green-500 dark:text-green-400">
                                                            {log.responseStatus}
                                                            <Check className="w-3 h-3" />
                                                        </span>
                                                    ) : log.responseStatus === 0 ? (
                                                        <span className="text-red-500 dark:text-red-400">Failed</span>
                                                    ) : (
                                                        <span className="text-yellow-500 dark:text-yellow-400">{log.responseStatus}</span>
                                                    )}
                                                </td>
                                                <td className="py-2 text-muted-foreground" suppressHydrationWarning>
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
            )}

            {/* Delete Confirmation */}
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
