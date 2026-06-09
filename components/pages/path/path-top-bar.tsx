"use client";
import { ArrowLeft, ArrowRight, Menu, Zap } from "lucide-react";

export interface PathTopBarProps {
  crumbs: (string | undefined)[];
  position: number;
  total: number;
  earnedPoints: number;
  masteryPct: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onOpenOutline: () => void;
}

export function PathTopBar({
  crumbs,
  position,
  total,
  earnedPoints,
  masteryPct,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onOpenOutline,
}: PathTopBarProps) {
  const items = crumbs.filter(Boolean) as string[];

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b bg-background/70 px-4 backdrop-blur">
      {/* Brand + breadcrumb */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand text-[11px] font-extrabold text-[#06222b] glow-subtle">
          MB
        </div>
        <div className="flex min-w-0 items-center gap-2 truncate text-xs text-muted-foreground">
          {items.map((c, i) => {
            const last = i === items.length - 1;
            return (
              <span
                key={`${c}-${i}`}
                className="flex min-w-0 items-center gap-2"
              >
                <span
                  className={
                    last
                      ? "truncate font-semibold text-foreground"
                      : "truncate"
                  }
                >
                  {c}
                </span>
                {!last && <span className="opacity-40">/</span>}
              </span>
            );
          })}
        </div>
      </div>

      {/* Nav cluster */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          title="Previous"
          onClick={onPrev}
          disabled={!hasPrev}
          className="grid h-9 w-9 place-items-center rounded-lg border bg-card text-foreground transition-colors enabled:hover:border-primary enabled:hover:text-primary disabled:pointer-events-none disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onOpenOutline}
          className="flex h-9 items-center gap-2 rounded-lg border bg-card px-3.5 text-[13px] font-semibold transition-colors hover:border-primary"
        >
          <Menu className="h-4 w-4" />
          <span className="hidden sm:inline">Path Outline</span>
          <span className="text-xs font-medium text-muted-foreground">
            · {position} / {total}
          </span>
        </button>
        <button
          type="button"
          title="Next"
          onClick={onNext}
          disabled={!hasNext}
          className="grid h-9 w-9 place-items-center rounded-lg border bg-card text-foreground transition-colors enabled:hover:border-primary enabled:hover:text-primary disabled:pointer-events-none disabled:opacity-40"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Utils */}
      <div className="flex items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary glow-subtle">
          <Zap className="h-3.5 w-3.5" />
          {earnedPoints} pts
        </span>
        <div
          title={`Mastery ${masteryPct}%`}
          className="relative grid h-[30px] w-[30px] place-items-center rounded-full"
          style={{
            background: `conic-gradient(hsl(var(--primary)) ${masteryPct}%, hsl(var(--muted)) 0)`,
          }}
        >
          <div className="absolute inset-[3px] rounded-full bg-background" />
          <span className="relative text-[9px] font-bold text-primary">
            {masteryPct}%
          </span>
        </div>
      </div>
    </header>
  );
}
