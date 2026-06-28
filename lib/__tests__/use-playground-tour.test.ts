// lib/__tests__/use-playground-tour.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const driveMock = vi.fn();
vi.mock("@/lib/playground-tour", () => ({
  buildPlaygroundTour: () => ({ drive: driveMock }),
  TOUR_STEPS: [],
}));

import { usePlaygroundTour, TOUR_FLAG } from "@/hooks/use-playground-tour";

function setSearch(search: string) {
  Object.defineProperty(window, "location", { value: { search }, writable: true });
}

describe("usePlaygroundTour", () => {
  beforeEach(() => { localStorage.clear(); driveMock.mockClear(); });

  it("offers only when ready, ?tour=offer, and flag unset", () => {
    setSearch("?tour=offer");
    const { result } = renderHook(() => usePlaygroundTour({ ready: true, theme: "dark", track: vi.fn() }));
    expect(result.current.shouldOffer).toBe(true);
  });

  it("does not offer when the flag is already set", () => {
    setSearch("?tour=offer");
    localStorage.setItem(TOUR_FLAG, "1");
    const { result } = renderHook(() => usePlaygroundTour({ ready: true, theme: "dark", track: vi.fn() }));
    expect(result.current.shouldOffer).toBe(false);
  });

  it("does not offer without ?tour=offer", () => {
    setSearch("");
    const { result } = renderHook(() => usePlaygroundTour({ ready: true, theme: "dark", track: vi.fn() }));
    expect(result.current.shouldOffer).toBe(false);
  });

  it("start() drives the tour, fires started, and sets the flag", () => {
    setSearch("?tour=offer");
    const track = vi.fn();
    const { result } = renderHook(() => usePlaygroundTour({ ready: true, theme: "dark", track }));
    act(() => result.current.start());
    expect(driveMock).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("playground_tour_started");
    expect(localStorage.getItem(TOUR_FLAG)).toBe("1");
  });

  it("skip() fires skipped and sets the flag without driving", () => {
    setSearch("?tour=offer");
    const track = vi.fn();
    const { result } = renderHook(() => usePlaygroundTour({ ready: true, theme: "dark", track }));
    act(() => result.current.skip());
    expect(driveMock).not.toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith("playground_tour_skipped");
    expect(localStorage.getItem(TOUR_FLAG)).toBe("1");
  });

  it("relaunch() drives without requiring the flag", () => {
    setSearch("");
    const track = vi.fn();
    const { result } = renderHook(() => usePlaygroundTour({ ready: true, theme: "dark", track }));
    act(() => result.current.relaunch());
    expect(driveMock).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("playground_tour_started");
  });

  it("autoStart drives once (after the mount delay) when offered, and sets the flag", () => {
    vi.useFakeTimers();
    setSearch("?tour=offer");
    const track = vi.fn();
    renderHook(() => usePlaygroundTour({ ready: true, theme: "dark", track, autoStart: true }));
    expect(driveMock).not.toHaveBeenCalled(); // delayed, not synchronous
    act(() => { vi.advanceTimersByTime(500); });
    expect(driveMock).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("playground_tour_started");
    expect(localStorage.getItem(TOUR_FLAG)).toBe("1");
    vi.useRealTimers();
  });

  it("autoStart does NOT drive when the tour would not be offered (flag set)", () => {
    vi.useFakeTimers();
    setSearch("?tour=offer");
    localStorage.setItem(TOUR_FLAG, "1");
    const track = vi.fn();
    renderHook(() => usePlaygroundTour({ ready: true, theme: "dark", track, autoStart: true }));
    act(() => { vi.advanceTimersByTime(1000); });
    expect(driveMock).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("alwaysOffer auto-drives even without ?tour=offer and even if the flag is set", () => {
    vi.useFakeTimers();
    setSearch(""); // no opt-in param
    localStorage.setItem(TOUR_FLAG, "1"); // already seen — must be ignored
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
