"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyStateCard } from "@/components/empty-state-card";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import type { TeamSummary } from "@/lib/data";
import { TeamRail } from "./team-rail";

/**
 * Wraps every /team/* screen.
 *
 * The hub is a mode: it replaces the learner rail while you are inside it, and
 * the "Back to learning" control is the exit. A mode without an obvious exit
 * is a trap.
 *
 * A user with no team never reaches the rail at all — they get the upsell
 * empty state, the same one /team showed before this existed.
 */
export function TeamHubLayout({ children }: { children: React.ReactNode }) {
  const store = useAppStore();
  const router = useRouter();
  const [teams, setTeams] = useState<TeamSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    store
      .getMyTeams()
      .then((mine) => {
        if (!cancelled) setTeams(mine ?? []);
      })
      .catch(() => {
        if (!cancelled) setTeams([]);
      });
    return () => {
      cancelled = true;
    };
  }, [store]);

  if (teams === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-6 md:py-8">
        <EmptyStateCard
          icon={Users}
          title="You're not on a team yet"
          description="Team accounts let you share one subscription with your colleagues. Create one to invite people and give them Pro access."
          primaryCTA={{
            label: "Create Team",
            onClick: () => router.push(routes.pricing(routes.team)),
          }}
        />
      </div>
    );
  }

  const team = teams[0];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 md:py-8">
      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        <aside className="md:w-56 md:flex-none">
          <TeamRail teamName={team.name} role={team.role} />
          <div className="mt-4 border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
              onClick={() => router.push(routes.dashboard)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to learning
            </Button>
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
