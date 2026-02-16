'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Eye,
  MousePointerClick,
  AlertTriangle,
} from 'lucide-react';
import type {
  CardColor,
  RateCardProps,
  SkeletonCardProps,
} from './analytics-types';

function useAnimatedValue(
  target: number,
  duration: number = 800,
): number {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setCurrent(0);
      return;
    }

    const startTime = performance.now();
    let rafId: number;

    function animate() {
      const now = performance.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setCurrent(target * eased);

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    }

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return current;
}

function RingProgress({
  value,
  color,
  size = 56,
  strokeWidth = 4,
}: {
  value: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(
      () => setAnimatedValue(value),
      50,
    );
    return () => clearTimeout(timer);
  }, [value]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference -
    (Math.min(animatedValue, 100) / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      className="-rotate-90 shrink-0"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        className="stroke-muted/20"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          transition: 'stroke-dashoffset 1s ease-out',
        }}
      />
    </svg>
  );
}

const cardStyles: Record<
  CardColor,
  {
    bg: string;
    text: string;
    ring: string;
    border: string;
    icon: React.ReactNode;
  }
> = {
  green: {
    bg: 'from-green-500/10 to-green-600/5',
    text: 'text-green-500',
    ring: '#22c55e',
    border: 'border-green-500/20',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  blue: {
    bg: 'from-blue-500/10 to-blue-600/5',
    text: 'text-blue-500',
    ring: '#3b82f6',
    border: 'border-blue-500/20',
    icon: <Eye className="w-4 h-4" />,
  },
  orange: {
    bg: 'from-orange-500/10 to-orange-600/5',
    text: 'text-orange-500',
    ring: '#f97316',
    border: 'border-orange-500/20',
    icon: <MousePointerClick className="w-4 h-4" />,
  },
  red: {
    bg: 'from-red-500/10 to-red-600/5',
    text: 'text-red-500',
    ring: '#ef4444',
    border: 'border-red-500/20',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
};

export function RateCard({
  title,
  value,
  subtitle,
  color,
  inverted = false,
}: RateCardProps) {
  const style = cardStyles[color];
  const displayValue = inverted
    ? Math.max(0, 100 - value)
    : value;
  const animatedNum = useAnimatedValue(value);

  return (
    <div
      className={`bg-gradient-to-br ${style.bg} border ${style.border} rounded-xl p-5 transition-shadow hover:shadow-md`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`${style.text} opacity-70`}>
            {style.icon}
          </span>
          <p className="text-muted-foreground text-sm font-medium">
            {title}
          </p>
        </div>
        <RingProgress
          value={displayValue}
          color={style.ring}
        />
      </div>
      <p
        className={`text-3xl font-bold ${style.text} tabular-nums`}
      >
        {animatedNum.toFixed(1)}%
      </p>
      <p className="text-muted-foreground/70 text-xs mt-1.5">
        {subtitle}
      </p>
    </div>
  );
}

export function SkeletonCard({
  title,
  color,
}: SkeletonCardProps) {
  const style = cardStyles[color];

  return (
    <div
      className={`bg-gradient-to-br ${style.bg} border ${style.border} rounded-xl p-5`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-muted-foreground text-sm font-medium">
          {title}
        </p>
        <div className="w-14 h-14 rounded-full bg-muted/20 animate-pulse" />
      </div>
      <div className="h-9 bg-muted/50 rounded w-24 mb-2 animate-pulse" />
      <div className="h-3 bg-muted/30 rounded w-36 animate-pulse" />
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="h-5 bg-muted/50 rounded w-44 animate-pulse" />
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-sky-500/30 rounded-full" />
            <div className="h-3 bg-muted/30 rounded w-8" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500/30 rounded-full" />
            <div className="h-3 bg-muted/30 rounded w-14" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-violet-500/30 rounded-full" />
            <div className="h-3 bg-muted/30 rounded w-12" />
          </div>
        </div>
      </div>
      <div className="flex items-end gap-1 h-[350px] animate-pulse">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-muted/20 rounded-t"
            style={{
              height: `${Math.round(20 + Math.sin(i * 0.5) * 30 + 30)}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
