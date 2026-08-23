"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { EmptyStateCard } from "@/components/empty-state-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import type { TeamGroup, TeamLeaderboard } from "@/lib/data";

/**
 * The team's own ranking.
 *
 * Ranks are re-numbered within the team by the backend. Showing the global
 * rank would place a team of four at 812th, 4051st and 9330th, which tells
 * them nothing about each other.
 *
 * Visible to every ACTIVE member, not just managers — the group filter here
 * is therefore never gated on canManage, unlike the progress figures on
 * Members/Overview. It also carries no seat caveat: unlike those two pages,
 * this one shows no seat figures at all, so there's nothing for a caveat to
 * qualify.
 */
export function TeamLeaderboardPage() {
  const store = useAppStore();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [board, setBoard] = useState<TeamLeaderboard | null>(null);
  const [teamFailed, setTeamFailed] = useState(false);
  const [boardLoading, setBoardLoading] = useState(true);
  const [boardFailed, setBoardFailed] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const [groups, setGroups] = useState<TeamGroup[]>([]);
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const prevGroupFilterRef = useRef(groupFilter);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const teams = await store.getMyTeams();
        const team = teams?.[0];
        if (!team) throw new Error("No team found");
        if (!cancelled) setTeamId(team.id);
      } catch {
        if (!cancelled) setTeamFailed(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // `store` is deliberately excluded — useAppStore() has no selector, so
    // its identity changes on any set() anywhere in the app. Same pattern as
    // team-overview.tsx.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Same shape as team-overview.tsx's overview fetch: a filtered fetch
  // failing (a stale groupId — the group was renamed/deleted out from under
  // a filtered view) only sets `boardFailed`, confined to the board region
  // below, so the header and group Select stay mounted and "All groups"
  // stays reachable. An unfiltered failure means the team itself couldn't be
  // loaded, which is still the full-page case.
  useEffect(() => {
    if (!teamId) return;
    let cancelled = false;
    setBoardFailed(false);
    setBoardLoading(true);
    const gid = groupFilter === "all" ? undefined : groupFilter;
    store
      .getTeamLeaderboard(teamId, gid)
      .then((data) => {
        if (!cancelled) setBoard(data);
      })
      .catch(() => {
        if (!cancelled) setBoardFailed(true);
      })
      .finally(() => {
        if (!cancelled) setBoardLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, groupFilter, retryToken]);

  // Not gated on canManage: the leaderboard and the group list are both
  // readable by any ACTIVE member. Same pattern as team.tsx's groups effect.
  useEffect(() => {
    if (!teamId) return;
    let cancelled = false;
    store
      .getTeamGroups(teamId)
      .then((g) => {
        if (!cancelled) setGroups(g ?? []);
      })
      .catch(() => {
        // The filter is additive. If groups fail to load the leaderboard
        // still renders — a ranking without a filter beats an error page.
        if (!cancelled) setGroups([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  // Reset the board's state during the render that first sees a new filter,
  // not in the effect that follows it. Choosing "Show all groups" out of a
  // failed filtered view flips `groupFilter` to "all" immediately, while
  // `boardFailed` still describes the OLD filter's outcome — so the guard
  // below would match for exactly one render and replace the whole page,
  // Select and all, with the full-page error the user is trying to escape.
  // Catching the change here makes React re-render with the reset state
  // before anything paints. Same pattern, and same reason, as team-overview.
  if (groupFilter !== prevGroupFilterRef.current) {
    prevGroupFilterRef.current = groupFilter;
    setBoardLoading(true);
    setBoardFailed(false);
  }

  if (teamFailed || (boardFailed && groupFilter === "all")) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Couldn&apos;t load the leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.reload()}>Try again</Button>
        </CardContent>
      </Card>
    );
  }

  if (!board) return <PageSkeleton rows={3} />;

  return (
    <div className="space-y-6">
      {groups.length > 0 && (
        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All groups</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {boardLoading ? (
        // Same shape as the roster/overview transitions: a skeleton for the
        // board region while a filter switch is in flight, not the previous
        // scope's rankings under the new department's caption.
        <PageSkeleton rows={3} />
      ) : boardFailed ? (
        // Reached only when groupFilter !== "all" — the unfiltered failure
        // case already returned the whole-page error above. The Select
        // above stays live so picking "All groups" is the recovery path,
        // same as team-overview.tsx.
        <EmptyStateCard
          icon={AlertTriangle}
          title="Couldn't load this view"
          description="This group may have been renamed or removed since you filtered to it. Switch to All groups, or try again."
          primaryCTA={{ label: "Show all groups", onClick: () => setGroupFilter("all") }}
          secondaryCTA={{ label: "Try again", onClick: () => setRetryToken((t) => t + 1) }}
        />
      ) : (
        <>
          {groupFilter !== "all" && (
            <p className="text-sm text-muted-foreground">
              Showing {groups.find((g) => g.id === groupFilter)?.name ?? "one group"}.
            </p>
          )}

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
        </>
      )}
    </div>
  );
}
