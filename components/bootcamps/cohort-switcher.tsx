"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MyCohort } from "@/lib/data";

/**
 * The selected cohort lives in `?cohort=` so detail, dashboard, week,
 * leaderboard and certificate pages all agree on it and links survive
 * a refresh. Absent param = let the API pick (most recent incomplete).
 */
export function useCohortParam() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const cohortId = searchParams?.get("cohort") ?? null;

  const setCohortId = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(searchParams?.toString());
      if (id) next.set("cohort", id);
      else next.delete("cohort");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  /** Append the current cohort param to an in-app path. */
  const withCohort = useCallback(
    (path: string) =>
      cohortId ? `${path}${path.includes("?") ? "&" : "?"}cohort=${cohortId}` : path,
    [cohortId],
  );

  return { cohortId, setCohortId, withCohort };
}

interface CohortSwitcherProps {
  cohorts: MyCohort[] | undefined;
  value: string | undefined;
  onChange: (id: string) => void;
  className?: string;
}

export function CohortSwitcher({ cohorts, value, onChange, className }: CohortSwitcherProps) {
  if (!cohorts || cohorts.length < 2 || !value) return null;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label="Switch cohort"
        className={className ?? "h-8 w-auto min-w-[10rem] text-xs"}
      >
        {/* Explicit children: without them Radix mirrors the whole
            SelectItem through ItemText, so the per-item status span would
            leak into the closed trigger ("Cohort 2 open"). */}
        <SelectValue placeholder="Cohort">
          {cohorts.find((c) => c.id === value)?.name ?? "Cohort"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {cohorts.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
            <span className="ml-2 text-[10px] uppercase text-muted-foreground">
              {c.completed ? "completed" : c.status.toLowerCase()}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
