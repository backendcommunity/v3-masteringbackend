"use client";
import { PathSessionStep } from "@/lib/path-types";

export function StepStage({
  step,
}: {
  pathId: string;
  step?: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, unknown>) => void;
  onSelectStep: (id: string) => void;
  onNavigate: (path: string) => void;
}) {
  if (!step) return null;
  return <div className="p-6">{step.title}</div>;
}
