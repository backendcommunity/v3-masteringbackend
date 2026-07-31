"use client";

import { useUser } from "@/hooks/use-user";
import { useDashboardData } from "@/components/dashboard/use-dashboard-data";
import { HabitStrip } from "@/components/dashboard/habit-strip";
import { ResumeHero } from "@/components/dashboard/resume-hero";
import { UpNextPanel } from "@/components/dashboard/up-next-panel";
import { LeaguePanel } from "@/components/dashboard/league-panel";
import { AnnouncementBanner } from "@/components/dashboard/announcement-banner";
import { Skeleton } from "@/components/ui/skeleton";

/** One skeleton shaped like the real ResumeHero + Up-next + League layout,
 *  shown until BOTH slices resolve so the section reveals as a single piece
 *  instead of settling in staggered chunks. */
function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Skeleton className="h-32 w-full flex-shrink-0 sm:h-24 sm:w-36" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-2 w-full max-w-md" />
          </div>
          <Skeleton className="h-9 w-full flex-shrink-0 sm:w-32" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <Skeleton className="h-4 w-24" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 flex-shrink-0 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-16 w-full" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 flex-shrink-0 rounded-full" />
              <Skeleton className="h-3 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardContent() {
  const user = useUser();
  const data = useDashboardData();

  // The welcome-back recap pop-out is disabled on the dashboard. The recap
  // modal/store/backend remain in place (dormant) — re-enable by triggering
  // triggerWelcomeBack() on mount again.

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-black tracking-tight">
        Welcome back, {firstName}
      </h1>

      <AnnouncementBanner />

      {/* HabitStrip paints immediately: streak/level/xp come from `user` (no
          API); week dots + today's MB fill in when activities resolve. */}
      <HabitStrip
        currentStreak={data.currentStreak}
        activeToday={data.activeToday}
        weekDots={data.weekDots}
        todayMB={data.todayMB}
        goalPct={data.goalPct}
        level={data.level}
        rankTitle={data.rankTitle}
        xpToNext={data.xpToNext}
        xpPct={data.xpPct}
      />

      {/* ResumeHero + Up-next + League each wait on their own data slice, but
          reveal together as one piece — a single skeleton avoids the jarring
          staggered pop-in of three panels settling at different times. */}
      {data.resumeLoading || data.leagueLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <ResumeHero
            item={data.continueLearning}
            pathSession={data.pathSession}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
            <UpNextPanel
              pathSession={data.pathSession}
              steps={data.upNextSteps}
            />
            <LeaguePanel league={data.league} />
          </div>
        </>
      )}
    </div>
  );
}
