// components/__tests__/streaming-output.test.tsx
// F4: streaming phase + per-check output in the Output tab
//
// Strategy:
//   - Mock getExerciseSocket() to return a controllable EventEmitter-like object
//     so we can emit exercise:phase / exercise:check / submission:result at will.
//   - Render PathExerciseIde and drive it through run/submit actions.
//   - Assert on DOM changes produced by the streamed events.

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PathExerciseIde } from "@/components/pages/path/path-exercise-ide";

// ── Browser APIs missing in jsdom ────────────────────────────────────────────
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// ── Controllable fake socket ─────────────────────────────────────────────────
// The component calls socket.on(event, handler) and socket.off(event, handler).
// We capture handlers so tests can fire them via fakeSocket.fireEvent(event, payload).

type Handler = (payload: unknown) => void;

class FakeSocket {
  private handlers: Record<string, Handler[]> = {};
  on = vi.fn((event: string, handler: Handler) => {
    (this.handlers[event] ??= []).push(handler);
  });
  off = vi.fn((event: string, handler: Handler) => {
    this.handlers[event] = (this.handlers[event] ?? []).filter((h) => h !== handler);
  });
  emit = vi.fn();

  // Fire an event INTO the component (server→client direction).
  fireEvent(event: string, payload: unknown) {
    (this.handlers[event] ?? []).forEach((h) => h(payload));
  }
}

const fakeSocket = new FakeSocket();

vi.mock("@/lib/exercise-socket", () => ({
  getExerciseSocket: () => fakeSocket,
}));

// ── Heavy deps that don't work in jsdom ─────────────────────────────────────
vi.mock("react-resizable-panels", () => ({
  ResizablePanelGroup: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "panel-group" }, children),
  ResizablePanel: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "panel" }, children),
  ResizableHandle: () => React.createElement("div", { "data-testid": "handle" }),
}));

vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "panel-group" }, children),
  ResizablePanel: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "panel" }, children),
  ResizableHandle: () => React.createElement("div", { "data-testid": "handle" }),
}));

vi.mock("@monaco-editor/react", () => ({
  default: ({ value }: { value?: string }) => {
    const React = require("react");
    return React.createElement("textarea", {
      "data-testid": "monaco-editor",
      defaultValue: value ?? "",
    });
  },
}));

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    getSubmissionStatus: vi.fn(),
    takeExerciseHint: vi.fn(),
    syncUserSnapshot: vi.fn(),
  }),
}));

vi.mock("@/lib/user-store", () => ({
  useUserStore: (sel: (s: { user: null }) => unknown) =>
    sel ? sel({ user: null }) : { user: null },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/analytics", () => ({
  analytics: { track: vi.fn() },
}));

// ── Fixtures ─────────────────────────────────────────────────────────────────
const step: any = {
  id: "step1",
  order: 1,
  type: "EXERCISE",
  itemId: "e1",
  groupId: null,
  topicId: "t1",
  title: "Sum two numbers",
  maxPoints: 10,
  optional: false,
  status: "NOT_STARTED",
  recommended: false,
  earnedPoints: 0,
  score: 0,
  passed: false,
  masteryMet: false,
  access: { allowed: true, reason: "" },
};

const exercise: any = {
  id: "e1",
  title: "Sum",
  graderType: "OUTPUT_MATCH",
  languages: ["node"],
  starterCode: "console.log(1+1)",
  hint: "",
  points: 10,
};

