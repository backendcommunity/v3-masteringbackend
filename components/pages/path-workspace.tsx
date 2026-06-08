"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import {
  PathSession,
  PathSessionStep,
  PathSessionDelta,
} from "@/lib/path-types";
import { Loader } from "@/components/ui/loader";
import { PathRail } from "@/components/pages/path/path-rail";
import { StepStage } from "@/components/pages/path/step-stage";

export interface PathWorkspaceProps {
  pathId: string;
  initialStepId?: string;
  onNavigate: (path: string) => void;
}

export function PathWorkspace({
  pathId,
  initialStepId,
  onNavigate,
}: PathWorkspaceProps) {
  const store = useAppStore();
  const [session, setSession] = useState<PathSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStepId, setCurrentStepId] = useState<string | undefined>(
    initialStepId,
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await store.getPathSession(pathId);
      setSession(data);
      setCurrentStepId(
        (prev) => prev ?? data?.cursor?.resumeStepId ?? data?.steps?.[0]?.id,
      );
    } catch {
      toast.error("Failed to load this path.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathId]);

  const currentStep: PathSessionStep | undefined = useMemo(
    () => session?.steps.find((s) => s.id === currentStepId),
    [session, currentStepId],
  );

  const selectStep = useCallback(
    (stepId: string) => {
      setCurrentStepId(stepId);
      onNavigate(`/paths/${pathId}/learn/${encodeURIComponent(stepId)}`);
    },
    [pathId, onNavigate],
  );

  const applyDelta = useCallback((delta: PathSessionDelta) => {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        path: { ...prev.path, ...delta.path },
        cursor: { ...prev.cursor, ...delta.cursor },
        steps: prev.steps.map((s) =>
          s.id === delta.step.id ? { ...s, ...delta.step } : s,
        ),
      };
    });
  }, []);

  const completeStep = useCallback(
    async (stepId: string, payload?: Record<string, unknown>) => {
      try {
        const delta = await store.completePathStep(pathId, stepId, payload);
        applyDelta(delta);
        const fresh = await store.getPathSession(pathId);
        setSession(fresh);
        const next = delta.cursor.nextStepId;
        if (next) setCurrentStepId(next);
        if (delta.path.certEligible) {
          toast.success("You've unlocked your certificate!");
        }
      } catch {
        toast.error("Could not mark this step complete.");
      }
    },
    [pathId, store, applyDelta],
  );

  if (loading && !session) return <Loader />;
  if (!session) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <PathRail
        session={session}
        currentStepId={currentStepId}
        onSelectStep={selectStep}
      />
      <div className="flex-1 overflow-y-auto">
        <StepStage
          pathId={pathId}
          step={currentStep}
          onComplete={completeStep}
          onSelectStep={selectStep}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}
