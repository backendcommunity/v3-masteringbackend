"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { ArrowLeft, ArrowRight, Menu, FileText, Trophy } from "lucide-react";

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
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const logoSrc =
    mounted && theme === "light" ? "/blue-icon-logo.png" : "/logo.png";

  // crumbs = [ "Learn", pathTitle, groupTitle, stepTitle ]
  const items = crumbs.filter(Boolean) as string[];
  const stepTitle = items[items.length - 1] ?? "Learning Path";
  const section = items.length > 2 ? items[items.length - 2] : items[1] ?? items[0];

  return (
    <header className="relative flex h-14 flex-none items-center justify-between border-b border-border bg-background px-4">
      {/* Left: brand + breadcrumb */}
      <div className="flex min-w-0 items-center gap-3">
        <Image
          src={logoSrc}
          alt="Mastering Backend"
          width={26}
          height={26}
          className="h-[26px] w-[26px] flex-none object-contain"
        />
        <p className="min-w-0 truncate text-sm">
          <span className="text-muted-foreground">Learn / </span>
          {section && (
            <span className="text-muted-foreground">{section} / </span>
          )}
          <span className="font-semibold text-foreground">{stepTitle}</span>
        </p>
      </div>

      {/* Center: segmented Course Outline pill */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <div className="inline-flex items-center overflow-hidden rounded-xl border border-border">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            title="Previous"
            className="flex h-9 w-9 items-center justify-center text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Previous</span>
          </button>
          <button
            type="button"
            onClick={onOpenOutline}
            className="flex h-9 items-center gap-2 border-l border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Menu className="h-4 w-4" />
            Course Outline
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            title="Next"
            className="flex h-9 w-9 items-center justify-center border-l border-border text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
          >
            <ArrowRight className="h-4 w-4" />
            <span className="sr-only">Next</span>
          </button>
        </div>
      </div>

      {/* Right: points + mastery */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notes"
          className="hidden h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
        >
          <FileText className="h-4 w-4" />
        </button>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
          <Trophy className="h-4 w-4 text-primary" />
          <span className="text-primary">{earnedPoints}</span>
          <span className="text-muted-foreground">pts</span>
        </span>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          · {masteryPct}%
        </span>
      </div>
    </header>
  );
}
