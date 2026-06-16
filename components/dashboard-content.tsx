"use client";

import { useUser } from "@/hooks/use-user";
import { useDashboardData } from "@/components/dashboard/use-dashboard-data";
import { HabitStrip } from "@/components/dashboard/habit-strip";
import { ResumeHero } from "@/components/dashboard/resume-hero";
import { UpNextPanel } from "@/components/dashboard/up-next-panel";
import { LeaguePanel } from "@/components/dashboard/league-panel";

function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] gap-4">
        <div className="h-24 rounded-xl bg-muted sm:col-span-2 lg:col-span-1" />
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
      </div>
      <div className="h-44 rounded-2xl bg-muted" />
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        <div className="h-64 rounded-2xl bg-muted" />
        <div className="h-64 rounded-2xl bg-muted" />
      </div>
    </div>
  );
}

export function DashboardContent() {
  const user = useUser();
  const data = useDashboardData();

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">
        Welcome back, {firstName}
      </h1>

      {data.loading ? (
        <DashboardSkeleton />
      ) : (
        <>
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

          <ResumeHero
            item={data.continueLearning}
            pathSession={data.pathSession}
            gateStep={data.gateStep}
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
