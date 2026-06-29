// lib/__tests__/use-playground-tour.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const driveMock = vi.fn();
vi.mock("@/lib/playground-tour", () => ({
  buildPlaygroundTour: () => ({ drive: driveMock }),
  TOUR_STEPS: [],
}));

import { usePlaygroundTour } from "@/hooks/use-playground-tour";

function setSearch(search: string) {
  Object.defineProperty(window, "location", { value: { search }, writable: true });
}

describe("usePlaygroundTour", () => {
  beforeEach(() => { driveMock.mockClear(); });

  it("offers when ready and ?tour=offer is present", () => {
    setSearch("?tour=offer");
    const { result } = renderHook(() => usePlaygroundTour({ ready: true, theme: "dark", track: vi.fn() }));
    expect(result.current.shouldOffer).toBe(true);
  });

  it("does not offer without ?tour=offer and not alwaysOffer", () => {
    setSearch("");
    const { result } = renderHook(() => usePlaygroundTour({ ready: true, theme: "dark", track: vi.fn() }));
    expect(result.current.shouldOffer).toBe(false);
  });

  it("does not offer until ready", () => {
    setSearch("?tour=offer");
    const { result } = renderHook(() => usePlaygroundTour({ ready: false, theme: "dark", track: vi.fn() }));
    expect(result.current.shouldOffer).toBe(false);
  });

  it("relaunch() drives the tour and fires started", () => {
    setSearch("");
    const track = vi.fn();
    const { result } = renderHook(() => usePlaygroundTour({ ready: true, theme: "dark", track }));
    act(() => result.current.relaunch());
    expect(driveMock).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("playground_tour_started");
  });

  it("autoStart drives once (after the mount delay) when offered", () => {
    vi.useFakeTimers();
    setSearch("?tour=offer");
    const track = vi.fn();
    renderHook(() => usePlaygroundTour({ ready: true, theme: "dark", track, autoStart: true }));
    expect(driveMock).not.toHaveBeenCalled(); // delayed, not synchronous
    act(() => { vi.advanceTimersByTime(500); });
    expect(driveMock).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("playground_tour_started");
    vi.useRealTimers();
  });

  it("autoStart does NOT drive without ?tour=offer and not alwaysOffer", () => {
    vi.useFakeTimers();
    setSearch("");
    const track = vi.fn();
    renderHook(() => usePlaygroundTour({ ready: true, theme: "dark", track, autoStart: true }));
    act(() => { vi.advanceTimersByTime(1000); });
    expect(driveMock).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("alwaysOffer auto-drives even without ?tour=offer", () => {
    vi.useFakeTimers();
    setSearch("");
    const track = vi.fn();
    const { result } = renderHook(() =>
      usePlaygroundTour({ ready: true, theme: "dark", track, autoStart: true, alwaysOffer: true }),
    );
    expect(result.current.shouldOffer).toBe(true);
    act(() => { vi.advanceTimersByTime(500); });
    expect(driveMock).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("playground_tour_started");
    vi.useRealTimers();
  });
});
