import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api", () => ({ api: { post: vi.fn() }, socketAPI: {} }));

import { api } from "../api";
import { useAppStore } from "../store";

beforeEach(() => vi.clearAllMocks());

describe("takeExerciseHint", () => {
  it("returns hint payload on 200", async () => {
    (api.post as any).mockResolvedValue({
      data: { data: { hint: "h", points: 70, charged: true, cost: 30 } },
    });
    const r = await useAppStore.getState().takeExerciseHint("e1");
    expect(api.post).toHaveBeenCalledWith("/exercises/e1/hint");
    expect(r).toMatchObject({ hint: "h", points: 70, charged: true });
  });
  it("maps 402 to INSUFFICIENT", async () => {
    (api.post as any).mockRejectedValue({
      response: { status: 402, data: { shortfall: 20 } },
    });
    const r = await useAppStore.getState().takeExerciseHint("e1");
    expect(r).toMatchObject({ error: "INSUFFICIENT", shortfall: 20 });
  });
});
