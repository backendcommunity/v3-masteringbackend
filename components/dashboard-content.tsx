"use client";

import { useUser } from "@/hooks/use-user";
import { useDashboardData } from "@/components/dashboard/use-dashboard-data";
import { HabitStrip } from "@/components/dashboard/habit-strip";
import { ResumeHero } from "@/components/dashboard/resume-hero";
import { UpNextPanel } from "@/components/dashboard/up-next-panel";
import { LeaguePanel } from "@/components/dashboard/league-panel";
import { AnnouncementBanner } from "@/components/dashboard/announcement-banner";

/** Single-panel skeleton — each slow slice shows its own placeholder so the
 *  rest of the dashboard paints immediately. */
function PanelSkeleton({ className }: { className: string }) {
  return <div className={`rounded-2xl bg-muted animate-pulse ${className}`} />;
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
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">
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

      {/* ResumeHero + Up-next wait on the continue-learning -> path-session
          chain (the slow waterfall) — isolated to their own skeletons. */}
      {data.resumeLoading ? (
        <PanelSkeleton className="h-44" />
      ) : (
        <ResumeHero
          item={data.continueLearning}
          pathSession={data.pathSession}
        />
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        {data.resumeLoading ? (
          <PanelSkeleton className="h-64" />
        ) : (
          <UpNextPanel
            pathSession={data.pathSession}
            steps={data.upNextSteps}
          />
        )}
        {data.leagueLoading ? (
          <PanelSkeleton className="h-64" />
        ) : (
          <LeaguePanel league={data.league} />
        )}
      </div>
    </div>
  );
}
