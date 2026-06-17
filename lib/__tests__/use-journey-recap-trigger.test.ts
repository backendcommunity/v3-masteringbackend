import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("../api", () => ({ api: { get: vi.fn(), post: vi.fn() }, socketAPI: {} }));
import { api } from "../api";
import { useAppStore } from "../store";
import { triggerItemRecap } from "../use-journey-recap-trigger";

beforeEach(() => {
  vi.clearAllMocks();
  useAppStore.setState({ returnRecap: null } as any);
  sessionStorage.clear();
});

it("sets returnRecap when eligible, then suppresses second call in same session", async () => {
  (api.get as any).mockResolvedValue({ data: { data: { eventId: "e1", surface: "ITEM", tier: "WEEK", itemType: "COURSE", itemId: "c1" } } });
  await triggerItemRecap("COURSE", "c1");
  expect(useAppStore.getState().returnRecap?.eventId).toBe("e1");

  useAppStore.setState({ returnRecap: null } as any);
  await triggerItemRecap("COURSE", "c1");
  expect(api.get).toHaveBeenCalledTimes(1); // second call short-circuited by sessionStorage
  expect(useAppStore.getState().returnRecap).toBeNull();
});

it("does nothing when not eligible (null payload)", async () => {
  (api.get as any).mockResolvedValue({ data: { data: null } });
  await triggerItemRecap("PROJECT", "p1");
  expect(useAppStore.getState().returnRecap).toBeNull();
});
