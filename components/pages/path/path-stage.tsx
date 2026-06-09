"use client";
import { Compass } from "lucide-react";
import { PathSessionStep } from "@/lib/path-types";

export function PathStage({
  step,
  children,
}: {
  step?: PathSessionStep;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[1000px] min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {step ? (
        children
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Compass className="h-7 w-7" />
          </span>
          <p className="font-medium text-muted-foreground">
            Select a step to begin.
          </p>
        </div>
      )}
    </div>
  );
}
