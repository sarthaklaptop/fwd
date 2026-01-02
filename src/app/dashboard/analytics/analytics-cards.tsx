import type {
  CardColor,
  RateCardProps,
  SkeletonCardProps,
} from './analytics-types';

const cardStyles: Record<
  CardColor,
  { bg: string; text: string; bar: string; border: string }
> = {
  green: {
    bg: 'from-green-500/10 to-green-600/5',
    text: 'text-green-500',
    bar: 'bg-green-500',
    border: 'border-green-500/20',
  },
  blue: {
    bg: 'from-blue-500/10 to-blue-600/5',
    text: 'text-blue-500',
    bar: 'bg-blue-500',
    border: 'border-blue-500/20',
  },
  orange: {
    bg: 'from-orange-500/10 to-orange-600/5',
    text: 'text-orange-500',
    bar: 'bg-orange-500',
    border: 'border-orange-500/20',
  },
  red: {
    bg: 'from-red-500/10 to-red-600/5',
    text: 'text-red-500',
    bar: 'bg-red-500',
    border: 'border-red-500/20',
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

  return (
    <div
      className={`bg-gradient-to-br ${style.bg} border ${style.border} rounded-xl p-5`}
    >
      <p className="text-muted-foreground text-sm font-medium mb-2">
        {title}
      </p>
      <p className={`text-4xl font-bold ${style.text}`}>
        {value}%
      </p>
      <p className="text-muted-foreground/70 text-xs mt-2">
        {subtitle}
      </p>
      <div className="mt-4 h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${style.bar} transition-all duration-500 rounded-full`}
          style={{
            width: `${Math.min(displayValue, 100)}%`,
          }}
        />
      </div>
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
      <p className="text-muted-foreground text-sm font-medium mb-2">
        {title}
      </p>
      <div className="h-10 bg-secondary/70 rounded w-24 mb-2 animate-pulse"></div>
      <div className="h-3 bg-secondary/50 rounded w-36 mb-4 animate-pulse"></div>
      <div className="h-2 bg-secondary rounded-full w-full"></div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Email Volume Over Time
      </h3>
      <div className="flex flex-wrap gap-6 text-sm mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-sky-500 dark:bg-sky-400 rounded-sm"></div>
          <span className="text-foreground/70">Sent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500 dark:bg-emerald-400 rounded-sm"></div>
          <span className="text-foreground/70">
            Delivered
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-violet-500 dark:bg-violet-400 rounded-sm"></div>
          <span className="text-foreground/70">Opened</span>
        </div>
      </div>
      <div className="flex items-end gap-2 h-40 animate-pulse">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-0.5 items-end flex-1"
          >
            <div
              className="w-3 bg-secondary rounded-t"
              style={{ height: `${30 + ((i * 8) % 50)}%` }}
            ></div>
            <div
              className="w-3 bg-secondary rounded-t"
              style={{ height: `${20 + ((i * 5) % 40)}%` }}
            ></div>
            <div
              className="w-3 bg-secondary rounded-t"
              style={{ height: `${10 + ((i * 3) % 30)}%` }}
            ></div>
          </div>
        ))}
      </div>
    </div>
  );
}
