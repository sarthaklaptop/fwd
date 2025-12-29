'use client';

import { useState, useEffect } from 'react';
import { BarChart } from './analytics-chart';
import {
  RateCard,
  SkeletonCard,
  SkeletonChart,
} from './analytics-cards';
import type {
  AnalyticsData,
  TimelineData,
} from './analytics-types';

export default function AnalyticsSection() {
  const [range, setRange] = useState('30d');
  const [overview, setOverview] =
    useState<AnalyticsData | null>(null);
  const [timeline, setTimeline] =
    useState<TimelineData | null>(null);
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

      const overviewResponse = await overviewRes.json();
      const timelineResponse = await timelineRes.json();

      if (overviewResponse.success) {
        setOverview(overviewResponse.data);
      }
      if (timelineResponse.success) {
        setTimeline(timelineResponse.data);
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
      <div className="flex flex-wrap gap-2">
        {['7d', '30d', '90d'].map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all border ${
              range === r
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-transparent text-foreground/70 border-border hover:bg-primary/10 hover:border-primary/30 hover:text-foreground'
            } ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {r === '7d'
              ? '7 Days'
              : r === '30d'
              ? '30 Days'
              : '90 Days'}
          </button>
        ))}
        {loading && (
          <div className="flex items-center gap-2 ml-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-muted-foreground">
              Loading...
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          <>
            <SkeletonCard
              title="Delivery Rate"
              color="green"
            />
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

      {loading ? (
        <SkeletonChart />
      ) : timeline && timeline.data.length > 0 ? (
        <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Email Volume Over Time
          </h3>
          <BarChart data={timeline.data} />
        </div>
      ) : timeline && timeline.data.length === 0 ? (
        <div className="bg-secondary/50 rounded-xl p-8 text-center border border-border">
          <p className="text-muted-foreground">
            No email data for this period
          </p>
        </div>
      ) : null}
    </div>
  );
}
