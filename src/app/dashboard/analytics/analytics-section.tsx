'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
    total: number;
    delivered: number;
    opened: number;
    bounced: number;
    complained: number;
    failed: number;
    pending: number;
    deliveryRate: number;
    openRate: number;
    bounceRate: number;
    range: string;
}

interface TimelineDataPoint {
    date: string;
    sent: number;
    delivered: number;
    opened: number;
    bounced: number;
    failed: number;
}

interface TimelineData {
    data: TimelineDataPoint[];
    range: string;
    groupBy: string;
}

export default function AnalyticsSection() {
    const [range, setRange] = useState('30d');
    const [overview, setOverview] = useState<AnalyticsData | null>(null);
    const [timeline, setTimeline] = useState<TimelineData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [range]);

    async function fetchData() {
        setLoading(true);
        try {
            const [overviewRes, timelineRes] = await Promise.all([
                fetch(`/api/analytics/overview?range=${range}`),
                fetch(`/api/analytics/timeline?range=${range}`),
            ]);

            if (overviewRes.ok) {
                setOverview(await overviewRes.json());
            }
            if (timelineRes.ok) {
                setTimeline(await timelineRes.json());
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        }
        setLoading(false);
    }

    if (loading && !overview) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-secondary rounded w-48"></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="h-32 bg-secondary rounded-xl"></div>
                    <div className="h-32 bg-secondary rounded-xl"></div>
                    <div className="h-32 bg-secondary rounded-xl"></div>
                </div>
                <div className="h-64 bg-secondary rounded-xl"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Range Selector */}
            <div className="flex flex-wrap gap-2">
                {['7d', '30d', '90d'].map((r) => (
                    <button
                        key={r}
                        onClick={() => setRange(r)}
                        disabled={loading}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all border ${range === r
                            ? 'bg-primary text-primary-foreground border-primary shadow-md'
                            : 'bg-transparent text-foreground/70 border-border hover:bg-primary/10 hover:border-primary/30 hover:text-foreground'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
                    </button>
                ))}
                {loading && (
                    <div className="flex items-center gap-2 ml-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-muted-foreground">Loading...</span>
                    </div>
                )}
            </div>

            {/* Rate Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {loading ? (
                    <>
                        <SkeletonCard title="Delivery Rate" color="green" />
                        <SkeletonCard title="Open Rate" color="blue" />
                        <SkeletonCard title="Bounce Rate" color="red" />
                    </>
                ) : overview ? (
                    <>
                        <RateCard
                            title="Delivery Rate"
                            value={overview.deliveryRate}
                            subtitle={`${overview.delivered} of ${overview.total} delivered`}
                            color="green"
                        />
                        <RateCard
                            title="Open Rate"
                            value={overview.openRate}
                            subtitle={`${overview.opened} of ${overview.delivered} opened`}
                            color="blue"
                        />
                        <RateCard
                            title="Bounce Rate"
                            value={overview.bounceRate}
                            subtitle={`${overview.bounced} bounced`}
                            color="red"
                            inverted
                        />
                    </>
                ) : null}
            </div>

            {/* Timeline Chart */}
            {loading ? (
                <SkeletonChart />
            ) : timeline && timeline.data.length > 0 ? (
                <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Email Volume Over Time</h3>
                    <BarChart data={timeline.data} />
                </div>
            ) : timeline && timeline.data.length === 0 ? (
                <div className="bg-secondary/50 rounded-xl p-8 text-center border border-border">
                    <p className="text-muted-foreground">No email data for this period</p>
                </div>
            ) : null}
        </div>
    );
}

