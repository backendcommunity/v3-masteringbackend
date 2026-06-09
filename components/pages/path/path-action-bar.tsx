"use client";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PathSessionStep } from "@/lib/path-types";

export type SegmentStatus = "DONE" | "CURRENT" | "UPCOMING";

export function PathActionBar({
  step,
  segments,
  hasNext,
  onNext,
  onComplete,
  hideNext = false,
}: {
  step?: PathSessionStep;
  segments: { status: SegmentStatus }[];
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onComplete: () => void;
  hideNext?: boolean;
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

  // Compact bar (e.g. exercise IDE owns its own Submit) — just centered progress.
  if (hideNext) {
    return (
      <div className="flex flex-shrink-0 items-center justify-center bg-transparent px-8 py-2">
        <div className="flex items-center gap-1.5">
          {segments.map((s, i) => (
            <span
              key={i}
              className={`h-1.5 w-8 rounded-full ${
                s.status === "DONE"
                  ? "bg-gradient-to-r from-[#347474] to-[#5fb0b0]"
                  : s.status === "CURRENT"
                    ? "bg-gradient-to-r from-[#13AECE] to-[#2BB8D8]"
                    : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex flex-shrink-0 items-center bg-transparent px-8 py-4 lg:px-16">
      {/* Centered milestone progress */}
      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1.5">
        {segments.map((s, i) => (
          <span
            key={i}
            className={`h-1.5 w-8 rounded-full ${
              s.status === "DONE"
                ? "bg-gradient-to-r from-[#347474] to-[#5fb0b0]"
                : s.status === "CURRENT"
                  ? "bg-gradient-to-r from-[#13AECE] to-[#2BB8D8]"
                  : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      <span className="flex-1" />

      <Button
        type="button"
        onClick={handleNext}
        disabled={atEnd}
        className="h-11 rounded-xl bg-gradient-to-br from-[#13AECE] to-[#2BB8D8] px-6 text-sm font-extrabold text-[#06222b] shadow-[0_6px_20px_-4px_rgba(19,174,206,0.5)] hover:brightness-110 hover:from-[#13AECE] hover:to-[#2BB8D8] disabled:pointer-events-none disabled:opacity-40"
      >
        Next <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>
    </div>
  );
}
