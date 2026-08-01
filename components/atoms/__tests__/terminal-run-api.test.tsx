import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

// jsdom has no ResizeObserver implementation; Terminal.tsx uses one to defer
// opening xterm until its host has a real size. Stub it (same inline-polyfill
// pattern simple-editor-run.test.tsx uses for matchMedia).
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
(global as any).ResizeObserver = MockResizeObserver;

// jsdom (without `pretendToBeVisual`) has no requestAnimationFrame, but
// Terminal.tsx defers opening xterm/connecting the PTY until the next frame.
// Stub it onto a real (setTimeout-backed) macrotask so that chain actually
// runs during tests instead of throwing or silently never firing.
const rafStub = (cb: FrameRequestCallback) =>
  setTimeout(() => cb(Date.now()), 0) as unknown as number;
(global as any).requestAnimationFrame = rafStub;
(global as any).cancelAnimationFrame = (id: number) => clearTimeout(id);

// jsdom elements report 0x0 by default, which makes Terminal.tsx's
// `openTerminal()` bail out (it waits for a real host size before opening
// xterm and connecting the PTY). Stub a real-looking size so the
// rAF → getWorkerToken → SandboxAddon chain actually runs in these tests.
Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
  configurable: true,
  value: 800,
});
Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
  configurable: true,
  value: 400,
});

const inputMock = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "dark" }),
}));

// Terminal.tsx loads xterm/xterm-addon-fit via a runtime `require()` (client-only
// lazy load), not a static import — Vitest's `vi.mock` only rewrites `import`/
// `import()` syntax, so it can't intercept that call (verified directly: a
// vi.mock("xterm", ...) here is silently ignored and the real xterm.js package
// loads instead, which then throws inside jsdom's incomplete Clipboard API).
// Node's `require.cache` is a process-wide singleton keyed by resolved path, so
// poisoning the cache entry here is picked up by Terminal.tsx's own require()
// call regardless of how its `require` binding was created. This keeps
// Terminal.tsx's internals untouched (only the forwardRef wrap changes it).
const xtermPath = require.resolve("xterm");
const xtermAddonFitPath = require.resolve("xterm-addon-fit");
const mockXtermInstance = {
  open: vi.fn(),
  loadAddon: vi.fn(),
  writeln: vi.fn(),
  input: inputMock,
  onData: vi.fn(),
  dispose: vi.fn(),
  cols: 80,
  rows: 24,
  options: {},
};
class MockXTerm {
  constructor() {
    return mockXtermInstance as any;
  }
}
class MockFitAddon {
  fit = vi.fn();
  activate = vi.fn();
}
require.cache[xtermPath] = {
  id: xtermPath,
  filename: xtermPath,
  loaded: true,
  exports: { Terminal: MockXTerm },
} as any;
require.cache[xtermAddonFitPath] = {
  id: xtermAddonFitPath,
  filename: xtermAddonFitPath,
  loaded: true,
  exports: { FitAddon: MockFitAddon },
} as any;

// Capture the options Terminal.tsx hands to `new SandboxAddon(...)` (in
// particular `onStateChange`) so tests can drive the PTY's reported
// connection state by hand — the mock never fires it on its own, mirroring
// how the real addon only calls it once its async WebSocket handshake
// resolves.
let capturedSandboxOptions: any = null;
vi.mock("@cloudflare/sandbox/xterm", () => ({
  // A plain `function` (not an arrow) — Terminal.tsx invokes this via
  // `new SandboxAddon(...)`, and arrow functions aren't constructable.
  SandboxAddon: vi.fn().mockImplementation(function (options: any) {
    capturedSandboxOptions = options;
    return {
      activate: vi.fn(),
      connect: vi.fn(),
      dispose: vi.fn(),
    };
  }),
}));
vi.mock("@/lib/playground-client", () => ({
  getWorkerToken: vi.fn().mockResolvedValue("token"),
  pgTerminalUrl: vi.fn().mockReturnValue("wss://worker.test/terminal"),
}));

import { Terminal } from "../Terminal";

const testCtx = { slug: "s", userId: "u", projectId: "p", projectName: "s" };

describe("Terminal imperative run API", () => {
  beforeEach(() => {
    inputMock.mockClear();
    capturedSandboxOptions = null;
  });

  it("runCommand() sends the command then a real Enter via input() (not paste, which bracketed-paste mode would swallow) once the PTY reports connected", async () => {
    const ref = React.createRef<any>();
    render(<Terminal ref={ref} ctx={testCtx} onClose={() => {}} />);

    // Wait for the rAF → getWorkerToken → SandboxAddon construction chain to
    // resolve, then simulate the PTY WebSocket reporting a successful connect.
    await waitFor(() => expect(capturedSandboxOptions).not.toBeNull());
    capturedSandboxOptions.onStateChange("connected");

    const result = ref.current?.runCommand("node index.js");
    expect(inputMock).toHaveBeenNthCalledWith(1, "node index.js", true);
    expect(inputMock).toHaveBeenNthCalledWith(2, "\r", true);
    expect(result).toBe(true);
  });

  it("runCommand() returns false and does not paste while the PTY is still connecting", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const ref = React.createRef<any>();
    render(<Terminal ref={ref} ctx={testCtx} onClose={() => {}} />);

    // No onStateChange("connected") has fired — runCommand is called before
    // the async connect chain resolves, which is exactly the window a fast
    // Run click can land in.
    const result = ref.current?.runCommand("node index.js");
    expect(inputMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("runCommand() returns false and does not paste when the PTY reports disconnected", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const ref = React.createRef<any>();
    render(<Terminal ref={ref} ctx={testCtx} onClose={() => {}} />);

    await waitFor(() => expect(capturedSandboxOptions).not.toBeNull());
    capturedSandboxOptions.onStateChange("disconnected", undefined);

    const result = ref.current?.runCommand("node index.js");
    expect(inputMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
    warnSpy.mockRestore();
  });
});
