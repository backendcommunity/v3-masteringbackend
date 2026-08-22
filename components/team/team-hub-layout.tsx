"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyStateCard } from "@/components/empty-state-card";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import type { TeamSummary } from "@/lib/data";
import { TEAM_NAV_ITEMS } from "./team-nav-items";

/**
 * Wraps every /team/* screen.
 *
 * The team pages are ordinary pages in the app: the normal learner sidebar
 * stays, and moving between team screens happens through tabs inside the
 * page, the same way /subscription/management moves between Subscription and
 * Billing History. There is no separate team mode and no second rail.
 *
 * The four screens keep their own routes rather than becoming tab panels, so
 * a link to /team/settings still works. The tabs navigate.
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

  // Overview and Settings are OWNER/ADMIN only, mirroring the backend's 403 on
  // those endpoints. The tabs omit them for a MEMBER, and this guard covers
  // the cases tabs cannot: a bookmark, a shared link, or /team's redirect.
  const blocked = !!team && !!currentItem?.managerOnly && !canManage;

  useEffect(() => {
    if (blocked) router.replace(routes.teamMembers);
  }, [blocked, router]);

  if (teams === null || blocked) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-6 md:py-8">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-6 md:py-8">
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

  const visible = TEAM_NAV_ITEMS.filter((i) => canManage || !i.managerOnly);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 md:py-8 lg:py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold md:text-4xl">{team.name}</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your team and see how everyone is getting on.
        </p>
      </div>

      <Tabs
        value={currentItem?.href ?? routes.teamMembers}
        onValueChange={(href) => router.push(href)}
        className="mb-6"
      >
        <TabsList
          className="grid w-full mb-6"
          style={{
            gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))`,
          }}
        >
          {visible.map((item) => (
            <TabsTrigger key={item.href} value={item.href}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {children}
    </div>
  );
}
