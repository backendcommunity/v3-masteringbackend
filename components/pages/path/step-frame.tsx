"use client";
import { PathSessionStep } from "@/lib/path-types";

export function StepFrame({
  children,
}: {
  step: PathSessionStep;
  onComplete: () => void;
  children: React.ReactNode;
  completeLabel?: string;
}) {
  return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
}
