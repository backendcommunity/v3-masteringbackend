"use client";
import { PathArticle } from "@/components/pages/path/path-article";
import { PathSessionStep } from "@/lib/path-types";

export function ArticleStep({
  step,
  onComplete,
}: {
  step: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, unknown>) => void;
}) {
  return <PathArticle step={step} onComplete={onComplete} />;
}
