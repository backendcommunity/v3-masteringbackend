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

import { toast } from "sonner";

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

// Task 5 — panel gating by playgroundConfig.mode + the widened Run-Test gate.
describe("ProjectPlaygroundPage — terminal-mode panel gating (Task 5)", () => {
  const terminalConfig = {
    mode: "terminal" as const,
    language: "node" as const,
    entrypoint: "index.js",
  };

  it("terminal mode mounts the Terminal (and a non-null runCommand ref) even before any file is opened", async () => {
    const terminalProject = {
      ...mockProject,
      playgroundConfig: terminalConfig,
    };
    getProject.mockResolvedValueOnce(terminalProject);

    render(
      <ProjectPlaygroundPage slug="test-project" onNavigate={() => {}} />,
    );

    await waitFor(() =>
      expect(getProject).toHaveBeenCalledWith("test-project"),
    );

    // A fresh project: no files opened, no tasks completed, so `onStartPage`
    // would previously have been true and suppressed the Terminal mount
    // entirely. It must be mounted regardless for terminal-mode projects.
    expect(await screen.findByTestId("mock-terminal")).toBeInTheDocument();
  });

  it("REST-API mode (no playgroundConfig.mode) still shows Preview button and iframe tab", async () => {
    const user = userEvent.setup();

    render(
      <ProjectPlaygroundPage slug="test-project" onNavigate={() => {}} />,
    );

    await waitFor(() =>
      expect(getProject).toHaveBeenCalledWith("test-project"),
    );

    const previewToggle = await screen.findByRole("button", {
      name: /preview/i,
    });
    expect(previewToggle).toBeInTheDocument();

    await user.click(previewToggle);

    // Opening the panel reveals the tab strip's own "Preview" button
    // alongside the top-bar toggle — two "Preview"-labelled buttons total
    // (role-scoped so the unrelated, always-present mobile bottom-nav tab,
    // role="tab", doesn't count).
    await waitFor(() => {
      expect(
        screen.getAllByRole("button", { name: /^preview$/i }).length,
      ).toBeGreaterThanOrEqual(2);
    });
  });

  it("terminal mode hides the Preview button and forces the Tests tab open", async () => {
    const user = userEvent.setup();
    const terminalProject = {
      ...mockProject,
      playgroundConfig: terminalConfig,
    };
    getProject.mockResolvedValueOnce(terminalProject);

    render(
      <ProjectPlaygroundPage slug="test-project" onNavigate={() => {}} />,
    );

    await waitFor(() =>
      expect(getProject).toHaveBeenCalledWith("test-project"),
    );

    // No "Preview" *button* control anywhere — not the top-bar toggle, not
    // (once opened) the tab strip. Scoped to role="button" so the unrelated,
    // always-present mobile bottom-nav tab (role="tab", outside Task 5's
    // scope) doesn't produce a false positive.
    expect(
      screen.queryByRole("button", { name: /^preview$/i }),
    ).not.toBeInTheDocument();

    const testsToggle = await screen.findByRole("button", { name: /tests/i });
    await user.click(testsToggle);

    expect(
      screen.queryByRole("button", { name: /^preview$/i }),
    ).not.toBeInTheDocument();
    // rightTab defaulted to "tests" — the tests pane content renders as soon
    // as the panel opens, with no need to click a "Tests" tab-strip button.
    expect(
      await screen.findByText(/no tests defined for this project/i),
    ).toBeInTheDocument();
  });

  it("terminal mode's Run-Test button is enabled for a terminalSpec task with no baseURL", async () => {
    const user = userEvent.setup();
    const terminalTask = {
      id: "task-1",
      title: "Print hello to stdout",
      type: "task",
      terminalSpec: { command: "node index.js", expectedOutput: "hello" },
      userTask: null,
    };
    const terminalProject = {
      ...mockProject,
      playgroundConfig: terminalConfig,
      projectTasks: [
        { id: "group-1", title: "Milestone 1", tasks: [terminalTask] },
      ],
    };
    getProject.mockResolvedValueOnce(terminalProject);

    render(
      <ProjectPlaygroundPage slug="test-project" onNavigate={() => {}} />,
    );

    await waitFor(() =>
      expect(getProject).toHaveBeenCalledWith("test-project"),
    );

    await user.click(await screen.findByText(/print hello to stdout/i));

    const runTestBtn = await screen.findByRole("button", {
      name: /run test/i,
    });
    // No apiSpec on this task, so the REST-API-specific `!baseURL` gate must
    // not apply — the button must be enabled even though no server was run.
    expect(runTestBtn).not.toBeDisabled();
  });
});

