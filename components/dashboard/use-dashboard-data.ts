"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { useUser } from "@/hooks/use-user";
import { dataStore, type ContinueLearningItem } from "@/lib/data";
import type { PathSession, PathSessionStep } from "@/lib/path-types";

/** Daily MB target for the goal ring. Tunable — single source of truth. */
export const DAILY_GOAL_MB = 50;

export interface WeekDot {
  date: string; // local date string
  active: boolean;
  isToday: boolean;
}

export interface DashboardData {
  // Per-slice loading so the page renders progressively instead of blocking the
  // whole dashboard on the slowest call. The shell + HabitStrip (from `user`)
  // paint immediately; these gate only their own panels.
  resumeLoading: boolean; // ResumeHero + Up-next (continue-learning -> path session)
  leagueLoading: boolean; // League panel
  // raw slices
  continueLearning: ContinueLearningItem | null;
  pathSession: PathSession | null;
  league: any | null;
  // streak + habit
  currentStreak: number;
  activeToday: boolean;
  weekDots: WeekDot[];
  todayMB: number;
  goalPct: number;
  // level / xp
  level: number;
  rankTitle: string;
  points: number;
  nextLevelXP: number;
  xpToNext: number;
  xpPct: number;
  // up next
  upNextSteps: PathSessionStep[];
}

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const sameDay = (a: Date, b: Date) =>
  startOfDay(a).getTime() === startOfDay(b).getTime();

export function useDashboardData(): DashboardData {
  // Select the specific store ACTIONS (stable references) rather than the whole
  // store. Subscribing to the whole store (`useAppStore()`) returns a new
  // snapshot on every unrelated mutation — e.g. closing the welcome-back recap
  // calls setReturnRecap(null) — which would re-run the load effect below and
  // refetch the entire dashboard (the "refresh on close" bug). Action refs are
  // created once, so the effect's deps stay stable and it loads once on mount.
  const getContinueLearning = useAppStore((s) => s.getContinueLearning);
  const getLeague = useAppStore((s) => s.getLeague);
  const getActivities = useAppStore((s) => s.getActivities);
  const getPathSession = useAppStore((s) => s.getPathSession);
  const user = useUser();

  const [resumeLoading, setResumeLoading] = useState(true);
  const [leagueLoading, setLeagueLoading] = useState(true);
  const [continueLearning, setContinueLearning] =
    useState<ContinueLearningItem | null>(null);
  const [pathSession, setPathSession] = useState<PathSession | null>(null);
  const [league, setLeague] = useState<any | null>(null);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;

    // Each slice loads and settles INDEPENDENTLY so a slow call only delays its
    // own panel, never the whole page. A failure never blanks the page.

    // League — gates only the league panel.
    getLeague()
      .then((lg) => {
        if (!cancelled) setLeague(lg && typeof lg.joined === "boolean" ? lg : null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLeagueLoading(false);
      });

    // Activities — feed the habit strip's week dots + today's MB. NOT gated:
    // HabitStrip paints instantly from `user` (streak/level/xp) and these
    // activity-derived bits fill in when this resolves.
    getActivities({ size: 50 })
      .then((acts: any) => {
        if (!cancelled) setActivities(Array.isArray(acts) ? acts : []);
      })
      .catch(() => {});

    // Resume slice — continue-learning, then its dependent path session. Gates
    // only ResumeHero + Up-next (this is the slow waterfall; isolating it is the
    // whole point — it no longer blocks the streak/league/shell from painting).
    (async () => {
      const cl = await getContinueLearning().catch(() => null);
      if (cancelled) return;
      setContinueLearning(cl ?? null);
      if (cl?.slug) {
        const ps = await getPathSession(cl.slug).catch(() => null);
        if (!cancelled) setPathSession(ps ?? null);
      } else if (!cancelled) {
        setPathSession(null);
      }
      if (!cancelled) setResumeLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [getContinueLearning, getLeague, getActivities, getPathSession]);

  // ---- derived: today's MB + week dots ----
  const now = new Date();
  const todayMB = activities.reduce((sum, a) => {
    const created = a?.createdAt ? new Date(a.createdAt) : null;
    return created && sameDay(created, now) ? sum + (Number(a?.mb) || 0) : sum;
  }, 0);

  const weekDots: WeekDot[] = Array.from({ length: 7 }, (_, i) => {
    const day = startOfDay(new Date(now));
    day.setDate(day.getDate() - (6 - i));
    const active = activities.some((a) => {
      const created = a?.createdAt ? new Date(a.createdAt) : null;
      return created ? sameDay(created, day) : false;
    });
    return {
      date: day.toDateString(),
      active,
      isToday: i === 6,
    };
  });

  const activeToday = weekDots[6]?.active ?? false;
  const goalPct = Math.min(100, Math.round((todayMB / DAILY_GOAL_MB) * 100));

  // ---- derived: level / xp ----
  const level = user?.level ?? 1;
  const points = user?.points ?? 0;
  const getLevel = (l: number) => dataStore.levels.find((x) => x.id === l);
  const rankTitle = getLevel(level)?.name ?? "Engineer";
  const nextLevelXP = getLevel(level + 1)?.point ?? points;
  const xpToNext = Math.max(0, nextLevelXP - points);
  const xpPct = nextLevelXP > 0 ? Math.min(100, (points / nextLevelXP) * 100) : 100;

  // ---- derived: up-next + gate ----
  const orderedSteps = (pathSession?.steps ?? [])
    .slice()
    .sort((a, b) => a.order - b.order);
  const upNextSteps = orderedSteps
    .filter((s) => s.status !== "DONE")
    .slice(0, 3);

  return {
    resumeLoading,
    leagueLoading,
    continueLearning,
    pathSession,
    league,
    currentStreak: user?.currentStreak ?? (user as any)?.streak ?? 0,
    activeToday,
    weekDots,
    todayMB,
    goalPct,
    level,
    rankTitle,
    points,
    nextLevelXP,
    xpToNext,
    xpPct,
    upNextSteps,
  };
}
