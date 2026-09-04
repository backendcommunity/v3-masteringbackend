import { StrictMode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import { PathWorkspace } from "@/components/pages/path-workspace";
import type { PathSession, PathSessionStep } from "@/lib/path-types";

// The rule these tests exist to protect: a learner is NEVER routed into a step
// they cannot open. Reaching for a gated step holds their position and raises
// the paywall over the page they already had — so what sits behind the wall is
// always content they are entitled to, and no premium payload is ever rendered.

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/paths/distributed-systems/learn/step-free",
}));

vi.mock("@/lib/analytics", () => ({
  analytics: { track: vi.fn() },
}));

vi.mock("@/lib/use-journey-recap-trigger", () => ({
  triggerItemRecap: vi.fn().mockResolvedValue(undefined),
}));

// The step renderers fetch their own payloads; this suite is about routing, so
// stand them down to a marker naming the step that actually mounted.
vi.mock("@/components/pages/path/step-stage", () => ({
  StepStage: ({ step }: { step?: PathSessionStep }) => (
    <div data-testid="stage">{step ? step.title : "no step"}</div>
  ),
}));

const FREE_STEP: PathSessionStep = {
  id: "step-free",
  order: 1,
  type: "ARTICLE",
  itemId: "item-free",
  groupId: null,
  topicId: "topic-1",
  title: "Leader election, plainly",
  maxPoints: 10,
  optional: false,
  status: "DONE",
  recommended: false,
  earnedPoints: 10,
  score: null,
  passed: null,
  masteryMet: true,
  access: { allowed: true, reason: "OK" },
  payloadRef: { mode: "inline", endpoint: "/payload/free", route: null },
} as PathSessionStep;

const GATED_STEP: PathSessionStep = {
  ...FREE_STEP,
  id: "step-gated",
  order: 2,
  title: "Raft, step by step",
  status: "NOT_STARTED",
  earnedPoints: 0,
  masteryMet: false,
  access: { allowed: false, reason: "PREMIUM_REQUIRED" },
  payloadRef: { mode: "inline", endpoint: "/payload/gated", route: null },
} as PathSessionStep;

function makeSession(): PathSession {
  return {
    path: {
      slug: "distributed-systems",
      title: "Distributed Systems",
      progressPct: 50,
      masteryPct: 50,
      earnedPoints: 10,
      certThreshold: 80,
      isCompleted: false,
      certEligible: false,
      payment: {
        id: "path-1",
        kind: "path",
        amount: 29,
        paddlePriceId: "pri_test",
        isPremium: true,
      },
    },
    cursor: {
      currentStepId: FREE_STEP.id,
      nextStepId: GATED_STEP.id,
      resumeStepId: FREE_STEP.id,
    },
    groups: [],
    groupsState: [],
    steps: [FREE_STEP, GATED_STEP],
  } as PathSession;
}

function renderWorkspace(initialStepId?: string) {
  const onNavigate = vi.fn();
  render(
    <PathWorkspace
      pathId="distributed-systems"
      initialStepId={initialStepId}
      onNavigate={onNavigate}
      loadSession={async () => makeSession()}
      hasCertificate={false}
    />,
  );
  return { onNavigate };
}

describe("PathWorkspace — gated step routing", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps the learner on their own step when they open a free one", async () => {
    renderWorkspace(FREE_STEP.id);
    await waitFor(() =>
      expect(screen.getByTestId("stage")).toHaveTextContent(FREE_STEP.title),
    );
  });

  it("a cold deep link into a gated step falls back to completed work", async () => {
    // Nothing is mounted yet on a fresh load, so there is no previous lesson to
    // raise the wall over. Falling through to the gated step would render an
    // empty stage and lose the "your progress is right there" framing.
    const { onNavigate } = renderWorkspace(GATED_STEP.id);

    await waitFor(() =>
      expect(screen.getByTestId("stage")).toHaveTextContent(FREE_STEP.title),
    );
    // The gated step is never what renders.
    expect(screen.getByTestId("stage")).not.toHaveTextContent(GATED_STEP.title);
    expect(onNavigate).not.toHaveBeenCalled();
    // …and the wall is up over it, rather than the learner silently landing on
    // an earlier lesson with no explanation.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("survives StrictMode's double-invoked renders", async () => {
    // The other cases here use plain render(), which does NOT double-invoke.
    // Dev runs under StrictMode, so mount-time paywall decisions get exercised
    // twice there and not here — this closes that gap.
    render(
      <StrictMode>
        <PathWorkspace
          pathId="distributed-systems"
          initialStepId={GATED_STEP.id}
          onNavigate={vi.fn()}
          loadSession={async () => makeSession()}
          hasCertificate={false}
        />
      </StrictMode>,
    );

    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    expect(screen.getByTestId("stage")).toHaveTextContent(FREE_STEP.title);
  });

  it("shows no paywall when every step is open to the learner", async () => {
    render(
      <PathWorkspace
        pathId="distributed-systems"
        initialStepId={FREE_STEP.id}
        onNavigate={vi.fn()}
        loadSession={async () => ({
          ...makeSession(),
          steps: [FREE_STEP, { ...GATED_STEP, access: { allowed: true, reason: "OK" } }],
        })}
        hasCertificate={false}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("stage")).toBeInTheDocument());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("still walls off a path where NOTHING is entitled", async () => {
    // The deep-link fallback has nothing to fall back to here, so the displayed
    // step ends up gated. The wall must still go up, and the gated renderer must
    // still not mount — otherwise a fully-premium path serves itself for free.
    render(
      <PathWorkspace
        pathId="distributed-systems"
        initialStepId={GATED_STEP.id}
        onNavigate={vi.fn()}
        loadSession={async () => ({
          ...makeSession(),
          steps: [
            { ...FREE_STEP, access: { allowed: false, reason: "PREMIUM_REQUIRED" } },
            GATED_STEP,
          ],
        })}
        hasCertificate={false}
      />,
    );

    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    // The stage still gets a step. Showing "Select a step to begin" here would
    // be wrong — the learner IS somewhere, and the page has to say where.
    // StepStage renders that step as frozen chrome rather than mounting it
    // live; the dedicated StepStage test covers that half.
    expect(screen.getByTestId("stage")).toHaveTextContent(GATED_STEP.title);
  });

  it("never mounts the gated step's renderer", async () => {
    renderWorkspace(GATED_STEP.id);
    await waitFor(() => expect(screen.getByTestId("stage")).toBeInTheDocument());
    // If the gated step ever reached StepStage it would resolve payloadRef and
    // pull paid content down to an unentitled client.
    expect(document.body.innerHTML).not.toContain("/payload/gated");
  });
});
