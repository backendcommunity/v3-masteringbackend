// lib/__tests__/get-path-item-dedupe.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api", () => ({ api: { get: vi.fn() }, socketAPI: {} }));

import { api } from "../api";
import { useAppStore } from "../store";

beforeEach(() => vi.clearAllMocks());

describe("getPathItem dedupe", () => {
  it("only fires one network request for two concurrent calls with the same endpoint", async () => {
    (api.get as any).mockResolvedValue({ data: { data: { title: "Video 1" } } });

    const [a, b] = await Promise.all([
      useAppStore.getState().getPathItem("/api/v3/paths/items/step-1"),
      useAppStore.getState().getPathItem("/api/v3/paths/items/step-1"),
    ]);

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(a).toEqual({ title: "Video 1" });
    expect(b).toEqual({ title: "Video 1" });
  });

  it("fires a new request for a different endpoint", async () => {
    // Uses endpoints not touched by the previous test — the cache is a
    // module-level Map that persists across cases in this file, so reusing
    // "step-1" here would silently hit the earlier test's cached promise.
    (api.get as any).mockResolvedValue({ data: { data: { title: "Video 2" } } });

    await useAppStore.getState().getPathItem("/api/v3/paths/items/step-3");
    await useAppStore.getState().getPathItem("/api/v3/paths/items/step-4");

    expect(api.get).toHaveBeenCalledTimes(2);
  });
});
