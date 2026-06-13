"use client";
import { PathMockInterview } from "@/components/pages/path/path-mock-interview";
import { PathSessionStep } from "@/lib/path-types";

export function MockStep({
  step,
  onComplete,
  onNavigate,
}: {
  step: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, unknown>) => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <PathMockInterview
      step={step}
      onComplete={onComplete}
      onNavigate={onNavigate}
    />
  );
}
