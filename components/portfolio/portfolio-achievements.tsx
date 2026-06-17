"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Crown,
  Flame,
  Zap,
  BookOpen,
  Users,
  Rocket,
  Mic,
  Map,
  Trophy,
} from "lucide-react";
import { RARITY_COLORS } from "@/lib/portfolio-types";
import type { PortfolioAchievement } from "@/lib/portfolio-types";

interface PortfolioAchievementsProps {
  achievements: PortfolioAchievement[];
}

const ICON_MAP: Record<string, React.ReactNode> = {
  crown: <Crown className="h-5 w-5" />,
  flame: <Flame className="h-5 w-5" />,
  zap: <Zap className="h-5 w-5" />,
  book: <BookOpen className="h-5 w-5" />,
  users: <Users className="h-5 w-5" />,
  rocket: <Rocket className="h-5 w-5" />,
  mic: <Mic className="h-5 w-5" />,
  map: <Map className="h-5 w-5" />,
};

function getIcon(icon: string) {
  return ICON_MAP[icon] ?? <Trophy className="h-5 w-5" />;
}

export function PortfolioAchievements({
  achievements,
}: PortfolioAchievementsProps) {
  const earned = useMemo(
    () => achievements.filter((a) => a.completed),
    [achievements],
  );
  const [visibleCount, setVisibleCount] = useState(4);
  const visible = earned.slice(0, visibleCount);
  const hasMore = earned.length > visibleCount;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Achievements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1">
          {visible.map((ach) => {
            const color = RARITY_COLORS[ach.rarity];
            return (
              <div
                key={ach.id}
                className="relative rounded-xl border p-3.5 transition-all"
                style={{
                  borderColor: ach.completed ? `${color}40` : undefined,
                  boxShadow: ach.completed
                    ? `0 0 12px 1px ${color}15`
                    : undefined,
                  opacity: ach.completed ? 1 : 0.75,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${color}15`,
                      color: color,
                    }}
                  >
                    {getIcon(ach.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-medium text-sm truncate">
                        {ach.name}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 leading-tight"
                        style={{
                          backgroundColor: `${color}15`,
                          color: color,
                          borderColor: `${color}40`,
                        }}
                      >
                        {ach.rarity}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                      {ach.description}
                    </p>
                    {ach.earnedAt && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Earned{" "}
                        {new Date(ach.earnedAt).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {hasMore && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3"
            onClick={() => setVisibleCount((v) => v + 4)}
          >
            Show More ({earned.length - visibleCount} more)
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
