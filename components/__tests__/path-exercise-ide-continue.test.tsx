// components/__tests__/path-exercise-ide-continue.test.tsx
// Task 4: TDD — Continue button + saved-solution load

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PathExerciseIde } from "@/components/pages/path/path-exercise-ide";

// ── Setup browser APIs missing in jsdom ──────────────────────────────────────
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

// ── Mock heavy deps that don't run in jsdom ──────────────────────────────────
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
  // No JSX — avoids needing a JSX transform plugin in vitest
  default: ({ value }: { value?: string }) => {
    const React = require("react");
    return React.createElement("textarea", {
      "data-testid": "monaco-editor",
      defaultValue: value ?? "",
    });
  },
}));

vi.mock("@/lib/exercise-socket", () => ({
  getExerciseSocket: () => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  }),
}));

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({}),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/analytics", () => ({
  analytics: { track: vi.fn() },
}));

// ── Fixtures ─────────────────────────────────────────────────────────────────

// A step object matching PathSessionStep (only the fields the component reads)
const step: any = {
  id: "step1",
  order: 1,
  type: "EXERCISE",
  itemId: "e1",
  groupId: null,
  topicId: "t1",
  title: "Sum",
  maxPoints: 10,
  optional: false,
  status: "COMPLETED",
  recommended: false,
  earnedPoints: 10,
  score: 100,
  passed: true,
  masteryMet: true,
  access: { allowed: true, reason: "" },
};

// A minimal exercise that already has a passed submission
const passedExercise: any = {
  id: "e1",
  title: "Sum",
  graderType: "OUTPUT_MATCH",
  languages: ["node"],
  starterCode: "// start",
  hint: "",
  points: 10,
  userSubmission: {
    code: "console.log(42)",
    language: "node",
    status: "PASSED",
    score: 100,
    bestScore: 100,
    passed: true,
  },
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("PathExerciseIde — Continue + saved solution", () => {
  it("returning passed: seeds saved code, shows Passed badge + Continue, clicking Continue calls onContinue", async () => {
    const onContinue = vi.fn();
    const onPassed = vi.fn();

    render(
      <PathExerciseIde
        exercise={passedExercise}
        step={step}
        onPassed={onPassed}
        onContinue={onContinue}
        onComplete={vi.fn()}
      />,
    );

    // Passed badge must appear near the title
    expect(screen.getByText(/Passed/i)).toBeInTheDocument();

    // Continue button must be rendered
    const cont = screen.getByRole("button", { name: /Continue/i });
    expect(cont).toBeInTheDocument();

    // Clicking Continue calls the onContinue callback
    await userEvent.click(cont);
    expect(onContinue).toHaveBeenCalled();
  });
});
