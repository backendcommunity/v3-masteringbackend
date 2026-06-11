"use client";

import { useEffect, useMemo, useRef } from "react";
import confetti from "canvas-confetti";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, Flag, Rocket, Trophy } from "lucide-react";

type MilestoneEvent =
  | { kind: "percent"; bracket: 25 | 50 | 75 | 100 }
  | { kind: "topicCompleted"; title: string };

interface PathMilestoneModalProps {
  event: MilestoneEvent;
  onDone: () => void;
}

const BRACKET_COPY: Record<
  25 | 50 | 75 | 100,
  { headline: string; subtext: string }
> = {
  25: {
    headline: "Great start!",
    subtext: "You've laid the foundation. Momentum is on your side now.",
  },
  50: {
    headline: "Halfway there!",
    subtext: "You're halfway through the path. The hard part is behind you.",
  },
  75: {
    headline: "Almost there!",
    subtext: "Three quarters done. The finish line is in sight.",
  },
  100: {
    headline: "Path complete!",
    subtext: "You finished the entire path. Time to put it on your portfolio.",
  },
};

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PathMilestoneModal({ event, onDone }: PathMilestoneModalProps) {
  const firedRef = useRef(false);

  // Silent confetti burst on open, honoring reduced-motion.
  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    if (prefersReducedMotion()) return;

    const colors = ["#13AECE", "#2BB8D8", "#F2C94C"];
    const burst = (originX: number, angle: number) =>
      confetti({
        particleCount: 60,
        spread: 70,
        startVelocity: 45,
        ticks: 120,
        angle,
        origin: { x: originX, y: 0.6 },
        colors,
        disableForReducedMotion: true,
        zIndex: 100,
      });

    burst(0.3, 60);
    burst(0.7, 120);
    const followUp = window.setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 100,
        startVelocity: 35,
        ticks: 120,
        origin: { x: 0.5, y: 0.4 },
        colors,
        disableForReducedMotion: true,
        zIndex: 100,
      });
    }, 180);

    return () => window.clearTimeout(followUp);
  }, []);

  const { Icon, headline, subtext, eyebrow } = useMemo(() => {
    if (event.kind === "percent") {
      const copy = BRACKET_COPY[event.bracket];
      const PercentIcon =
        event.bracket === 100
          ? Trophy
          : event.bracket === 25
          ? Rocket
          : Flag;
      return {
        Icon: PercentIcon,
        headline: copy.headline,
        subtext: copy.subtext,
        eyebrow: `${event.bracket}%`,
      };
    }
    return {
      Icon: Trophy,
      headline: `${event.title} complete`,
      subtext: "Topic mastered. Keep the streak alive and tackle the next one.",
      eyebrow: null as string | null,
    };
  }, [event]);

  return (
    <Dialog open onOpenChange={(open) => !open && onDone()}>
      <DialogContent
        className={cn(
          "max-w-sm gap-0 overflow-hidden rounded-2xl border-border bg-card p-0",
          "text-center"
        )}
      >
        {/* Brand accent header band */}
        <div className="relative bg-gradient-to-br from-[#13AECE] to-[#2BB8D8] px-6 pb-6 pt-8">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/30 backdrop-blur-sm"
            aria-hidden="true"
          >
            <Icon className="h-8 w-8 text-white" strokeWidth={2.25} />
          </div>

          {event.kind === "percent" && (
            <div className="mt-4 flex items-baseline justify-center gap-0.5">
              <span className="text-5xl font-extrabold leading-none tracking-tight text-white">
                {event.bracket}
              </span>
              <span className="text-2xl font-bold text-[#F2C94C]">%</span>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-5">
          <h2
            id="path-milestone-title"
            className="text-xl font-bold tracking-tight text-foreground"
          >
            {headline}
          </h2>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {subtext}
          </p>

          {event.kind === "topicCompleted" && (
            <div className="mx-auto mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#F2C94C]/15 px-3 py-1 text-xs font-medium text-[#946C00] dark:text-[#F2C94C]">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Topic completed
            </div>
          )}

          <Button
            onClick={onDone}
            className={cn(
              "mt-6 h-11 w-full rounded-xl border-0 text-base font-semibold text-white",
              "bg-gradient-to-r from-[#13AECE] to-[#2BB8D8]",
              "transition-opacity hover:opacity-90"
            )}
          >
            Keep going
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
