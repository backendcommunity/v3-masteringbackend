"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Loader } from "@/components/ui/loader";
import { EmptyStateCard } from "@/components/empty-state-card";
import { useAppStore } from "@/lib/store";
import { analytics } from "@/lib/analytics";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Clock, Trophy, ChevronUp, ChevronDown, Sparkles } from "lucide-react";
import {
  LeagueTierEmblem,
  TIER_CONFIG,
  type Tier,
} from "./league/league-tier";
import { useCountdown } from "./league/use-countdown";

interface LeaderboardPageProps {
  onNavigate: (path: string) => void;
}

interface CohortRow {
  userId: string;
  name: string;
  username?: string | null;
  avatar?: string | null;
  xp: number;
  rank: number;
  zone: "PROMOTE" | "STAY" | "DEMOTE";
  isMe: boolean;
}

interface League {
  tier: Tier;
  tierName: string;
  cohortRank: number;
  weeklyXp: number;
  zone: "PROMOTE" | "STAY" | "DEMOTE";
  weekEndsAt: string;
  ladder: Tier[];
  cohortSize: number;
  season: { key: string };
  cohort: CohortRow[];
}

export function LeaderboardPage({ onNavigate }: LeaderboardPageProps) {
  const store = useAppStore();
  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    analytics.track("league_viewed");
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(false);
        const data = await store.getLeague();
        if (cancelled) return;
        if (data?.cohort) setLeague(data);
        else setError(true);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store]);

  const countdown = useCountdown(league?.weekEndsAt);

  if (loading) return <Loader isLoader={false} />;

  if (error || !league) {
    return (
      <EmptyStateCard
        icon={Trophy}
        title="Your league is warming up"
        description="Earn some XP — finish a lesson, ship a project — and you'll join this week's league."
        primaryCTA={{
          label: "Browse courses",
          onClick: () => onNavigate(routes.courses),
        }}
      />
    );
  }

  const zoneCopy =
    league.zone === "PROMOTE"
      ? "You're in the promotion zone — hold it to climb."
      : league.zone === "DEMOTE"
        ? "You're in the demotion zone — earn XP to climb out."
        : "Keep earning XP to reach the promotion zone.";

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      {/* Standing hero */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0c1222] p-6 md:p-7 text-white">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="absolute -top-20 -left-16 w-44 h-44 bg-primary/15 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <LeagueTierEmblem tier={league.tier} size={52} />
            <div className="min-w-0">
              <div className="eyebrow-mono text-white/[.55]">MB League</div>
              <h1 className="text-2xl font-bold leading-tight">
                {league.tierName} League
              </h1>
            </div>
            <div className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-white/[.06] px-3 py-1.5 text-sm">
              <Clock className="w-4 h-4 opacity-70" />
              resets in {countdown}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div>
              <div className="text-3xl font-bold tabular-nums">
                #{league.cohortRank}
              </div>
              <div className="text-xs text-white/50">your rank</div>
            </div>
            <div>
              <div className="text-3xl font-bold tabular-nums">
                {league.weeklyXp.toLocaleString()}
              </div>
              <div className="text-xs text-white/50">XP this week</div>
            </div>
            <div className="ml-auto max-w-xs text-sm text-white/70">
              {zoneCopy}
            </div>
          </div>
        </div>
      </div>

      {/* Tier ladder strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {league.ladder.map((t) => {
          const active = t === league.tier;
          const cfg = TIER_CONFIG[t];
          return (
            <div
              key={t}
              className={cn(
                "flex-1 min-w-[110px] rounded-xl border px-3 py-2.5 flex items-center gap-2 transition-colors",
                active
                  ? "border-primary/50 bg-primary/5"
                  : "border-border bg-card",
              )}
            >
              <LeagueTierEmblem tier={t} size={28} />
              <span
                className={cn(
                  "text-xs font-semibold truncate",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Cohort board */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="font-semibold">This week&apos;s cohort</h2>
          <span className="text-xs text-muted-foreground">
            top 7 promote · bottom 5 demote
          </span>
        </div>
        <ul>
          {league.cohort.map((row, i) => {
            const prevZone = league.cohort[i - 1]?.zone;
            const showPromoteHeader = row.zone === "PROMOTE" && i === 0;
            const showDemoteHeader =
              row.zone === "DEMOTE" && prevZone !== "DEMOTE";
            return (
              <li key={row.userId}>
                {showPromoteHeader && (
                  <ZoneHeader kind="PROMOTE" label="Promotion zone" />
                )}
                {showDemoteHeader && (
                  <ZoneHeader kind="DEMOTE" label="Demotion zone" />
                )}
                <div
                  className={cn(
                    "flex items-center gap-3 px-5 py-2.5 border-b border-border last:border-0",
                    row.isMe && "bg-primary/5 ring-1 ring-inset ring-primary/30",
                    row.zone === "PROMOTE" && "bg-emerald-500/[.04]",
                    row.zone === "DEMOTE" && "bg-red-500/[.04]",
                  )}
                >
                  <span className="w-7 text-sm font-semibold tabular-nums text-muted-foreground">
                    {row.rank}
                  </span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={row.avatar || undefined} alt={row.name} />
                    <AvatarFallback className="text-xs">
                      {row.name?.charAt(0) ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      "flex-1 truncate text-sm",
                      row.isMe ? "font-bold" : "font-medium",
                    )}
                  >
                    {row.name}
                    {row.isMe && (
                      <span className="ml-1.5 text-xs text-primary">you</span>
                    )}
                  </span>
                  <div className="w-28 hidden sm:block">
                    <Progress
                      value={
                        league.cohort[0]?.xp
                          ? (row.xp / league.cohort[0].xp) * 100
                          : 0
                      }
                      className="h-1.5"
                    />
                  </div>
                  <span className="w-16 text-right text-sm font-semibold tabular-nums">
                    {row.xp.toLocaleString()}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Season strip */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-primary/10 to-[#9B59B6]/10 p-5 flex items-center gap-4">
        <div className="h-11 w-11 rounded-xl bg-[#F2C94C]/15 flex items-center justify-center text-[#F2C94C] shrink-0">
          <Trophy className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Season {league.season.key}
          </p>
          <p className="text-xs text-muted-foreground">
            Reach{" "}
            <span className="font-semibold text-foreground">Planet-Scale</span>{" "}
            and finish top of the apex tier this month to win the grand prize.
          </p>
        </div>
      </div>
    </div>
  );
}

function ZoneHeader({
  kind,
  label,
}: {
  kind: "PROMOTE" | "DEMOTE";
  label: string;
}) {
  const promote = kind === "PROMOTE";
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-5 py-1.5 text-[11px] font-bold uppercase tracking-wider",
        promote
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-red-500/10 text-red-600 dark:text-red-400",
      )}
    >
      {promote ? (
        <ChevronUp className="h-3.5 w-3.5" />
      ) : (
        <ChevronDown className="h-3.5 w-3.5" />
      )}
      {label}
    </div>
  );
}
