"use client";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { PathSessionStep } from "@/lib/path-types";
import { StepFrame } from "../step-frame";

export function ResourceStep({
  step,
  onComplete,
}: {
  step: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, unknown>) => void;
}) {
  return (
    <StepFrame
      step={step}
      onComplete={() => onComplete(step.id)}
      completeLabel="Mark as visited"
    >
      <div className="p-6 max-w-2xl mx-auto text-center space-y-4">
        <p className="text-muted-foreground">External resource</p>
        <Button asChild>
          <a href={step.url ?? "#"} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" /> Open resource
          </a>
        </Button>
      </div>
    </StepFrame>
  );
}
