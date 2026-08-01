import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

// jsdom has no ResizeObserver implementation; Terminal.tsx uses one to defer
// opening xterm until its host has a real size. Stub it (same inline-polyfill
// pattern simple-editor-run.test.tsx uses for matchMedia).
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
(global as any).ResizeObserver = MockResizeObserver;

const pasteMock = vi.fn();

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
  paste: pasteMock,
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

vi.mock("@cloudflare/sandbox/xterm", () => ({
  SandboxAddon: vi.fn().mockImplementation(() => ({
    activate: vi.fn(),
    connect: vi.fn(),
    dispose: vi.fn(),
  })),
}));
vi.mock("@/lib/playground-client", () => ({
  getWorkerToken: vi.fn().mockResolvedValue("token"),
  pgTerminalUrl: vi.fn().mockReturnValue("wss://worker.test/terminal"),
}));

import { Terminal } from "../Terminal";

describe("Terminal imperative run API", () => {
  it("runCommand() pastes the command with a trailing carriage return", () => {
    const ref = React.createRef<any>();
    render(
      <Terminal
        ref={ref}
        ctx={{ slug: "s", userId: "u", projectId: "p", projectName: "s" }}
        onClose={() => {}}
      />,
    );
    ref.current?.runCommand("node index.js");
    expect(pasteMock).toHaveBeenCalledWith("node index.js\r");
  });
});
