export function ResearchSkeleton() {
  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="h-6 w-52 rounded-md bg-muted animate-pulse" />
          <div className="h-4 w-80 rounded-md bg-muted/60 animate-pulse" />
        </div>
        <div className="h-9 w-32 rounded-md bg-muted animate-pulse" />
      </div>

      <div className="h-14 w-full rounded-xl border border-border bg-card p-3 shadow-xs">
        <div className="h-8 w-full rounded-md bg-muted/50 animate-pulse" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="p-4 space-y-3">
          <div className="flex gap-4 border-b border-border/60 pb-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-4 rounded-sm bg-muted animate-pulse flex-1"
              />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, r) => (
            <div key={r} className="flex gap-4 py-2">
              {Array.from({ length: 7 }).map((_, c) => (
                <div
                  key={c}
                  className="h-6 rounded-sm bg-muted/60 animate-pulse flex-1"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
