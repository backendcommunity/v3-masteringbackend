"use client";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
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
      <div className="p-6 max-w-2xl mx-auto">
        <div className="rounded-2xl border border-border bg-card card-glow p-8 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <span className="w-14 h-14 rounded-2xl bg-[#2D9CDB]/15 text-[#2D9CDB] flex items-center justify-center glow-subtle">
              <Mic className="w-7 h-7" />
            </span>
            {step.optional && (
              <span
                className="rounded-full px-3 py-1 text-[11px] font-bold text-[#1a1305]"
                style={{
                  background:
                    "linear-gradient(135deg, #F2C94C 0%, #d9a93b 100%)",
                }}
              >
                Optional · bonus
              </span>
            )}
          </div>
          <p className="text-muted-foreground font-medium">
            Practice with a mock interview for this milestone.
          </p>
          <Button
            onClick={() => onNavigate(`/mock-interviews/${step.itemId}`)}
            className="btn-primary glow-subtle"
          >
            Start mock interview
          </Button>
        </div>
      </div>
    </StepFrame>
  );
}
