export default function EmployeeLoading() {
  return (
    <div className="animate-pulse space-y-sp-6">
      {/* Header skeleton */}
      <div className="space-y-sp-2">
        <div className="h-7 w-48 rounded bg-surface-secondary" />
        <div className="h-4 w-72 rounded bg-surface-secondary" />
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

      {/* Content skeleton */}
      <div className="rounded-lg border border-border bg-surface-primary p-sp-6">
        <div className="space-y-sp-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-sp-4">
              <div className="h-10 w-10 rounded-full bg-surface-secondary" />
              <div className="flex-1 space-y-sp-2">
                <div className="h-4 w-3/4 rounded bg-surface-secondary" />
                <div className="h-3 w-1/2 rounded bg-surface-secondary" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
