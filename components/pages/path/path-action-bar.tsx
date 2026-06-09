"use client";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PathSessionStep } from "@/lib/path-types";

export type SegmentStatus = "DONE" | "CURRENT" | "UPCOMING";

export function PathActionBar({
  step,
  segments,
  segmentLabel,
  hasNext,
  onNext,
  onComplete,
}: {
  step?: PathSessionStep;
  segments: { status: SegmentStatus }[];
  segmentLabel: string;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onComplete: () => void;
}) {
  if (!step) return null;
  const isDone = step.status === "DONE";
  const atEnd = isDone && !hasNext;

  // One action: completes the step (which auto-advances), or moves on if already done.
  const handleNext = () => {
    if (isDone) {
      if (hasNext) onNext();
    } else {
      onComplete();
    }
  };

  return (
    <div className="relative z-10 flex flex-shrink-0 items-center bg-background/85 px-8 py-4 lg:px-12 backdrop-blur">
      {/* Centered milestone progress */}
      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1.5">
        {segments.map((s, i) => (
          <span
            key={i}
            className={`h-1.5 w-8 rounded-full ${
              s.status === "DONE"
                ? "bg-gradient-to-r from-[#347474] to-[#5fb0b0]"
                : s.status === "CURRENT"
                  ? "bg-gradient-to-r from-primary to-[#2BB8D8] glow-subtle"
                  : "bg-muted"
            }`}
          />
        ))}
        <span className="ml-2 text-xs text-muted-foreground">
          {segmentLabel}
        </span>
      </div>

      <span className="flex-1" />

      <Button
        type="button"
        onClick={handleNext}
        disabled={atEnd}
        className="btn-primary glow-subtle h-11 px-6 text-sm font-bold disabled:pointer-events-none disabled:opacity-40"
      >
        Next <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>
    </div>
  );
}
