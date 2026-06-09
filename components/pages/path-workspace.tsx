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
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

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
  const next = idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : undefined;

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
  const segmentLabel = `This milestone · ${milestoneIndex + 1} of ${
    milestoneSteps.length || 1
  }`;

  if (loading && !session) return <Loader />;
  if (!session) return null;

  return (
    <div className="flex flex-col h-screen bg-background">
      <PathTopBar
        crumbs={[
          "Learn",
          session.path.title,
          activeGroup?.title,
          currentStep?.title,
        ]}
        position={idx >= 0 ? idx + 1 : 0}
        total={ordered.length}
        earnedPoints={session.path.earnedPoints}
        masteryPct={session.path.masteryPct}
        hasPrev={!!prev}
        hasNext={!!next}
        onPrev={() => prev && selectStep(prev.id)}
        onNext={() => next && selectStep(next.id)}
        onOpenOutline={() => setOutlineOpen(true)}
      />

      <ResizablePanelGroup
        orientation="horizontal"
        className="flex-1 min-h-0 overflow-hidden"
      >
        {/* Main stage + action bar */}
        <ResizablePanel
          defaultSize="74"
          minSize="55"
          className="flex flex-col min-h-0"
        >
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
            segmentLabel={segmentLabel}
            hasPrev={!!prev}
            hasNext={!!next}
            onPrev={() => prev && selectStep(prev.id)}
            onNext={() => next && selectStep(next.id)}
            onComplete={() => currentStep && completeStep(currentStep.id)}
          />
        </ResizablePanel>

        <ResizableHandle withHandle className="hidden lg:flex" />

        {/* Right context panel */}
        <ResizablePanel
          defaultSize="26"
          minSize="0"
          collapsible
          className="hidden lg:block min-h-0"
        >
          <PathContextPanel step={currentStep} />
        </ResizablePanel>
      </ResizablePanelGroup>

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