function renderIde() {
  return render(
    <PathExerciseIde
      step={step}
      exercise={exercise}
      onComplete={vi.fn()}
      onPassed={vi.fn()}
      onContinue={vi.fn()}
    />,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("F4 — streaming Output tab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the handler registry on the shared fake socket between tests
    (fakeSocket as any).handlers = {};
  });

  it("shows running status with check count and per-check stdout as events arrive", async () => {
    renderIde();

    // 1. Click Run Code — component registers submissionId on submission:queued
    await userEvent.click(screen.getByRole("button", { name: /Run Code/i }));

    // 2. Server acknowledges with submissionId
    act(() => {
      fakeSocket.fireEvent("submission:queued", { submissionId: "run_abc123" });
    });

    // 3. Phase → running
    act(() => {
      fakeSocket.fireEvent("exercise:phase", {
        submissionId: "run_abc123",
        phase: "running",
      });
    });

    // The output tab should show a running status line
    expect(screen.getByTestId("exercise-phase-status")).toBeInTheDocument();
    expect(screen.getByTestId("exercise-phase-status").textContent).toMatch(
      /Running/i,
    );

    // 4. First check arrives
    act(() => {
      fakeSocket.fireEvent("exercise:check", {
        submissionId: "run_abc123",
        index: 0,
        total: 2,
        name: "adds positive numbers",
        passed: true,
        stdout: "2\n",
        hidden: false,
      });
    });

    // Status line should reflect 1/2
    expect(screen.getByTestId("exercise-phase-status").textContent).toMatch(
      /Running.*1.*2/i,
    );
    // Check stdout block should appear
    expect(screen.getByText(/Check 1 — adds positive numbers/i)).toBeInTheDocument();

    // 5. Second check arrives
    act(() => {
      fakeSocket.fireEvent("exercise:check", {
        submissionId: "run_abc123",
        index: 1,
        total: 2,
        name: "handles zero",
        passed: true,
        stdout: "0\n",
        hidden: false,
      });
    });

    // Status line: 2/2
    expect(screen.getByTestId("exercise-phase-status").textContent).toMatch(
      /Running.*2.*2/i,
    );
    // Both check blocks rendered
    expect(screen.getByText(/Check 1 — adds positive numbers/i)).toBeInTheDocument();
    expect(screen.getByText(/Check 2 — handles zero/i)).toBeInTheDocument();
  });

  it("clears in-progress status and shows final summary when submission:result arrives", async () => {
    renderIde();

    await userEvent.click(screen.getByRole("button", { name: /Run Code/i }));

    act(() => {
      fakeSocket.fireEvent("submission:queued", { submissionId: "run_abc123" });
    });

    act(() => {
      fakeSocket.fireEvent("exercise:phase", {
        submissionId: "run_abc123",
        phase: "running",
      });
    });

    act(() => {
      fakeSocket.fireEvent("exercise:check", {
        submissionId: "run_abc123",
        index: 0,
        total: 1,
        name: "sums correctly",
        passed: true,
        stdout: "42\n",
        hidden: false,
      });
    });

    // Spinner / phase status is visible
    expect(screen.getByTestId("exercise-phase-status")).toBeInTheDocument();

    // Final result arrives
    act(() => {
      fakeSocket.fireEvent("submission:result", {
        submissionId: "run_abc123",
        status: "PASSED",
        score: 100,
        passedCount: 1,
        totalCount: 1,
        caseResults: [
          { name: "sums correctly", passed: true, gotPreview: "42" },
        ],
      });
    });

    // Phase status spinner should be gone after final result
    expect(screen.queryByTestId("exercise-phase-status")).toBeNull();

    // Final summary line should be present (existing finish() logic)
    expect(screen.getByText(/PASSED/i)).toBeInTheDocument();
    expect(screen.getByText(/100%/i)).toBeInTheDocument();
  });

  it("ignores exercise:phase and exercise:check events for a different submissionId", async () => {
    renderIde();

    await userEvent.click(screen.getByRole("button", { name: /Run Code/i }));

    act(() => {
      fakeSocket.fireEvent("submission:queued", { submissionId: "run_abc123" });
    });

    // Fire events for a DIFFERENT submissionId
    act(() => {
      fakeSocket.fireEvent("exercise:phase", {
        submissionId: "run_STALE",
        phase: "running",
      });
    });

    act(() => {
      fakeSocket.fireEvent("exercise:check", {
        submissionId: "run_STALE",
        index: 0,
        total: 1,
        name: "stale check",
        passed: false,
        stdout: "stale output",
        hidden: false,
      });
    });

    // No phase status for the stale id
    expect(screen.queryByTestId("exercise-phase-status")).toBeNull();
    // No stale check block
    expect(screen.queryByText(/stale output/i)).toBeNull();
  });

  it("skips stdout block for hidden checks (empty stdout)", async () => {
    renderIde();

    await userEvent.click(screen.getByRole("button", { name: /Run Code/i }));

    act(() => {
      fakeSocket.fireEvent("submission:queued", { submissionId: "run_abc123" });
    });

    act(() => {
      fakeSocket.fireEvent("exercise:phase", {
        submissionId: "run_abc123",
        phase: "running",
      });
    });

    act(() => {
      fakeSocket.fireEvent("exercise:check", {
        submissionId: "run_abc123",
        index: 0,
        total: 1,
        name: "hidden check",
        passed: true,
        stdout: "",
        hidden: true,
      });
    });

    // The check label should NOT render (no stdout, hidden)
    expect(screen.queryByText(/Check 1 — hidden check/i)).toBeNull();
  });
});
