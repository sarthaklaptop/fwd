import { TableSkeleton } from '@/components/skeletons';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          API Keys
        </h1>
        <p className="text-muted-foreground">
          Manage your API keys for authentication
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-sm h-11 bg-muted/50 rounded-lg animate-pulse" />
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
