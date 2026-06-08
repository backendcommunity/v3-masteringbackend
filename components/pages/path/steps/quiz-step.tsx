"use client";
import { CourseQuizPage } from "@/components/pages/course-quiz";
import { PathSessionStep } from "@/lib/path-types";

export function QuizStep({
  step,
  onComplete,
  onNavigate,
}: {
  step: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, unknown>) => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="p-2">
      <CourseQuizPage
        courseId={step.groupId ?? ""}
        quizId={step.itemId}
        showNav={false}
        onNavigate={onNavigate}
        handleQuizSubmit={(passed) => {
          if (passed) onComplete(step.id, { passed });
        }}
      />
    </div>
  );
}
