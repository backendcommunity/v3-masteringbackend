"use client";
import { PathSessionStep } from "@/lib/path-types";
import { PathProjectTasks } from "./path-project-tasks";

// In-path project step. Until the embedded playground ships, render the
// project's build tasks as one clean, Article-style page (project header +
// grouped checklist) so students keep building, framed as a single project.
export function ProjectStep({
  step,
  onComplete,
}: {
  step: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, unknown>) => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <PathProjectTasks
      projectId={step.itemId}
      onComplete={() => onComplete(step.id)}
    />
  );
}
