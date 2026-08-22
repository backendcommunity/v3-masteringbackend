"use client";

import { useEffect, useState } from "react";
import { Users, Flame, MoonStar, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import type { TeamOverview } from "@/lib/data";

/**
 * The Team Hub landing screen.
 *
 * Four numbers, and the one that matters is "stalled" — the point of buying
 * seats is that people use them, and this is the screen that says who isn't.
 */
export function TeamOverviewPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const store = useAppStore();
  const [overview, setOverview] = useState<TeamOverview | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const teams = await store.getMyTeams();
        const team = teams?.[0];
        if (!team) throw new Error("No team found");
        const data = await store.getTeamOverview(team.id);
        if (!cancelled) setOverview(data);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [store]);

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
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Overview</h1>
        <p className="mt-1 text-muted-foreground">
          How your team is using their seats.
        </p>
      </div>

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
