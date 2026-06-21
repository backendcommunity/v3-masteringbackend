import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the transport layer; the sync engine only ever talks to `pgGit`.
vi.mock("@/lib/playground-client", () => ({ pgGit: vi.fn() }));
import { pgGit, type PgCtx } from "@/lib/playground-client";

import {
  createPlaygroundSync,
  type PlaygroundSyncOpts,
  type SyncState,
} from "@/lib/playground-sync";

const pgGitMock = pgGit as unknown as ReturnType<typeof vi.fn>;

const ctx: PgCtx = {
  slug: "proj",
  userId: "user-1",
  projectId: "proj-db-id",
  projectName: "my-project",
};

function makeOpts(over: Partial<PlaygroundSyncOpts> = {}) {
  let lastSha: string | null = null;
  const opts: PlaygroundSyncOpts = {
    ctx,
    owner: "acme",
    repo: "widgets",
    installationId: 42,
    getLastSha: vi.fn(() => lastSha),
    setLastSha: vi.fn((s: string | null) => {
      lastSha = s;
    }),
    onStatus: vi.fn(),
    onConflict: vi.fn(),
    onReloaded: vi.fn(),
    now: () => 1_700_000_000_000, // fixed clock for deterministic HH:MM + timestamps
    ...over,
  };
  return opts;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("nudgeSave debounce", () => {
  it("collapses multiple calls within the window into one push", async () => {
    pgGitMock.mockResolvedValue({ pushed: true, sha: "new" });
    const opts = makeOpts();
    const sync = createPlaygroundSync(opts);

    sync.nudgeSave();
    sync.nudgeSave();
    sync.nudgeSave();

    // Nothing fires before the debounce elapses.
    expect(pgGitMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2500);

    const pushes = pgGitMock.mock.calls.filter((c) => c[1].op === "push");
    expect(pushes).toHaveLength(1);
    expect(pushes[0][1].message).toMatch(/^autosave /);
  });

  it("uses a custom debounceMs", async () => {
    pgGitMock.mockResolvedValue({ pushed: true, sha: "new" });
    const sync = createPlaygroundSync(makeOpts({ debounceMs: 1000 }));

    sync.nudgeSave();
    await vi.advanceTimersByTimeAsync(999);
    expect(pgGitMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(pgGitMock).toHaveBeenCalledTimes(1);
  });
});

describe("saveNow", () => {
  it("on push success updates lastSha and reports synced with a timestamp", async () => {
    pgGitMock.mockResolvedValue({ pushed: true, sha: "new" });
    const opts = makeOpts();
    const sync = createPlaygroundSync(opts);

    await sync.saveNow("idle");

    expect(opts.setLastSha).toHaveBeenCalledWith("new");
    const statuses = (opts.onStatus as any).mock.calls;
    expect(statuses[0]).toEqual(["syncing"]);
    const last = statuses[statuses.length - 1];
    expect(last[0]).toBe("synced");
    expect(typeof last[1]).toBe("number");
  });

  it("passes baseSha from getLastSha and the reason-derived message", async () => {
    pgGitMock.mockResolvedValue({ pushed: true, sha: "s2" });
    const opts = makeOpts({ getLastSha: vi.fn(() => "base-1") });
    const sync = createPlaygroundSync(opts);

    await sync.saveNow("run");

    expect(pgGitMock).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        op: "push",
        owner: "acme",
        repo: "widgets",
        installationId: 42,
        baseSha: "base-1",
        message: "checkpoint before run",
      }),
    );
  });

  it("on conflict reports conflict + onConflict and does NOT touch lastSha", async () => {
    pgGitMock.mockResolvedValue({ conflict: true, remoteSha: "rrr" });
    const opts = makeOpts();
    const sync = createPlaygroundSync(opts);

    await sync.saveNow("idle");

    expect(opts.onConflict).toHaveBeenCalledWith("rrr");
    const states = (opts.onStatus as any).mock.calls.map(
      (c: [SyncState]) => c[0],
    );
    expect(states).toContain("conflict");
    expect(opts.setLastSha).not.toHaveBeenCalled();
  });

  it("on throw reports error", async () => {
    pgGitMock.mockRejectedValue(new Error("boom"));
    const opts = makeOpts();
    const sync = createPlaygroundSync(opts);

    await sync.saveNow("manual");

    const states = (opts.onStatus as any).mock.calls.map(
      (c: [SyncState]) => c[0],
    );
    expect(states).toContain("error");
  });
});

