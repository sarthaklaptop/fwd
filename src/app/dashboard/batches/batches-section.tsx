'use client';

import { useState, useEffect } from 'react';
import { formatRelativeTime } from '@/lib/utils';
import { Package, RefreshCw, X, Check, Minus } from 'lucide-react';

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
    const [pendingBatchId, setPendingBatchId] = useState<string | null>(null);
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

    async function fetchBatchDetail(batch: Batch) {
        setPendingBatchId(batch.id);
        setDetailLoading(true);
        try {
            const res = await fetch(`/api/batches/${batch.id}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedBatch({ ...data.batch, emails: data.emails });
            }
        } catch (error) {
            console.error('Failed to fetch batch detail:', error);
        }
        setDetailLoading(false);
    }

    function closeModal() {
        setSelectedBatch(null);
        setPendingBatchId(null);
    }

    // Get the batch info for showing in modal header while loading
    const pendingBatch = pendingBatchId ? batches.find(b => b.id === pendingBatchId) : null;

    return (
        <div className="space-y-6">
            {/* Header with Refresh Button */}
            <div className="flex justify-end">
                <button
                    onClick={() => fetchBatches()}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-primary/10 text-foreground text-sm font-medium rounded-lg border border-border hover:border-primary/30 transition-colors disabled:opacity-50"
                    title="Refresh"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-border rounded-xl">
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/30">
                            <th className="px-4 py-3">Template</th>
                            <th className="px-4 py-3">Recipients</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Success Rate</th>
                            <th className="px-4 py-3">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? (
                            // Skeleton rows
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-4 py-3"><div className="h-4 bg-secondary rounded w-24"></div></td>
                                    <td className="px-4 py-3"><div className="h-4 bg-secondary rounded w-16"></div></td>
                                    <td className="px-4 py-3"><div className="h-6 bg-secondary rounded-full w-20"></div></td>
                                    <td className="px-4 py-3"><div className="h-4 bg-secondary rounded w-12"></div></td>
                                    <td className="px-4 py-3"><div className="h-4 bg-secondary rounded w-20"></div></td>
                                </tr>
                            ))
                        ) : batches.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-12 text-center">
                                    <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                                    <p className="text-foreground font-medium">No batch sends yet</p>
                                    <p className="text-muted-foreground text-sm mt-1">Use the API to send batch emails</p>
                                </td>
                            </tr>
                        ) : (
                            batches.map((batch) => (
                                <tr
                                    key={batch.id}
                                    onClick={() => fetchBatchDetail(batch)}
                                    className="hover:bg-secondary/30 transition-colors cursor-pointer"
                                >
                                    <td className="px-4 py-3 text-sm text-foreground font-medium">
                                        {batch.templateName || 'Direct Send'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-foreground">
                                        <span className="font-medium">{batch.queued}</span>
                                        <span className="text-muted-foreground"> / {batch.total}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={batch.status} />
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <SuccessRate completed={batch.completed} queued={batch.queued} />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground" suppressHydrationWarning>
                                        {formatRelativeTime(batch.createdAt)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Batch Detail Modal */}
            {(selectedBatch || pendingBatchId) && (
                <BatchDetailModal
                    batch={selectedBatch}
                    pendingBatch={pendingBatch}
                    loading={detailLoading}
                    onClose={closeModal}
                />
            )}
        </div>
    );
}

function BatchDetailModal({
    batch,
    pendingBatch,
    loading,
    onClose,
}: {
    batch: BatchDetail | null;
    pendingBatch: Batch | null | undefined;
    loading: boolean;
    onClose: () => void;
}) {
    // Use actual batch data if available, otherwise use pending batch info for header
    const displayBatch = batch || pendingBatch;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">Batch Details</h3>
                            {displayBatch ? (
                                <p className="text-muted-foreground text-sm">
                                    {displayBatch.templateName || 'Direct Send'} • {displayBatch.queued} emails
                                </p>
                            ) : (
                                <div className="h-4 bg-secondary rounded w-32 animate-pulse"></div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)] space-y-6">
                    {loading || !batch ? (
                        <div className="animate-pulse space-y-6">
                            {/* Stats skeleton */}
                            <div className="grid grid-cols-4 gap-3">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="border border-border rounded-lg p-3">
                                        <div className="h-3 bg-secondary rounded w-12 mb-2"></div>
                                        <div className="h-6 bg-secondary rounded w-8"></div>
                                    </div>
                                ))}
                            </div>
                            {/* Table skeleton */}
                            <div>
                                <div className="h-4 bg-secondary rounded w-24 mb-3"></div>
                                <div className="border border-border rounded-xl overflow-hidden">
                                    <div className="bg-secondary/30 px-4 py-2 border-b border-border">
                                        <div className="flex gap-8">
                                            <div className="h-3 bg-secondary rounded w-16"></div>
                                            <div className="h-3 bg-secondary rounded w-12"></div>
                                            <div className="h-3 bg-secondary rounded w-12"></div>
                                        </div>
                                    </div>
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="px-4 py-3 border-b border-border last:border-0">
                                            <div className="flex gap-8">
                                                <div className="h-4 bg-secondary rounded w-32"></div>
                                                <div className="h-4 bg-secondary rounded w-16"></div>
                                                <div className="h-4 bg-secondary rounded w-4"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
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
                                        <span className="text-yellow-500 dark:text-yellow-400">
                                            {batch.suppressed} suppressed
                                        </span>
                                    )}
                                    {batch.duplicates > 0 && (
                                        <span className="text-orange-500 dark:text-orange-400">
                                            {batch.duplicates} duplicates
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Emails Table */}
                            <div>
                                <h4 className="text-sm font-medium text-foreground mb-3">
                                    Emails ({batch.emails?.length || 0})
                                </h4>
                                <div className="rounded-xl overflow-hidden max-h-64 overflow-y-auto border border-border">
                                    <table className="w-full text-sm">
                                        <thead className="bg-secondary/30 sticky top-0 border-b border-border">
                                            <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                                                <th className="px-4 py-2">Recipient</th>
                                                <th className="px-4 py-2">Status</th>
                                                <th className="px-4 py-2">Opened</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {batch.emails?.map((email) => (
                                                <tr key={email.id} className="hover:bg-primary/5 transition-colors">
                                                    <td className="px-4 py-2.5 text-foreground">{email.to}</td>
                                                    <td className="px-4 py-2.5">
                                                        <EmailStatusBadge status={email.status} />
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

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, { bg: string; text: string }> = {
        processing: { bg: 'bg-blue-500/10', text: 'text-blue-500 dark:text-blue-400' },
        completed: { bg: 'bg-green-500/10', text: 'text-green-500 dark:text-green-400' },
        partial: { bg: 'bg-yellow-500/10', text: 'text-yellow-500 dark:text-yellow-400' },
        failed: { bg: 'bg-red-500/10', text: 'text-red-500 dark:text-red-400' },
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
        pending: 'text-yellow-500 dark:text-yellow-400',
        processing: 'text-blue-500 dark:text-blue-400',
        completed: 'text-green-500 dark:text-green-400',
        failed: 'text-red-500 dark:text-red-400',
        bounced: 'text-orange-500 dark:text-orange-400',
    };

    return (
        <span className={`text-xs font-medium ${colors[status] || 'text-muted-foreground'}`}>
            {status}
        </span>
    );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
    const textColors: Record<string, string> = {
        blue: 'text-blue-500 dark:text-blue-400',
        green: 'text-green-500 dark:text-green-400',
        red: 'text-red-500 dark:text-red-400',
    };

    return (
        <div className="bg-transparent rounded-lg p-3 border border-border">
            <p className="text-muted-foreground text-xs mb-1">{label}</p>
            <p className={`text-xl font-bold ${color ? textColors[color] : 'text-foreground'}`}>
                {value}
            </p>
        </div>
    );
}

function SuccessRate({ completed, queued }: { completed: number; queued: number }) {
    if (queued === 0) return <span className="text-muted-foreground">—</span>;

    const rate = Math.round((completed / queued) * 100);
    const color = rate >= 90 ? 'text-green-500 dark:text-green-400' : rate >= 70 ? 'text-yellow-500 dark:text-yellow-400' : 'text-red-500 dark:text-red-400';

    return (
        <span className={`font-medium ${color}`}>{rate}%</span>
    );
}
