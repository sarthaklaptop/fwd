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
      <StatCardsSkeleton count={4} />
      <ChartSkeleton />
    </div>
  );
}
