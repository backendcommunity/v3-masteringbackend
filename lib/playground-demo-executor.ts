// lib/playground-demo-executor.ts
// Mock executor for demo mode. Returns canned responses; no real executor/worker calls.

import type { PgCtx } from "@/lib/playground-client";
import { DEMO_STARTER_FILES } from "./playground-demo-script";

type DemoState = {
  serverRunning: boolean;
};

export function createDemoExecutor(): Partial<PgCtx> {
  const state: DemoState = {
    serverRunning: false,
  };

  return {
    pgFs: async (op: string, payload?: any) => {
      if (op === "list") {
        return {
          ok: true,
          files: DEMO_STARTER_FILES.map((f) => ({
            name: f.name,
            relativePath: f.name,
            type: "file" as const,
          })),
        };
      }
      if (op === "read") {
        const file = DEMO_STARTER_FILES.find((f) => f.name === payload?.path);
        return {
          ok: !!file,
          content: file?.content ?? "",
        };
      }
      if (op === "write") {
        // Mock write: pretend success, don't persist
        return { ok: true };
      }
      return { ok: false };
    },

    pgRun: async () => {
      state.serverRunning = true;
      return { ok: true, running: true };
    },

    pgStop: async () => {
      state.serverRunning = false;
      return { ok: true, running: false };
    },

    pgStatus: async () => {
      return {
        ok: true,
        running: state.serverRunning,
        baseURL: state.serverRunning ? "http://localhost:3000" : undefined,
      };
    },

    pgExec: async (cmd: string) => {
      // Mock test execution
      if (cmd.includes("test") || cmd.includes("npm test")) {
        return {
          ok: true,
          exitCode: 0,
          stdout: "Test passed",
          stderr: "",
        };
      }
      return { ok: true, exitCode: 0, stdout: "", stderr: "" };
    },

    pgSeed: async () => ({ ok: true }),
    pgReload: async () => ({ ok: true }),
    pgRestart: async () => ({ ok: true, running: true }),
    pgDownload: async () => ({ ok: true }),
  };
}
