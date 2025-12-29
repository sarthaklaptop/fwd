import type {
  TimelineDataPoint,
  BarChartProps,
} from './analytics-types';

export function BarChart({ data }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.sent), 1);
  const barMinWidth = data.length < 10 ? '48px' : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-6 text-sm">
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

      <div className="flex items-end gap-2 h-48 overflow-x-auto pb-4">
        {data.map((point) => {
          const sentHeight = Math.max(
            (point.sent / maxValue) * 100,
            5
          );
          const deliveredHeight = Math.max(
            (point.delivered / maxValue) * 100,
            0
          );
          const openedHeight = Math.max(
            (point.opened / maxValue) * 100,
            0
          );

          return (
            <div
              key={point.date}
              className="flex flex-col items-center gap-1 group relative"
              style={{
                minWidth: barMinWidth,
                flex: data.length >= 10 ? 1 : undefined,
              }}
            >
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                <div className="bg-popover border border-border rounded-lg p-3 text-sm whitespace-nowrap shadow-xl">
                  <p className="text-foreground font-semibold mb-2">
                    {formatDateLabel(point.date)}
                  </p>
                  <div className="space-y-1.5">
                    <p className="text-sky-500 dark:text-sky-400">
                      Sent: {point.sent}
                    </p>
                    <p className="text-emerald-500 dark:text-emerald-400">
                      Delivered: {point.delivered}
                    </p>
                    <p className="text-violet-500 dark:text-violet-400">
                      Opened: {point.opened}
                    </p>
                    {point.bounced > 0 && (
                      <p className="text-red-500 dark:text-red-400">
                        Bounced: {point.bounced}
                      </p>
                    )}
                  </div>
                </div>
              </div>

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
    year: 'numeric',
  });
}

function formatDateShort(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
