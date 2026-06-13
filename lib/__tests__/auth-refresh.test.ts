import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPost } = vi.hoisted(() => ({ mockPost: vi.fn() }));
vi.mock("@/lib/api", () => ({ api: { post: mockPost } }));

import { refreshSession, __resetRefreshForTests } from "../auth-refresh";

describe("refreshSession single-flight", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetRefreshForTests();
  });

  it("collapses concurrent callers into a single /auth/refresh call", async () => {
    let resolve!: () => void;
    mockPost.mockReturnValue(new Promise<void>((r) => { resolve = () => r(); }));

    const a = refreshSession();
    const b = refreshSession();
    const c = refreshSession();
    resolve();
    await Promise.all([a, b, c]);

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith("/auth/refresh");
  });

  it("allows a new refresh after the previous one settles", async () => {
    mockPost.mockResolvedValue(undefined);
    await refreshSession();
    await refreshSession();
    expect(mockPost).toHaveBeenCalledTimes(2);
  });

  it("propagates failure to all concurrent callers and resets", async () => {
    mockPost.mockRejectedValueOnce(new Error("boom"));
    const a = refreshSession();
    const b = refreshSession();
    await expect(a).rejects.toThrow("boom");
    await expect(b).rejects.toThrow("boom");
    expect(mockPost).toHaveBeenCalledTimes(1);

    mockPost.mockResolvedValue(undefined);
    await refreshSession();
    expect(mockPost).toHaveBeenCalledTimes(2);
  });
});
