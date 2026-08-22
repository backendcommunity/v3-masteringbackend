"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useAppStore } from "@/lib/store";
import type { TeamLeaderboard } from "@/lib/data";

/**
 * The team's own ranking.
 *
 * Ranks are re-numbered within the team by the backend. Showing the global
 * rank would place a team of four at 812th, 4051st and 9330th, which tells
 * them nothing about each other.
 */
export function TeamLeaderboardPage() {
  const store = useAppStore();
  const [board, setBoard] = useState<TeamLeaderboard | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const teams = await store.getMyTeams();
      const team = teams?.[0];
      if (!team) return;
      const data = await store.getTeamLeaderboard(team.id);
      if (!cancelled) setBoard(data);
    }
    load().catch(() => {
      if (!cancelled) setBoard({ entries: [] });
    });
    return () => {
      cancelled = true;
    };
  }, [store]);

  if (!board) return <PageSkeleton rows={3} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Leaderboard</h1>
        <p className="mt-1 text-muted-foreground">Points earned across your team.</p>
      </div>

      {board.entries.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nobody has earned points yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {board.entries.map((e) => (
            <Card key={e.id}>
              <CardContent className="flex items-center gap-3 py-3">
                <span className="w-6 text-sm font-bold tabular-nums text-muted-foreground">
                  {e.rank}
                </span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={e.avatar ?? undefined} alt="" />
                  <AvatarFallback>
                    {(e.name ?? e.username ?? "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {e.name ?? e.username}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {e.totalCompletedCourses} courses
                </span>
                <span className="text-sm font-bold tabular-nums">{e.totalPoints}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
