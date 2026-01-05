import { TableSkeleton } from '@/components/skeletons';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Batches
        </h1>
        <p className="text-muted-foreground">
          Send and track bulk email campaigns
        </p>
      </div>
      <div className="flex justify-between items-center">
        <div className="w-36 h-10 bg-primary/50 rounded-lg animate-pulse" />
        <div className="w-10 h-10 bg-muted/50 rounded-lg animate-pulse" />
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
