"use client";

import { useEffect, useMemo, useRef } from "react";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { CheckCircle2, Flag, Rocket, Trophy, X } from "lucide-react";
import { CelebrationToast, useCelebrationDismiss } from "./celebration-toast";

type MilestoneEvent =
  | { kind: "percent"; bracket: 25 | 50 | 75 | 100 }
  | { kind: "topicCompleted"; title: string };

interface PathMilestoneModalProps {
  event: MilestoneEvent;
  onDone: () => void;
  // Noun for the copy: "path" (default) or "course".
  kind?: "path" | "course";
}

const bracketCopy = (
  noun: string,
  nounCap: string,
): Record<25 | 50 | 75 | 100, { headline: string; subtext: string }> => ({
  25: {
    headline: "Good start.",
    subtext: "You've laid the foundation. Momentum is on your side now.",
  },
  50: {
    headline: "Halfway there!",
    subtext: `You're halfway through the ${noun}. The hard part is behind you.`,
  },
  75: {
    headline: "Almost there!",
    subtext: "Three quarters done. The finish line is in sight.",
  },
  100: {
    headline: `${nounCap} complete!`,
    subtext: `You finished the entire ${noun}. Time to put it on your portfolio.`,
  },
});

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PathMilestoneModal({
  event,
  onDone,
  kind = "path",
}: PathMilestoneModalProps) {
  const noun = kind === "course" ? "course" : "path";
  const nounCap = kind === "course" ? "Course" : "Path";
  const topicCap = kind === "course" ? "Chapter" : "Topic";
  const firedRef = useRef(false);
  const dismiss = useCelebrationDismiss(onDone, 5000);

  // Silent confetti burst from the bottom-right corner, honoring reduced-motion.
  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    if (prefersReducedMotion()) return;

    confetti({
      particleCount: 55,
      spread: 70,
      startVelocity: 42,
      ticks: 120,
      angle: 135,
      origin: { x: 0.95, y: 0.95 },
      colors: ["#13AECE", "#2BB8D8", "#F2C94C"],
      disableForReducedMotion: true,
      zIndex: 100,
    });
  }, []);

  const { Icon, headline, subtext, eyebrow } = useMemo(() => {
    if (event.kind === "percent") {
      const copy = bracketCopy(noun, nounCap)[event.bracket];
      const PercentIcon =
        event.bracket === 100 ? Trophy : event.bracket === 25 ? Rocket : Flag;
      return {
        Icon: PercentIcon,
        headline: copy.headline,
        subtext: copy.subtext,
        eyebrow: `${event.bracket}% complete`,
      };
    }
    return {
      Icon: Trophy,
      headline: `${event.title} complete`,
      subtext: `${topicCap} mastered. Keep the streak alive and tackle the next one.`,
      eyebrow: `${topicCap} complete` as string | null,
    };
  }, [event, noun, nounCap, topicCap]);

  return (
    <CelebrationToast>
      {/* Brand accent header band */}
      <div className="relative flex items-center gap-3 bg-gradient-to-br from-primary to-[#2BB8D8] px-4 py-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/30"
          aria-hidden="true"
        >
          <Icon className="h-5 w-5 text-white" strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
              {eyebrow}
            </p>
          )}
          {event.kind === "percent" && (
            <p className="flex items-baseline gap-0.5 leading-none">
              <span className="text-2xl font-bold tracking-tight text-white">
                {event.bracket}
              </span>
              <span className="text-base font-bold text-[#F2C94C]">%</span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="px-4 pb-4 pt-3">
        <h2 className="text-base font-bold tracking-tight text-foreground">
          {headline}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {subtext}
        </p>

        {event.kind === "topicCompleted" && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#F2C94C]/15 px-2.5 py-1 text-xs font-medium text-[#946C00] dark:text-[#F2C94C]">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            {topicCap} completed
          </div>
        )}

        <button
          type="button"
          onClick={dismiss}
          className={cn(
            "mt-4 h-9 w-full rounded-lg border-0 text-sm font-semibold text-white",
            "bg-gradient-to-r from-primary to-[#2BB8D8] transition-opacity hover:opacity-90"
          )}
        >
          Keep going
        </button>
      </div>
    </CelebrationToast>
  );
}
