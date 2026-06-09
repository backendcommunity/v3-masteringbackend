"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { ArrowLeft, ArrowRight, Menu, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const subtitle = items.length > 1 ? items[items.length - 2] : items[0];

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
      {/* Left: brand + step title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden">
          <Image
            src={logoSrc}
            alt="Mastering Backend"
            width={26}
            height={26}
            className="object-contain"
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate leading-tight">
            {stepTitle}
          </p>
          {subtitle && subtitle !== stepTitle && (
            <p className="text-[11px] text-muted-foreground truncate leading-tight">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Center: linear nav */}
      <div className="flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8"
          onClick={onPrev}
          disabled={!hasPrev}
          title="Previous"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="sr-only">Previous</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs gap-1.5"
          onClick={onOpenOutline}
        >
          <Menu className="w-3.5 h-3.5" />
          Outline
          <span className="text-muted-foreground font-medium">
            · {position} / {total}
          </span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8"
          onClick={onNext}
          disabled={!hasNext}
          title="Next"
        >
          <ArrowRight className="w-4 h-4" />
          <span className="sr-only">Next</span>
        </Button>
      </div>

      {/* Right: points + mastery */}
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-bold glow-subtle">
          <Zap className="w-3.5 h-3.5" />
          {earnedPoints} pts
        </span>
        <span className="hidden sm:inline text-[11px] text-muted-foreground">
          {masteryPct}% mastery
        </span>
      </div>
    </header>
  );
}
