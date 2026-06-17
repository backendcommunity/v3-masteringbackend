import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("../api", () => ({ api: { get: vi.fn(), post: vi.fn() }, socketAPI: {} }));
import { api } from "../api";
import { useAppStore } from "../store";

beforeEach(() => vi.clearAllMocks());

describe("journey store actions", () => {
  it("getJourneyRecap returns data.data", async () => {
    (api.get as any).mockResolvedValue({ data: { data: { eventId: "e1", tier: "MONTH" } } });
    const r = await useAppStore.getState().getJourneyRecap("COURSE", "c1");
    expect(api.get).toHaveBeenCalledWith("/journey/recap", { params: { itemType: "COURSE", itemId: "c1" } });
    expect(r?.eventId).toBe("e1");
  });
  it("getWelcomeBack returns null when data.data null", async () => {
    (api.get as any).mockResolvedValue({ data: { data: null } });
    expect(await useAppStore.getState().getWelcomeBack()).toBeNull();
  });
  it("sendRecapFeedback posts useful", async () => {
    (api.post as any).mockResolvedValue({ data: { data: { ok: true } } });
    await useAppStore.getState().sendRecapFeedback("e1", true);
    expect(api.post).toHaveBeenCalledWith("/journey/recap/e1/feedback", { useful: true });
  });
  it("setReturnRecap updates state", () => {
    useAppStore.getState().setReturnRecap({ eventId: "e2" } as any);
    expect(useAppStore.getState().returnRecap?.eventId).toBe("e2");
    useAppStore.getState().setReturnRecap(null);
    expect(useAppStore.getState().returnRecap).toBeNull();
  });
});
