"use client";
import { Button } from "@/components/ui/button";
import { ExternalLink, Link2 } from "lucide-react";
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
      <div className="p-6 max-w-2xl mx-auto">
        <div className="rounded-2xl border border-border bg-card card-glow p-8 text-center space-y-5">
          <span className="mx-auto w-14 h-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center glow-subtle">
            <Link2 className="w-7 h-7" />
          </span>
          <p className="text-muted-foreground font-medium">External resource</p>
          <Button asChild className="btn-primary glow-subtle">
            <a href={step.url ?? "#"} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" /> Open resource
            </a>
          </Button>
        </div>
      </div>
    </StepFrame>
  );
}
