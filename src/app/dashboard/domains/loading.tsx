import { CardListSkeleton } from '@/components/skeletons';

export default function DomainsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Custom Domains
        </h1>
        <p className="text-muted-foreground">
          Send emails from your own domain for better
          deliverability
        </p>
      </div>

      <div className="flex justify-between items-center">
        <div className="h-4 w-24 bg-secondary rounded animate-pulse" />
        <div className="h-9 w-32 bg-primary/30 rounded-lg animate-pulse" />
      </div>

      <CardListSkeleton count={2} />
    </div>
  );
}
