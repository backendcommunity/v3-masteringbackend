"use client";
import { PathSessionStep } from "@/lib/path-types";
import { PathComingSoon } from "../path-coming-soon";

export function ProjectStep({
  step,
  onComplete,
}: {
  step: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, unknown>) => void;
  onNavigate: (path: string) => void;
}) {
  // Project playground not shipped yet in-path — show coming-soon + let the
  // learner skip ahead so the step never blocks path progression.
  return (
    <PathComingSoon
      kind="project"
      onSkip={() => onComplete(step.id, { skipped: true })}
    />
  );
}
