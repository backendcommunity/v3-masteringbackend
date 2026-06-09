"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { ArrowLeft, ArrowRight, Menu, MoreVertical, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PathSessionStep } from "@/lib/path-types";
import { PathHelpSheet } from "./path-help-sheet";
import { PathFeedbackDialog } from "./path-feedback-dialog";
import { PathCodeSheet } from "./path-code-sheet";
import { PathResourceSheet } from "./path-resource-sheet";

export interface Crumb {
  label?: string;
  href?: string;
}

export interface PathTopBarProps {
  crumbs: Crumb[];
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
  onNavigate: (path: string) => void;
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
  onNavigate,
}: PathTopBarProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => setMounted(true), []);
  const logoSrc =
    mounted && theme === "light" ? "/blue-icon-logo.png" : "/logo.png";

  // crumbs = [ Learn, pathTitle, groupTitle, stepTitle ]
  const items = crumbs.filter((c) => c?.label);
  const stepTitle = items[items.length - 1]?.label ?? "Learning Path";
  const context = items.slice(0, -1); // [ Context, pathTitle, courseName ]

  const outlineButton = (
    <Button
      variant="outline"
      size="sm"
      className="h-8 px-2.5 text-xs gap-1.5 min-w-0 max-w-[420px]"
      onClick={onOpenOutline}
      title="Open outline"
    >
      <Menu className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="truncate font-medium text-foreground">{stepTitle}</span>
    </Button>
  );

  return (
    <header className="flex items-center justify-between gap-2 px-4 py-3 sm:px-6 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
      {/* Left: brand + (desktop) breadcrumb / (mobile) outline */}
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
        <nav className="hidden md:flex min-w-0 items-center gap-1.5 text-sm">
          {context.map((c, i) => {
            const last = i === context.length - 1;
            const base = `truncate ${
              last ? "font-semibold text-foreground" : "text-muted-foreground"
            }`;
            return (
              <span key={i} className="flex items-center gap-1.5 min-w-0">
                {c.href ? (
                  <button
                    type="button"
                    onClick={() => onNavigate(c.href!)}
                    className={`${base} underline-offset-2 hover:text-foreground hover:underline`}
                  >
                    {c.label}
                  </button>
                ) : (
                  <span className={base}>{c.label}</span>
                )}
                {!last && <span className="text-muted-foreground/50">/</span>}
              </span>
            );
          })}
        </nav>
        {/* Mobile: course outline sits inline next to the logo */}
        <div className="md:hidden min-w-0">{outlineButton}</div>
      </div>

      {/* Center: step-title pagination (desktop only) */}
      <div className="hidden md:flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2 max-w-[50vw]">
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
        {outlineButton}
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

      {/* Right: full cluster on desktop, collapsed menu on mobile */}
      <div className="hidden md:flex items-center gap-3">
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

      {/* Mobile: everything else behind a single menu */}
      <div className="relative md:hidden flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9"
          onClick={() => setMobileOpen((v) => !v)}
          title="More"
          aria-expanded={mobileOpen}
        >
          <MoreVertical className="w-5 h-5" />
          <span className="sr-only">More</span>
        </Button>
        {mobileOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-popover p-2 shadow-lg">
              <div className="flex items-center justify-between rounded-lg px-2 py-2">
                <span className="text-xs text-muted-foreground">Points</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-bold">
                  <Zap className="w-3.5 h-3.5" />
                  {earnedPoints} pts
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onPrev();
                  setMobileOpen(false);
                }}
                disabled={!hasPrev}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
              <button
                type="button"
                onClick={() => {
                  onNext();
                  setMobileOpen(false);
                }}
                disabled={!hasNext}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
              >
                <ArrowRight className="w-4 h-4" /> Next
              </button>
              <div className="my-1 h-px bg-border" />
              <div className="flex items-center justify-around px-1 py-1">
                {step?.type !== "EXERCISE" && <PathCodeSheet step={step} />}
                <PathResourceSheet step={step} />
                <PathHelpSheet />
                <PathFeedbackDialog />
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
