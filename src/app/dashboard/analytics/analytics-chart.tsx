'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { AreaChartProps } from './analytics-types';

const COLORS = {
  sent: '#0ea5e9',
  delivered: '#10b981',
  opened: '#8b5cf6',
};

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-2xl">
      <p className="text-sm font-semibold text-foreground mb-2.5">
        {formatDateLabel(label || '')}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div
            key={entry.dataKey}
            className="flex items-center gap-2.5 text-sm"
          >
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: entry.color }}
            />
            <span className="text-muted-foreground">
              {entry.name}
            </span>
            <span className="font-semibold text-foreground ml-auto tabular-nums">
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmailAreaChart({ data }: AreaChartProps) {
  const tickInterval =
    data.length <= 7
      ? 0
      : Math.max(0, Math.floor(data.length / 7) - 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-5 text-sm">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: COLORS.sent }}
          />
          <span className="text-muted-foreground">Sent</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: COLORS.delivered }}
          />
          <span className="text-muted-foreground">
            Delivered
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: COLORS.opened }}
          />
          <span className="text-muted-foreground">
            Opened
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
        >
          <defs>
            <linearGradient
              id="gradientSent"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={COLORS.sent}
                stopOpacity={0.25}
              />
              <stop
                offset="100%"
                stopColor={COLORS.sent}
                stopOpacity={0}
              />
            </linearGradient>
            <linearGradient
              id="gradientDelivered"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={COLORS.delivered}
                stopOpacity={0.25}
              />
              <stop
                offset="100%"
                stopColor={COLORS.delivered}
                stopOpacity={0}
              />
            </linearGradient>
            <linearGradient
              id="gradientOpened"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={COLORS.opened}
                stopOpacity={0.25}
              />
              <stop
                offset="100%"
                stopColor={COLORS.opened}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="currentColor"
            strokeOpacity={0.08}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateShort}
            interval={tickInterval}
            tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            width={48}
            allowDecimals={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: 'var(--color-muted-foreground)',
              strokeWidth: 1,
              strokeDasharray: '4 4',
              strokeOpacity: 0.4,
            }}
          />
          <Area
            type="monotone"
            dataKey="sent"
            name="Sent"
            stroke={COLORS.sent}
            fill="url(#gradientSent)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{
              r: 5,
              stroke: COLORS.sent,
              strokeWidth: 2,
              fill: 'var(--color-background)',
            }}
            animationDuration={1000}
            animationEasing="ease-out"
          />
          <Area
            type="monotone"
            dataKey="delivered"
            name="Delivered"
            stroke={COLORS.delivered}
            fill="url(#gradientDelivered)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{
              r: 5,
              stroke: COLORS.delivered,
              strokeWidth: 2,
              fill: 'var(--color-background)',
            }}
            animationDuration={1000}
            animationEasing="ease-out"
          />
          <Area
            type="monotone"
            dataKey="opened"
            name="Opened"
            stroke={COLORS.opened}
            fill="url(#gradientOpened)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{
              r: 5,
              stroke: COLORS.opened,
              strokeWidth: 2,
              fill: 'var(--color-background)',
            }}
            animationDuration={1000}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatDateLabel(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateShort(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
