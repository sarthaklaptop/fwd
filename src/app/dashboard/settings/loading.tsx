export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 bg-muted/50 rounded w-32 mb-2"></div>
        <div className="h-4 bg-muted/50 rounded w-64"></div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        <div className="h-10 bg-muted/50 rounded-lg w-24"></div>
        <div className="h-10 bg-muted/50 rounded-lg w-24"></div>
        <div className="h-10 bg-muted/50 rounded-lg w-28"></div>
      </div>

      {/* Content skeleton */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-muted/50 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted/50 rounded w-32"></div>
            <div className="h-3 bg-muted/50 rounded w-48"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-3 bg-muted/50 rounded w-16"></div>
            <div className="h-10 bg-muted/50 rounded-lg w-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-muted/50 rounded w-20"></div>
            <div className="h-10 bg-muted/50 rounded-lg w-full"></div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <div className="h-10 bg-muted/50 rounded-lg w-32"></div>
        </div>
      </div>
    </div>
  );
}
