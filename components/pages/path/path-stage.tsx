"use client";
import { Compass } from "lucide-react";
import { PathSessionStep } from "@/lib/path-types";

// These step types render their own full-bleed IDE/workspace and should fill
// the stage edge-to-edge instead of the centered, max-width content layout.
const FULL_BLEED = new Set(["EXERCISE", "PROJECT", "QUIZ"]);

export function PathStage({
  step,
  children,
}: {
  step?: PathSessionStep;
  children: React.ReactNode;
}) {
  if (step && FULL_BLEED.has(step.type)) {
    return <div className="flex w-full min-w-0 flex-1 min-h-0">{children}</div>;
  }

  return (
    <div className="relative flex flex-1 min-w-0 min-h-0 items-start justify-center overflow-auto px-4 py-6 sm:px-8 sm:py-8 lg:items-center lg:px-16 lg:py-10">
      <div className="relative mx-auto w-full max-w-[1280px]">
        {step ? (
          children
        ) : (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary glow-subtle">
              <Compass className="h-7 w-7" />
            </span>
            <p className="font-medium text-muted-foreground">
              Select a step to begin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
