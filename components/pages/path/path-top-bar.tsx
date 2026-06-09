"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { ArrowLeft, ArrowRight, Menu, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PathSessionStep } from "@/lib/path-types";
import { PathHelpSheet } from "./path-help-sheet";
import { PathFeedbackDialog } from "./path-feedback-dialog";
import { PathCodeSheet } from "./path-code-sheet";
import { PathResourceSheet } from "./path-resource-sheet";

export interface PathTopBarProps {
  crumbs: (string | undefined)[];
  position: number;
  total: number;
  earnedPoints: number;
  masteryPct: number;
  step?: PathSessionStep;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onOpenOutline: () => void;
}

export function PathTopBar({
  crumbs,
  earnedPoints,
  step,
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
  const context = items.slice(0, -1); // [ Learn, pathTitle, groupTitle ]

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
      {/* Left: brand + context breadcrumb */}
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
        <nav className="min-w-0 flex items-center gap-1.5 text-sm">
          {context.map((c, i) => {
            const last = i === context.length - 1;
            return (
              <span key={i} className="flex items-center gap-1.5 min-w-0">
                <span
                  className={`truncate ${
                    last
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {c}
                </span>
                {!last && <span className="text-muted-foreground/50">/</span>}
              </span>
            );
          })}
        </nav>
      </div>

      {/* Center: step-title pagination (prev · outline+title+position · next) */}
      <div className="flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2 max-w-[50vw]">
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 flex-shrink-0"
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
          className="h-8 px-3 text-xs gap-1.5 min-w-0 max-w-[420px]"
          onClick={onOpenOutline}
          title="Open outline"
        >
          <Menu className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate font-medium text-foreground">
            {stepTitle}
          </span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 flex-shrink-0"
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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-bold">
          <Zap className="w-3.5 h-3.5" />
          {earnedPoints} pts
        </span>
        <div className="flex items-center gap-0.5">
          {/* Exercise steps already are a code editor — hide the slide-in one. */}
          {step?.type !== "EXERCISE" && <PathCodeSheet step={step} />}
          <PathResourceSheet step={step} />
          <PathHelpSheet />
          <PathFeedbackDialog />
        </div>
      </div>
    </header>
  );
}
