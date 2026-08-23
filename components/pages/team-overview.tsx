"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Users, Flame, MoonStar, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { routes } from "@/lib/routes";
import type { TeamGroup, TeamOverview } from "@/lib/data";

/**
 * The Team Hub landing screen.
 *
 * Four numbers, and the one that matters is "stalled" — the point of buying
 * seats is that people use them, and this is the screen that says who isn't.
 */
export function TeamOverviewPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const store = useAppStore();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [overview, setOverview] = useState<TeamOverview | null>(null);
  const [teamFailed, setTeamFailed] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewFailed, setOverviewFailed] = useState(false);
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
    // its identity changes on any set() anywhere in the app. Depending on it
    // would re-run this fetch on unrelated churn. Same pattern as
    // loadTeams/loadRoster in components/pages/team.tsx.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A failed fetch here used to flip a single `failed` flag that replaced
  // the ENTIRE page, unmounting the group Select along with everything
  // else. That's fine when the unfiltered fetch fails (the team itself is
  // unreachable — see the full-page branch below, unchanged for that case).
  // But the backend 404s a stale `groupId` (the group was renamed/deleted
  // out from under a filtered view), and losing the Select at that exact
  // moment removes the one control that lets the viewer recover by picking
  // "All groups". So a filtered failure only sets `overviewFailed`, which
  // the render below confines to the stats region — the header and Select
  // stay mounted.
  useEffect(() => {
    if (!teamId) return;
    let cancelled = false;
    setOverviewFailed(false);
    setOverviewLoading(true);
    const gid = groupFilter === "all" ? undefined : groupFilter;
    store
      .getTeamOverview(teamId, gid)
      .then((data) => {
        if (!cancelled) setOverview(data);
      })
      .catch(() => {
        if (!cancelled) setOverviewFailed(true);
      })
      .finally(() => {
        if (!cancelled) setOverviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, groupFilter, retryToken]);

  useEffect(() => {
    if (!teamId) return;
    let cancelled = false;
    store
      .getTeamGroups(teamId)
      .then((g) => {
        if (!cancelled) setGroups(g ?? []);
      })
      .catch(() => {
        // The filter is additive. If groups fail to load the overview still
        // renders — stats without a filter beat an error page.
        if (!cancelled) setGroups([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  // Adjusting state during render (React's sanctioned pattern for "reset
  // when a value changes") rather than in an effect: an effect fires AFTER
  // the click's own render commits, so for one frame `groupFilter` would
  // already be the new value while `overviewFailed`/`overviewLoading` still
  // described the OLD filter's outcome — the exact flash Finding 3 and
  // Minor 7 both are. Catching the change here means React bails out and
  // re-renders with the reset state before anything paints, so the flash
  // never reaches the screen. `prevGroupFilterRef` tracks what render last
  // saw so this only fires ON the change, not every render.
  if (groupFilter !== prevGroupFilterRef.current) {
    prevGroupFilterRef.current = groupFilter;
    setOverviewLoading(true);
    setOverviewFailed(false);
  }

  // An unfiltered fetch failing means the team itself couldn't be loaded —
  // the whole-page error is still the right read there, same as before.
  if (teamFailed || (overviewFailed && groupFilter === "all")) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Couldn&apos;t load your team</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.reload()}>Try again</Button>
        </CardContent>
      </Card>
    );
  }

  if (!overview) return <PageSkeleton rows={3} />;

  const stats = [
    {
      label: "Seats used",
      value: `${overview.seats.used} of ${overview.seats.paidSeats}`,
      icon: Users,
    },
    { label: "Signed in this week", value: String(overview.activeThisWeek), icon: Flame },
    { label: "Stalled", value: String(overview.stalled), icon: MoonStar },
    { label: "Never started", value: String(overview.neverActive), icon: UserX },
  ];

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

      {overviewLoading ? (
        // A filter change keeps stale `overview` figures sitting in state —
        // clearing them would flash empty instead of the previous number,
        // which is no better. Showing a skeleton here rather than the old
        // scope's stats is what stops "Seats used 4 of 6" from reading as
        // Platform's numbers when it's still whole-team data in flight.
        // Same shape as rosterLoading -> PageSkeleton in team.tsx.
        <PageSkeleton rows={3} />
      ) : overviewFailed ? (
        // Reached only when groupFilter !== "all" — the unfiltered failure
        // case already returned the whole-page error above. This reads as
        // the filtered view failing, not the team, and the Select above
        // stays live so picking "All groups" is the recovery path.
        <EmptyStateCard
          icon={AlertTriangle}
          title="Couldn't load this view"
          description="This group may have been renamed or removed since you filtered to it. Switch to All groups, or try again."
          primaryCTA={{ label: "Show all groups", onClick: () => setGroupFilter("all") }}
          secondaryCTA={{ label: "Try again", onClick: () => setRetryToken((t) => t + 1) }}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label}>
                <CardContent className="pt-5">
                  <s.icon className="mb-2 h-4 w-4 text-muted-foreground" />
                  <p className="text-2xl font-bold tabular-nums">{s.value}</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {groupFilter !== "all" && (
            <p className="text-sm text-muted-foreground">
              Showing {groups.find((g) => g.id === groupFilter)?.name ?? "one group"}.
              Seats are counted for the whole team.
            </p>
          )}

          {overview.stalled > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {overview.stalled === 1
                    ? "One person has stopped learning"
                    : `${overview.stalled} people have stopped learning`}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  No activity in the last 14 days. Seats they aren&apos;t using
                  are seats someone else could have.
                </p>
                <Button variant="outline" onClick={() => onNavigate(routes.teamMembers)}>
                  See who
                </Button>
              </CardContent>
            </Card>
          )}

          {overview.seats.available > 0 && (
            <p className="text-sm text-muted-foreground">
              You have {overview.seats.available}{" "}
              {overview.seats.available === 1 ? "seat" : "seats"} free.{" "}
              <button
                type="button"
                className="font-semibold text-primary hover:underline"
                onClick={() => onNavigate(routes.teamMembers)}
              >
                Invite someone
              </button>
            </p>
          )}
        </>
      )}
    </div>
  );
}
