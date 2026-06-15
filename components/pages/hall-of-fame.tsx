"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { EmptyStateCard } from "@/components/empty-state-card";
import { useAppStore } from "@/lib/store";
import { analytics } from "@/lib/analytics";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { ArrowLeft, Crown, Trophy, Medal, BookOpen } from "lucide-react";

interface HallOfFamePageProps {
  onNavigate: (path: string) => void;
}

interface HallRow {
  id: string;
  name: string;
  username?: string | null;
  avatar?: string | null;
  totalPoints: number;
  rank: number;
  totalCompletedCourses?: number;
  isCurrentUser?: boolean;
}

export function HallOfFamePage({ onNavigate }: HallOfFamePageProps) {
  const store = useAppStore();
  const [rows, setRows] = useState<HallRow[] | null>(null);
  const requested = useRef(false);

  useEffect(() => {
    analytics.track("hall_of_fame_viewed");
  }, []);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    let cancelled = false;
    (async () => {
      try {
        const data = await store.getHallOfFame();
        if (!cancelled)
          setRows(Array.isArray(data) ? data : (data?.users ?? []));
      } catch {
        if (!cancelled) setRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store]);

  if (!rows) return <Loader isLoader={false} />;

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);
  // Podium visual order: 2nd · 1st · 3rd
  const podium = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6">
      {/* Back to League */}
      <button
        onClick={() => onNavigate(routes.leaderboard)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to MB League
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0c1222] p-7 text-center text-white">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-56 bg-[#F2C94C]/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="h-12 w-12 rounded-2xl bg-[#F2C94C]/15 border border-[#F2C94C]/30 flex items-center justify-center text-[#F2C94C]">
            <Trophy className="h-6 w-6" />
          </div>
          <div className="eyebrow-mono text-white/[.55] mt-1">all-time</div>
          <h1 className="text-2xl md:text-3xl font-bold">Hall of Fame</h1>
          <p className="text-sm text-white/60 max-w-md">
            The all-time legends of MasteringBackend, ranked by total MB earned
            across every course, project, and challenge.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyStateCard
          icon={Trophy}
          title="No legends yet"
          description="The Hall of Fame fills as engineers rack up MB points. Be the first."
          primaryCTA={{
            label: "Start earning",
            onClick: () => onNavigate(routes.courses),
          }}
        />
      ) : (
        <>
          {/* Podium — top 3 */}
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-3 items-end">
              {podium.map((row) => {
                const place = row.rank; // 1 | 2 | 3
                const tall = place === 1;
                const ring =
                  place === 1
                    ? "ring-[#F2C94C]"
                    : place === 2
                      ? "ring-slate-400"
                      : "ring-amber-700";
                const badge =
                  place === 1
                    ? "bg-[#F2C94C] text-amber-950"
                    : place === 2
                      ? "bg-slate-300 text-slate-800"
                      : "bg-amber-700 text-amber-50";
                return (
                  <div
                    key={row.id}
                    className={cn(
                      "flex flex-col items-center rounded-2xl border bg-card p-4",
                      tall ? "pt-6 pb-7" : "pt-4",
                      row.isCurrentUser
                        ? "border-primary/40 ring-1 ring-primary/30"
                        : "border-border",
                    )}
                  >
                    <div className="relative">
                      {place === 1 && (
                        <Crown className="absolute -top-5 left-1/2 -translate-x-1/2 h-5 w-5 text-[#F2C94C]" />
                      )}
                      <Avatar
                        className={cn(
                          "ring-2 ring-offset-2 ring-offset-background",
                          tall ? "h-16 w-16" : "h-12 w-12",
                          ring,
                        )}
                      >
                        <AvatarImage src={row.avatar || undefined} alt={row.name} />
                        <AvatarFallback>{row.name?.charAt(0) ?? "?"}</AvatarFallback>
                      </Avatar>
                      <span
                        className={cn(
                          "absolute -bottom-1 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full text-[11px] font-bold flex items-center justify-center",
                          badge,
                        )}
                      >
                        {place}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "mt-3 text-sm font-semibold truncate max-w-full text-center",
                        tall ? "" : "text-[13px]",
                      )}
                    >
                      {row.name}
                      {row.isCurrentUser && (
                        <span className="ml-1 text-xs text-primary">you</span>
                      )}
                    </p>
                    <p className="text-xs font-bold text-[#F2C94C] tabular-nums mt-0.5">
                      {row.totalPoints?.toLocaleString() ?? 0} MB
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Ranked list — 4th onward */}
          {rest.length > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <ul>
                {rest.map((row) => (
                  <li
                    key={row.id}
                    className={cn(
                      "flex items-center gap-3 px-5 py-2.5 border-b border-border last:border-0",
                      row.isCurrentUser &&
                        "bg-primary/5 ring-1 ring-inset ring-primary/30",
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
                        row.isCurrentUser ? "font-bold" : "font-medium",
                      )}
                    >
                      {row.name}
                      {row.isCurrentUser && (
                        <span className="ml-1.5 text-xs text-primary">you</span>
                      )}
                    </span>
                    {row.totalCompletedCourses != null && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <BookOpen className="h-3 w-3" />
                        {row.totalCompletedCourses}
                      </span>
                    )}
                    <span className="w-20 text-right text-sm font-semibold tabular-nums">
                      {row.totalPoints?.toLocaleString() ?? 0} MB
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <div className="flex justify-center">
        <Button variant="outline" onClick={() => onNavigate(routes.leaderboard)}>
          <Medal className="mr-2 h-4 w-4" />
          Compete in MB League
        </Button>
      </div>
    </div>
  );
}
