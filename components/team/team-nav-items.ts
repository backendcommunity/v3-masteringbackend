import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Users, Trophy, Settings } from "lucide-react";
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
  { href: routes.teamOverview, label: "Overview", icon: LayoutDashboard, managerOnly: true },
  { href: routes.teamMembers, label: "Members", icon: Users, managerOnly: false },
  { href: routes.teamLeaderboard, label: "Leaderboard", icon: Trophy, managerOnly: false },
  { href: routes.teamSettings, label: "Settings", icon: Settings, managerOnly: true },
];
