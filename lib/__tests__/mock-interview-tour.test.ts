import { describe, it, expect, vi } from "vitest";
import {
  MOCK_INTERVIEW_STEPS,
  MOCK_INTERVIEW_GUIDE_STEPS,
  mockInterviewSampleControls,
  mockInterviewGuideControls,
} from "@/lib/mock-interview-tour";

describe("mock interview tour", () => {
  it("defines steps in order", () => {
    expect(MOCK_INTERVIEW_STEPS.map((s) => s.id)).toEqual([
      "welcome", "templates", "format", "chat", "input",
      "code", "whiteboard", "timer", "end", "result", "done",
    ]);
  });

  it("anchors exactly the room/result steps", () => {
    const anchored = MOCK_INTERVIEW_STEPS.filter((s) => s.anchor).map((s) => s.anchor);
    expect(anchored).toEqual([
      "mi-chat", "mi-input", "mi-code", "mi-whiteboard", "mi-timer", "mi-end", "mi-result-score",
    ]);
    expect(MOCK_INTERVIEW_STEPS.find((s) => s.id === "welcome")?.anchor).toBeUndefined();
    expect(MOCK_INTERVIEW_STEPS.find((s) => s.id === "templates")?.anchor).toBeUndefined();
  });

  it("MOCK_INTERVIEW_GUIDE_STEPS excludes templates and format", () => {
    const ids = MOCK_INTERVIEW_GUIDE_STEPS.map((s) => s.id);
    expect(ids).not.toContain("templates");
    expect(ids).not.toContain("format");
    // All other steps are present in the same order
    expect(ids).toEqual([
      "welcome", "chat", "input", "code", "whiteboard", "timer", "end", "result", "done",
    ]);
  });

  it("sample controls drive the demo ref on the right steps", async () => {
    const demo = { current: { playNextTurn: vi.fn(), revealResult: vi.fn(), showCode: vi.fn(), showWhiteboard: vi.fn() } };
    const { actions } = mockInterviewSampleControls(demo);
    await actions["chat"]?.();
    await actions["input"]?.();
    await actions["result"]?.();
    expect(demo.current.playNextTurn).toHaveBeenCalledTimes(2);
    expect(demo.current.revealResult).toHaveBeenCalledOnce();
  });

  it("sample controls expose reveals.code that calls showCode", () => {
    const demo = { current: { playNextTurn: vi.fn(), revealResult: vi.fn(), showCode: vi.fn(), showWhiteboard: vi.fn() } };
    const { reveals } = mockInterviewSampleControls(demo);
    reveals["code"]?.();
    expect(demo.current.showCode).toHaveBeenCalledOnce();
  });

  it("sample controls expose reveals.whiteboard that calls showWhiteboard", () => {
    const demo = { current: { playNextTurn: vi.fn(), revealResult: vi.fn(), showCode: vi.fn(), showWhiteboard: vi.fn() } };
    const { reveals } = mockInterviewSampleControls(demo);
    reveals["whiteboard"]?.();
    expect(demo.current.showWhiteboard).toHaveBeenCalledOnce();
  });

  it("guide controls take a ui arg and expose reveals.code and reveals.whiteboard", () => {
    const showCode = vi.fn();
    const showWhiteboard = vi.fn();
    const { actions, reveals } = mockInterviewGuideControls({ showCode, showWhiteboard });
    expect(actions).toBeUndefined();
    reveals?.["code"]?.();
    expect(showCode).toHaveBeenCalledOnce();
    reveals?.["whiteboard"]?.();
    expect(showWhiteboard).toHaveBeenCalledOnce();
  });
});
