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
    <div className="relative flex flex-1 min-h-0 justify-center overflow-auto px-6 py-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_75%_-5%,hsl(var(--primary)/0.06),transparent),radial-gradient(40%_35%_at_0%_0%,hsl(var(--mb-blue)/0.05),transparent)]"
      />
      <div className="relative w-full max-w-[1180px]">
        {step ? (
          <>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              {step.type.replace("_", " ")}
            </p>
            <h1 className="mb-5 mt-1.5 text-xl font-extrabold tracking-tight">
              {step.title}
            </h1>
            {children}
          </>
        ) : (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary glow-subtle">
              <Compass className="h-7 w-7" />
            </span>
            <p className="font-medium text-muted-foreground">
              Select a step to begin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
