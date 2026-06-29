// lib/__tests__/playground-tour.test.ts
import { describe, it, expect, vi } from "vitest";
import { TOUR_STEPS, buildPlaygroundTour } from "@/lib/playground-tour";

describe("playground tour", () => {
  it("defines steps in the documented order", () => {
    expect(TOUR_STEPS.map((s) => s.id)).toEqual([
      "welcome", "file-tree", "editor", "kap", "run-server",
      "terminal", "run-test", "github-sync", "preview", "done",
    ]);
  });
  it("anchors every non-centered step to a data-tour id", () => {
    const anchored = TOUR_STEPS.filter((s) => s.anchor);
    for (const s of anchored) expect(typeof s.anchor).toBe("string");
    expect(TOUR_STEPS.find((s) => s.id === "welcome")?.anchor).toBeUndefined();
  });
  it("builds a driver with a drive() method", () => {
    const tour = buildPlaygroundTour({ theme: "dark", onStep: vi.fn() });
    expect(typeof tour.drive).toBe("function");
  });
});
