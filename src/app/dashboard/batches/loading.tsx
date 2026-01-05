import { TableSkeleton } from '@/components/skeletons';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="w-36 h-10 bg-primary/50 rounded-lg animate-pulse" />
        <div className="w-10 h-10 bg-secondary/50 rounded-lg animate-pulse" />
      </div>
      <TableSkeleton
        rows={5}
        columns={[
          'Template',
          'Emails',
          'Status',
          'Success',
          'Clicked',
          'Created',
        ]}
      />
    </div>
  );
}
