"use client";
import { ProjectPlaygroundPage } from "@/components/pages/project-playground";
import { PathSessionStep } from "@/lib/path-types";

export function ProjectStep({
  step,
  onComplete,
  onNavigate,
}: {
  step: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, unknown>) => void;
  onNavigate: (path: string) => void;
}) {
  // The path workspace already provides the top bar + full-bleed frame for
  // PROJECT steps, so render the playground full-height in embedded mode (its
  // own top bar hidden) and let task completion drive step progression.
  return (
    <div className="h-full min-h-0 w-full flex flex-col">
      <ProjectPlaygroundPage
        slug={step.itemId}
        embedded
        onNavigate={onNavigate}
        onComplete={() => onComplete(step.id)}
      />
    </div>
  );
}
