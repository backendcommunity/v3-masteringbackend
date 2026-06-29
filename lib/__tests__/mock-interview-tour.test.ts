import { describe, it, expect, vi } from "vitest";
import {
  MOCK_INTERVIEW_STEPS,
  mockInterviewSampleControls,
  mockInterviewGuideControls,
} from "@/lib/mock-interview-tour";

describe("mock interview tour", () => {
  it("defines steps in order", () => {
    expect(MOCK_INTERVIEW_STEPS.map((s) => s.id)).toEqual([
      "welcome", "templates", "format", "chat", "input",
      "timer", "end", "result-score", "result-breakdown", "done",
    ]);
  });

  it("anchors exactly the room/result steps", () => {
    const anchored = MOCK_INTERVIEW_STEPS.filter((s) => s.anchor).map((s) => s.anchor);
    expect(anchored).toEqual([
      "mi-chat", "mi-input", "mi-timer", "mi-end", "mi-result-score", "mi-result-breakdown",
    ]);
    expect(MOCK_INTERVIEW_STEPS.find((s) => s.id === "welcome")?.anchor).toBeUndefined();
    expect(MOCK_INTERVIEW_STEPS.find((s) => s.id === "templates")?.anchor).toBeUndefined();
  });

  it("sample controls drive the demo ref on the right steps", async () => {
    const demo = { current: { playNextTurn: vi.fn(), revealResult: vi.fn() } };
    const { actions } = mockInterviewSampleControls(demo);
    await actions["chat"]?.();
    await actions["input"]?.();
    await actions["result-score"]?.();
    expect(demo.current.playNextTurn).toHaveBeenCalledTimes(2);
    expect(demo.current.revealResult).toHaveBeenCalledOnce();
  });

  it("guide controls perform no mutations", () => {
    const { actions } = mockInterviewGuideControls();
    expect(actions).toBeUndefined();
  });
});
