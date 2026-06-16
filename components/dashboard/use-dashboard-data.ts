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
  loading: boolean;
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
  gateStep: PathSessionStep | null;
}

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const sameDay = (a: Date, b: Date) =>
  startOfDay(a).getTime() === startOfDay(b).getTime();

export function useDashboardData(): DashboardData {
  const store = useAppStore();
  const user = useUser();

  const [loading, setLoading] = useState(true);
  const [continueLearning, setContinueLearning] =
    useState<ContinueLearningItem | null>(null);
  const [pathSession, setPathSession] = useState<PathSession | null>(null);
  const [league, setLeague] = useState<any | null>(null);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      // Each slice degrades independently — a failure never blanks the page.
      const [cl, lg, acts] = await Promise.all([
        store.getContinueLearning().catch(() => null),
        store.getLeague().catch(() => null),
        store.getActivities({ size: 50 }).catch(() => []),
      ]);

      if (cancelled) return;
      setContinueLearning(cl ?? null);
      setLeague(lg && typeof lg.joined === "boolean" ? lg : null);
      setActivities(Array.isArray(acts) ? acts : []);

      // Up-next + path-gate come from the active path's session.
      if (cl?.slug) {
        const ps = await store.getPathSession(cl.slug).catch(() => null);
        if (!cancelled) setPathSession(ps ?? null);
      } else {
        setPathSession(null);
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [store]);

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
  const gateStep =
    orderedSteps.find((s) => s.status !== "DONE" && !s.access.allowed) ??
    orderedSteps.find((s) => s.status !== "DONE" && s.type === "QUIZ") ??
    null;

  return {
    loading,
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
    gateStep,
  };
}
