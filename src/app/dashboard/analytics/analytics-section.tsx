'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EmailAreaChart } from './analytics-chart';
import { DonutChart } from './analytics-donut';
import {
  RateCard,
  SkeletonCard,
  SkeletonChart,
} from './analytics-cards';
import type {
  AnalyticsData,
  TimelineData,
} from './analytics-types';

const RANGES = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
];

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
      <div className="space-y-6">
        <div className="inline-flex bg-muted/50 rounded-lg p-1 gap-0.5">
          {RANGES.map((r) => (
            <div
              key={r.value}
              className="px-4 py-2 text-sm rounded-md bg-muted/30 text-muted-foreground"
            >
              {r.label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard
            title="Delivery Rate"
            color="green"
          />
          <SkeletonCard title="Open Rate" color="blue" />
          <SkeletonCard
            title="Click Rate"
            color="orange"
          />
          <SkeletonCard title="Bounce Rate" color="red" />
        </div>
        <SkeletonChart />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Range Selector */}
      <div className="flex items-center gap-4">
        <div className="inline-flex bg-muted/50 rounded-lg p-1 gap-0.5">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              disabled={loading}
              className={`relative px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                loading
                  ? 'opacity-60 cursor-not-allowed'
                  : 'cursor-pointer'
              }`}
            >
              {range === r.value && (
                <motion.div
                  layoutId="activeRange"
                  className="absolute inset-0 bg-background rounded-md shadow-sm border border-border"
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}
              <span
                className={`relative z-10 ${
                  range === r.value
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r.label}
              </span>
            </button>
          ))}
        </div>
        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">
              Updating...
            </span>
          </div>
        )}
      </div>

      {/* Rate Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={loading ? 'loading' : `cards-${range}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {loading ? (
            <>
              <SkeletonCard
                title="Delivery Rate"
                color="green"
              />
              <SkeletonCard
                title="Open Rate"
                color="blue"
              />
              <SkeletonCard
                title="Click Rate"
                color="orange"
              />
              <SkeletonCard
                title="Bounce Rate"
                color="red"
              />
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
                title="Click Rate"
                value={overview.clickRate || 0}
                subtitle={`${overview.clicked || 0} of ${overview.opened} clicked`}
                color="orange"
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
        </motion.div>
      </AnimatePresence>

      {/* Area Chart */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="chart-skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <SkeletonChart />
          </motion.div>
        ) : timeline && timeline.data.length > 0 ? (
          <motion.div
            key={`chart-${range}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-card rounded-xl p-6 border border-border shadow-sm"
          >
            <h3 className="text-sm font-semibold text-foreground mb-5">
              Email Volume Over Time
            </h3>
            <EmailAreaChart data={timeline.data} />
          </motion.div>
        ) : timeline && timeline.data.length === 0 ? (
          <motion.div
            key="chart-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-muted/20 rounded-xl p-12 text-center border border-border"
          >
            <p className="text-muted-foreground">
              No email data for this period
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Donut Chart - Email Distribution */}
      <AnimatePresence>
        {!loading && overview && overview.total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-card rounded-xl p-6 border border-border shadow-sm"
          >
            <h3 className="text-sm font-semibold text-foreground mb-5">
              Email Status Distribution
            </h3>
            <DonutChart data={overview} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
