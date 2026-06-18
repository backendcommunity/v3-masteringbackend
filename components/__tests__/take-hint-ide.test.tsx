// components/__tests__/take-hint-ide.test.tsx
// Task 4: TDD — Take Hint deduction + insufficient-MB modal

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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

// ── Mock the Dialog so Radix doesn't need a real DOM portal ─────────────────
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open?: boolean; children: React.ReactNode }) =>
    open ? React.createElement("div", { "data-testid": "dialog" }, children) : null,
  DialogContent: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  DialogHeader: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  DialogTitle: ({ children }: { children: React.ReactNode }) =>
    React.createElement("h2", null, children),
  DialogDescription: ({ children }: { children: React.ReactNode }) =>
    React.createElement("p", null, children),
  DialogFooter: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  DialogClose: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
}));

// ── Store mock — component calls useAppStore() and reads methods directly ────
const takeHint = vi.fn();
const syncUserSnapshot = vi.fn();

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    takeExerciseHint: takeHint,
    syncUserSnapshot,
  }),
}));

vi.mock("@/lib/user-store", () => ({
  useUserStore: (sel: any) =>
    sel ? sel({ user: { level: 1, points: 100 } }) : { user: null },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/analytics", () => ({
  analytics: { track: vi.fn() },
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────
const step: any = {
  id: "s1",
  order: 1,
  type: "EXERCISE",
  itemId: "e1",
  groupId: null,
  topicId: "t1",
  title: "Test Ex",
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

const ex: any = {
  id: "e1",
  title: "T",
  graderType: "OUTPUT_MATCH",
  languages: ["node"],
  starterCode: "// s",
  hint: "<b>do it</b>",
  hintCost: 30,
  hintTaken: false,
  points: 10,
};

beforeEach(() => vi.clearAllMocks());

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("Take Hint", () => {
  it("insufficient → modal shown, hint NOT revealed", async () => {
    takeHint.mockResolvedValue({ error: "INSUFFICIENT", shortfall: 20 });

    render(
      <PathExerciseIde
        exercise={ex}
        step={step}
        onPassed={vi.fn()}
        onContinue={vi.fn()}
        onComplete={vi.fn()}
      />,
    );

    // Button must show cost label (e.g. "−30 MB")
    const btn = screen.getByRole("button", { name: /Take Hint/i });
    expect(btn).toBeInTheDocument();

    await userEvent.click(btn);

    // Insufficient-MB modal must appear
    expect(await screen.findByText(/more MB/i)).toBeInTheDocument();
    // Hint HTML must NOT be revealed
    expect(screen.queryByText(/do it/i)).toBeNull();
  });

  it("success → hint revealed, syncUserSnapshot called", async () => {
    takeHint.mockResolvedValue({
      hint: "<b>do it</b>",
      points: 70,
      charged: true,
      cost: 30,
    });

    render(
      <PathExerciseIde
        exercise={ex}
        step={step}
        onPassed={vi.fn()}
        onContinue={vi.fn()}
        onComplete={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /Take Hint/i }));

    // Hint content must be revealed
    expect(await screen.findByText(/do it/i)).toBeInTheDocument();
    // syncUserSnapshot must be called with points
    expect(syncUserSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ points: 70 }),
    );
  });

  it("already taken → reveals hint without an API call", async () => {
    render(
      <PathExerciseIde
        exercise={{ ...ex, hintTaken: true }}
        step={step}
        onPassed={vi.fn()}
        onContinue={vi.fn()}
        onComplete={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /Show Hint/i }));

    // Hint content must be revealed
    expect(await screen.findByText(/do it/i)).toBeInTheDocument();
    // takeExerciseHint must NOT be called
    expect(takeHint).not.toHaveBeenCalled();
  });

  it("insufficient modal dismiss closes it", async () => {
    takeHint.mockResolvedValue({ error: "INSUFFICIENT", shortfall: 20 });

    render(
      <PathExerciseIde
        exercise={ex}
        step={step}
        onPassed={vi.fn()}
        onContinue={vi.fn()}
        onComplete={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /Take Hint/i }));

    // Insufficient-MB modal must appear
    const modal = await screen.findByText(/more MB/i);
    expect(modal).toBeInTheDocument();

    // Find and click Dismiss button (exact match to avoid other buttons)
    const dismissBtn = screen.getByRole("button", { name: "Dismiss" });
    await userEvent.click(dismissBtn);

    // Modal text must be gone
    expect(screen.queryByText(/more MB/i)).toBeNull();
  });
});
