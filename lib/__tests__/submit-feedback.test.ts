import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api", () => ({ api: { get: vi.fn(), post: vi.fn() }, socketAPI: {} }));

import { api } from "../api";
import { useAppStore } from "../store";

beforeEach(() => vi.clearAllMocks());

describe("store.submitFeedback", () => {
  it("posts message, source, and context to /feedback with no extra shape", async () => {
    (api.post as any).mockResolvedValue({ data: { data: { ok: true } } });

    await useAppStore.getState().submitFeedback({
      message: "This page is great",
      source: "path-lesson",
      context: { lessonSlug: "intro-to-http" },
    });

    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith("/feedback", {
      message: "This page is great",
      source: "path-lesson",
      context: { lessonSlug: "intro-to-http" },
    });
  });

  it("re-throws when api.post rejects, so callers can catch it", async () => {
    const err = Object.assign(new Error("Request failed"), {
      response: { status: 429 },
    });
    (api.post as any).mockRejectedValue(err);

    await expect(
      useAppStore.getState().submitFeedback({
        message: "Too much feedback",
        source: "playground",
      })
    ).rejects.toBe(err);

    expect(api.post).toHaveBeenCalledWith("/feedback", {
      message: "Too much feedback",
      source: "playground",
    });
  });
});
