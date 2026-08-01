// Task 4 — regression test: REST-API mode projects (playgroundConfig.mode
// unset / not "terminal") must keep using the existing pgRun(...) path when
// Run is clicked, and must NEVER touch the new terminal-mode wiring (pgExec,
// Terminal.runCommand). Guards against the inline stand-in check in
// handleRunProject (`project?.playgroundConfig?.mode === "terminal"` — see
// the TODO(Task 5) comment there) accidentally flipping the wrong branch for
// ordinary projects.
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// vi.mock(...) factories are hoisted above every import in this file, so any
// shared state they close over must be created via vi.hoisted() (plain
// top-level consts would be a TDZ reference at hoist time).
const {
  mockProject,
  getProject,
  pgRun,
  pgExec,
  pgFs,
  pgSeed,
  pgStatus,
  pgStop,
  pgReload,
  pgDownload,
  pgRestart,
  runCommand,
  usePlaygroundControlsMock,
} = vi.hoisted(() => {
  const mockProject = {
    id: "proj-1",
    slug: "test-project",
    title: "Test Project",
    languages: ["javascript"],
    isSample: false,
    isPremium: false,
    enrolled: true,
    projectTasks: [],
    userProject: null,
    // playgroundConfig intentionally omitted → the inline mode check in
    // handleRunProject falls through to "rest-api".
  };
  const pgControlsState = { setControls: vi.fn(), reset: vi.fn() };
  const usePlaygroundControlsMock: any = (selector: any) =>
    selector(pgControlsState);
  usePlaygroundControlsMock.getState = () => pgControlsState;

  return {
    mockProject,
    getProject: vi.fn().mockResolvedValue(mockProject),
    pgRun: vi.fn().mockResolvedValue({ status: "healthy", serverUrl: null }),
    pgExec: vi
      .fn()
      .mockResolvedValue({ ok: true, stdout: "", stderr: "", exitCode: 0 }),
    pgFs: vi.fn().mockResolvedValue({ ok: true, files: [] }),
    pgSeed: vi.fn().mockResolvedValue({ ok: true }),
    pgStatus: vi
      .fn()
      .mockResolvedValue({ ok: true, running: false, status: null }),
    pgStop: vi.fn().mockResolvedValue({ ok: true }),
    pgReload: vi.fn().mockResolvedValue({ ok: true }),
    pgDownload: vi.fn(),
    pgRestart: vi.fn(),
    runCommand: vi.fn(),
    usePlaygroundControlsMock,
  };
});

// ── next/navigation ──────────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
  usePathname: () => "/projects/test-project",
  useSearchParams: () => new URLSearchParams(),
}));

// ── next-themes ──────────────────────────────────────────────────────────
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "dark", setTheme: vi.fn() }),
}));

// ── sonner ───────────────────────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() },
}));

// ── app store (only getProject is used by this component) ────────────────
vi.mock("@/lib/store", () => ({
  useAppStore: () => ({ getProject }),
}));

// ── user ─────────────────────────────────────────────────────────────────
vi.mock("@/hooks/use-user", () => ({
  useUser: () => ({ id: "user-1", github: null, githubInstallationId: null }),
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

// ── playground controls store (zustand-style: hook + static getState) ────
vi.mock("@/lib/playground-controls-store", () => ({
  usePlaygroundControls: usePlaygroundControlsMock,
}));

// ── guided tour (avoid pulling in the real tour engine) ───────────────────
vi.mock("@/hooks/use-playground-tour", () => ({
  usePlaygroundTour: () => ({ shouldOffer: false, relaunch: vi.fn() }),
}));

// ── worker transport — the functions under test ───────────────────────────
vi.mock("@/lib/playground-client", () => ({
  pgFs,
  pgRun,
  pgStop,
  pgStatus,
  pgReload,
  pgSeed,
  pgDownload,
  pgRestart,
  pgExec,
}));

// ── heavy / unrelated child components — stub them out ────────────────────
vi.mock("@monaco-editor/react", () => ({
  default: () => React.createElement("div", { "data-testid": "mock-editor" }),
}));
vi.mock("@/components/pages/path/path-feedback-dialog", () => ({
  PathFeedbackDialog: () => null,
}));
vi.mock("@/components/pages/playground/github-connect", () => ({
  GithubConnect: () => null,
}));
vi.mock("@/components/pages/kap/kap-tutor-panel", () => ({
  KapTutorPanel: () => null,
}));
vi.mock("@/components/payment-dialog", () => ({
  PaymentDialog: () => null,
}));
vi.mock("@/components/confetti-celebration", () => ({
  default: () => null,
}));
vi.mock("@/components/ContextMenu", () => ({
  ContextMenu: () => null,
}));

// The runCommand spy that terminal-mode Run would call — asserted NEVER
// called from the REST-API path.
vi.mock("@/components/atoms/Terminal", () => ({
  Terminal: React.forwardRef((_props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({ runCommand }));
    return React.createElement("div", { "data-testid": "mock-terminal" });
  }),
}));

import { ProjectPlaygroundPage } from "../project-playground";

beforeEach(() => {
  vi.clearAllMocks();
  getProject.mockResolvedValue(mockProject);
  pgRun.mockResolvedValue({ status: "healthy", serverUrl: null });
  pgFs.mockResolvedValue({ ok: true, files: [] });
  pgSeed.mockResolvedValue({ ok: true });
  pgStatus.mockResolvedValue({ ok: true, running: false, status: null });
});

describe("ProjectPlaygroundPage — REST-API mode Run (regression)", () => {
  it("REST-API mode projects still call pgRun, never terminalRunRef or pgExec", async () => {
    const user = userEvent.setup();

    render(
      <ProjectPlaygroundPage slug="test-project" onNavigate={() => {}} />,
    );

    await waitFor(() =>
      expect(getProject).toHaveBeenCalledWith("test-project"),
    );

    await user.click(
      await screen.findByRole("button", { name: /run server/i }),
    );

    await waitFor(() => {
      expect(pgRun).toHaveBeenCalledTimes(1);
    });

    expect(pgExec).not.toHaveBeenCalled();
    expect(runCommand).not.toHaveBeenCalled();
  });
});
