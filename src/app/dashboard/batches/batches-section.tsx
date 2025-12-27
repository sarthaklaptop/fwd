'use client';

import { useState, useEffect } from 'react';
import { formatRelativeTime } from '@/lib/utils';

interface Batch {
    id: string;
    templateId: string | null;
    templateName: string | null;
    total: number;
    valid: number;
    suppressed: number;
    duplicates: number;
    queued: number;
    completed: number;
    failed: number;
    status: string;
    createdAt: Date;
}

interface BatchEmail {
    id: string;
    to: string;
    subject: string;
    status: string;
    openedAt: Date | null;
    createdAt: Date;
}

interface BatchDetail extends Batch {
    emails: BatchEmail[];
}

export default function BatchesSection() {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBatch, setSelectedBatch] = useState<BatchDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        fetchBatches();
    }, []);

    async function fetchBatches() {
        setLoading(true);
        try {
            const res = await fetch('/api/batches?limit=20');
            if (res.ok) {
                const data = await res.json();
                setBatches(data.batches);
            }
        } catch (error) {
            console.error('Failed to fetch batches:', error);
        }
        setLoading(false);
    }

    async function fetchBatchDetail(id: string) {
        setDetailLoading(true);
        try {
            const res = await fetch(`/api/batches/${id}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedBatch({ ...data.batch, emails: data.emails });
            }
        } catch (error) {
            console.error('Failed to fetch batch detail:', error);
        }
        setDetailLoading(false);
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">Batch Sends</h2>
                    <p className="text-gray-400 text-sm">Manage your bulk email campaigns</p>
                </div>
                <button
                    onClick={() => fetchBatches()}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    title="Refresh"
                >
                    <RefreshIcon className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Table */}
            {loading ? (
                <div className="animate-pulse space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-14 bg-gray-700/50 rounded"></div>
                    ))}
                </div>
            ) : batches.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-4xl mb-4">📦</div>
                    <p className="text-gray-400">No batch sends yet</p>
                    <p className="text-gray-500 text-sm mt-2">
                        Use the API to send batch emails
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                <th className="px-4 py-3">Template</th>
                                <th className="px-4 py-3">Recipients</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Success Rate</th>
                                <th className="px-4 py-3">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                            {batches.map((batch) => (
                                <tr
                                    key={batch.id}
                                    onClick={() => fetchBatchDetail(batch.id)}
                                    className="hover:bg-gray-700/30 transition-colors cursor-pointer"
                                >
                                    <td className="px-4 py-3 text-sm text-white font-medium">
                                        {batch.templateName || 'Direct Send'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-300">
                                        <span className="font-medium">{batch.queued}</span>
                                        <span className="text-gray-500"> / {batch.total}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={batch.status} />
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <SuccessRate completed={batch.completed} queued={batch.queued} />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-400" suppressHydrationWarning>
                                        {formatRelativeTime(batch.createdAt)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Batch Detail Modal */}
            {selectedBatch && (
                <BatchDetailModal
                    batch={selectedBatch}
                    loading={detailLoading}
                    onClose={() => setSelectedBatch(null)}
                />
            )}
        </div>
    );
}

function BatchDetailModal({
    batch,
    loading,
    onClose,
}: {
    batch: BatchDetail;
    loading: boolean;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Batch Details</h3>
                        <p className="text-gray-400 text-sm">
                            {batch.templateName || 'Direct Send'} • {batch.queued} emails
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <CloseIcon className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)] space-y-6">
                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            <div className="h-20 bg-gray-700 rounded"></div>
                            <div className="h-40 bg-gray-700 rounded"></div>
                        </div>
                    ) : (
                        <>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-4 gap-3">
                                <StatCard label="Total" value={batch.total} />
                                <StatCard label="Queued" value={batch.queued} color="blue" />
                                <StatCard label="Completed" value={batch.completed} color="green" />
                                <StatCard label="Failed" value={batch.failed} color="red" />
                            </div>

                            {/* Filtering Stats */}
                            {(batch.suppressed > 0 || batch.duplicates > 0) && (
                                <div className="flex gap-4 text-sm">
                                    {batch.suppressed > 0 && (
                                        <span className="text-yellow-400">
                                            {batch.suppressed} suppressed
                                        </span>
                                    )}
                                    {batch.duplicates > 0 && (
                                        <span className="text-orange-400">
                                            {batch.duplicates} duplicates
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Emails Table */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-400 mb-3">
                                    Emails ({batch.emails?.length || 0})
                                </h4>
                                <div className="bg-gray-900/50 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-900 sticky top-0">
                                            <tr className="text-left text-xs text-gray-500 uppercase">
                                                <th className="px-3 py-2">Recipient</th>
                                                <th className="px-3 py-2">Status</th>
                                                <th className="px-3 py-2">Opened</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {batch.emails?.map((email) => (
                                                <tr key={email.id}>
                                                    <td className="px-3 py-2 text-white">{email.to}</td>
                                                    <td className="px-3 py-2">
                                                        <EmailStatusBadge status={email.status} />
                                                    </td>
                                                    <td className="px-3 py-2 text-gray-400">
                                                        {email.openedAt ? '✓' : '—'}
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

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, { bg: string; text: string }> = {
        processing: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
        completed: { bg: 'bg-green-500/10', text: 'text-green-400' },
        partial: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
        failed: { bg: 'bg-red-500/10', text: 'text-red-400' },
    };

    const style = styles[status] || styles.processing;

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

function EmailStatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        pending: 'text-yellow-400',
        processing: 'text-blue-400',
        completed: 'text-green-400',
        failed: 'text-red-400',
        bounced: 'text-orange-400',
    };

    return (
        <span className={`text-xs ${colors[status] || 'text-gray-400'}`}>
            {status}
        </span>
    );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
    const textColors: Record<string, string> = {
        blue: 'text-blue-400',
        green: 'text-green-400',
        red: 'text-red-400',
    };

    return (
        <div className="bg-gray-900/50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">{label}</p>
            <p className={`text-xl font-bold ${color ? textColors[color] : 'text-white'}`}>
                {value}
            </p>
        </div>
    );
}

function SuccessRate({ completed, queued }: { completed: number; queued: number }) {
    if (queued === 0) return <span className="text-gray-500">—</span>;

    const rate = Math.round((completed / queued) * 100);
    const color = rate >= 90 ? 'text-green-400' : rate >= 70 ? 'text-yellow-400' : 'text-red-400';

    return (
        <span className={color}>{rate}%</span>
    );
}

function CloseIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

function RefreshIcon({ className }: { className?: string }) {
    return (
        <svg className={`w-4 h-4 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    );
}
