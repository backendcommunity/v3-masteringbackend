"use client";
import { ArrowLeft, ArrowRight, Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PathSessionStep } from "@/lib/path-types";

export type SegmentStatus = "DONE" | "CURRENT" | "UPCOMING";

export function PathActionBar({
  step,
  segments,
  segmentLabel,
  hasPrev,
  hasNext,
  onPrev,
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

  return (
    <div className="flex-shrink-0 z-10 flex items-center gap-5 border-t border-border bg-background/85 px-6 py-3 backdrop-blur">
      {/* Segmented milestone progress */}
      <div className="flex items-center gap-1.5">
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
        <span className="ml-1.5 text-xs text-muted-foreground">
          {segmentLabel}
        </span>
      </div>

      <span className="flex-1" />

      <Button
        type="button"
        onClick={onPrev}
        disabled={!hasPrev}
        className="h-10 border bg-transparent px-4 font-semibold text-foreground transition-colors hover:border-primary hover:bg-transparent hover:text-primary disabled:pointer-events-none disabled:opacity-40"
        variant="outline"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Previous
      </Button>

      {isDone ? (
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#347474]/15 px-3 py-1.5 text-sm font-semibold text-[#5fb0b0]">
            <Check className="h-4 w-4" /> Completed
          </span>
          <Button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            className="btn-primary glow-subtle h-10 px-5 disabled:pointer-events-none disabled:opacity-40"
          >
            Next <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          onClick={onComplete}
          className="btn-primary glow-subtle h-11 gap-2.5 px-5 text-sm font-extrabold"
        >
          Mark complete &amp; continue
          {step.maxPoints > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#06222b]/25 px-2 py-0.5 text-xs">
              <Zap className="h-3 w-3" />+{step.maxPoints} pts
            </span>
          )}
        </Button>
      )}
    </div>
  );
}
