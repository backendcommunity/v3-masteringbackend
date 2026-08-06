// lib/playground-demo-executor.ts
// Demo mode utilities: create mock pgCtx and state for demo playground.

import type { PgCtx } from "@/lib/playground-client";
import { DEMO_STARTER_FILES } from "./playground-demo-script";

// Global demo state (shared across component lifecycle)
export const demoExecutorState = {
  serverRunning: false,
};

// Create a PgCtx for demo mode (dummy project)
export function createDemoPgCtx(): PgCtx {
  return {
    slug: "playground-demo",
    userId: "demo-user",
    projectId: "demo-project-id",
    projectName: "playground-demo",
  };
}

// Demo-aware executor wrappers (intercept pgFs, pgRun, etc. when in demo mode)
export function pgFsDemo(op: string, payload?: any): Promise<any> {
  if (op === "list") {
    return Promise.resolve({
      ok: true,
      files: DEMO_STARTER_FILES.map((f) => ({
        name: f.name,
        relativePath: f.name,
        type: "file" as const,
      })),
    });
  }
  if (op === "read") {
    const file = DEMO_STARTER_FILES.find((f) => f.name === payload?.path);
    return Promise.resolve({
      ok: !!file,
      content: file?.content ?? "",
    });
  }
  if (op === "write") {
    return Promise.resolve({ ok: true });
  }
  return Promise.resolve({ ok: false });
}

export function pgRunDemo(): Promise<any> {
  demoExecutorState.serverRunning = true;
  return Promise.resolve({ ok: true, running: true });
}

export function pgStopDemo(): Promise<any> {
  demoExecutorState.serverRunning = false;
  return Promise.resolve({ ok: true, running: false });
}

export function pgStatusDemo(): Promise<any> {
  return Promise.resolve({
    ok: true,
    running: demoExecutorState.serverRunning,
    baseURL: demoExecutorState.serverRunning
      ? "http://localhost:3000"
      : undefined,
  });
}

export function pgExecDemo(cmd: string): Promise<any> {
  if (cmd.includes("test") || cmd.includes("npm test")) {
    return Promise.resolve({
      ok: true,
      exitCode: 0,
      stdout: "Test passed",
      stderr: "",
    });
  }
  return Promise.resolve({ ok: true, exitCode: 0, stdout: "", stderr: "" });
}
