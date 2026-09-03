"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderTree, Loader2, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { GroupMembersDialog } from "@/components/team/group-members-dialog";
import { useAppStore } from "@/lib/store";
import type { TeamGroup } from "@/lib/data";

/**
 * Departments inside a team.
 *
 * A group organises people and grants nothing, so deleting one is safe — the
 * confirmation says so plainly rather than using the usual destructive
 * language, which would make an owner think they were about to remove people.
 */
export function TeamGroupsPage() {
  const store = useAppStore();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [groups, setGroups] = useState<TeamGroup[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TeamGroup | null>(null);
  const [editName, setEditName] = useState("");
  const [deleting, setDeleting] = useState<TeamGroup | null>(null);
  const [picking, setPicking] = useState<TeamGroup | null>(null);

  const load = useCallback(async () => {
    try {
      const teams = await store.getMyTeams();
      const team = teams?.[0];
      if (!team) throw new Error("No team found");
      setTeamId(team.id);
      setGroups(await store.getTeamGroups(team.id));
    } catch {
      setFailed(true);
    }
    // `store` is deliberately excluded — useAppStore() has no selector, so
    // its identity changes on any set() anywhere in the app. Depending on it
    // would re-run this fetch (and, via the effect below, getMyTeams() +
    // getTeamGroups()) on unrelated churn. Same pattern as
    // loadTeams/loadRoster in components/pages/team.tsx.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create() {
    if (!teamId || !newName.trim()) return;
    setCreating(true);
    try {
      await store.createTeamGroup(teamId, newName.trim());
      setNewName("");
      setGroups(await store.getTeamGroups(teamId));
      toast.success("Group created.");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Couldn't create that group.");
    } finally {
      setCreating(false);
    }
  }

  async function rename() {
    if (!teamId || !editing || !editName.trim()) return;
    try {
      await store.renameTeamGroup(teamId, editing.id, editName.trim());
      setEditing(null);
      setGroups(await store.getTeamGroups(teamId));
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Couldn't rename that group.");
    }
  }

  async function remove() {
    if (!teamId || !deleting) return;
    try {
      await store.deleteTeamGroup(teamId, deleting.id);
      setDeleting(null);
      setGroups(await store.getTeamGroups(teamId));
      toast.success("Group deleted. Everyone is still on the team.");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Couldn't delete that group.");
    }
  }

  if (failed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Couldn&apos;t load your groups</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.reload()}>Try again</Button>
        </CardContent>
      </Card>
    );
  }

  if (!groups) return <PageSkeleton rows={3} />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">New group</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={newName}
            maxLength={120}
            placeholder="Platform, Data, New starters…"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !creating) create();
            }}
          />
          <Button onClick={create} disabled={creating || !newName.trim()}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
          </Button>
        </CardContent>
      </Card>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <FolderTree className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No groups yet. Create one to organise your team by department.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => (
            <Card key={g.id}>
              <CardContent className="flex flex-wrap items-center gap-3 py-3">
                {editing?.id === g.id ? (
                  <>
                    <Input
                      value={editName}
                      maxLength={120}
                      className="max-w-xs"
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") rename();
                        if (e.key === "Escape") setEditing(null);
                      }}
                    />
                    <Button size="sm" onClick={rename} disabled={!editName.trim()}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 truncate font-medium">{g.name}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {g.memberCount} {g.memberCount === 1 ? "member" : "members"}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => setPicking(g)}>
                      <Users className="mr-1 h-4 w-4" />
                      Members
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Rename ${g.name}`}
                      onClick={() => {
                        setEditing(g);
                        setEditName(g.name);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Delete ${g.name}`}
                      onClick={() => setDeleting(g)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The group goes away. Everyone in it stays on the team and keeps
              their access — only the grouping is removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Delete group</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {teamId && (
        <GroupMembersDialog
          teamId={teamId}
          groupId={picking?.id ?? null}
          groupName={picking?.name ?? ""}
          open={picking !== null}
          onOpenChange={(o) => !o && setPicking(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
