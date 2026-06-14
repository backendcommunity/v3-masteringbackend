"use client";
import { Compass } from "lucide-react";
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
  onReachComplete,
  onNavigate,
  updateProgress,
}: {
  pathId: string;
  step?: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, unknown>) => void;
  // 90%-watched mark (no advance) — only VideoStep uses it.
  onReachComplete?: (stepId: string, payload?: Record<string, unknown>) => void;
  onSelectStep: (id: string) => void;
  onNavigate: (path: string) => void;
  // Watch-progress heartbeat sink. Defaults to the path endpoint inside
  // VideoStep when omitted; the course route passes its course equivalent.
  updateProgress?: (
    id: string,
    stepId: string,
    payload: { duration: number },
  ) => Promise<unknown>;
}) {
  if (!step)
    return (
      <div className="flex flex-col items-center justify-center min-h-full gap-3 p-10 text-center">
        <span className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center glow-subtle">
          <Compass className="w-7 h-7" />
        </span>
        <p className="text-muted-foreground font-medium">
          Select a step to begin.
        </p>
      </div>
    );

  const render = () => {
    switch (step.type) {
      case "VIDEO":
        return (
          <VideoStep
            pathId={pathId}
            step={step}
            onComplete={onComplete}
            onReachComplete={onReachComplete}
            updateProgress={updateProgress}
          />
        );
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
  };

  return (
    <div
      key={step.id}
      className="interview-panel-enter min-h-full w-full min-w-0 flex-1"
    >
      {render()}
    </div>
  );
}
