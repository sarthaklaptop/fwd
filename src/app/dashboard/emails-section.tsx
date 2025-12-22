'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatRelativeTime } from '@/lib/utils';

interface Email {
    id: string;
    to: string;
    subject: string;
    status: string;
    openedAt: Date | null;
    createdAt: Date;
}

interface EmailDetail {
    id: string;
    to: string;
    subject: string;
    html: string | null;
    text: string | null;
    status: string;
    bounceType: string | null;
    sesMessageId: string | null;
    errorMessage: string | null;
    openedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export default function EmailsSection() {
    const [emails, setEmails] = useState<Email[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchEmails = useCallback(async (cursor?: string | null) => {
        if (cursor) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }

        try {
            const params = new URLSearchParams();
            if (cursor) params.set('cursor', cursor);
            if (debouncedSearch) params.set('search', debouncedSearch);
            if (statusFilter) params.set('status', statusFilter);
            params.set('limit', '20');

            const res = await fetch(`/api/emails?${params}`);
            if (res.ok) {
                const data = await res.json();
                if (cursor) {
                    setEmails(prev => [...prev, ...data.emails]);
                } else {
                    setEmails(data.emails);
                }
                setNextCursor(data.nextCursor);
                setHasMore(data.hasMore);
            }
        } catch (error) {
            console.error('Failed to fetch emails:', error);
        }

        setLoading(false);
        setLoadingMore(false);
    }, [debouncedSearch, statusFilter]);

    useEffect(() => {
        fetchEmails();
    }, [fetchEmails]);

    // Fetch email detail
    async function fetchEmailDetail(id: string) {
        setDetailLoading(true);
        try {
            const res = await fetch(`/api/emails/${id}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedEmail(data.email);
            }
        } catch (error) {
            console.error('Failed to fetch email detail:', error);
        }
        setDetailLoading(false);
    }

    // Export CSV
    async function handleExport() {
        setExporting(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.set('status', statusFilter);
            
            const res = await fetch(`/api/emails/export?${params}`);
            if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `emails-export-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Failed to export:', error);
        }
        setExporting(false);
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">Email Logs</h2>
                    <p className="text-gray-400 text-sm">Search and browse sent emails</p>
                </div>
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    {exporting ? (
                        <>
                            <LoadingSpinner />
                            Exporting...
                        </>
                    ) : (
                        <>
                            <DownloadIcon />
                            Export CSV
                        </>
                    )}
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
                <div className="flex-1 relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by recipient or subject..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                    <option value="">All Status</option>
                    <option value="completed">Delivered</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                    <option value="bounced">Bounced</option>
                    <option value="complained">Complained</option>
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="animate-pulse space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-14 bg-gray-700/50 rounded"></div>
                    ))}
                </div>
            ) : emails.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-4xl mb-4">📭</div>
                    <p className="text-gray-400">
                        {debouncedSearch || statusFilter ? 'No emails match your filters' : 'No emails sent yet'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    <th className="px-4 py-3">To</th>
                                    <th className="px-4 py-3">Subject</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Opened</th>
                                    <th className="px-4 py-3">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {emails.map((email) => (
                                    <tr
                                        key={email.id}
                                        onClick={() => fetchEmailDetail(email.id)}
                                        className="hover:bg-gray-700/30 transition-colors cursor-pointer"
                                    >
                                        <td className="px-4 py-3 text-sm text-white font-medium">{email.to}</td>
                                        <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">{email.subject}</td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={email.status} />
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-400" suppressHydrationWarning>
                                            {email.openedAt ? formatRelativeTime(email.openedAt) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-400" suppressHydrationWarning>
                                            {formatRelativeTime(email.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Load More */}
                    {hasMore && (
                        <div className="flex justify-center pt-4">
                            <button
                                onClick={() => fetchEmails(nextCursor)}
                                disabled={loadingMore}
                                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                                {loadingMore ? 'Loading...' : 'Load More'}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Email Detail Modal */}
            {selectedEmail && (
                <EmailDetailModal
                    email={selectedEmail}
                    loading={detailLoading}
                    onClose={() => setSelectedEmail(null)}
                />
            )}
        </div>
    );
}

function EmailDetailModal({
    email,
    loading,
    onClose,
}: {
    email: EmailDetail;
    loading: boolean;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h3 className="text-lg font-semibold text-white">Email Details</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <CloseIcon className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)] space-y-4">
                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                            <div className="h-32 bg-gray-700 rounded"></div>
                        </div>
                    ) : (
                        <>
                            {/* Metadata */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-400">To</p>
                                    <p className="text-white font-medium">{email.to}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Status</p>
                                    <StatusBadge status={email.status} />
                                </div>
                                <div>
                                    <p className="text-gray-400">Sent</p>
                                    <p className="text-white">{new Date(email.createdAt).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Opened</p>
                                    <p className="text-white">
                                        {email.openedAt ? new Date(email.openedAt).toLocaleString() : '—'}
                                    </p>
                                </div>
                                {email.bounceType && (
                                    <div>
                                        <p className="text-gray-400">Bounce Type</p>
                                        <p className="text-red-400">{email.bounceType}</p>
                                    </div>
                                )}
                                {email.sesMessageId && (
                                    <div className="col-span-2">
                                        <p className="text-gray-400">SES Message ID</p>
                                        <p className="text-white font-mono text-xs break-all">{email.sesMessageId}</p>
                                    </div>
                                )}
                            </div>

                            {/* Subject */}
                            <div>
                                <p className="text-gray-400 text-sm mb-1">Subject</p>
                                <p className="text-white font-medium">{email.subject}</p>
                            </div>

                            {/* Error Message */}
                            {email.errorMessage && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                    <p className="text-red-400 text-sm font-medium">Error</p>
                                    <p className="text-red-300 text-sm">{email.errorMessage}</p>
                                </div>
                            )}

                            {/* HTML Content Preview */}
                            {email.html && (
                                <div>
                                    <p className="text-gray-400 text-sm mb-2">HTML Content</p>
                                    <div className="bg-white rounded-lg overflow-hidden">
                                        <iframe
                                            srcDoc={email.html}
                                            className="w-full h-64 border-0"
                                            sandbox="allow-same-origin"
                                            title="Email preview"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Text Content */}
                            {email.text && !email.html && (
                                <div>
                                    <p className="text-gray-400 text-sm mb-2">Text Content</p>
                                    <pre className="bg-gray-900 rounded-lg p-4 text-gray-300 text-sm whitespace-pre-wrap overflow-x-auto">
                                        {email.text}
                                    </pre>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, { bg: string; text: string; dot: string }> = {
        pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
        processing: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400 animate-pulse' },
        completed: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
        failed: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
        bounced: { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400' },
        complained: { bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400' },
    };

    const style = styles[status] || styles.pending;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

function LoadingSpinner() {
    return (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    );
}

function SearchIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

function DownloadIcon() {
    return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
    );
}

function CloseIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}
