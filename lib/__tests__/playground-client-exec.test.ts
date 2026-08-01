import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api", () => ({ api: { get: vi.fn() }, socketAPI: {} }));
import { api } from "../api";

process.env.NEXT_PUBLIC_PLAYGROUND_WORKER_URL = "http://localhost:8787";

import { pgExec, clearWorkerTokens, type PgCtx } from "../playground-client";

const ctx: PgCtx = {
  slug: "s",
  userId: "u",
  projectId: "p",
  projectName: "s",
};

// academy token endpoint response shape: { success, data: { token, expiresAt } }
function mockTokenResponse(token = "tok", ttlMs = 15 * 60 * 1000) {
  (api.get as any).mockResolvedValue({
    data: {
      success: true,
      data: { token, expiresAt: new Date(Date.now() + ttlMs).toISOString() },
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  clearWorkerTokens();
  global.fetch = vi.fn() as any;
});

describe("pgExec", () => {
  it("POSTs cmd to /exec with the ctx fields and returns the worker's response", async () => {
    mockTokenResponse("tok");
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, stdout: "done", stderr: "", exitCode: 0 }),
    });

    const result = await pgExec(ctx, { cmd: "pkill -f 'index.js'" });

    expect(result.ok).toBe(true);
    expect(result.stdout).toBe("done");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as any).mock.calls[0];
    expect(url).toBe("http://localhost:8787/exec");
    expect(init.method).toBe("POST");
    expect(init.headers.authorization).toBe("Bearer tok");
    expect(init.headers["content-type"]).toBe("application/json");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      userId: "u",
      projectId: "p",
      projectName: "s",
      cmd: "pkill -f 'index.js'",
    });
  });
});
