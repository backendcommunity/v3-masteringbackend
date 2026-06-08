"use client";
import { PathSessionStep } from "@/lib/path-types";
import { VideoStep } from "./steps/video-step";
import { ArticleStep } from "./steps/article-step";
import { ResourceStep } from "./steps/resource-step";

export function StepStage({
  pathId,
  step,
  onComplete,
}: {
  pathId: string;
  step?: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, unknown>) => void;
  onSelectStep: (id: string) => void;
  onNavigate: (path: string) => void;
}) {
  if (!step)
    return (
      <div className="p-6 text-muted-foreground">Select a step to begin.</div>
    );

  switch (step.type) {
    case "VIDEO":
      return <VideoStep pathId={pathId} step={step} onComplete={onComplete} />;
    case "ARTICLE":
      return <ArticleStep step={step} onComplete={onComplete} />;
    case "RESOURCE":
      return <ResourceStep step={step} onComplete={onComplete} />;
    default:
      return (
        <div className="p-6 text-muted-foreground">
          {step.type} renderer coming next…
        </div>
      );
  }
}
