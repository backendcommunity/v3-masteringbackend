"use client";
import { ArrowRight, Check } from "lucide-react";
import { PathSessionStep } from "@/lib/path-types";

export type SegmentStatus = "DONE" | "CURRENT" | "UPCOMING";

const LESSON_TYPES = new Set(["VIDEO", "ARTICLE", "RESOURCE"]);

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
  const isLesson = LESSON_TYPES.has(step.type);
  const primaryLabel = isLesson ? "Got it!" : "Mark complete & continue";

  return (
    <div className="mx-auto w-full max-w-[1000px] flex-none">
      {/* Action row */}
      <div className="mt-3 flex items-center">
        {hasPrev ? (
          <button
            type="button"
            onClick={onPrev}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Prev
          </button>
        ) : (
          <span />
        )}

        <span className="flex-1" />

        {isDone ? (
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              <Check className="h-4 w-4" /> Completed
            </span>
            <button
              type="button"
              onClick={onNext}
              disabled={!hasNext}
              className="inline-flex h-10 items-center rounded-lg bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-40"
            >
              Next <ArrowRight className="ml-1.5 h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onComplete}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {primaryLabel}
            <ArrowRight className="h-4 w-4" />
            {step.maxPoints > 0 && (
              <span className="ml-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs font-semibold">
                +{step.maxPoints} pts
              </span>
            )}
          </button>
        )}
      </div>

      {/* Segmented progress */}
      <div className="mt-3 flex flex-col items-center gap-1.5">
        <div className="flex justify-center gap-1.5">
          {segments.map((s, i) => (
            <span
              key={i}
              className={`h-1.5 w-9 rounded-full ${
                s.status === "DONE"
                  ? "bg-primary"
                  : s.status === "CURRENT"
                    ? "bg-primary/60"
                    : "bg-muted-foreground/20"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{segmentLabel}</span>
      </div>
    </div>
  );
}
