"use client";

import { useCallback, useEffect, useState } from "react";
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
import { useUser } from "@/hooks/use-user";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import type { TeamMember, TeamRoster, TeamSummary } from "@/lib/data";
import { AlertTriangle, UserPlus, Users } from "lucide-react";

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
  const [confirmBusy, setConfirmBusy] = useState(false);

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

  const loadRoster = useCallback(async (teamId: string) => {
    setRosterLoading(true);
    setRosterError(false);
    try {
      const data = await store.getTeamMembers(teamId);
      setRoster(data);
    } catch {
      setRosterError(true);
    } finally {
      setRosterLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedTeamId) loadRoster(selectedTeamId);
  }, [selectedTeamId, loadRoster]);

  const team = teams.find((t) => t.id === selectedTeamId) ?? null;
  const canManage = team?.role === "OWNER" || team?.role === "ADMIN";
  const isOwnerViewer = team?.role === "OWNER";

  const refetchRoster = () => {
    if (selectedTeamId) loadRoster(selectedTeamId);
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
            onClick: () => onNavigate(routes.pricing(routes.team)),
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-6 md:py-8">
      <div>
        <h1 className="text-3xl font-bold md:text-4xl">Team</h1>
        <p className="mt-1 text-muted-foreground">
          Manage who has access to your team&apos;s subscription.
        </p>
      </div>

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
              <CardTitle>{team.name}</CardTitle>
              <CardDescription>
                {roster?.usage
                  ? `${roster.usage.used} / ${roster.usage.paidSeats} seats used`
                  : "Team roster"}
              </CardDescription>
            </div>
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
          </CardHeader>
          <CardContent>
            {rosterLoading ? (
              <PageSkeleton rows={3} />
            ) : rosterError ? (
              <EmptyStateCard
                icon={AlertTriangle}
                title="Couldn't load the roster"
                description="Something went wrong loading this team's members."
                primaryCTA={{ label: "Try again", onClick: refetchRoster }}
              />
            ) : !roster || roster.members.length === 0 ? (
              <EmptyStateCard
                icon={Users}
                title="No members yet"
                description="Invite a teammate to get started."
              />
            ) : (
              <div className="divide-y divide-border">
                {roster.members.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    viewerUserId={user?.id}
                    canManage={canManage}
                    isOwnerViewer={isOwnerViewer}
                    actionPending={pendingMemberId === member.id}
                    onChangeRole={handleChangeRole}
                    onRemove={setRemoveTarget}
                    onTransferOwnership={setTransferTarget}
                  />
                ))}
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
    </div>
  );
}
