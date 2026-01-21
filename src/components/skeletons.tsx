interface TableSkeletonProps {
  rows?: number;
  columns: string[];
}

interface CardGridSkeletonProps {
  count?: number;
  cols?: string;
}

interface CardListSkeletonProps {
  count?: number;
}

export function TableSkeleton({
  rows = 5,
  columns,
}: TableSkeletonProps) {
  return (
    <div className="overflow-x-auto border border-border rounded-xl">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/20">
            {columns.map((col) => (
              <th key={col} className="px-4 py-3">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="animate-pulse">
              {columns.map((col, j) => (
                <td key={j} className="px-4 py-3">
                  <div
                    className="h-4 bg-muted/50 rounded"
                    style={{
                      width: `${60 + (j % 3) * 20}%`,
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardGridSkeleton({
  count = 6,
  cols = 'md:grid-cols-2 lg:grid-cols-3',
}: CardGridSkeletonProps) {
  return (
    <div className={`grid gap-4 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-xl p-4 animate-pulse"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="h-5 bg-muted/50 rounded w-32" />
            <div className="flex gap-2">
              <div className="w-6 h-6 bg-muted/50 rounded" />
              <div className="w-6 h-6 bg-muted/50 rounded" />
            </div>
          </div>
          <div className="h-4 bg-muted/30 rounded w-48 mb-2" />
          <div className="flex gap-1">
            <div className="h-5 bg-primary/10 rounded-full w-16" />
            <div className="h-5 bg-primary/10 rounded-full w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardListSkeleton({
  count = 3,
}: CardListSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-xl p-4 animate-pulse"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 mr-4">
              <div className="h-4 bg-muted/50 rounded w-64 mb-2" />
              <div className="flex gap-2">
                <div className="h-5 bg-primary/10 rounded-full w-20" />
                <div className="h-5 bg-primary/10 rounded-full w-24" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-16 h-8 bg-muted/50 rounded" />
              <div className="w-14 h-8 bg-muted/50 rounded" />
            </div>
          </div>
          <div className="h-10 bg-muted/20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function StatCardsSkeleton({
  count = 4,
}: {
  count?: number;
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-xl p-4 animate-pulse"
        >
          <div className="h-10 bg-muted/50 rounded w-24 mb-2" />
          <div className="h-3 bg-muted/30 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-6 animate-pulse">
      <div className="h-5 bg-muted/50 rounded w-32 mb-4" />
      <div className="flex items-end gap-2 h-48">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-muted/30 rounded-t"
            style={{
              height: `${30 + Math.random() * 70}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function PageHeaderSkeleton({
  hasButton = true,
}: {
  hasButton?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      {hasButton && (
        <div className="w-36 h-10 bg-primary/30 rounded-lg animate-pulse" />
      )}
      <div className="w-10 h-10 bg-muted/30 rounded-lg animate-pulse" />
    </div>
  );
}
