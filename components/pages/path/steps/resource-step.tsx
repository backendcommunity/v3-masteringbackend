"use client";
import { PathResource } from "@/components/pages/path/path-resource";
import { PathSessionStep } from "@/lib/path-types";

export function ResourceStep({
  step,
  onComplete,
}: {
  step: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, unknown>) => void;
}) {
  return <PathResource step={step} onComplete={onComplete} />;
}
