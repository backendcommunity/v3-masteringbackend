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

  const segClass = (status: SegmentStatus) =>
    status === "DONE"
      ? "bg-gradient-to-r from-[#347474] to-[#5fb0b0]"
      : status === "CURRENT"
        ? "bg-gradient-to-r from-primary to-[#2BB8D8]"
        : "bg-muted-foreground/30";

  // Centers the dashes when they fit, scrolls horizontally when they overflow.
  // min-w-full + justify-center keeps a short track centered; w-max lets a long
  // track grow past the container and scroll instead of colliding with Next.
  const track = (
    <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="mx-auto flex w-max min-w-full items-center justify-center gap-1.5 px-1">
        {segments.map((s, i) => (
          <span
            key={i}
            className={`h-1.5 w-8 shrink-0 rounded-full ${segClass(s.status)}`}
          />
        ))}
      </div>
    </div>
  );

  // Compact bar (e.g. exercise IDE owns its own Submit) — just centered progress.
  if (hideNext) {
    return (
      <div className="flex w-full min-w-0 flex-shrink-0 items-center bg-transparent px-4 py-2 sm:px-8">
        {track}
      </div>
    );
  }

  return (
    <div className="z-10 flex w-full min-w-0 flex-shrink-0 items-center gap-3 bg-transparent px-4 py-3 sm:px-8 sm:py-4 lg:px-16">
      {track}

      <Button
        type="button"
        onClick={handleNext}
        disabled={atEnd}
        className="h-11 shrink-0 rounded-xl bg-gradient-to-br from-primary to-[#2BB8D8] px-6 text-sm font-extrabold text-[#06222b] shadow-[0_6px_20px_-4px_rgba(19,174,206,0.5)] hover:brightness-110 hover:from-primary hover:to-[#2BB8D8] disabled:pointer-events-none disabled:opacity-40"
      >
        Next <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>
    </div>
  );
}
