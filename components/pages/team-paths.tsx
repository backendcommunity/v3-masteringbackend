"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Archive,
  ListOrdered,
  Map,
  Pencil,
  Plus,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyStateCard } from "@/components/empty-state-card";
import { PathFormDialog } from "@/components/team/path-form-dialog";
import { PathSectionEditor } from "@/components/team/path-section-editor";
import { AssignmentFormDialog } from "@/components/team/assignment-form-dialog";
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
 * just never call them here.
 *
 * Task 11 added the manager surface UNDERNEATH that member view rather than
 * around it: `canManage` gates the "Manage paths" section and nothing else,
 * so a plain member still sees exactly what they saw before it existed, and
 * `getTeamPath` is still never called for them — it fires only when a
 * manager actually opens the editor.
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

  // Gates the manager section below and nothing else. The member view above
  // stays unconditional — a manager is also a person working through their
  // team's paths, and sub-project 3a's mistake was letting a canManage check
  // creep upward until the member saw an empty screen.
  const canManage = team?.role === "OWNER" || team?.role === "ADMIN";

  // Which path's sections are being edited. The editor is MOUNTED only while
  // this is set, which is also what keeps its `getTeamPath` call out of a
  // member's session entirely. Same for the create/rename dialog and the
  // archive confirmation below.
  const [editing, setEditing] = useState<TeamPath | null>(null);
  // `formOpen` is separate from `formPath` because null is a meaningful
  // value there — it is the CREATE case, not "nothing open".
  const [formOpen, setFormOpen] = useState(false);
  const [formPath, setFormPath] = useState<TeamPath | null>(null);
  /**
   * The path being assigned, if any.
   *
   * Assigning already worked before this: an assignment can target the whole
   * team, one group or one member, and PATH is one of the item types it can
   * hold. What was missing was the way in. A manager who had just built a
   * path had to leave this page, open Assignments, create one from scratch
   * and find the same path again in a picker — so the feature Enterprise is
   * sold on sat two screens away from where it is decided.
   *
   * This opens the SAME dialog Assignments uses, prefilled with this path.
   * No new endpoint, no second way to create an assignment, nothing for the
   * two screens to disagree about.
   */
  const [assigning, setAssigning] = useState<TeamPath | null>(null);
  const [archiving, setArchiving] = useState<TeamPath | null>(null);
  const [archivePending, setArchivePending] = useState(false);

  async function handleArchive() {
    if (!team || !archiving) return;
    setArchivePending(true);
    try {
      await store.archiveTeamPath(team.id, archiving.id);
      setArchiving(null);
      toast.success(`"${archiving.title}" archived.`);
      loadPaths(team.id);
    } catch (e: any) {
      // The dialog stays open on failure rather than closing as if it had
      // worked — this is the destructive one.
      toast.error(e?.response?.data?.message ?? "Couldn't archive that path.");
    } finally {
      setArchivePending(false);
    }
  }

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

      {canManage && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Manage paths</h2>
              <p className="text-sm text-muted-foreground">
                Put a path together for your team: name it, then build its
                sections and choose what goes inside.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setFormPath(null);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New path
            </Button>
          </div>

          {!paths || pathsFailed ? null : paths.length === 0 ? (
            <EmptyStateCard
              icon={Map}
              title="No paths yet"
              description="Create one, then build its sections from your team's courses, projects and interviews."
            />
          ) : (
            <div className="space-y-2">
              {paths.map((path) => (
                <Card key={path.id}>
                  <CardContent className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{path.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {path.sectionCount}{" "}
                        {path.sectionCount === 1 ? "section" : "sections"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditing(path)}
                    >
                      <ListOrdered className="mr-2 h-4 w-4" />
                      Edit sections
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAssigning(path)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Assign
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Rename ${path.title}`}
                      onClick={() => {
                        setFormPath(path);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Archive ${path.title}`}
                      onClick={() => setArchiving(path)}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {editing && (
        <PathSectionEditor
          teamId={team.id}
          path={editing}
          onSaved={() => loadPaths(team.id)}
          onClose={() => setEditing(null)}
        />
      )}

      {formOpen && (
        <PathFormDialog
          teamId={team.id}
          path={formPath}
          onSaved={() => loadPaths(team.id)}
          onClose={() => setFormOpen(false)}
        />
      )}

      {/* Assigning a path. The dialog is Assignments' own — same fields, same
          POST /:id/assignments, same target picker (everyone / a group / one
          person) — opened with this path already in the item list and its
          title as the default assignment name. The common case is therefore
          two clicks: choose who, save. */}
      {team && assigning && (
        <AssignmentFormDialog
          teamId={team.id}
          assignment={null}
          open
          onOpenChange={(open) => {
            if (!open) setAssigning(null);
          }}
          onSaved={() => {
            setAssigning(null);
            toast.success(`"${assigning.title}" assigned.`);
          }}
          prefill={{
            name: assigning.title,
            // `title` is client-side only (see AssignmentItemInput): it is
            // stripped before the save call and exists so the item builder
            // shows "Backend Engineering" rather than "Path · <uuid>" while
            // the manager is choosing who to assign it to.
            items: [
              { type: "PATH", refId: assigning.id, title: assigning.title },
            ],
          }}
        />
      )}

      {/* Archiving is the destructive one — it is reversible only by a
          developer (the path leaves getTeamPaths and there is no un-archive
          endpoint), so it asks first and says what does NOT happen too. */}
      <AlertDialog
        open={archiving !== null}
        onOpenChange={(open) => !open && !archivePending && setArchiving(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {archiving?.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              It disappears from your team&apos;s paths for everyone. Nobody
              loses the work they already did, but bringing it back needs a
              developer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archivePending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              // preventDefault: Radix closes an Action on click, and a
              // failed archive that closed the confirmation would look
              // exactly like a successful one. `handleArchive` closes it
              // itself once the call actually resolves.
              onClick={(e) => {
                e.preventDefault();
                handleArchive();
              }}
              disabled={archivePending}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
