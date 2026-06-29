import { describe, it, expect, vi } from "vitest";
import { buildGuidedTour, type TourStep } from "@/lib/guided-tour";

const STEPS: TourStep[] = [
  { id: "welcome", title: "Hi", body: "start" },
  { id: "panel", title: "Panel", body: "look", anchor: "panel" },
];

describe("guided tour engine", () => {
  it("builds a driver with a drive() method from supplied steps", () => {
    const tour = buildGuidedTour({ steps: STEPS, theme: "dark", onStep: vi.fn() });
    expect(typeof tour.drive).toBe("function");
  });

  it("reveals the first step's target before driving", async () => {
    const reveal = vi.fn();
    const tour = buildGuidedTour({
      steps: STEPS,
      theme: "light",
      onStep: vi.fn(),
      reveals: { welcome: reveal },
    });
    await tour.drive();
    expect(reveal).toHaveBeenCalledOnce();
  });
});
