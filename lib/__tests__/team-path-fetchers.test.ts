import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
  socketAPI: {},
}));

import { api } from "../api";
import { useAppStore } from "../store";

beforeEach(() => vi.clearAllMocks());

describe("store.setSectionItems", () => {
  /**
   * `ValidateSetSectionItems` (backend) has no `id` key and no
   * `allowUnknown` — Joi's default `allowUnknown: false` rejects any
   * extra field with a 422 ("items[0].id" is not allowed"). Items are
   * diffed by the composite (type, refId), never by an id, unlike
   * sections. `PathItem` (the read shape from `getTeamPath`) carries a
   * derived `id` of `type:refId` for React keys — a caller that spreads
   * one of those into an item update must not leak it onto the wire.
   * This proves the fetcher itself strips it, not just that the input
   * type happens to omit the field.
   */
  it("never lets an id reach the PUT body, even if the caller's object carries one", async () => {
    (api.put as any).mockResolvedValue({ data: { data: { id: "sec-1", itemCount: 1 } } });

    // Simulates a caller spreading a PathItem (which has `id`, `title`,
    // `parentLabel`) into what it believes is a TeamPathItemInput.
    const itemWithLeakedId = {
      id: "COURSE:c1",
      type: "COURSE",
      refId: "c1",
      title: "Intro to Postgres",
      parentLabel: undefined,
    } as any;

    await useAppStore
      .getState()
      .setSectionItems("t1", "p1", "sec-1", [itemWithLeakedId]);

    expect(api.put).toHaveBeenCalledTimes(1);
    const [url, body] = (api.put as any).mock.calls[0];
    expect(url).toBe("/teams/t1/paths/p1/sections/sec-1/items");
    expect(body.items).toEqual([{ type: "COURSE", refId: "c1" }]);
    for (const sent of body.items) {
      expect(sent).not.toHaveProperty("id");
      expect(sent).not.toHaveProperty("title");
      expect(sent).not.toHaveProperty("parentLabel");
    }
  });

  it("passes plain {type, refId} items through unchanged", async () => {
    (api.put as any).mockResolvedValue({ data: { data: { id: "sec-1", itemCount: 2 } } });

    const result = await useAppStore.getState().setSectionItems("t1", "p1", "sec-1", [
      { type: "COURSE", refId: "c1" },
      { type: "LESSON", refId: "l1" },
    ]);

    expect(api.put).toHaveBeenCalledWith("/teams/t1/paths/p1/sections/sec-1/items", {
      items: [
        { type: "COURSE", refId: "c1" },
        { type: "LESSON", refId: "l1" },
      ],
    });
    expect(result).toEqual({ id: "sec-1", itemCount: 2 });
  });
});

describe("store.createTeamPath", () => {
  it("omits summary entirely when not provided", async () => {
    (api.post as any).mockResolvedValue({
      data: { data: { id: "p1", title: "New Path", slug: "new-path" } },
    });

    await useAppStore.getState().createTeamPath("t1", "New Path");

    expect(api.post).toHaveBeenCalledWith("/teams/t1/paths", { title: "New Path" });
  });

  it("sends an explicit summary when provided, including null", async () => {
    (api.post as any).mockResolvedValue({
      data: { data: { id: "p1", title: "New Path", slug: "new-path" } },
    });

    await useAppStore.getState().createTeamPath("t1", "New Path", "A summary");
    expect(api.post).toHaveBeenCalledWith("/teams/t1/paths", {
      title: "New Path",
      summary: "A summary",
    });

    await useAppStore.getState().createTeamPath("t1", "New Path", null);
    expect(api.post).toHaveBeenLastCalledWith("/teams/t1/paths", {
      title: "New Path",
      summary: null,
    });
  });

  it("returns only {id, title, slug} — not a full TeamPath", async () => {
    (api.post as any).mockResolvedValue({
      data: { data: { id: "p1", title: "New Path", slug: "new-path" } },
    });

    const result = await useAppStore.getState().createTeamPath("t1", "New Path");
    expect(result).toEqual({ id: "p1", title: "New Path", slug: "new-path" });
  });
});
