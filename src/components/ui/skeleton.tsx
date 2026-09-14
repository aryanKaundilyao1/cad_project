import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton-shimmer", className)} {...props} />;
}

/** Table skeleton with multiple rows */
function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="lead-table-container">
      <div className="table-scroll-wrapper">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <Skeleton className="h-3 w-20 rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, row) => (
              <tr key={row} className="border-t border-border/50">
                {Array.from({ length: cols }).map((_, col) => (
                  <td key={col} className="px-4 py-3.5">
                    <Skeleton
                      className={cn(
                        "h-4 rounded",
                        col === 0 ? "w-36" : col === cols - 1 ? "w-16" : "w-24"
                      )}
                      style={{ animationDelay: `${row * 0.05}s` }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Card skeleton for project/bid listings */
function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-5 w-64 rounded" />
          <Skeleton className="h-4 w-48 rounded" />
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-6 w-28 rounded ml-auto" />
          <Skeleton className="h-3 w-20 rounded ml-auto" />
        </div>
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-4 w-20 rounded" />
        <Skeleton className="h-4 w-28 rounded" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-28 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
    </div>
  );
}

/** Stat card skeleton */
function StatSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3" style={{ boxShadow: "var(--shadow-card)" }}>
      <Skeleton className="h-8 w-8 rounded-lg mx-auto" />
      <Skeleton className="h-8 w-16 rounded mx-auto" />
      <Skeleton className="h-3 w-24 rounded mx-auto" />
    </div>
  );
}

/** Profile info skeleton */
function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
      </div>
    </div>
  );
}

/** Hero section skeleton */
function HeroStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="text-center space-y-2">
          <Skeleton className="h-10 w-20 rounded mx-auto" />
          <Skeleton className="h-3 w-28 rounded mx-auto" />
        </div>
      ))}
    </div>
  );
}

export { Skeleton, TableSkeleton, CardSkeleton, StatSkeleton, ProfileSkeleton, HeroStatsSkeleton };
