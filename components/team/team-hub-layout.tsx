"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyStateCard } from "@/components/empty-state-card";
import { JourneyGlyph } from "@/components/journey-glyph";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import type { TeamSummary } from "@/lib/data";
import { TEAM_NAV_ITEMS } from "./team-nav-items";

/**
 * Wraps every /team/* screen.
 *
 * These are ordinary pages: the learner sidebar stays, DashboardLayout
 * supplies the width and padding (max-w-7xl px-6 py-6), and the page opens
 * with the same navy blueprint hero that Paths, Courses and Projects use —
 * so a team screen sits in the product rather than beside it.
 *
 * Moving between team screens happens through tabs, the way
 * /subscription/management moves between Subscription and Billing History.
 * The four screens keep their own routes rather than becoming tab panels, so
 * a link to /team/settings still resolves. The tabs navigate.
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
  // what tabs cannot: a bookmark, a shared link, or /team's redirect.
  const blocked = !!team && !!currentItem?.managerOnly && !canManage;

  useEffect(() => {
    if (blocked) router.replace(routes.teamMembers);
  }, [blocked, router]);

  if (teams === null || blocked) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!team) {
    return (
      <EmptyStateCard
        icon={Users}
        title="You're not on a team yet"
        description="Team accounts let you share one subscription with your colleagues. Create one to invite people and give them Pro access."
        primaryCTA={{
          label: "Create Team",
          onClick: () => router.push(routes.pricingEnterprise),
        }}
      />
    );
  }

  const visible = TEAM_NAV_ITEMS.filter((i) => canManage || !i.managerOnly);

  return (
    <div className="space-y-6">
      {/* ── Blueprint hero (navy anchor · grow pillar) ── */}
      <div className="bg-[#0E1F33] dark:bg-[#080F1A] text-white relative overflow-hidden dark:ring-1 dark:ring-white/10">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="relative px-5 py-6 sm:px-8 sm:py-7">
          <JourneyGlyph
            stage="grow"
            className="absolute right-4 top-4 w-20 opacity-40 md:right-10 md:top-1/2 md:w-60 md:-translate-y-1/2 md:opacity-100"
          />
          <div className="max-w-2xl">
            <div className="eyebrow-mono text-[#4AC5E8]">team</div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-1.5">
              {team.name}
            </h1>
            <p className="mt-2.5 text-[15px] leading-relaxed text-white/[.78]">
              Everyone here learns on one subscription. See who is making
              progress, who has stalled, and who still has a seat waiting.
            </p>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div>
        <Tabs
          value={currentItem?.href ?? routes.teamMembers}
          onValueChange={(href) => router.push(href)}
          className="mb-6"
        >
          <TabsList
            className="grid w-full"
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
    </div>
  );
}
