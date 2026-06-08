"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PathSessionStep } from "@/lib/path-types";
import { StepFrame } from "../step-frame";

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
    <StepFrame step={step} onComplete={() => onComplete(step.id)} completeLabel="Mark complete">
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        {step.optional && <Badge variant="outline">Optional · bonus</Badge>}
        <p className="text-muted-foreground">
          Practice with a mock interview for this milestone.
        </p>
        <Button onClick={() => onNavigate(`/mock-interviews/${step.itemId}`)}>
          Start mock interview
        </Button>
      </div>
    </StepFrame>
  );
}
