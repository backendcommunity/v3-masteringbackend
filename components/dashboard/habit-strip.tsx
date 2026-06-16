"use client";

import { Flame, Zap, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { DAILY_GOAL_MB, type WeekDot } from "./use-dashboard-data";

interface HabitStripProps {
  currentStreak: number;
  activeToday: boolean;
  weekDots: WeekDot[];
  todayMB: number;
  goalPct: number;
  level: number;
  rankTitle: string;
  xpToNext: number;
  xpPct: number;
}

export function HabitStrip({
  currentStreak,
  activeToday,
  weekDots,
  todayMB,
  goalPct,
  level,
  rankTitle,
  xpToNext,
  xpPct,
}: HabitStripProps) {
  const goalMet = todayMB >= DAILY_GOAL_MB;
  const remaining = Math.max(0, DAILY_GOAL_MB - todayMB);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] gap-3 sm:gap-4">
      {/* Streak — largest, alive */}
      <div className="sm:col-span-2 lg:col-span-1 flex items-center gap-4 rounded-xl border border-orange-200/70 dark:border-orange-500/20 bg-gradient-to-br from-card to-orange-50/60 dark:to-orange-500/[0.06] p-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 shadow-lg shadow-orange-500/30">
          <Flame className="h-7 w-7 text-white fill-white" />
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-extrabold leading-none">
            {currentStreak}{" "}
            <span className="text-sm font-bold text-muted-foreground">
              day streak
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {activeToday
              ? "On fire — keep it going"
              : `Learn today to make it ${currentStreak + 1}`}
          </p>
          <div className="mt-2 flex gap-1.5">
            {weekDots.map((d, i) => (
              <span
                key={i}
                title={d.date}
                className={cn(
                  "h-3.5 w-3.5 rounded",
                  d.active
                    ? "bg-gradient-to-br from-orange-500 to-amber-400"
                    : "bg-muted",
                  d.isToday && "ring-2 ring-orange-400/60 ring-offset-1 ring-offset-card",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Daily goal ring */}
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
        <div
          className="flex h-[50px] w-[50px] flex-shrink-0 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(${
              goalMet ? "#16C46A" : "#13AECE"
            } ${goalPct}%, hsl(var(--muted)) 0)`,
          }}
        >
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-card">
            {goalMet ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Zap className="h-4 w-4 text-primary" />
            )}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-xl font-extrabold leading-none">
            {todayMB}
            <span className="text-sm font-bold text-muted-foreground">
              /{DAILY_GOAL_MB}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {goalMet ? "Daily goal smashed ✓" : `Daily goal · ${remaining} MB to go`}
          </p>
        </div>
      </div>

      {/* Level / XP */}
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex h-[50px] w-[50px] flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0E1F33] to-[#1c3d5e] text-lg font-extrabold text-white">
          {level}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">
            Level {level} · {rankTitle}
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {xpToNext.toLocaleString()} XP to Level {level + 1}
          </p>
        </div>
      </div>
    </div>
  );
}
