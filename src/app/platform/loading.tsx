export default function PlatformLoading() {
  return (
    <div className="animate-pulse space-y-sp-6">
      {/* Header skeleton */}
      <div className="space-y-sp-2">
        <div className="h-7 w-56 rounded bg-surface-secondary" />
        <div className="h-4 w-80 rounded bg-surface-secondary" />
      </div>

      {/* KPI row skeleton */}
      <div className="grid grid-cols-1 gap-sp-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-lg border border-border bg-surface-primary p-sp-4"
          >
            <div className="h-3 w-20 rounded bg-surface-secondary" />
            <div className="mt-sp-3 h-6 w-16 rounded bg-surface-secondary" />
            <div className="mt-sp-2 h-3 w-24 rounded bg-surface-secondary" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border border-border bg-surface-primary">
        {/* Table header */}
        <div className="flex gap-sp-4 border-b border-border px-sp-6 py-sp-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-4 flex-1 rounded bg-surface-secondary"
            />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-sp-4 border-b border-border px-sp-6 py-sp-4 last:border-b-0"
          >
            {Array.from({ length: 5 }).map((_, j) => (
              <div
                key={j}
                className="h-4 flex-1 rounded bg-surface-secondary"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
