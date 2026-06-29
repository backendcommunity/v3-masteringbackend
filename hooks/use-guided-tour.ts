// hooks/use-guided-tour.ts
import { useCallback, useEffect, useMemo, useRef } from "react";
import { buildGuidedTour, type TourAction, type TourStep } from "@/lib/guided-tour";

function tourRequested(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("tour") === "offer";
}

export function useGuidedTour(opts: {
  ready: boolean;
  theme: "dark" | "light";
  track: (event: string, extra?: Record<string, unknown>) => void;
  /** The ordered steps to drive (feature-specific). */
  steps: TourStep[];
  /** Event namespace, e.g. "playground" or "mock_interview". */
  eventPrefix: string;
  /** When true, the tour auto-starts as soon as it would be offered. */
  autoStart?: boolean;
  actions?: Record<string, TourAction>;
  reveals?: Record<string, () => void>;
  /** When true, offer + auto-start EVERY time, regardless of ?tour=offer. */
  alwaysOffer?: boolean;
}) {
  const {
    ready, theme, track, steps, eventPrefix,
    autoStart = false, actions, reveals, alwaysOffer = false,
  } = opts;

  const ev = useCallback(
    (name: string) => `${eventPrefix}_tour_${name}`,
    [eventPrefix],
  );

  const run = useCallback(() => {
    const tour = buildGuidedTour({
      steps,
      theme,
      onStep: (index, id) => track(ev("step_viewed"), { step_index: index, step_id: id }),
      onComplete: () => track(ev("completed")),
      onDismiss: () => track(ev("dismissed")),
      actions,
      reveals,
    });
    track(ev("started"));
    tour.drive();
  }, [steps, theme, track, ev, actions, reveals]);

  const relaunch = useCallback(() => { run(); }, [run]);

  const shouldOffer = useMemo(
    () => ready && (alwaysOffer || tourRequested()),
    [ready, alwaysOffer],
  );

  // Auto-start when offered. Guard is set INSIDE the timer so React StrictMode
  // re-invocations (which clear the pending timer in cleanup) reschedule rather
  // than early-returning — the tour fires exactly once.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (!autoStart || !shouldOffer || autoStarted.current) return;
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled || autoStarted.current) return;
      autoStarted.current = true;
      run();
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [autoStart, shouldOffer, run]);

  return { shouldOffer, relaunch };
}
