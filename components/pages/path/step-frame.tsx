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
      <header className="flex items-center justify-between gap-4 px-6 py-4 border-b">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {step.type.replace("_", " ")}
          </p>
          <h1 className="font-bold text-lg">{step.title}</h1>
        </div>
        {step.status === "DONE" ? (
          <span className="flex items-center gap-1 text-sm text-[#347474] font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Completed
          </span>
        ) : (
          <Button onClick={onComplete}>{completeLabel}</Button>
        )}
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
