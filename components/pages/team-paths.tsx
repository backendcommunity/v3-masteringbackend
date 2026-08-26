"use client";

import { useCallback, useEffect, useState } from "react";
import { Map } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyStateCard } from "@/components/empty-state-card";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import type { TeamPath, TeamSummary } from "@/lib/data";

/**
 * A team's custom paths, as a plain MEMBER sees them: their team's paths as
 * cards, each opening the existing path workspace. A team path IS a path —
 * there is no separate learner UI to build here.
 *
 * Sub-project 3a shipped a member view that showed nothing at all — the API
 * served a member's data fine, but every piece of UI sat behind a canManage
 * check. So this page is built and tested for the plain-member path FIRST,
 * completely standing alone, before a single authoring affordance exists.
 * That's also why this file never calls the manager-only endpoints
 * (getTeamPath, createTeamPath, updateTeamPath, archiveTeamPath,
 * setPathSections, setSectionItems) — not "handle their 403 gracefully",
 * just never call them here. Task 11 adds the authoring UI on top of this.
 */
export function TeamPathsPage() {
  const store = useAppStore();

  const [team, setTeam] = useState<TeamSummary | null>(null);
  const [teamFailed, setTeamFailed] = useState(false);

  const [paths, setPaths] = useState<TeamPath[] | null>(null);
  const [pathsFailed, setPathsFailed] = useState(false);

  const loadTeam = useCallback(async () => {
    setTeamFailed(false);
    try {
      const teams = await store.getMyTeams();
      const first = teams?.[0] ?? null;
      if (!first) throw new Error("No team found");
      setTeam(first);
    } catch {
      setTeamFailed(true);
    }
    // `store` is deliberately excluded — useAppStore() has no selector, so
    // its identity changes on any set() anywhere in the app (including a
    // nav-bar poll on a ten-second timer). Depending on it would re-run this
    // fetch on unrelated churn. Same pattern as loadTeams in
    // components/pages/team.tsx:121.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const loadPaths = useCallback(async (teamId: string) => {
    setPathsFailed(false);
    try {
      const data = await store.getTeamPaths(teamId);
      setPaths(data ?? []);
    } catch {
      setPathsFailed(true);
    }
    // `store` is deliberately excluded — see loadTeam above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (team) loadPaths(team.id);
  }, [team, loadPaths]);

  if (teamFailed) {
    return (
      <EmptyStateCard
        icon={Map}
        title="Couldn't load your team"
        description="Something went wrong loading your team information. Please try again."
        primaryCTA={{ label: "Try again", onClick: loadTeam }}
      />
    );
  }

  if (!team) return <PageSkeleton rows={3} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Team paths</h2>
        <p className="text-sm text-muted-foreground">
          Paths your team has put together, ready to open and work through.
        </p>
      </div>

      {pathsFailed ? (
        <EmptyStateCard
          icon={Map}
          title="Couldn't load your team's paths"
          description="Something went wrong loading your team's paths. Please try again."
          primaryCTA={{
            label: "Try again",
            onClick: () => loadPaths(team.id),
          }}
        />
      ) : !paths ? (
        <PageSkeleton rows={3} />
      ) : paths.length === 0 ? (
        <EmptyStateCard
          icon={Map}
          title="No paths yet"
          description="When your team puts together a path, it'll show up here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map((path) => (
            // Linked by SLUG, never by id — routes.pathDetail resolves
            // through getRoadmapBySlug despite its param being named
            // pathId. A link built from `path.id` is a 404 wearing a
            // link's clothes.
            <a key={path.id} href={routes.pathDetail(path.slug)} className="block">
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardHeader>
                  <CardTitle className="text-base">{path.title}</CardTitle>
                  {path.summary && (
                    <CardDescription>{path.summary}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {path.sectionCount}{" "}
                    {path.sectionCount === 1 ? "section" : "sections"}
                  </p>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
