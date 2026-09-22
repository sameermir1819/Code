export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-28 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between p-6">
        <div className="space-y-2.5">
          <div className="h-4 w-28 bg-muted rounded-full"></div>
          <div className="h-7 w-64 bg-muted rounded-lg"></div>
          <div className="h-3 w-48 bg-muted rounded-full"></div>
        </div>
        <div className="hidden sm:flex gap-3">
          <div className="h-9 w-32 bg-muted rounded-xl"></div>
          <div className="h-9 w-32 bg-muted rounded-xl"></div>
        </div>
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl bg-card border border-border/60 p-4 flex items-center gap-3.5"
          >
            <div className="h-11 w-11 rounded-lg bg-muted shrink-0"></div>
            <div className="space-y-2 flex-1">
              <div className="h-3 w-20 bg-muted rounded"></div>
              <div className="h-6 w-16 bg-muted rounded"></div>
              <div className="h-2.5 w-24 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table / Content Skeleton */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="p-4 border-b border-border/60 flex items-center justify-between">
          <div className="h-5 w-40 bg-muted rounded"></div>
          <div className="h-8 w-48 bg-muted rounded-lg"></div>
        </div>
        <div className="divide-y divide-border/40">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-muted shrink-0"></div>
                <div className="space-y-1.5">
                  <div className="h-4 w-36 bg-muted rounded"></div>
                  <div className="h-3 w-24 bg-muted rounded"></div>
                </div>
              </div>
              <div className="h-4 w-20 bg-muted rounded"></div>
              <div className="h-4 w-28 bg-muted rounded hidden sm:block"></div>
              <div className="h-6 w-16 bg-muted rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

