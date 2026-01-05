import { CardListSkeleton } from '@/components/skeletons';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Webhooks
        </h1>
        <p className="text-muted-foreground">
          Configure webhook endpoints for real-time
          notifications
        </p>
      </div>
      <div className="flex justify-end">
        <div className="w-36 h-10 bg-muted/50 rounded-lg animate-pulse" />
      </div>
      <CardListSkeleton count={3} />
    </div>
  );
}
