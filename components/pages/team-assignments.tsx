"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AssignmentCard } from "@/components/team/assignment-card";
import { AssignmentDetailDialog } from "@/components/team/assignment-detail-dialog";
import { AssignmentFormDialog } from "@/components/team/assignment-form-dialog";
import { EmptyStateCard } from "@/components/empty-state-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAppStore } from "@/lib/store";
import type { MyAssignment, TeamAssignment, TeamSummary } from "@/lib/data";

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

  // Gates the manager section below only. The member section above stays
  // unconditional — a manager is also a person with assignments, and they
  // see their own regardless of role. This section shows other people's
  // progress, which the backend also restricts to OWNER/ADMIN, so the guard
  // belongs here and must not creep upward.
  const canManage = team?.role === "OWNER" || team?.role === "ADMIN";

  const [teamAssignments, setTeamAssignments] = useState<TeamAssignment[] | null>(null);
  const [teamAssignmentsFailed, setTeamAssignmentsFailed] = useState(false);
  const [openAssignmentId, setOpenAssignmentId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<TeamAssignment | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<TeamAssignment | null>(null);

  const loadTeamAssignments = useCallback(async (teamId: string) => {
    setTeamAssignmentsFailed(false);
    try {
      const data = await store.getTeamAssignments(teamId);
      setTeamAssignments(data ?? []);
    } catch {
      setTeamAssignmentsFailed(true);
    }
    // `store` is deliberately excluded — see loadTeam above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (team && canManage) loadTeamAssignments(team.id);
  }, [team, canManage, loadTeamAssignments]);

  const handleDelete = async () => {
    if (!team || !deleting) return;
    try {
      await store.deleteTeamAssignment(team.id, deleting.id);
      setDeleting(null);
      toast.success("Assignment deleted.");
      loadTeamAssignments(team.id);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Couldn't delete that assignment.");
    }
  };

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

      {canManage && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Team assignments</h2>
              <p className="text-sm text-muted-foreground">
                Everything assigned across the team, and who is behind.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingAssignment(null);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New assignment
            </Button>
          </div>

          {teamAssignmentsFailed ? (
            <EmptyStateCard
              icon={CalendarClock}
              title="Couldn't load team assignments"
              description="Something went wrong loading the team's assignments. Please try again."
              primaryCTA={{
                label: "Try again",
                onClick: () => loadTeamAssignments(team.id),
              }}
            />
          ) : !teamAssignments ? (
            <PageSkeleton rows={3} />
          ) : teamAssignments.length === 0 ? (
            <EmptyStateCard
              icon={CalendarClock}
              title="No assignments yet"
              description="Assign a course, path, project or task to the team, a group, or a person."
            />
          ) : (
            <div className="space-y-2">
              {teamAssignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="flex flex-wrap items-center gap-3 py-3">
                    <button
                      type="button"
                      className="min-w-0 flex-1 space-y-1 text-left"
                      onClick={() => setOpenAssignmentId(assignment.id)}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{assignment.name}</span>
                        {assignment.isOverdue && (
                          <Badge variant="destructive">Overdue</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {assignment.targetLabel} &middot; {assignment.audienceSize}{" "}
                        {assignment.audienceSize === 1 ? "person" : "people"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.doneCount} of {assignment.audienceSize} done
                      </p>
                    </button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Edit ${assignment.name}`}
                      onClick={() => {
                        setEditingAssignment(assignment);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Delete ${assignment.name}`}
                      onClick={() => setDeleting(assignment)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The assignment goes away. Nobody loses their progress or
              access — the courses, paths, projects and tasks it pointed at
              stay exactly as finished (or unfinished) as they were.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete assignment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {team && (
        <AssignmentDetailDialog
          teamId={team.id}
          assignmentId={openAssignmentId}
          onOpenChange={(o) => !o && setOpenAssignmentId(null)}
        />
      )}

      {team && (
        <AssignmentFormDialog
          teamId={team.id}
          assignment={editingAssignment}
          open={formOpen}
          onOpenChange={(o) => {
            setFormOpen(o);
            if (!o) setEditingAssignment(null);
          }}
          onSaved={() => loadTeamAssignments(team.id)}
        />
      )}
    </div>
  );
}
