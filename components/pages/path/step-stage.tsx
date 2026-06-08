"use client";
import { PathSessionStep } from "@/lib/path-types";
import { VideoStep } from "./steps/video-step";
import { ArticleStep } from "./steps/article-step";
import { ResourceStep } from "./steps/resource-step";
import { QuizStep } from "./steps/quiz-step";
import { ExerciseStep } from "./steps/exercise-step";
import { ProjectStep } from "./steps/project-step";
import { MockStep } from "./steps/mock-step";
import { BootcampStep } from "./steps/bootcamp-step";

export function StepStage({
  pathId,
  step,
  onComplete,
  onNavigate,
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
    case "QUIZ":
      return <QuizStep step={step} onComplete={onComplete} onNavigate={onNavigate} />;
    case "EXERCISE":
      return <ExerciseStep step={step} onComplete={onComplete} onNavigate={onNavigate} />;
    case "PROJECT":
      return <ProjectStep step={step} onComplete={onComplete} onNavigate={onNavigate} />;
    case "MOCK_INTERVIEW":
      return <MockStep step={step} onComplete={onComplete} onNavigate={onNavigate} />;
    case "BOOTCAMP":
      return <BootcampStep step={step} onComplete={onComplete} onNavigate={onNavigate} />;
    default:
      return (
        <div className="p-6 text-muted-foreground">
          {step.type} renderer coming next…
        </div>
      );
  }
}
