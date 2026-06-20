import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api", () => ({ api: { get: vi.fn() }, socketAPI: {} }));
import { api } from "../api";

process.env.NEXT_PUBLIC_PLAYGROUND_WORKER_URL = "http://localhost:8787";

import {
  getWorkerToken,
  pgFs,
  pgTerminalUrl,
  clearWorkerTokens,
  type PgCtx,
} from "../playground-client";

const ctx: PgCtx = {
  slug: "proj",
  userId: "user-1",
  projectId: "proj-db-id",
  projectName: "my-project",
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

describe("getWorkerToken", () => {
  it("fetches once and caches by slug (second call hits no api.get)", async () => {
    mockTokenResponse("tok");

    const a = await getWorkerToken("proj");
    const b = await getWorkerToken("proj");

    expect(a).toBe("tok");
    expect(b).toBe("tok");
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith("/projects/proj/playground-token");
  });
});

describe("pgFs", () => {
  it("POSTs the worker /fs with bearer token + body, returns parsed json", async () => {
    mockTokenResponse("tok");
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });

    const res = await pgFs(ctx, { op: "write", path: "index.js", content: "x" });

    expect(res).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as any).mock.calls[0];
    expect(url).toBe("http://localhost:8787/fs");
    expect(init.method).toBe("POST");
    expect(init.headers.authorization).toBe("Bearer tok");
    expect(init.headers["content-type"]).toBe("application/json");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      userId: "user-1",
      projectId: "proj-db-id",
      projectName: "my-project",
      op: "write",
      path: "index.js",
      content: "x",
    });
  });

  it("on 401 clears the cache, refetches a fresh token, and retries once", async () => {
    // First token fetch -> "tok1", forced refetch -> "tok2"
    (api.get as any)
      .mockResolvedValueOnce({
        data: { success: true, data: { token: "tok1", expiresAt: new Date(Date.now() + 9e5).toISOString() } },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: { token: "tok2", expiresAt: new Date(Date.now() + 9e5).toISOString() } },
      });

    (global.fetch as any)
      .mockResolvedValueOnce({ status: 401, ok: false, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true }) });

    const res = await pgFs(ctx, { op: "read", path: "index.js" });

    expect(res).toEqual({ ok: true });
    expect(api.get).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    // retry used the fresh token
    const secondInit = (global.fetch as any).mock.calls[1][1];
    expect(secondInit.headers.authorization).toBe("Bearer tok2");
  });

  it("throws when the retried request is also 401 (second-401 after refresh)", async () => {
    // First token fetch -> "tok1", forced refetch -> "tok2"
    (api.get as any)
      .mockResolvedValueOnce({
        data: { success: true, data: { token: "tok1", expiresAt: new Date(Date.now() + 9e5).toISOString() } },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: { token: "tok2", expiresAt: new Date(Date.now() + 9e5).toISOString() } },
      });

    // Both worker fetches return 401 — even after the forced refresh.
    (global.fetch as any)
      .mockResolvedValueOnce({ status: 401, ok: false, json: async () => ({}) })
      .mockResolvedValueOnce({ status: 401, ok: false, json: async () => ({}) });

    await expect(pgFs(ctx, { op: "read", path: "index.js" })).rejects.toThrow(
      /unauthorized after token refresh/,
    );

    expect(api.get).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("throws with the worker error message when !res.ok", async () => {
    mockTokenResponse("tok");
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "boom" }),
    });

    await expect(pgFs(ctx, { op: "list" })).rejects.toThrow(/boom/);
  });
});

describe("pgTerminalUrl", () => {
  it("builds a ws:// url with token, ctx fields, cols and rows", () => {
    const url = pgTerminalUrl("tok", ctx, { cols: 100, rows: 30 });

    expect(url.startsWith("ws://localhost:8787/terminal?")).toBe(true);
    expect(url).toContain("token=tok");
    expect(url).toContain("userId=user-1");
    expect(url).toContain("projectId=proj-db-id");
    expect(url).toContain("projectName=my-project");
    expect(url).toContain("cols=100");
    expect(url).toContain("rows=30");
  });

  it("defaults cols=80 rows=24", () => {
    const url = pgTerminalUrl("tok", ctx);
    expect(url).toContain("cols=80");
    expect(url).toContain("rows=24");
  });
});
