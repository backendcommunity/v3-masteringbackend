"use client";
import { PathQuiz } from "@/components/pages/path/path-quiz";
import { PathSessionStep } from "@/lib/path-types";

export function QuizStep({
  step,
  onComplete,
}: {
  step: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, unknown>) => void;
  onNavigate: (path: string) => void;
}) {
  return <PathQuiz step={step} quizId={step.itemId} onComplete={onComplete} />;
}
