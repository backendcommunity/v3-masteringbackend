"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import { AssignmentCard } from "@/components/team/assignment-card";
import { EmptyStateCard } from "@/components/empty-state-card";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useAppStore } from "@/lib/store";
import type { MyAssignment, TeamSummary } from "@/lib/data";

/**
 * A member's Assignments tab: what they were given, and the ability to tick
 * off free-text TASK items.
 *
 * Sub-project 3a shipped a member view that showed nothing at all — the API
 * served a member's data fine, but every piece of UI sat behind a canManage
 * check. So this page is built and tested for the plain-member path FIRST,
 * completely standing alone, before a single manager affordance exists.
 * That's also why this file never calls `getTeamAssignments` (the manager
 * endpoint) — not "handle its 403 gracefully", just never call it here.
 */
export function TeamAssignmentsPage() {
  const store = useAppStore();

  const [team, setTeam] = useState<TeamSummary | null>(null);
  const [teamFailed, setTeamFailed] = useState(false);

  const [assignments, setAssignments] = useState<MyAssignment[] | null>(null);
  const [assignmentsFailed, setAssignmentsFailed] = useState(false);

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

  const loadAssignments = useCallback(async (teamId: string) => {
    setAssignmentsFailed(false);
    try {
      const data = await store.getMyAssignments(teamId);
      setAssignments(data ?? []);
    } catch {
      setAssignmentsFailed(true);
    }
    // `store` is deliberately excluded — see loadTeam above, and
    // components/pages/team.tsx:145.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (team) loadAssignments(team.id);
  }, [team, loadAssignments]);

  // Computed for Task 9, which adds the manager section below gated on it.
  // Not read yet — the member section renders unconditionally regardless of
  // role, and this task must not call the manager endpoint at all.
  const canManage = team?.role === "OWNER" || team?.role === "ADMIN";

  const handleToggle = async (
    assignmentId: string,
    itemId: string,
    done: boolean,
  ) => {
    if (!team) return;
    // Re-thrown so AssignmentCard's optimistic tick can revert on failure.
    await store.setAssignmentItemDone(team.id, assignmentId, itemId, done);
  };

  if (teamFailed) {
    return (
      <EmptyStateCard
        icon={CalendarClock}
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
        <h2 className="text-lg font-semibold">Your assignments</h2>
        <p className="text-sm text-muted-foreground">
          What you&apos;ve been given, and what&apos;s left to finish.
        </p>
      </div>

      {assignmentsFailed ? (
        <EmptyStateCard
          icon={CalendarClock}
          title="Couldn't load your assignments"
          description="Something went wrong loading your assignments. Please try again."
          primaryCTA={{
            label: "Try again",
            onClick: () => loadAssignments(team.id),
          }}
        />
      ) : !assignments ? (
        <PageSkeleton rows={3} />
      ) : assignments.length === 0 ? (
        <EmptyStateCard
          icon={CalendarClock}
          title="Nothing assigned yet"
          description="When your team lead assigns you something, it'll show up here."
        />
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onToggle={(itemId, done) =>
                handleToggle(assignment.id, itemId, done)
              }
            />
          ))}
        </div>
      )}

      {/*
        Task 9: the manager section goes here, gated on `canManage`, backed
        by getTeamAssignments/getTeamAssignmentDetail/create/update/delete/
        setTeamAssignmentItems. Deliberately absent in this task — the
        member section above has to work, and be tested, standing
        completely alone first.
      */}
    </div>
  );
}
