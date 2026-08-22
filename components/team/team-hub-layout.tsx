"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyStateCard } from "@/components/empty-state-card";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import type { TeamSummary } from "@/lib/data";
import { TeamRail } from "./team-rail";
import { TEAM_NAV_ITEMS } from "./team-nav-items";

/**
 * Wraps every /team/* screen.
 *
 * The hub is a mode: it replaces the learner rail while you are inside it, and
 * the "Back to learning" control is the exit. A mode without an obvious exit
 * is a trap.
 *
 * A user with no team never reaches the rail at all — they get the upsell
 * empty state, the same one /team showed before this existed.
 *
 * TEAM_NAV_ITEMS is the single source of truth for which routes are
 * OWNER/ADMIN-only. TeamRail uses it to omit entries a MEMBER can't see;
 * this layout uses the same list to enforce it — a MEMBER who reaches a
 * manager-only route directly (old `/team` link, typed URL) is redirected
 * to Members instead of rendering the screen the rail said they couldn't see.
 */
export function TeamHubLayout({ children }: { children: React.ReactNode }) {
  const store = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
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

  const team = teams && teams.length > 0 ? teams[0] : null;
  const canManage = team ? team.role === "OWNER" || team.role === "ADMIN" : false;
  const currentItem = TEAM_NAV_ITEMS.find((item) => item.href === pathname);
  const blocked = !!team && !!currentItem?.managerOnly && !canManage;

  useEffect(() => {
    if (blocked) router.replace(routes.teamMembers);
  }, [blocked, router]);

  if (teams === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!team) {
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

  if (blocked) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
