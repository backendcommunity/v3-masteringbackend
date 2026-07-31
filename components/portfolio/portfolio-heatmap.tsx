"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Flame, Calendar, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PortfolioActivity, ActivityDay } from "@/lib/portfolio-types";

interface PortfolioHeatmapProps {
  activity: PortfolioActivity;
}

function getIntensityClass(count: number): string {
  if (count === 0) return "bg-secondary dark:bg-white/[0.06]";
  if (count <= 2) return "bg-primary/20";
  if (count <= 4) return "bg-primary/40";
  if (count <= 6) return "bg-primary/70";
  return "bg-primary";
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function PortfolioHeatmap({ activity }: PortfolioHeatmapProps) {
  const { weeks, monthPositions } = useMemo(() => {
    const days = activity.days;
    if (!days.length) return { weeks: [], monthPositions: [] };

    // Group into weeks (columns). Each week is an array of 7 slots (Mon=0 to Sun=6).
    const weeksArr: (ActivityDay | null)[][] = [];
    let currentWeek: (ActivityDay | null)[] = [];

    // Pad the first week with nulls for days before the start
    const firstDate = new Date(days[0].date);
    // getDay(): 0=Sun, 1=Mon. We want Mon=0, so remap.
    const firstDayOfWeek = (firstDate.getDay() + 6) % 7;
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }

    for (const day of days) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeksArr.push(currentWeek);
        currentWeek = [];
      }
    }
    // Push remaining partial week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeksArr.push(currentWeek);
    }

    // Compute month label positions
    const positions: { label: string; col: number }[] = [];
    let lastMonth = -1;
    for (let col = 0; col < weeksArr.length; col++) {
      const firstNonNull = weeksArr[col].find((d) => d !== null);
      if (firstNonNull) {
        const month = new Date(firstNonNull.date).getMonth();
        if (month !== lastMonth) {
          positions.push({ label: MONTH_LABELS[month], col });
          lastMonth = month;
        }
      }
    }

    return { weeks: weeksArr, monthPositions: positions };
  }, [activity.days]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-lg">Activity</CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              {activity.currentStreak} day streak
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {activity.activeDaysCount} active days
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-[#F2C94C]" />
              {activity.monthlyXp.toLocaleString()} MB this month
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="min-w-[700px]">
            {/* Month labels */}
            <div className="flex ml-8 mb-1" style={{ gap: "3px" }}>
              {weeks.map((_, colIdx) => {
                const match = monthPositions.find((m) => m.col === colIdx);
                return (
                  <div
                    key={colIdx}
                    className="text-[10px] text-muted-foreground"
                    style={{ width: "11px" }}
                  >
                    {match ? match.label : ""}
                  </div>
                );
              })}
            </div>

            {/* Grid */}
            <div className="flex gap-0">
              {/* Day labels */}
              <div
                className="flex flex-col justify-between pr-2 py-0"
                style={{ gap: "3px", width: "28px" }}
              >
                {["Mon", "", "Wed", "", "Fri", "", ""].map((label, i) => (
                  <div
                    key={i}
                    className="text-[10px] text-muted-foreground leading-none"
                    style={{ height: "11px", display: "flex", alignItems: "center" }}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              <div className="flex" style={{ gap: "3px" }}>
                {weeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col" style={{ gap: "3px" }}>
                    {week.map((day, dayIdx) => (
                      <Tooltip key={dayIdx}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "rounded-[2px] transition-colors",
                              day
                                ? getIntensityClass(day.count)
                                : "bg-transparent",
                            )}
                            style={{ width: "11px", height: "11px" }}
                          />
                        </TooltipTrigger>
                        {day && (
                          <TooltipContent side="top" className="text-xs">
                            <p className="font-medium">
                              {day.count} {day.count === 1 ? "activity" : "activities"}
                            </p>
                            <p className="text-muted-foreground">
                              {formatDate(day.date)}
                            </p>
                            {day.types && day.types.length > 0 && (
                              <div className="border-t border-border/50 mt-1.5 pt-1.5 space-y-0.5">
                                {day.types.map((t) => (
                                  <p key={t.label} className="text-muted-foreground flex justify-between gap-3">
                                    <span>{t.label}</span>
                                    <span className="tabular-nums font-medium text-foreground">{t.count}</span>
                                  </p>
                                ))}
                              </div>
                            )}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-1.5 mt-3 text-[10px] text-muted-foreground justify-end">
              <span>Less</span>
              {[0, 1, 3, 5, 7].map((count) => (
                <div
                  key={count}
                  className={cn("rounded-[2px]", getIntensityClass(count))}
                  style={{ width: "11px", height: "11px" }}
                />
              ))}
              <span>More</span>
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
