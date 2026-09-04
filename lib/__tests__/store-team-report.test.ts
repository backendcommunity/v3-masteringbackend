import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
  socketAPI: {},
}));

import { api } from "../api";
import { useAppStore } from "../store";

beforeEach(() => vi.clearAllMocks());

describe("store.getTeamReport", () => {
  it("sends the group as a query parameter when one is given", async () => {
    (api.get as any).mockResolvedValue({ data: { data: {} } });

    await useAppStore.getState().getTeamReport("t1", "12w", "g9");
    expect(api.get).toHaveBeenCalledWith("/teams/t1/reports", {
      params: { range: "12w", groupId: "g9" },
    });
  });

  it("omits the parameter entirely for the whole team", async () => {
    (api.get as any).mockResolvedValue({ data: { data: {} } });

    await useAppStore.getState().getTeamReport("t1", "12w");
    expect(api.get).toHaveBeenCalledWith("/teams/t1/reports", {
      params: { range: "12w" },
    });
  });
});
