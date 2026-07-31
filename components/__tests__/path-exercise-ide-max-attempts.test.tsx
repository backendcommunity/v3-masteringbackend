// components/__tests__/path-exercise-ide-max-attempts.test.tsx

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PathExerciseIde } from "@/components/pages/path/path-exercise-ide";

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

vi.mock("@/lib/user-store", () => ({
  useUserStore: (sel: any) => (sel ? sel({ user: null }) : { user: null }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/analytics", () => ({
  analytics: { track: vi.fn() },
}));

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
  status: "IN_PROGRESS",
  recommended: false,
  earnedPoints: 0,
  score: 0,
  passed: false,
  masteryMet: false,
  access: { allowed: true, reason: "" },
};

// Exhausted, not passed, window resets in 3h.
const exhaustedExercise: any = {
  id: "e1",
  title: "Sum",
  graderType: "OUTPUT_MATCH",
  languages: ["node"],
  starterCode: "// start",
  hint: "",
  points: 10,
  attempts: 5,
  maxAttempts: 5,
  attemptsResetAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
};

describe("PathExerciseIde — max attempts reached", () => {
  it("disables Submit, shows the locked message, and Continue navigates without a pass", async () => {
    const onContinue = vi.fn();

    render(
      <PathExerciseIde
        exercise={exhaustedExercise}
        step={step}
        onPassed={vi.fn()}
        onContinue={onContinue}
        onComplete={vi.fn()}
      />,
    );

    const submitBtn = screen.getByRole("button", { name: /Submit Answer/i });
    expect(submitBtn).toBeDisabled();

    expect(screen.getByText(/Max attempts reached/i)).toBeInTheDocument();

    const cont = screen.getByRole("button", { name: /Continue/i });
    expect(cont).toBeInTheDocument();
    await userEvent.click(cont);
    expect(onContinue).toHaveBeenCalled();
  });
});
