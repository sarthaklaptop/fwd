import { TableSkeleton } from '@/components/skeletons';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Emails
        </h1>
        <p className="text-muted-foreground">
          View and track all sent emails
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-3">
          <div className="w-64 h-10 bg-muted/50 rounded-lg animate-pulse" />
          <div className="w-32 h-10 bg-muted/50 rounded-lg animate-pulse" />
        </div>
        <div className="w-10 h-10 bg-muted/50 rounded-lg animate-pulse" />
      </div>
      <TableSkeleton
        rows={10}
        columns={[
          'Recipient',
          'Subject',
          'Status',
          'Sent',
          'Opened',
        ]}
      />
    </div>
  );
}
