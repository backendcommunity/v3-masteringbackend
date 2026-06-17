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
  return <div className="min-h-full">{children}</div>;
}
