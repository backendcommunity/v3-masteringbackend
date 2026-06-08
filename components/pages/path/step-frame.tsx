"use client";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { PathSessionStep } from "@/lib/path-types";

export function StepFrame({
  step,
  onComplete,
  children,
  completeLabel = "Mark complete & continue",
}: {
  step: PathSessionStep;
  onComplete: () => void;
  children: React.ReactNode;
  completeLabel?: string;
}) {
  return (
    <div className="flex flex-col min-h-full">
      <header className="relative flex items-center justify-between gap-4 px-6 py-4 border-b">
        <span className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-[#2BB8D8] to-transparent" />
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-primary font-semibold">
            {step.type.replace("_", " ")}
          </p>
          <h1 className="text-xl font-bold tracking-tight">{step.title}</h1>
        </div>
        {step.status === "DONE" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#347474]/15 text-[#5fb0b0] px-3 py-1.5 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Completed
          </span>
        ) : (
          <Button onClick={onComplete} className="btn-primary glow-subtle">
            {completeLabel}
          </Button>
        )}
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
