"use client";
import { PathSessionStep } from "@/lib/path-types";
import { PathComingSoon } from "../path-coming-soon";

export function ExerciseStep({
  step,
  onComplete,
}: {
  step: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, unknown>) => void;
  onNavigate: (path: string) => void;
}) {
  // Exercise IDE not shipped yet — show coming-soon + let the learner skip ahead.
  return (
    <PathComingSoon
      kind="exercise"
      onSkip={() => onComplete(step.id, { skipped: true })}
    />
  );
}
