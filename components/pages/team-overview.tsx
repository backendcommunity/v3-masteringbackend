"use client";

import { useEffect, useState } from "react";
import { Users, Flame, MoonStar, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/page-skeleton";
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
  const [failed, setFailed] = useState(false);
  const [groups, setGroups] = useState<TeamGroup[]>([]);
  const [groupFilter, setGroupFilter] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const teams = await store.getMyTeams();
        const team = teams?.[0];
        if (!team) throw new Error("No team found");
        if (!cancelled) setTeamId(team.id);
      } catch {
        if (!cancelled) setFailed(true);
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

  useEffect(() => {
    if (!teamId) return;
    let cancelled = false;
    const gid = groupFilter === "all" ? undefined : groupFilter;
    store
      .getTeamOverview(teamId, gid)
      .then((data) => {
        if (!cancelled) setOverview(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, groupFilter]);

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

  if (failed) {
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
              No activity in the last 14 days. Seats they aren&apos;t using are
              seats someone else could have.
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
    </div>
  );
}