// Fix 4 — positive coverage for the terminal-mode Run happy path. The
// existing Task 5 tests only cover panel gating; nothing yet asserts that
// clicking Run actually pkills the previous process and types the right
// `node`/`python3 <entrypoint>` command into the terminal. Commands are
// asserted by shape (starts-with + contains-entrypoint) rather than exact
// string equality since `escapeSingleQuoted` (Fix 2) wraps the entrypoint in
// shell-quoting that would make an exact match brittle.
describe("ProjectPlaygroundPage — terminal-mode Run happy path (Fix 4)", () => {
  const nodeTerminalConfig = {
    mode: "terminal" as const,
    language: "node" as const,
    entrypoint: "server/index.js",
  };
  const pythonTerminalConfig = {
    mode: "terminal" as const,
    language: "python" as const,
    entrypoint: "app/main.py",
  };

  it("clicking Run on a terminal-mode Node project pkills the old process then runs `node <entrypoint>`", async () => {
    const user = userEvent.setup();
    const terminalProject = {
      ...mockProject,
      playgroundConfig: nodeTerminalConfig,
    };
    getProject.mockResolvedValueOnce(terminalProject);

    render(
      <ProjectPlaygroundPage slug="test-project" onNavigate={() => {}} />,
    );

    await waitFor(() =>
      expect(getProject).toHaveBeenCalledWith("test-project"),
    );

    await user.click(
      await screen.findByRole("button", { name: /run server/i }),
    );

    await waitFor(() => expect(pgExec).toHaveBeenCalled());
    const pkillCmd = pgExec.mock.calls[0][1]?.cmd as string;
    expect(pkillCmd).toContain("pkill -f");
    expect(pkillCmd).toContain(nodeTerminalConfig.entrypoint);

    await waitFor(() => expect(runCommand).toHaveBeenCalled());
    const runCmd = runCommand.mock.calls[0][0] as string;
    expect(runCmd.startsWith("node ")).toBe(true);
    expect(runCmd).toContain(nodeTerminalConfig.entrypoint);
  });

  it("clicking Run on a terminal-mode Python project runs `python3 <entrypoint>`", async () => {
    const user = userEvent.setup();
    const terminalProject = {
      ...mockProject,
      playgroundConfig: pythonTerminalConfig,
    };
    getProject.mockResolvedValueOnce(terminalProject);

    render(
      <ProjectPlaygroundPage slug="test-project" onNavigate={() => {}} />,
    );

    await waitFor(() =>
      expect(getProject).toHaveBeenCalledWith("test-project"),
    );

    await user.click(
      await screen.findByRole("button", { name: /run server/i }),
    );

    await waitFor(() => expect(runCommand).toHaveBeenCalled());
    const runCmd = runCommand.mock.calls[0][0] as string;
    expect(runCmd.startsWith("python3 ")).toBe(true);
    expect(runCmd).toContain(pythonTerminalConfig.entrypoint);
  });

  it("clicking Run on a terminal-mode project with no entrypoint configured shows an error toast and never calls runCommand/pgExec", async () => {
    const user = userEvent.setup();
    const terminalProject = {
      ...mockProject,
      playgroundConfig: { mode: "terminal" as const, language: "node" as const },
    };
    getProject.mockResolvedValueOnce(terminalProject);

    render(
      <ProjectPlaygroundPage slug="test-project" onNavigate={() => {}} />,
    );

    await waitFor(() =>
      expect(getProject).toHaveBeenCalledWith("test-project"),
    );

    await user.click(
      await screen.findByRole("button", { name: /run server/i }),
    );

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(pgExec).not.toHaveBeenCalled();
    expect(runCommand).not.toHaveBeenCalled();
  });
});
