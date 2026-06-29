import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useGuidedTour } from "@/hooks/use-guided-tour";
import type { TourStep } from "@/lib/guided-tour";

const STEPS: TourStep[] = [{ id: "welcome", title: "Hi", body: "go" }];

describe("useGuidedTour", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("does not offer until ready", () => {
    const { result } = renderHook(() =>
      useGuidedTour({
        ready: false,
        theme: "dark",
        track: vi.fn(),
        steps: STEPS,
        eventPrefix: "mock_interview",
        alwaysOffer: true,
      }),
    );
    expect(result.current.shouldOffer).toBe(false);
  });

  it("offers when alwaysOffer + ready", () => {
    const { result } = renderHook(() =>
      useGuidedTour({
        ready: true,
        theme: "dark",
        track: vi.fn(),
        steps: STEPS,
        eventPrefix: "mock_interview",
        alwaysOffer: true,
      }),
    );
    expect(result.current.shouldOffer).toBe(true);
  });

  it("exposes a relaunch function", () => {
    const { result } = renderHook(() =>
      useGuidedTour({
        ready: true,
        theme: "light",
        track: vi.fn(),
        steps: STEPS,
        eventPrefix: "playground",
      }),
    );
    expect(typeof result.current.relaunch).toBe("function");
  });
});
