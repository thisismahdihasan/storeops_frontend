import { cn } from "@/lib/utils";

export function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <div className="h-5 w-36 rounded-md bg-muted animate-pulse" />
        <div className="h-3 w-64 rounded-md bg-muted/60 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 11 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-xs",
              i === 0 && "sm:col-span-2 md:col-span-3 lg:col-span-1",
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-muted animate-pulse" />
                <div className="h-4 w-20 rounded-md bg-muted/70 animate-pulse" />
              </div>
              <div className="size-3.5 rounded-sm bg-muted/40 animate-pulse" />
            </div>

            <div className="mt-6 flex items-baseline justify-between">
              <div className="h-7 w-12 rounded-md bg-muted animate-pulse" />
              <div className="h-3 w-28 rounded-md bg-muted/50 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardTeamSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="h-5 w-36 rounded-md bg-muted animate-pulse" />
          <div className="h-3 w-64 rounded-md bg-muted/60 animate-pulse" />
        </div>
        <div className="h-8 w-60 rounded-lg bg-muted animate-pulse" />
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
        <div className="h-6 w-full rounded-md bg-muted/60 animate-pulse" />
        <div className="h-8 w-full rounded-md bg-muted/40 animate-pulse" />
        <div className="h-8 w-full rounded-md bg-muted/40 animate-pulse" />
        <div className="h-8 w-full rounded-md bg-muted/40 animate-pulse" />
      </div>
    </div>
  );
}
