import { TableSkeleton } from '@/components/skeletons';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-sm h-11 bg-secondary/50 rounded-lg animate-pulse" />
        <div className="w-32 h-11 bg-primary/50 rounded-lg animate-pulse" />
      </div>
      <TableSkeleton
        rows={3}
        columns={[
          'Name',
          'Key',
          'Last Used',
          'Status',
          'Actions',
        ]}
      />
    </div>
  );
}
