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
                const overviewData = await overviewRes.json();
                console.log('Overview data:', overviewData);
                setOverview(overviewData);
            } else {
                console.error('Overview API error:', overviewRes.status);
            }
            if (timelineRes.ok) {
                const timelineData = await timelineRes.json();
                console.log('Timeline data:', timelineData);
                setTimeline(timelineData);
            } else {
                console.error('Timeline API error:', timelineRes.status);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        }
        setLoading(false);
    }

    if (loading && !overview) {
        return (
            <div className="animate-pulse">
                <div className="h-8 bg-gray-700 rounded w-48 mb-4"></div>
                <div className="h-64 bg-gray-700 rounded"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Range Selector */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">Analytics</h2>
                    <p className="text-gray-400 text-sm">Email performance overview</p>
                </div>
                <div className="flex gap-2">
                    {['7d', '30d', '90d'].map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                range === r
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Rate Cards */}
            {overview && (
                <div className="grid grid-cols-3 gap-4">
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
                        color="cyan"
                    />
                    <RateCard
                        title="Bounce Rate"
                        value={overview.bounceRate}
                        subtitle={`${overview.bounced} bounced`}
                        color="red"
                        inverted
                    />
                </div>
            )}

            {/* Timeline Chart */}
            {timeline && timeline.data.length > 0 && (
                <div className="bg-gray-800/50 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-gray-400 mb-4">Email Volume</h3>
                    <BarChart data={timeline.data} />
                </div>
            )}

            {timeline && timeline.data.length === 0 && (
                <div className="bg-gray-800/50 rounded-xl p-8 text-center">
                    <p className="text-gray-400">No email data for this period</p>
                </div>
            )}
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
    color: 'green' | 'cyan' | 'red';
    inverted?: boolean;
}) {
    const colors = {
        green: { bg: 'from-green-500/20 to-green-600/10', text: 'text-green-400', bar: 'bg-green-500' },
        cyan: { bg: 'from-cyan-500/20 to-cyan-600/10', text: 'text-cyan-400', bar: 'bg-cyan-500' },
        red: { bg: 'from-red-500/20 to-red-600/10', text: 'text-red-400', bar: 'bg-red-500' },
    };
    const style = colors[color];

    // For inverted (like bounce rate), lower is better
    const displayValue = inverted ? Math.max(0, 100 - value) : value;

    return (
        <div className={`bg-gradient-to-br ${style.bg} border border-gray-700/50 rounded-xl p-4`}>
            <p className="text-gray-400 text-sm mb-1">{title}</p>
            <p className={`text-3xl font-bold ${style.text}`}>{value}%</p>
            <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
            <div className="mt-3 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={`h-full ${style.bar} transition-all duration-500`}
                    style={{ width: `${Math.min(displayValue, 100)}%` }}
                />
            </div>
        </div>
    );
}

function BarChart({ data }: { data: TimelineDataPoint[] }) {
    const maxValue = Math.max(...data.map(d => d.sent), 1);
    
    // For small datasets, use a minimum width per bar
    const barMinWidth = data.length < 10 ? '40px' : undefined;

    return (
        <div className="space-y-2">
            {/* Legend */}
            <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-gray-400">Sent</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-gray-400">Delivered</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-cyan-500 rounded"></div>
                    <span className="text-gray-400">Opened</span>
                </div>
            </div>
            
            {/* Chart */}
            <div className="flex items-end gap-2 h-40 overflow-x-auto pb-2">
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
                                <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs whitespace-nowrap shadow-xl">
                                    <p className="text-white font-medium mb-1">{formatDateLabel(point.date)}</p>
                                    <p className="text-blue-400">Sent: {point.sent}</p>
                                    <p className="text-green-400">Delivered: {point.delivered}</p>
                                    <p className="text-cyan-400">Opened: {point.opened}</p>
                                    {point.bounced > 0 && <p className="text-red-400">Bounced: {point.bounced}</p>}
                                </div>
                            </div>
                            
                            {/* Bars side by side */}
                            <div className="flex gap-0.5 items-end h-32">
                                <div
                                    className="w-3 bg-blue-500 rounded-t transition-all hover:bg-blue-400"
                                    style={{ height: `${sentHeight}%` }}
                                    title={`Sent: ${point.sent}`}
                                />
                                <div
                                    className="w-3 bg-green-500 rounded-t transition-all hover:bg-green-400"
                                    style={{ height: `${deliveredHeight}%` }}
                                    title={`Delivered: ${point.delivered}`}
                                />
                                <div
                                    className="w-3 bg-cyan-500 rounded-t transition-all hover:bg-cyan-400"
                                    style={{ height: `${openedHeight}%` }}
                                    title={`Opened: ${point.opened}`}
                                />
                            </div>
                            
                            {/* Date label */}
                            <span className="text-[10px] text-gray-500 mt-1 whitespace-nowrap">
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
