"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  PanelRightClose,
  PanelRightOpen,
  PanelBottomClose,
  PanelBottomOpen,
  Play,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { usePlaygroundControls } from "@/lib/playground-controls-store";
import {
  PathSession,
  PathSessionStep,
  PathSessionDelta,
  CelebrationEvent,
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
import { PathCelebrations } from "@/components/pages/path/celebrations/path-celebrations";
import { PathCertificate } from "@/components/pages/path/path-certificate";

export interface PathWorkspaceProps {
  pathId: string;
  initialStepId?: string;
  onNavigate: (path: string) => void;
}

// Run server + Preview, surfaced in the path top bar for embedded PROJECT steps.
// Reads the live handlers/state the playground publishes to the controls store.
function ProjectTopControls() {
  const { connected, isRunning, previewVisible, runServer, togglePreview } =
    usePlaygroundControls();
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        onClick={() => runServer?.()}
        disabled={isRunning || !connected}
        className="h-8 gap-1.5 px-3 text-xs"
      >
        <Play className="w-3.5 h-3.5" />
        {isRunning ? "Running…" : "Run server"}
      </Button>
      <Button
        size="sm"
        variant={previewVisible ? "secondary" : "outline"}
        onClick={() => togglePreview?.()}
        aria-pressed={previewVisible}
        className="h-8 gap-1.5 px-3 text-xs"
      >
        <Monitor className="w-3.5 h-3.5" />
        Preview
      </Button>
    </div>
  );
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
  // Overview/Transcript pane is collapsible — hidden lets the player go full.
  const [panelOpen, setPanelOpen] = useState(true);
  // Celebration queue plays after a step completes, THEN advances sequentially.
  const [celebrationQueue, setCelebrationQueue] = useState<CelebrationEvent[]>(
    [],
  );
  // Path-branded certificate landing takes over the stage when true.
  const [showCertificate, setShowCertificate] = useState(false);

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
      // Selecting any normal step always exits the certificate landing.
      setShowCertificate(false);
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

        const cel = delta.celebrations ?? [];
        const certUnlocked = cel.some((c) => c.kind === "certUnlocked");

        // Advance immediately to the next step in order. Celebrations are
        // non-blocking bottom-right toasts, so they play over the new step
        // rather than gating the advance.
        if (certUnlocked || !delta.cursor.nextStepId) {
          setShowCertificate(true);
        } else {
          setCurrentStepId(delta.cursor.nextStepId);
        }
        // Only meaningful pops (levels, achievements, % milestones, topic
        // completion) surface — the per-step "unlocked" ribbon is dropped, and
        // cert routing is handled above.
        setCelebrationQueue(
          cel.filter(
            (c) => c.kind !== "certUnlocked" && c.kind !== "stepUnlocked",
          ),
        );
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

  // Full-bleed steps own their layout (exercise IDE, project, quiz) — no side
  // pane and no action-bar Next. Build-type steps relabel the breadcrumb root.
  const fullBleed =
    currentStep?.type === "EXERCISE" ||
    currentStep?.type === "PROJECT" ||
    currentStep?.type === "QUIZ" ||
    currentStep?.type === "ARTICLE" ||
    currentStep?.type === "RESOURCE" ||
    currentStep?.type === "MOCK_INTERVIEW";
  // Learn → Build → Grow breadcrumb root.
  const isBuild =
    currentStep?.type === "EXERCISE" || currentStep?.type === "PROJECT";
  const isGrow =
    currentStep?.type === "MOCK_INTERVIEW" ||
    currentStep?.type === "BOOTCAMP";
  const contextLabel = isBuild ? "Build" : isGrow ? "Grow" : "Learn";
  const hasContext = !!currentStep && !fullBleed;

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

  // The advance already happened in completeStep; these just tidy up the
  // non-blocking corner toasts. Stable identities keep PathCelebrations'
  // terminal effect from re-running on every render.
  const onCertUnlocked = useCallback(() => {
    setShowCertificate(true);
    setCelebrationQueue([]);
  }, []);
  const onAllDone = useCallback(() => {
    setCelebrationQueue([]);
  }, []);

  if (loading && !session) return <Loader />;
  if (!session) return null;

  // Always mounted: renders nothing when the queue is empty. When a step
  // completes, plays the queued celebrations and THEN advances sequentially.
  const celebrations = (
    <PathCelebrations
      queue={celebrationQueue}
      onCertUnlocked={onCertUnlocked}
      onAllDone={onAllDone}
    />
  );

  const outlineDrawer = (
    <PathOutlineDrawer
      open={outlineOpen}
      onOpenChange={setOutlineOpen}
      session={session}
      currentStepId={showCertificate ? undefined : currentStepId}
      certEligible={session.path.certEligible}
      onOpenCertificate={() => {
        setShowCertificate(true);
        setOutlineOpen(false);
      }}
      onSelectStep={(id) => {
        selectStep(id);
        setOutlineOpen(false);
      }}
    />
  );

  // Certificate landing takes over the stage, but KEEPS the PathTopBar + outline
  // so the learner can navigate back to any step (selecting a step exits here).
  if (showCertificate) {
    return (
      <div
        className="flex h-screen w-full flex-col bg-background"
        style={{
          fontFamily: "Satoshi, system-ui, sans-serif",
          fontSize: "14px",
        }}
      >
        <PathTopBar
          crumbs={[
            { label: contextLabel, href: "/paths" },
            { label: session.path.title, href: `/paths/${pathId}` },
            { label: "Certificate" },
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
        <div className="flex-1 min-h-0 w-full overflow-y-auto">
          <PathCertificate slug={pathId} pathTitle={session.path.title} />
        </div>
        {outlineDrawer}
        {celebrations}
      </div>
    );
  }

  // PROJECT steps take over the screen with the playground, but KEEP the course
  // outline / path nav up top (PathTopBar). No side panel, no bottom action bar.
  if (currentStep?.type === "PROJECT") {
    return (
      <div
        className="flex h-screen w-full flex-col bg-background"
        style={{
          fontFamily: "Satoshi, system-ui, sans-serif",
          fontSize: "14px",
        }}
      >
        <PathTopBar
          crumbs={[
            { label: contextLabel, href: "/paths" },
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
          projectActions={<ProjectTopControls />}
        />
        <div className="flex flex-1 min-h-0 w-full min-w-0">
          <StepStage
            pathId={pathId}
            step={currentStep}
            onComplete={completeStep}
            onSelectStep={selectStep}
            onNavigate={onNavigate}
          />
        </div>
        {outlineDrawer}
        {celebrations}
      </div>
    );
  }

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
          { label: contextLabel, href: "/paths" },
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
            which render their own instructions panel, and collapsible elsewhere. */}
        {hasContext && panelOpen && (
          <>
            <div className="hidden md:flex w-[26%] min-w-[240px] max-w-[340px] shrink-0 p-3">
              <PathContextPanel step={currentStep} />
            </div>
            {/* 1px divider */}
            <div className="hidden md:block w-px shrink-0 bg-border" />
          </>
        )}

        {/* Main stage + action bar */}
        <div className="relative flex flex-1 min-w-0 flex-col min-h-0">
          {/* Desktop pane toggle — collapse for a full-width player */}
          {hasContext && (
            <button
              type="button"
              onClick={() => setPanelOpen((v) => !v)}
              className="absolute right-3 top-3 z-20 hidden items-center gap-1.5 rounded-lg border border-border bg-background/80 px-2.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur transition-colors hover:text-foreground md:inline-flex"
              title={panelOpen ? "Hide panel" : "Show panel"}
            >
              {panelOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
              {panelOpen ? "Hide panel" : "Show panel"}
            </button>
          )}

          <PathStage step={currentStep}>
            <StepStage
              pathId={pathId}
              step={currentStep}
              onComplete={completeStep}
              onSelectStep={selectStep}
              onNavigate={onNavigate}
            />
          </PathStage>

          {/* Mobile pane toggle + collapsible Overview/Transcript below player */}
          {hasContext && (
            <button
              type="button"
              onClick={() => setPanelOpen((v) => !v)}
              className="flex shrink-0 items-center justify-center gap-1.5 border-t border-border bg-muted/30 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground md:hidden"
            >
              {panelOpen ? (
                <PanelBottomClose className="h-4 w-4" />
              ) : (
                <PanelBottomOpen className="h-4 w-4" />
              )}
              {panelOpen
                ? "Hide overview & transcript"
                : "Show overview & transcript"}
            </button>
          )}
          {hasContext && panelOpen && (
            <div className="flex h-[45vh] min-h-0 shrink-0 px-3 pb-3 md:hidden">
              <PathContextPanel step={currentStep} />
            </div>
          )}

          <PathActionBar
            step={currentStep}
            segments={segments}
            hasPrev={!!prev}
            hasNext={!!next}
            onPrev={() => prev && selectStep(prev.id)}
            onNext={() => next && selectStep(next.id)}
            onComplete={() => currentStep && completeStep(currentStep.id)}
            hideNext={fullBleed}
          />
        </div>
      </div>

      {outlineDrawer}
      {celebrations}
    </div>
  );
}
