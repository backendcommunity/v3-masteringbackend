// Dashboard homepage skeleton — mirrors DashboardContent layout exactly so
// the page feels instant on first load instead of flashing a spinner.
export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      {/* "Welcome back, ___" heading */}
      <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />

      {/* HabitStrip — 3 col grid matching the real strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] gap-3 sm:gap-4">
        {/* Streak tile — spans 2 cols on sm */}
        <div className="sm:col-span-2 lg:col-span-1 rounded-xl border border-border bg-muted animate-pulse h-[88px]" />
        {/* Daily goal tile */}
        <div className="rounded-xl border border-border bg-muted animate-pulse h-[88px]" />
        {/* Level / XP tile */}
        <div className="rounded-xl border border-border bg-muted animate-pulse h-[88px]" />
      </div>

      {/* ResumeHero */}
      <div className="overflow-hidden rounded-2xl border border-border bg-muted animate-pulse">
        {/* main body */}
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          {/* cover thumbnail */}
          <div className="h-32 w-full flex-shrink-0 rounded-xl bg-muted-foreground/10 sm:h-24 sm:w-36" />
          {/* text block */}
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-3 w-32 rounded bg-muted-foreground/20" />
            <div className="h-6 w-3/4 rounded bg-muted-foreground/20" />
            <div className="h-2 max-w-md rounded-full bg-muted-foreground/20" />
            <div className="h-3 w-20 rounded bg-muted-foreground/20" />
          </div>
          {/* CTA buttons */}
          <div className="flex flex-shrink-0 gap-2 sm:flex-col">
            <div className="h-9 w-24 rounded-md bg-muted-foreground/20" />
            <div className="h-9 w-24 rounded-md bg-muted-foreground/10" />
          </div>
        </div>
        {/* gate footer bar */}
        <div className="h-11 w-full border-t border-border bg-muted-foreground/5" />
      </div>

      {/* UpNextPanel + LeaguePanel — 2-col grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* UpNextPanel */}
        <div className="rounded-2xl border border-border bg-muted animate-pulse p-5 space-y-3">
          <div className="flex items-baseline justify-between">
            <div className="h-4 w-40 rounded bg-muted-foreground/20" />
            <div className="h-3 w-12 rounded bg-muted-foreground/10" />
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 flex-shrink-0 rounded-lg bg-muted-foreground/20" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 rounded bg-muted-foreground/20" />
                <div className="h-2 w-1/3 rounded bg-muted-foreground/10" />
              </div>
            </div>
          ))}
        </div>

        {/* LeaguePanel */}
        <div className="rounded-2xl border border-border bg-muted animate-pulse p-5 space-y-3">
          <div className="flex items-baseline justify-between">
            <div className="h-4 w-28 rounded bg-muted-foreground/20" />
            <div className="h-3 w-12 rounded bg-muted-foreground/10" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-5 w-5 flex-shrink-0 rounded bg-muted-foreground/10" />
              <div className="h-7 w-7 flex-shrink-0 rounded-full bg-muted-foreground/20" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-2/3 rounded bg-muted-foreground/20" />
              </div>
              <div className="h-3 w-10 rounded bg-muted-foreground/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
