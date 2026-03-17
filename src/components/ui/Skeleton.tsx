export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-surface-secondary rounded-sm ${className ?? "h-4 w-full"}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border p-sp-6 space-y-sp-3">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-sp-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
