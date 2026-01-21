export default function BillingLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-32 mb-2 rounded bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded bg-muted animate-pulse" />
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-24 rounded bg-muted animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="h-4 w-48 rounded bg-muted animate-pulse" />
        <div className="h-10 w-40 rounded bg-muted animate-pulse" />
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-6 w-32 mb-4 rounded bg-muted animate-pulse" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-4 w-full rounded bg-muted animate-pulse"
              />
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-4 w-full rounded bg-muted animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
