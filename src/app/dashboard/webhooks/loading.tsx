import { CardListSkeleton } from '@/components/skeletons';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="w-36 h-10 bg-secondary/50 rounded-lg animate-pulse" />
      </div>
      <CardListSkeleton count={3} />
    </div>
  );
}
