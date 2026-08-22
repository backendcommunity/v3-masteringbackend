"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { TeamRole } from "@/lib/data";
import { TEAM_NAV_ITEMS } from "./team-nav-items";

/**
 * The Team Hub's own navigation.
 *
 * Entries for sub-projects 3 and 4 — Groups, custom paths, assignments,
 * insights — are ABSENT rather than disabled. A greyed-out menu item is a
 * promise with a date attached, and there is no date.
 */
export function TeamRail({
  teamName,
  role,
}: {
  teamName: string;
  role: TeamRole;
}) {
  const pathname = usePathname();
  const canManage = role === "OWNER" || role === "ADMIN";

  return (
    <nav aria-label="Team" className="flex flex-col gap-1">
      <div className="px-3 pb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Team
        </p>
        <p className="truncate text-sm font-semibold text-foreground" title={teamName}>
          {teamName}
        </p>
      </div>

      {TEAM_NAV_ITEMS.filter((i) => canManage || !i.managerOnly).map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary/10 font-semibold text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
