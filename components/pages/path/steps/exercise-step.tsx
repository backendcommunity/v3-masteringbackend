"use client";

import { PathSessionStep } from "@/lib/path-types";
import { ExercisePlayground } from "@/components/exercise-playground";

export function ExerciseStep({
  step,
  onComplete,
}: {
  step: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, unknown>) => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="h-[70vh]">
      <ExercisePlayground
        exerciseId={step.itemId}
        onPassed={(result) =>
          onComplete(step.id, {
            score: result.score,
            passed: true,
            submissionId: result.submissionId,
          })
        }
      />
    </div>
  );
}
