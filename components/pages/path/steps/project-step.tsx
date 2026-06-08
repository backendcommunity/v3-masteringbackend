"use client";
import { CourseProjectPage } from "@/components/pages/course-project";
import { PathSessionStep } from "@/lib/path-types";
import { StepFrame } from "../step-frame";

export function ProjectStep({
  step,
  onComplete,
  onNavigate,
}: {
  step: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, unknown>) => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <StepFrame
      step={step}
      onComplete={() => onComplete(step.id)}
      completeLabel="Mark complete & continue"
    >
      <CourseProjectPage
        courseId={step.groupId ?? ""}
        projectId={step.itemId}
        onNavigate={onNavigate}
      />
    </StepFrame>
  );
}
