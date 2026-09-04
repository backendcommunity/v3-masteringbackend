"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { EmptyStateCard } from "@/components/empty-state-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { InviteDialog } from "@/components/team/invite-dialog";
import { MemberRow } from "@/components/team/member-row";
import { MemberProgressSheet } from "@/components/team/member-progress-sheet";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/use-user";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import type {
  TeamGroup,
  TeamMember,
  TeamRoster,
  TeamRosterProgress,
  TeamSummary,
} from "@/lib/data";
import { AlertTriangle, Eye, UserPlus, Users } from "lucide-react";

interface TeamPageProps {
  onNavigate: (path: string) => void;
}

export function TeamPage({ onNavigate }: TeamPageProps) {
  const user = useUser();
  const store = useAppStore();

  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState(false);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState(false);
  const [roster, setRoster] = useState<TeamRoster | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [transferTarget, setTransferTarget] = useState<TeamMember | null>(null);
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null);
  const [revokingInviteId, setRevokingInviteId] = useState<string | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const [progress, setProgress] = useState<TeamRosterProgress | null>(null);
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);
  const [selfProgressOpen, setSelfProgressOpen] = useState(false);

  const [groups, setGroups] = useState<TeamGroup[]>([]);
  const [groupFilter, setGroupFilter] = useState<string>("all");

  const loadTeams = useCallback(async () => {
    setTeamsLoading(true);
    setTeamsError(false);
    try {
      const data = await store.getMyTeams();
      setTeams(data ?? []);
      setSelectedTeamId((prev) => prev ?? data?.[0]?.id ?? null);
    } catch {
      setTeamsError(true);
    } finally {
      setTeamsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  // `loadRoster` is called both by the effect below (on team/group change)
  // and by `refetchRoster()` after mutations (role change, remove, transfer,
  // invite) — a plain `cancelled` closure from a single useEffect wouldn't
  // cover the latter. A monotonic request id does: whichever call resolves
  // last only wins if it's also the most recently *started* call, so
  // switching Platform -> Data before Platform's response lands can no
  // longer let Platform's late response overwrite Data's roster or clear
  // rosterLoading out from under it.
  const rosterRequestRef = useRef(0);

  const loadRoster = useCallback(async (teamId: string, groupId?: string) => {
    const requestId = ++rosterRequestRef.current;
    setRosterLoading(true);
    setRosterError(false);
    try {
      const data = await store.getTeamMembers(teamId, groupId);
      if (rosterRequestRef.current === requestId) setRoster(data);
    } catch {
      if (rosterRequestRef.current === requestId) setRosterError(true);
    } finally {
      if (rosterRequestRef.current === requestId) setRosterLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      const gid = groupFilter === "all" ? undefined : groupFilter;
      loadRoster(selectedTeamId, gid);
    }
  }, [selectedTeamId, groupFilter, loadRoster]);

  const team = teams.find((t) => t.id === selectedTeamId) ?? null;
  const canManage = team?.role === "OWNER" || team?.role === "ADMIN";
  const isOwnerViewer = team?.role === "OWNER";

  useEffect(() => {
    if (!selectedTeamId || !canManage) return;
    let cancelled = false;
    const gid = groupFilter === "all" ? undefined : groupFilter;
    store
      .getTeamProgress(selectedTeamId, gid)
      .then((p) => {
        if (!cancelled) setProgress(p);
      })
      .catch(() => {
        // Progress is additive. If it fails the roster still renders — a
        // member list without progress beats an error page.
        if (!cancelled) setProgress(null);
      });
    return () => {
      cancelled = true;
    };
    // `store` is deliberately excluded — useAppStore() has no selector, so
    // its identity changes on any set() anywhere in the app. Depending on it
    // would re-run this fetch on unrelated churn. Same pattern as
    // loadTeams/loadRoster above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeamId, canManage, groupFilter]);

  // Not gated on canManage: the roster and the group list are both readable
  // by any ACTIVE member, and group labels are colleague information rather
  // than management information. A MEMBER sees who is in which department,
  // and can filter by one, even though they never see progress figures.
  useEffect(() => {
    if (!selectedTeamId) return;
    let cancelled = false;
    store
      .getTeamGroups(selectedTeamId)
      .then((g) => {
        if (!cancelled) setGroups(g ?? []);
      })
      .catch(() => {
        // The filter is additive. If groups fail to load the roster still
        // renders — a member list without a filter beats an error page.
        if (!cancelled) setGroups([]);
      });
    return () => {
      cancelled = true;
    };
    // `store` is deliberately excluded — see the progress effect above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeamId]);

  const progressFor = new Map(
    (progress?.members ?? []).map((m) => [m.memberId, m]),
  );

  const refetchRoster = () => {
    if (selectedTeamId) {
      const gid = groupFilter === "all" ? undefined : groupFilter;
      loadRoster(selectedTeamId, gid);
    }
  };

  /**
   * Cancel a pending invite. The seat comes back immediately — the API drops
   * the provider quantity as part of the same call — so the roster is
   * refetched rather than patched locally, keeping the seat line and the
   * invite list from disagreeing.
   */
  const handleRevokeInvite = async (inviteId: string) => {
    if (!team) return;
    setRevokingInviteId(inviteId);
    try {
      await store.revokeTeamInvite(team.id, inviteId);
      toast.success("Invite cancelled. The seat is free again.");
      refetchRoster();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Couldn't cancel that invite.",
      );
    } finally {
      setRevokingInviteId(null);
    }
  };

  const handleChangeRole = async (
    member: TeamMember,
    role: "ADMIN" | "MEMBER",
  ) => {
    if (!team) return;
    setPendingMemberId(member.id);
    try {
      await store.changeTeamMemberRole(team.id, member.id, role);
      toast.success(
        `${member.user.name} is now ${role === "ADMIN" ? "an admin" : "a member"}`,
      );
      refetchRoster();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Couldn't update that role.",
      );
    } finally {
      setPendingMemberId(null);
    }
  };

  const handleConfirmRemove = async () => {
    if (!team || !removeTarget) return;
    setConfirmBusy(true);
    try {
      await store.removeTeamMember(team.id, removeTarget.id);
      toast.success(`Removed ${removeTarget.user.name} from the team`);
      setRemoveTarget(null);
      refetchRoster();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Couldn't remove that member.",
      );
    } finally {
      setConfirmBusy(false);
    }
  };

  const handleConfirmTransfer = async () => {
    if (!team || !transferTarget) return;
    setConfirmBusy(true);
    try {
      await store.transferTeamOwnership(team.id, transferTarget.user.id);
      toast.success(`Ownership transferred to ${transferTarget.user.name}`);
      setTransferTarget(null);
      // The viewer's own role just changed (OWNER -> ADMIN) — refetch both
      // the team list (role) and the roster (badges) so the UI reflects it
      // without a manual reload.
      loadTeams();
      refetchRoster();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Couldn't transfer ownership.",
      );
    } finally {
      setConfirmBusy(false);
    }
  };

  if (teamsLoading) {
    return (
      <div className="container mx-auto max-w-3xl space-y-6 px-4 py-6 md:py-8">
        <PageSkeleton rows={4} />
      </div>
    );
  }

  if (teamsError) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-6 md:py-8">
        <EmptyStateCard
          icon={AlertTriangle}
          title="Couldn't load your teams"
          description="Something went wrong loading your team information. Please try again."
          primaryCTA={{ label: "Try again", onClick: loadTeams }}
        />
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
            onClick: () => onNavigate(routes.pricingEnterprise),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {teams.length > 1 && (
        <Select
          value={selectedTeamId ?? undefined}
          onValueChange={setSelectedTeamId}
        >
          <SelectTrigger className="w-full sm:w-64" aria-label="Select team">
            <SelectValue placeholder="Select a team" />
          </SelectTrigger>
          <SelectContent>
            {teams.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {team && (
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {/* The team's name is the page heading now, so this card just
                  says what it holds. Repeating the name said it twice. */}
              <CardTitle>Team roster</CardTitle>
              <CardDescription>
                {roster?.usage
                  ? `${roster.usage.used} of ${roster.usage.paidSeats} seats used`
                  : "Who has access to your team's subscription"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/*
                Every ACTIVE member — OWNER and ADMIN included, since seeing
                your own record is not a manager action — can open the exact
                view their team sees about them. This deliberately points at
                the same MemberProgressSheet the roster below uses, just in
                "asSelf" mode: the backend guarantees both views come from one
                resolver, so a second component here would reintroduce the
                drift that guarantee exists to prevent.
              */}
              <Button variant="outline" size="sm" onClick={() => setSelfProgressOpen(true)}>
                <Eye className="mr-2 h-4 w-4" />
                What your team can see about you
              </Button>
              {canManage && (
                <Button
                  onClick={() => setInviteOpen(true)}
                  // The roster (and its `usage.available`) is a SECOND,
                  // sequential round-trip after the team list loads. Enabling
                  // this before it resolves lets InviteDialog receive
                  // `seatsAvailable={roster?.usage?.available ?? 0}` — a
                  // fallback zero, not a real "at capacity" reading — which
                  // would route a team that actually has a free seat through
                  // the paid confirmation and send `buySeat: true`, charging
                  // for capacity it didn't need to buy. Disabled, not hidden,
                  // so the control doesn't jump around as the roster resolves.
                  disabled={rosterLoading || !roster}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite member
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {groups.length > 0 && (
              <div className="mb-4 space-y-2">
                <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All groups</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {groupFilter !== "all" && (
                  <p className="text-sm text-muted-foreground">
                    Showing{" "}
                    {groups.find((g) => g.id === groupFilter)?.name ??
                      "one group"}
                    .
                    {/*
                      The seat caveat exists because the seat count sits right
                      above a roster the filter has just narrowed. A MEMBER
                      never receives `usage`, so for them there is no seat
                      count on screen and the sentence would point at nothing.
                    */}
                    {roster?.usage
                      ? " Seats are counted for the whole team."
                      : ""}
                  </p>
                )}
              </div>
            )}
            {rosterLoading ? (
              <PageSkeleton rows={3} />
            ) : rosterError ? (
              groupFilter !== "all" ? (
                // A stale groupId (the group was renamed/deleted out from
                // under a filtered view) 404s the same way Overview's does.
                // The Select above stays mounted either way, but without
                // this branch the only CTA on offer was "Try again" —
                // retrying the exact request that's doomed to 404 again.
                // Same recovery path as team-overview.tsx.
                <EmptyStateCard
                  icon={AlertTriangle}
                  title="Couldn't load this view"
                  description="This group may have been renamed or removed since you filtered to it. Switch to All groups, or try again."
                  primaryCTA={{ label: "Show all groups", onClick: () => setGroupFilter("all") }}
                  secondaryCTA={{ label: "Try again", onClick: refetchRoster }}
                />
              ) : (
                <EmptyStateCard
                  icon={AlertTriangle}
                  title="Couldn't load the roster"
                  description="Something went wrong loading this team's members."
                  primaryCTA={{ label: "Try again", onClick: refetchRoster }}
                />
              )
            ) : !roster || roster.members.length === 0 ? (
              groupFilter !== "all" ? (
                <EmptyStateCard
                  icon={Users}
                  title="This group is empty"
                  description="Nobody has been added to this group yet. Switch to All groups to see everyone, or add people from the Groups tab."
                />
              ) : (
                <EmptyStateCard
                  icon={Users}
                  title="No members yet"
                  description="Invite a teammate to get started."
                />
              )
            ) : (
              <div className="divide-y divide-border">
                {roster.members.map((member) => (
                  <div key={member.id}>
                    <MemberRow
                      member={member}
                      viewerUserId={user?.id}
                      canManage={canManage}
                      isOwnerViewer={isOwnerViewer}
                      actionPending={pendingMemberId === member.id}
                      onChangeRole={handleChangeRole}
                      onRemove={setRemoveTarget}
                      onTransferOwnership={setTransferTarget}
                    />
                    {(() => {
                      const p = progressFor.get(member.id);
                      const groupNames = (member.groups ?? []).map((g) => g.name);
                      // The labels come from the roster, which every member
                      // reads; the figures come from progress, which only a
                      // manager reads. Rendering them together but gating the
                      // whole row on `p` hid the labels from everyone else.
                      if (!p && groupNames.length === 0) return null;
                      return (
                        <div className="flex items-center justify-end gap-3 pb-3">
                          {groupNames.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {groupNames.join(", ")}
                            </span>
                          )}
                          {p && (
                            <>
                              <span className="text-xs tabular-nums text-muted-foreground">
                                {p.coursesCompleted} of {p.coursesStarted} courses
                              </span>
                              {p.isStalled && <Badge variant="secondary">Stalled</Badge>}
                              <button
                                type="button"
                                className="text-xs font-semibold text-primary hover:underline"
                                onClick={() => setOpenMemberId(member.id)}
                              >
                                View progress
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            )}

            {/* ── Invited, not yet joined ──
                A pending invite occupies a seat: it is counted in
                `usage.used`, which is what the "N of M seats used" line above
                reports. Until this section existed, an admin read "3 of 5"
                beside a list of one person, could not see who held the other
                two, and had no way to cancel a typo — the seat simply stayed
                gone for the fourteen days until the invite expired.

                Manager-only, because `invites` is only sent to OWNER/ADMIN. */}
            {canManage && (roster?.invites?.length ?? 0) > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Invited, not yet joined
                </p>
                <div className="divide-y divide-border">
                  {roster!.invites!.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {invite.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Holding a seat until they accept
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={revokingInviteId === invite.id}
                        onClick={() => handleRevokeInvite(invite.id)}
                      >
                        {revokingInviteId === invite.id
                          ? "Cancelling..."
                          : "Cancel invite"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {team && canManage && (
        <InviteDialog
          teamId={team.id}
          seatsAvailable={roster?.usage?.available ?? 0}
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          onInvited={refetchRoster}
        />
      )}

      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {removeTarget?.user.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This revokes their access immediately. They can be re-invited
              later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirmBusy}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmRemove();
              }}
              disabled={confirmBusy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!transferTarget}
        onOpenChange={(o) => !o && setTransferTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Transfer ownership to {transferTarget?.user.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They&apos;ll gain full control of this team, including
              billing. You&apos;ll be moved to admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirmBusy}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmTransfer();
              }}
              disabled={confirmBusy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Transfer ownership
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedTeamId && (
        <MemberProgressSheet
          teamId={selectedTeamId}
          memberId={openMemberId}
          open={openMemberId !== null}
          onOpenChange={(o) => !o && setOpenMemberId(null)}
        />
      )}

      {selectedTeamId && (
        <MemberProgressSheet
          teamId={selectedTeamId}
          memberId={null}
          asSelf
          open={selfProgressOpen}
          onOpenChange={setSelfProgressOpen}
        />
      )}
    </div>
  );
}