function SkeletonCard({ title, color }: { title: string; color: 'green' | 'blue' | 'red' }) {
    const colors = {
        green: { bg: 'from-green-500/10 to-green-600/5', border: 'border-green-500/20' },
        blue: { bg: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-500/20' },
        red: { bg: 'from-red-500/10 to-red-600/5', border: 'border-red-500/20' },
    };
    const style = colors[color];

    return (
        <div className={`bg-gradient-to-br ${style.bg} border ${style.border} rounded-xl p-5`}>
            <p className="text-muted-foreground text-sm font-medium mb-2">{title}</p>
            <div className="h-10 bg-secondary/70 rounded w-24 mb-2 animate-pulse"></div>
            <div className="h-3 bg-secondary/50 rounded w-36 mb-4 animate-pulse"></div>
            <div className="h-2 bg-secondary rounded-full w-full"></div>
        </div>
    );
}

function SkeletonChart() {
    return (
        <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-4">Email Volume Over Time</h3>
            {/* Legend - static */}
            <div className="flex flex-wrap gap-6 text-sm mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-sky-500 dark:bg-sky-400 rounded-sm"></div>
                    <span className="text-foreground/70">Sent</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 dark:bg-emerald-400 rounded-sm"></div>
                    <span className="text-foreground/70">Delivered</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-violet-500 dark:bg-violet-400 rounded-sm"></div>
                    <span className="text-foreground/70">Opened</span>
                </div>
            </div>
            {/* Chart skeleton - animated */}
            <div className="flex items-end gap-2 h-40 animate-pulse">
                {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex gap-0.5 items-end flex-1">
                        <div className="w-3 bg-secondary rounded-t" style={{ height: `${30 + (i * 8) % 50}%` }}></div>
                        <div className="w-3 bg-secondary rounded-t" style={{ height: `${20 + (i * 5) % 40}%` }}></div>
                        <div className="w-3 bg-secondary rounded-t" style={{ height: `${10 + (i * 3) % 30}%` }}></div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function RateCard({
    title,
    value,
    subtitle,
    color,
    inverted = false,
}: {
    title: string;
    value: number;
    subtitle: string;
    color: 'green' | 'blue' | 'red';
    inverted?: boolean;
}) {
    const colors = {
        green: {
            bg: 'from-green-500/10 to-green-600/5',
            text: 'text-green-500',
            bar: 'bg-green-500',
            border: 'border-green-500/20'
        },
        blue: {
            bg: 'from-blue-500/10 to-blue-600/5',
            text: 'text-blue-500',
            bar: 'bg-blue-500',
            border: 'border-blue-500/20'
        },
        red: {
            bg: 'from-red-500/10 to-red-600/5',
            text: 'text-red-500',
            bar: 'bg-red-500',
            border: 'border-red-500/20'
        },
    };
    const style = colors[color];

    // For inverted (like bounce rate), lower is better
    const displayValue = inverted ? Math.max(0, 100 - value) : value;

    return (
        <div className={`bg-gradient-to-br ${style.bg} border ${style.border} rounded-xl p-5`}>
            <p className="text-muted-foreground text-sm font-medium mb-2">{title}</p>
            <p className={`text-4xl font-bold ${style.text}`}>{value}%</p>
            <p className="text-muted-foreground/70 text-xs mt-2">{subtitle}</p>
            <div className="mt-4 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                    className={`h-full ${style.bar} transition-all duration-500 rounded-full`}
                    style={{ width: `${Math.min(displayValue, 100)}%` }}
                />
            </div>
        </div>
    );
}

function BarChart({ data }: { data: TimelineDataPoint[] }) {
    const maxValue = Math.max(...data.map(d => d.sent), 1);

    // For small datasets, use a minimum width per bar
    const barMinWidth = data.length < 10 ? '48px' : undefined;

    return (
        <div className="space-y-4">
            {/* Legend */}
            <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-sky-500 dark:bg-sky-400 rounded-sm"></div>
                    <span className="text-foreground/70">Sent</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 dark:bg-emerald-400 rounded-sm"></div>
                    <span className="text-foreground/70">Delivered</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-violet-500 dark:bg-violet-400 rounded-sm"></div>
                    <span className="text-foreground/70">Opened</span>
                </div>
            </div>

            {/* Chart */}
            <div className="flex items-end gap-2 h-48 overflow-x-auto pb-4">
                {data.map((point) => {
                    const sentHeight = Math.max((point.sent / maxValue) * 100, 5);
                    const deliveredHeight = Math.max((point.delivered / maxValue) * 100, 0);
                    const openedHeight = Math.max((point.opened / maxValue) * 100, 0);

                    return (
                        <div
                            key={point.date}
                            className="flex flex-col items-center gap-1 group relative"
                            style={{ minWidth: barMinWidth, flex: data.length >= 10 ? 1 : undefined }}
                        >
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                                <div className="bg-popover border border-border rounded-lg p-3 text-sm whitespace-nowrap shadow-xl">
                                    <p className="text-foreground font-semibold mb-2">{formatDateLabel(point.date)}</p>
                                    <div className="space-y-1.5">
                                        <p className="text-sky-500 dark:text-sky-400">Sent: {point.sent}</p>
                                        <p className="text-emerald-500 dark:text-emerald-400">Delivered: {point.delivered}</p>
                                        <p className="text-violet-500 dark:text-violet-400">Opened: {point.opened}</p>
                                        {point.bounced > 0 && <p className="text-red-500 dark:text-red-400">Bounced: {point.bounced}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Bars side by side */}
                            <div className="flex gap-0.5 items-end h-40">
                                <div
                                    className="w-3 bg-sky-500 dark:bg-sky-400 rounded-t transition-all hover:opacity-80"
                                    style={{ height: `${sentHeight}%` }}
                                />
                                <div
                                    className="w-3 bg-emerald-500 dark:bg-emerald-400 rounded-t transition-all hover:opacity-80"
                                    style={{ height: `${deliveredHeight}%` }}
                                />
                                <div
                                    className="w-3 bg-violet-500 dark:bg-violet-400 rounded-t transition-all hover:opacity-80"
                                    style={{ height: `${openedHeight}%` }}
                                />
                            </div>

                            {/* Date label */}
                            <span className="text-[11px] text-foreground/50 mt-2 whitespace-nowrap">
                                {formatDateShort(point.date)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function formatDateLabel(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatDateShort(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}
