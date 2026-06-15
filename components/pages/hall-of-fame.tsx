"use client";

import { useEffect, useState } from "react";
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

// Open a user's portfolio in a new tab.
const openPortfolio = (userId: string) =>
  window.open(routes.portfolio(userId), "_blank", "noopener,noreferrer");

// Deterministic avatar tint (used when a user has no avatar image).
const AVATAR_PALETTE = [
  "#13AECE",
  "#9B59B6",
  "#27AE60",
  "#F2C94C",
  "#e26d5c",
  "#5c7cfa",
  "#f06595",
  "#20c997",
  "#845ef7",
  "#fa5252",
];
const tintFor = (rank: number) =>
  AVATAR_PALETTE[(rank - 1) % AVATAR_PALETTE.length];

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

  useEffect(() => {
    analytics.track("hall_of_fame_viewed");
  }, []);

  useEffect(() => {
    let active = true;
    store
      .getHallOfFame()
      .then((data) => {
        if (active) setRows(Array.isArray(data) ? data : (data?.users ?? []));
      })
      .catch(() => {
        if (active) setRows([]);
      });
    return () => {
      active = false;
    };
  }, [store]);

  if (!rows) return <Loader isLoader={false} />;

  // The board is the top 100; an off-board current user (rank > 100) is appended
  // by the API — pull them out so they render as a pinned "your standing" row
  // instead of inline with a jarring rank gap.
  const board = rows.filter((r) => r.rank <= 100);
  const offBoardMe =
    rows.find((r) => r.isCurrentUser && r.rank > 100) ?? null;

  const top3 = board.slice(0, 3);
  const rest = board.slice(3);
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
            <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end">
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
                    role="link"
                    tabIndex={0}
                    onClick={() => openPortfolio(row.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") openPortfolio(row.id);
                    }}
                    className={cn(
                      "flex flex-col items-center rounded-2xl border bg-card p-2.5 sm:p-4 cursor-pointer transition-shadow hover:shadow-md",
                      tall ? "pt-5 pb-6 sm:pt-6 sm:pb-7" : "pt-3 sm:pt-4",
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
                          tall ? "h-12 w-12 sm:h-16 sm:w-16" : "h-10 w-10 sm:h-12 sm:w-12",
                          ring,
                        )}
                      >
                        <AvatarImage src={row.avatar || undefined} alt={row.name} />
                        <AvatarFallback
                          style={{ background: tintFor(row.rank), color: "#fff" }}
                        >
                          {row.name?.charAt(0) ?? "?"}
                        </AvatarFallback>
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
                        "mt-3 text-xs sm:text-sm font-semibold truncate max-w-full text-center",
                        tall ? "" : "sm:text-[13px]",
                      )}
                    >
                      {row.name}
                      {row.isCurrentUser && (
                        <span className="ml-1 text-xs text-primary">you</span>
                      )}
                    </p>
                    <p className="text-[11px] sm:text-xs font-bold text-[#F2C94C] tabular-nums mt-0.5 truncate max-w-full text-center">
                      {row.totalPoints?.toLocaleString() ?? 0} MB
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Ranked list — 4th onward (contained scroll for long boards) */}
          {rest.length > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <ul className="max-h-[520px] overflow-y-auto">

                {rest.map((row) => (
                  <li
                    key={row.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => openPortfolio(row.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") openPortfolio(row.id);
                    }}
                    className={cn(
                      "flex items-center gap-3 px-5 py-2.5 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors",
                      row.isCurrentUser &&
                        "bg-primary/5 ring-1 ring-inset ring-primary/30",
                    )}
                  >
                    <span className="w-7 text-sm font-semibold tabular-nums text-muted-foreground">
                      {row.rank}
                    </span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={row.avatar || undefined} alt={row.name} />
                      <AvatarFallback
                        className="text-xs"
                        style={{ background: tintFor(row.rank), color: "#fff" }}
                      >
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

          {/* Pinned "your standing" when the viewer isn't in the top 100 */}
          {offBoardMe && (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 overflow-hidden">
              <div className="px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Your standing
              </div>
              <div
                role="link"
                tabIndex={0}
                onClick={() => openPortfolio(offBoardMe.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") openPortfolio(offBoardMe.id);
                }}
                className="flex items-center gap-3 px-5 py-2.5 border-t border-border cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <span className="w-12 text-sm font-bold tabular-nums text-primary">
                  #{offBoardMe.rank.toLocaleString()}
                </span>
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={offBoardMe.avatar || undefined}
                    alt={offBoardMe.name}
                  />
                  <AvatarFallback className="text-xs">
                    {offBoardMe.name?.charAt(0) ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-sm font-bold">
                  {offBoardMe.name}
                  <span className="ml-1.5 text-xs text-primary">you</span>
                </span>
                <span className="w-20 text-right text-sm font-semibold tabular-nums">
                  {offBoardMe.totalPoints?.toLocaleString() ?? 0} MB
                </span>
              </div>
              <p className="px-5 pb-3 pt-1 text-xs text-muted-foreground">
                Break into the top 100 to enter the Hall of Fame.
              </p>
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
