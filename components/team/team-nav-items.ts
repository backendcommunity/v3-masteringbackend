import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Users, FolderTree, Map, ClipboardList, Trophy, Settings } from "lucide-react";
import { routes } from "@/lib/routes";

/**
 * Single source of truth for the Team Hub's navigation, shared by TeamRail
 * (which entries to show) and TeamHubLayout (which routes to guard). Two
 * copies of this list would drift.
 *
 * Entries for sub-projects 3 and 4 — Groups, custom paths, assignments,
 * insights — are ABSENT rather than disabled. A greyed-out menu item is a
 * promise with a date attached, and there is no date.
 */
export interface TeamNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  managerOnly: boolean;
}

export const TEAM_NAV_ITEMS: TeamNavItem[] = [
  // managerOnly: TRUE. The team report — "did this subscription do
  // anything" — lives on this tab now (folded in from the retired Reports
  // tab), so this gate is the whole security argument: a later change that
  // opens Overview to plain members has to confront a billing-visible
  // report sitting on it.
  { href: routes.teamOverview, label: "Overview", icon: LayoutDashboard, managerOnly: true },
  { href: routes.teamMembers, label: "Members", icon: Users, managerOnly: false },
  { href: routes.teamGroups, label: "Groups", icon: FolderTree, managerOnly: true },
  // managerOnly: FALSE. A member sees their team's paths and opens them —
  // only authoring (create/edit/archive/reorder) is manager-gated within the
  // page itself. Gating the tab on canManage is exactly the mistake
  // sub-project 3a shipped, where the API served a member's data and the UI
  // threw it away before it ever reached the screen.
  { href: routes.teamPaths, label: "Paths", icon: Map, managerOnly: false },
  // managerOnly: FALSE. Both audiences live here — a member sees what they
  // were given, a manager additionally sees the team's lists. Gating this tab
  // on canManage is exactly the mistake sub-project 3a shipped, where the API
  // served a member's group labels and the UI threw them away.
  { href: routes.teamAssignments, label: "Assignments", icon: ClipboardList, managerOnly: false },
  { href: routes.teamLeaderboard, label: "Leaderboard", icon: Trophy, managerOnly: false },
  { href: routes.teamSettings, label: "Settings", icon: Settings, managerOnly: true },
];
