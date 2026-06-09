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
import { StepStage } from "@/components/pages/path/step-stage";
import { PathTopBar } from "@/components/pages/path/path-top-bar";
import { PathContextPanel } from "@/components/pages/path/path-context-panel";
import { PathStage } from "@/components/pages/path/path-stage";
import {
  PathActionBar,
  SegmentStatus,
} from "@/components/pages/path/path-action-bar";
import { PathOutlineDrawer } from "@/components/pages/path/path-outline-drawer";

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
  const [outlineOpen, setOutlineOpen] = useState(false);

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

  const ordered = useMemo(
    () => (session ? [...session.steps].sort((a, b) => a.order - b.order) : []),
    [session],
  );
  const idx = ordered.findIndex((s) => s.id === currentStepId);
  const prev = idx > 0 ? ordered[idx - 1] : undefined;
  const next =
    idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : undefined;

  const activeGroup = session?.groups.find((g) =>
    g.stepIds.includes(currentStepId ?? ""),
  );

  const milestoneSteps = ordered.filter(
    (s) => s.topicId === currentStep?.topicId,
  );
  const segments = milestoneSteps.map((s) => ({
    status: (s.status === "DONE"
      ? "DONE"
      : s.id === currentStep?.id
        ? "CURRENT"
        : "UPCOMING") as SegmentStatus,
  }));
  const milestoneIndex = milestoneSteps.findIndex(
    (s) => s.id === currentStep?.id,
  );
  // const segmentLabel = `${milestoneIndex + 1} of ${milestoneSteps.length || 1}`;

  if (loading && !session) return <Loader />;
  if (!session) return null;

  return (
    // Match watch-v2 exactly: the mockup renders in system-ui (Satoshi isn't
    // installed), while the app body is Inter — which has a larger x-height and
    // makes fonts/buttons look bigger. Override the font for this page only.
    <div
      className="flex flex-col h-screen bg-background"
      style={{ fontFamily: "Satoshi, system-ui, sans-serif", fontSize: "14px" }}
    >
      <PathTopBar
        crumbs={[
          { label: "Learn", href: "/paths" },
          { label: session.path.title, href: `/paths/${pathId}` },
          { label: activeGroup?.title },
          { label: currentStep?.title },
        ]}
        position={idx >= 0 ? idx + 1 : 0}
        total={ordered.length}
        earnedPoints={session.path.earnedPoints}
        masteryPct={session.path.masteryPct}
        step={currentStep}
        hasPrev={!!prev}
        hasNext={!!next}
        onPrev={() => prev && selectStep(prev.id)}
        onNext={() => next && selectStep(next.id)}
        onOpenOutline={() => setOutlineOpen(true)}
        onNavigate={onNavigate}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden bg-muted/20">
        {/* Lesson context panel — hidden for full-bleed steps (exercise/project)
            which render their own instructions panel. */}
        {currentStep?.type !== "EXERCISE" &&
          currentStep?.type !== "PROJECT" && (
            <>
              <div className="hidden lg:flex w-[20%] min-w-[220px] max-w-[320px] shrink-0 p-3">
                <PathContextPanel step={currentStep} />
              </div>
              {/* 1px divider */}
              <div className="hidden lg:block w-px shrink-0 bg-border" />
            </>
          )}

        {/* Main stage + action bar */}
        <div className="flex flex-1 min-w-0 flex-col min-h-0">
          <PathStage step={currentStep}>
            <StepStage
              pathId={pathId}
              step={currentStep}
              onComplete={completeStep}
              onSelectStep={selectStep}
              onNavigate={onNavigate}
            />
          </PathStage>

          <PathActionBar
            step={currentStep}
            segments={segments}
            hasPrev={!!prev}
            hasNext={!!next}
            onPrev={() => prev && selectStep(prev.id)}
            onNext={() => next && selectStep(next.id)}
            onComplete={() => currentStep && completeStep(currentStep.id)}
            hideNext={
              currentStep?.type === "EXERCISE" ||
              currentStep?.type === "PROJECT"
            }
          />
        </div>
      </div>

      <PathOutlineDrawer
        open={outlineOpen}
        onOpenChange={setOutlineOpen}
        session={session}
        currentStepId={currentStepId}
        onSelectStep={(id) => {
          selectStep(id);
          setOutlineOpen(false);
        }}
      />
    </div>
  );
}
