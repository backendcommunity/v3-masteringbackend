"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { Sparkles, X } from "lucide-react";

interface PathStepRibbonProps {
  nextTitle?: string | null;
  onDone: () => void;
}

const AUTO_DISMISS_MS = 2500;
const EXIT_ANIMATION_MS = 220;

const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export function PathStepRibbon({ nextTitle, onDone }: PathStepRibbonProps) {
  const [exiting, setExiting] = useState(false);

  const autoDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneCalled = useRef(false);

  const finish = useCallback(() => {
    if (doneCalled.current) return;
    doneCalled.current = true;
    onDone();
  }, [onDone]);

  const dismiss = useCallback(() => {
    if (doneCalled.current || exiting) return;

    if (autoDismissTimer.current) {
      clearTimeout(autoDismissTimer.current);
      autoDismissTimer.current = null;
    }

    if (prefersReducedMotion()) {
      finish();
      return;
    }

    setExiting(true);
    exitTimer.current = setTimeout(finish, EXIT_ANIMATION_MS);
  }, [exiting, finish]);

  // One-shot soft confetti burst on mount (skipped for reduced motion).
  useEffect(() => {
    if (prefersReducedMotion()) return;
    confetti({
      particleCount: 40,
      spread: 55,
      startVelocity: 28,
      gravity: 0.9,
      ticks: 90,
      origin: { y: 0.1 },
      colors: ["#13AECE", "#2BB8D8", "#F2C94C"],
      disableForReducedMotion: true,
    });
  }, []);

  // Auto-dismiss after a short delay.
  useEffect(() => {
    autoDismissTimer.current = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => {
      if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current);
      if (exitTimer.current) clearTimeout(exitTimer.current);
    };
  }, [dismiss]);

  const message = nextTitle
    ? `Unlocked: ${nextTitle}`
    : "Step complete — next unlocked";

  return (
    <div
      // Container spans top-center but never blocks the page — only the
      // dismiss button below re-enables pointer events.
      className="pointer-events-none fixed left-1/2 top-4 z-50 -translate-x-1/2"
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-full border border-border bg-card/95 py-2 pl-3 pr-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80",
          "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-4 motion-safe:duration-300",
          exiting &&
            "motion-safe:animate-out motion-safe:fade-out-0 motion-safe:slide-out-to-top-2 motion-safe:duration-200"
        )}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        </span>

        <span className="max-w-[16rem] truncate text-sm font-medium text-foreground">
          {message}
        </span>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="pointer-events-auto ml-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