describe("single-in-flight coalescing", () => {
  it("runs only one push at a time and coalesces into exactly one follow-up", async () => {
    let resolveFirst: (v: any) => void = () => {};
    pgGitMock
      .mockImplementationOnce(
        () => new Promise((res) => (resolveFirst = res)),
      )
      .mockResolvedValueOnce({ pushed: true, sha: "second" });

    const sync = createPlaygroundSync(makeOpts());

    const p1 = sync.saveNow("idle"); // in flight, deferred
    const p2 = sync.saveNow("manual"); // should coalesce, not start a new push

    expect(pgGitMock).toHaveBeenCalledTimes(1);

    resolveFirst({ pushed: true, sha: "first" });
    await p1;
    await p2;
    await vi.runAllTimersAsync();

    // first push + exactly one coalesced follow-up
    expect(pgGitMock).toHaveBeenCalledTimes(2);
  });
});

describe("conflict resolution", () => {
  it("resolveOverwrite calls pushForce and updates lastSha", async () => {
    pgGitMock.mockResolvedValue({ sha: "forced" });
    const opts = makeOpts();
    const sync = createPlaygroundSync(opts);

    await sync.resolveOverwrite();

    expect(pgGitMock).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        op: "pushForce",
        message: "overwrite from playground",
      }),
    );
    expect(opts.setLastSha).toHaveBeenCalledWith("forced");
  });

  it("resolveReload calls resetToRemote then onReloaded", async () => {
    pgGitMock.mockResolvedValue({ sha: "remote-head" });
    const opts = makeOpts();
    const sync = createPlaygroundSync(opts);

    await sync.resolveReload();

    expect(pgGitMock).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({ op: "resetToRemote" }),
    );
    expect(opts.setLastSha).toHaveBeenCalledWith("remote-head");
    expect(opts.onReloaded).toHaveBeenCalled();
  });
});

describe("hydrate", () => {
  it("sets lastSha + reports synced and returns {empty, sha}", async () => {
    pgGitMock.mockResolvedValue({ empty: false, sha: "head-1" });
    const opts = makeOpts();
    const sync = createPlaygroundSync(opts);

    const result = await sync.hydrate();

    expect(pgGitMock).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({ op: "hydrate" }),
    );
    expect(opts.setLastSha).toHaveBeenCalledWith("head-1");
    expect(result).toEqual({ empty: false, sha: "head-1" });
    const last = (opts.onStatus as any).mock.calls.slice(-1)[0];
    expect(last[0]).toBe("synced");
  });

  it("on throw returns null and reports error", async () => {
    pgGitMock.mockRejectedValue(new Error("nope"));
    const opts = makeOpts();
    const sync = createPlaygroundSync(opts);

    const result = await sync.hydrate();

    expect(result).toBeNull();
    const states = (opts.onStatus as any).mock.calls.map(
      (c: [SyncState]) => c[0],
    );
    expect(states).toContain("error");
  });
});

describe("dispose", () => {
  it("cancels a pending debounced save", async () => {
    pgGitMock.mockResolvedValue({ pushed: true, sha: "new" });
    const sync = createPlaygroundSync(makeOpts());

    sync.nudgeSave();
    sync.dispose();
    await vi.advanceTimersByTimeAsync(5000);

    expect(pgGitMock).not.toHaveBeenCalled();
  });
});
