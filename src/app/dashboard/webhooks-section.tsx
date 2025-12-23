'use client';

import { useState } from 'react';
import { ConfirmDialog, Toast } from '@/components/ui';

interface Webhook {
    id: string;
    url: string;
    events: string[];
    secret: string;
    createdAt: Date;
}

const AVAILABLE_EVENTS = [
    { id: 'email.sent', label: 'Email Sent' },
    { id: 'email.delivered', label: 'Email Delivered' },
    { id: 'email.opened', label: 'Email Opened' },
    { id: 'email.bounced', label: 'Email Bounced' },
    { id: 'email.complained', label: 'Spam Complaint' },
];

export default function WebhooksSection({ initialWebhooks }: { initialWebhooks: Webhook[] }) {
    const [webhooks, setWebhooks] = useState<Webhook[]>(initialWebhooks);
    const [showModal, setShowModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Webhook | null>(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Form state
    const [url, setUrl] = useState('');
    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
    const [showSecretId, setShowSecretId] = useState<string | null>(null);

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
            setToast({ message: 'Webhook created successfully!', type: 'success' });
            closeModal();
        } else {
            setToast({ message: data.error || 'Failed to create webhook', type: 'error' });
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        const res = await fetch(`/api/webhooks/${deleteTarget.id}`, { method: 'DELETE' });
        if (res.ok) {
            setWebhooks(webhooks.filter(w => w.id !== deleteTarget.id));
            setToast({ message: 'Webhook deleted', type: 'success' });
        } else {
            setToast({ message: 'Failed to delete webhook', type: 'error' });
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
            setToast({ message: `Test event sent! Status: ${data.status}`, type: 'success' });
        } else {
            setToast({ message: data.error || 'Test failed', type: 'error' });
        }
    };

    const copySecret = (secret: string) => {
        navigator.clipboard.writeText(secret);
        setToast({ message: 'Secret copied to clipboard', type: 'success' });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">Webhooks</h2>
                    <p className="text-gray-400 text-sm">Receive real-time updates for email events</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium rounded-lg transition-all shadow-lg shadow-blue-500/20"
                >
                    + Add Endpoinst
                </button>
            </div>

            {/* Webhooks List */}
            {webhooks.length === 0 ? (
                <div className="text-center py-12 border border-gray-700/50 rounded-xl bg-gray-800/20">
                    <div className="text-4xl mb-4">🔌</div>
                    <p className="text-gray-400">No webhooks configured</p>
                    <p className="text-gray-500 text-sm">Add an endpoint to start receiving events</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {webhooks.map((webhook) => (
                        <div key={webhook.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1 mr-4">
                                    <h3 className="text-white font-mono text-sm break-all mb-1">{webhook.url}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {webhook.events.map((event) => (
                                            <span key={event} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                                                {event}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => testWebhook(webhook.id)}
                                        disabled={loading}
                                        className="text-blue-400 hover:text-blue-300 text-sm px-2 py-1 rounded hover:bg-blue-900/20 transition-colors disabled:opacity-50"
                                    >
                                        ⚡ Test
                                    </button>
                                    <button onClick={() => setDeleteTarget(webhook)} className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-900/20 transition-colors">
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {/* Secret Display */}
                            <div className="flex items-center gap-2 bg-gray-900/50 rounded px-3 py-2 border border-gray-700/50">
                                <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Signing Secret:</span>
                                <code className="text-gray-300 text-sm font-mono filter blur-[4px] hover:blur-none transition-all cursor-pointer select-all" onClick={() => copySecret(webhook.secret)}>
                                    {webhook.secret}
                                </code>
                                <button
                                    onClick={() => copySecret(webhook.secret)}
                                    className="ml-auto text-gray-500 hover:text-white"
                                    title="Copy Secret"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl max-w-lg w-full mx-4 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Add Webhook Endpoint</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Endpoint URL</label>
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://api.your-app.com/webhooks/email"
                                    className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Events to Subscribe</label>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {AVAILABLE_EVENTS.map((event) => (
                                        <div
                                            key={event.id}
                                            onClick={() => toggleEvent(event.id)}
                                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${selectedEvents.includes(event.id)
                                                ? 'bg-blue-500/20 border-blue-500/50'
                                                : 'bg-gray-900/30 border-gray-700 hover:border-gray-600'
                                                }`}
                                        >
                                            <span className={`text-sm font-medium ${selectedEvents.includes(event.id) ? 'text-blue-300' : 'text-gray-300'}`}>
                                                {event.label}
                                            </span>
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedEvents.includes(event.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-500'
                                                }`}>
                                                {selectedEvents.includes(event.id) && (
                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
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
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium rounded-lg disabled:opacity-50 transition-all"
                            >
                                {loading ? 'Adding...' : 'Add Endpoint'}
                            </button>
                            <button
                                onClick={closeModal}
                                className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
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

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
