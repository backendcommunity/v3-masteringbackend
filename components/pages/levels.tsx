"use client";

import { CheckCircle2, Lock, ChevronRight, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { dataStore, LEVEL_PERKS, Level } from "@/lib/data";
import { useUser } from "@/hooks/use-user";
import { useLevel } from "@/hooks/use-level";

interface LevelsPageProps {
  onNavigate?: (path: string) => void;
}

export function LevelsPage({ onNavigate }: LevelsPageProps) {
  const user = useUser();
  const { progressPct, mbToNextLevel } = useLevel();
  const levels: Level[] = dataStore.levels;
  const userLevel: number = user?.level ?? 1;
  const userPoints: number = user?.points ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Level Progression</h1>
        <p className="text-muted-foreground text-sm">
          Earn MB by watching videos, completing quizzes, and finishing projects.
          Each level unlocks new features and earns you platform badges.
        </p>
      </div>

      {/* Current progress summary */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {LEVEL_PERKS[userLevel]?.icon ?? "⭐"}
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Current Level</p>
                <p className="font-semibold leading-tight">
                  Level {userLevel} — {levels.find((l) => l.id === userLevel)?.name}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total MB</p>
              <p className="font-bold text-primary">{userPoints.toLocaleString()}</p>
            </div>
          </div>
          {userLevel < 10 ? (
            <>
              <Progress value={progressPct} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1.5">
                {mbToNextLevel.toLocaleString()} MB to Level {userLevel + 1}
              </p>
            </>
          ) : (
            <p className="text-xs text-primary font-medium mt-1">
              Maximum level reached — Backend Overlord
            </p>
          )}
        </CardContent>
      </Card>

      {/* Level cards */}
      <div className="space-y-3">
        {levels.map((lvl, idx) => {
          const isCurrentLevel = lvl.id === userLevel;
          const isCompleted = lvl.id < userLevel;
          const isLocked = lvl.id > userLevel;
          const perksData = LEVEL_PERKS[lvl.id];
          const prevPoint = idx === 0 ? 0 : levels[idx - 1].point;

          return (
            <Card
              key={lvl.id}
              className={`transition-colors ${
                isCurrentLevel
                  ? "border-primary ring-1 ring-primary/30 bg-primary/5"
                  : isCompleted
                  ? "border-border opacity-70"
                  : "border-border"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Level badge / status icon */}
                  <div
                    className={`flex-shrink-0 h-11 w-11 rounded-full flex items-center justify-center text-xl font-bold
                      ${
                        isCompleted
                          ? "bg-muted text-muted-foreground"
                          : isCurrentLevel
                          ? "bg-primary/20 text-primary"
                          : "bg-muted/40 text-muted-foreground/50"
                      }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : isLocked ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <span>{perksData?.icon ?? "⭐"}</span>
                    )}
                  </div>

                  {/* Level info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-semibold text-sm ${
                          isCurrentLevel ? "text-primary" : isCompleted ? "text-muted-foreground" : ""
                        }`}
                      >
                        Level {lvl.id} — {lvl.name}
                      </span>
                      {isCurrentLevel && (
                        <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/20 text-primary border-primary/30">
                          YOU ARE HERE
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4 text-green-600 border-green-500/30"
                        >
                          Completed
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-0.5">
                      {idx === 0
                        ? `Starts at 0 MB`
                        : `${prevPoint.toLocaleString()} – ${lvl.point.toLocaleString()} MB`}
                    </p>

                    {/* Progress bar for current level */}
                    {isCurrentLevel && (
                      <Progress value={progressPct} className="h-1.5 mt-2 mb-1" />
                    )}

                    {/* Perks */}
                    {perksData && (
                      <ul className="mt-2 space-y-0.5">
                        {perksData.perks.map((perk, i) => (
                          <li
                            key={i}
                            className={`flex items-center gap-1.5 text-xs ${
                              isLocked ? "text-muted-foreground/50" : "text-muted-foreground"
                            }`}
                          >
                            <Star
                              className={`h-3 w-3 flex-shrink-0 ${
                                isLocked
                                  ? "text-muted-foreground/30"
                                  : isCompleted
                                  ? "text-green-500"
                                  : "text-primary"
                              }`}
                            />
                            {perk}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Right: point threshold */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">Required</p>
                    <p
                      className={`font-bold text-sm ${
                        isCompleted
                          ? "text-green-500"
                          : isCurrentLevel
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {lvl.point.toLocaleString()} MB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
