"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";
import { Trophy, ArrowRight } from "lucide-react";

interface CohortRow {
  userId: string;
  name: string;
  avatar?: string | null;
  xp: number;
  rank: number;
  isMe: boolean;
}

interface League {
  joined: boolean;
  tierName: string;
  weeklyXp: number;
  joinThreshold: number;
  cohortRank?: number;
  cohort?: CohortRow[];
}

interface LeaguePanelProps {
  league: League | null;
}

const openPortfolio = (userId: string) =>
  window.open(routes.portfolio(userId), "_blank", "noopener,noreferrer");

export function LeaguePanel({ league }: LeaguePanelProps) {
  const router = useRouter();

  const header = (
    <div className="mb-3 flex items-baseline justify-between">
      <h3 className="text-base font-bold">Leaderboard</h3>
      <button
        onClick={() => router.push(routes.leaderboard)}
        className="text-xs font-bold text-primary hover:underline"
      >
        This week
      </button>
    </div>
  );

  // ---- not joined / no data → join-gate ----
  if (!league || !league.joined) {
    const weeklyXp = league?.weeklyXp ?? 0;
    const threshold = league?.joinThreshold ?? 150;
    const pct = Math.min(100, Math.round((weeklyXp / threshold) * 100));
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        {header}
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-semibold">
            Earn {threshold} MB this week to join the league
          </p>
          <div className="h-2 w-full max-w-[220px] overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {weeklyXp} / {threshold} MB
          </p>
          <button
            onClick={() => router.push(routes.leaderboard)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            View league <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  const cohort = league.cohort ?? [];
  const top3 = cohort.filter((r) => r.rank <= 3).slice(0, 3);
  const me = cohort.find((r) => r.isMe);
  const rows = [...top3];
  if (me && !top3.some((r) => r.userId === me.userId)) rows.push(me);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      {header}

      {/* Your standing */}
      <div className="mb-3 flex items-center gap-3 rounded-xl bg-primary/5 p-3">
        <div className="text-2xl font-bold text-primary">
          #{league.cohortRank ?? "—"}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold">You · {league.tierName}</div>
          <div className="text-xs text-muted-foreground">
            {league.weeklyXp.toLocaleString()} MB this week
          </div>
        </div>
      </div>

      <div>
        {rows.map((row) => (
          <button
            key={row.userId}
            onClick={() => openPortfolio(row.userId)}
            className={cn(
              "flex w-full items-center gap-3 border-b border-border px-1.5 py-2 text-left text-sm last:border-0 hover:bg-muted/40",
              row.isMe && "font-bold",
            )}
          >
            <span className="w-5 flex-shrink-0 font-bold text-muted-foreground">
              {row.rank}
            </span>
            <Avatar className="h-6 w-6">
              <AvatarImage src={row.avatar || undefined} alt={row.name} />
              <AvatarFallback className="text-[10px]">
                {row.name?.charAt(0) ?? "?"}
              </AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "min-w-0 flex-1 truncate",
                row.isMe ? "text-primary" : "font-medium",
              )}
            >
              {row.isMe ? "You" : row.name}
            </span>
            <span className="flex-shrink-0 text-xs font-bold text-muted-foreground">
              {row.xp.toLocaleString()}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
