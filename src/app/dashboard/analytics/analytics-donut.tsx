'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import type { DonutChartProps } from './analytics-types';

const STATUS_COLORS: Record<string, string> = {
  Opened: '#8b5cf6',
  Unopened: '#10b981',
  Bounced: '#ef4444',
  Complained: '#ec4899',
  Failed: '#f97316',
  Pending: '#6b7280',
};

interface DonutTooltipPayload {
  name: string;
  value: number;
  payload: { color: string };
}

interface DonutTooltipProps {
  active?: boolean;
  payload?: DonutTooltipPayload[];
}

function CustomDonutTooltip({
  active,
  payload,
}: DonutTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];

  return (
    <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-xl">
      <div className="flex items-center gap-2 text-sm">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: item.payload.color }}
        />
        <span className="text-muted-foreground">
          {item.name}
        </span>
        <span className="font-semibold text-foreground ml-1 tabular-nums">
          {item.value.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export function DonutChart({ data }: DonutChartProps) {
  const segments = [
    {
      name: 'Opened',
      value: data.opened,
      color: STATUS_COLORS.Opened,
    },
    {
      name: 'Unopened',
      value: Math.max(0, data.delivered - data.opened),
      color: STATUS_COLORS.Unopened,
    },
    {
      name: 'Bounced',
      value: data.bounced,
      color: STATUS_COLORS.Bounced,
    },
    {
      name: 'Complained',
      value: data.complained,
      color: STATUS_COLORS.Complained,
    },
    {
      name: 'Failed',
      value: data.failed,
      color: STATUS_COLORS.Failed,
    },
    {
      name: 'Pending',
      value: data.pending,
      color: STATUS_COLORS.Pending,
    },
  ].filter((s) => s.value > 0);

  if (segments.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No email data for this period
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative shrink-0">
        <PieChart width={220} height={220}>
            <Pie
              data={segments}
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {segments.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomDonutTooltip />} />
          </PieChart>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {data.total.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              Total
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full space-y-2.5">
        {segments.map((segment) => {
          const pct =
            data.total > 0
              ? ((segment.value / data.total) * 100).toFixed(
                  1,
                )
              : '0';
          return (
            <div
              key={segment.name}
              className="flex items-center gap-3"
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: segment.color }}
              />
              <span className="text-sm text-muted-foreground flex-1">
                {segment.name}
              </span>
              <span className="text-sm font-medium text-foreground tabular-nums">
                {segment.value.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
