import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { StepStage } from "../step-stage";
import type { PathSessionStep, PathStepType } from "@/lib/path-types";

// Every live step renderer is spied on. If a gated step ever reaches one it
// would resolve payloadRef and pull paid content down to an unentitled client,
// so these mocks are the tripwire for that.
// Both live inside vi.hoisted: vi.mock factories are lifted above ordinary
// top-level consts, so anything they close over has to be hoisted too.
const { mounted, stub } = vi.hoisted(() => {
  const mounted = vi.fn();
  return {
    mounted,
    stub: (name: string) => () => {
      mounted(name);
      return null;
    },
  };
});

vi.mock("../steps/video-step", () => ({ VideoStep: stub("VideoStep") }));
vi.mock("../steps/article-step", () => ({ ArticleStep: stub("ArticleStep") }));
vi.mock("../steps/resource-step", () => ({ ResourceStep: stub("ResourceStep") }));
vi.mock("../steps/quiz-step", () => ({ QuizStep: stub("QuizStep") }));
vi.mock("../steps/exercise-step", () => ({ ExerciseStep: stub("ExerciseStep") }));
vi.mock("../steps/project-step", () => ({ ProjectStep: stub("ProjectStep") }));
vi.mock("../steps/mock-step", () => ({ MockStep: stub("MockStep") }));
vi.mock("../steps/bootcamp-step", () => ({ BootcampStep: stub("BootcampStep") }));

function makeStep(
  type: PathStepType,
  allowed: boolean,
): PathSessionStep {
  return {
    id: `step-${type}`,
    order: 2,
    type,
    itemId: "item-1",
    groupId: null,
    topicId: "topic-1",
    chapterTitle: "Consensus & Replication",
    title: "Raft, step by step",
    maxPoints: 20,
    optional: false,
    status: "NOT_STARTED",
    recommended: true,
    earnedPoints: 0,
    score: null,
    passed: null,
    masteryMet: false,
    access: { allowed, reason: allowed ? "OK" : "PREMIUM_REQUIRED" },
    payloadRef: {
      mode: "inline",
      endpoint: "/api/v3/paths/steps/step-1/payload",
      route: null,
    },
  } as PathSessionStep;
}

const noop = () => {};
const renderStage = (step: PathSessionStep) =>
  render(
    <StepStage
      pathId="p"
      step={step}
      onComplete={noop}
      onSelectStep={noop}
      onNavigate={noop}
    />,
  );

const EVERY_TYPE: PathStepType[] = [
  "VIDEO",
  "ARTICLE",
  "QUIZ",
  "EXERCISE",
  "PROJECT",
  "MOCK_INTERVIEW",
  "BOOTCAMP",
  "RESOURCE",
];

describe("StepStage — gated step", () => {
  it.each(EVERY_TYPE)("never mounts the live renderer for %s", (type) => {
    mounted.mockClear();
    renderStage(makeStep(type, false));
    expect(mounted).not.toHaveBeenCalled();
  });

  it.each(EVERY_TYPE)("still shows the learner where they are for %s", (type) => {
    renderStage(makeStep(type, false));
    // "Select a step to begin" would be wrong: the learner IS on this step.
    expect(screen.getAllByText("Raft, step by step").length).toBeGreaterThan(0);
    expect(screen.queryByText(/Select a step to begin/)).not.toBeInTheDocument();
  });

  it("does not leak the payload endpoint", () => {
    const { container } = renderStage(makeStep("VIDEO", false));
    expect(container.innerHTML).not.toContain("/payload");
  });

  it("mounts the live renderer normally when access IS allowed", () => {
    mounted.mockClear();
    renderStage(makeStep("QUIZ", true));
    expect(mounted).toHaveBeenCalledWith("QuizStep");
  });
});
