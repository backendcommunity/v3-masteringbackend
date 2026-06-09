"use client";
import { useEffect, useState } from "react";
import { Exercise } from "@/lib/data";
import { PathSessionStep } from "@/lib/path-types";
import { useAppStore } from "@/lib/store";
import { Loader } from "@/components/ui/loader";
import { PathExerciseIde } from "../path-exercise-ide";

export function ExerciseStep({
  step,
  onComplete,
}: {
  step: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, unknown>) => void;
  onNavigate: (path: string) => void;
}) {
  const store = useAppStore();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await store.getPathItem(step.payloadRef.endpoint);
        setExercise(data as Exercise);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id]);

  if (loading) return <Loader />;
  if (!exercise)
    return (
      <div className="p-6 text-muted-foreground">Exercise unavailable.</div>
    );

  return (
    <PathExerciseIde
      step={step}
      exercise={exercise}
      onComplete={(id) => onComplete(id)}
    />
  );
}
