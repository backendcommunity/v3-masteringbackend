"use client";

import { MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";
import type { TeamMember } from "@/lib/data";

interface MemberRowProps {
  member: TeamMember;
  viewerUserId?: string;
  /** Viewer is OWNER or ADMIN — the only roles that see the actions menu. */
  canManage: boolean;
  /** Only the current OWNER can hand off ownership. */
  isOwnerViewer: boolean;
  /** Disables the row's actions while a request for THIS row is in flight. */
  actionPending?: boolean;
  onChangeRole: (member: TeamMember, role: "ADMIN" | "MEMBER") => void;
  onRemove: (member: TeamMember) => void;
  onTransferOwnership: (member: TeamMember) => void;
}

const ROLE_BADGE_VARIANT: Record<TeamMember["role"], "default" | "secondary" | "outline"> = {
  OWNER: "default",
  ADMIN: "secondary",
  MEMBER: "outline",
};

function formatJoined(date: string | Date): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function MemberRow({
  member,
  viewerUserId,
  canManage,
  isOwnerViewer,
  actionPending,
  onChangeRole,
  onRemove,
  onTransferOwnership,
}: MemberRowProps) {
  const isSelf = !!viewerUserId && member.user.id === viewerUserId;
  // An OWNER is never a valid target for any of these actions — ownership
  // only ever moves through transferOwnership (see academy's controller.ts).
  const showActions = canManage && member.role !== "OWNER";

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={member.user.avatar ?? undefined} alt="" />
          <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {member.user.name}
            {isSelf && <span className="text-muted-foreground"> (you)</span>}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {member.user.email}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <Badge variant={ROLE_BADGE_VARIANT[member.role]} className="capitalize">
          {member.role.toLowerCase()}
        </Badge>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Joined {formatJoined(member.joinedAt)}
        </span>

        {showActions ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={actionPending}
                aria-label={`Actions for ${member.user.name}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {member.role === "ADMIN" ? (
                <DropdownMenuItem onClick={() => onChangeRole(member, "MEMBER")}>
                  Change to member
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onChangeRole(member, "ADMIN")}>
                  Make admin
                </DropdownMenuItem>
              )}
              {isOwnerViewer && (
                <DropdownMenuItem onClick={() => onTransferOwnership(member)}>
                  Transfer ownership
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onRemove(member)}
                className="text-destructive focus:text-destructive"
              >
                Remove from team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          // Reserve the trigger's width so rows without a menu (the owner's
          // own row, or a plain MEMBER viewer) still line up in the grid.
          <span className="h-8 w-8" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
