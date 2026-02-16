import {
  StatCardsSkeleton,
  ChartSkeleton,
} from '@/components/skeletons';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Analytics
        </h1>
        <p className="text-muted-foreground">
          Track your email delivery performance
        </p>
      </div>

      <div className="inline-flex bg-muted/50 rounded-lg p-1 gap-0.5">
        {['7 Days', '30 Days', '90 Days'].map((label) => (
          <div
            key={label}
            className="px-4 py-2 text-sm rounded-md text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>

      <StatCardsSkeleton count={4} />
      <ChartSkeleton />
    </div>
  );
}
