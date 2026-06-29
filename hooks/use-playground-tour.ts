// hooks/use-playground-tour.ts
import { useCallback, useEffect, useMemo, useRef } from "react";
import { buildPlaygroundTour, type TourAction } from "@/lib/playground-tour";
import { TOUR_EVENTS } from "@/lib/analytics-events";

function tourRequested(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("tour") === "offer";
}

export function usePlaygroundTour(opts: {
  ready: boolean;
  theme: "dark" | "light";
  track: (event: string, extra?: Record<string, unknown>) => void;
  /** When true, the tour auto-starts as soon as it would be offered. */
  autoStart?: boolean;
  /** step id -> real action run when the user advances past that step. */
  actions?: Record<string, TourAction>;
  /** step id -> reveal callback that opens the step's panel before highlight. */
  reveals?: Record<string, () => void>;
  /**
   * When true (the sample project), offer + auto-start EVERY time the page is
   * opened, regardless of the ?tour=offer param.
   */
  alwaysOffer?: boolean;
}) {
  const { ready, theme, track, autoStart = false, actions, reveals, alwaysOffer = false } = opts;

  const run = useCallback(() => {
    const tour = buildPlaygroundTour({
      theme,
      onStep: (index, id) => track(TOUR_EVENTS.stepViewed, { step_index: index, step_id: id }),
      onComplete: () => track(TOUR_EVENTS.completed),
      onDismiss: () => track(TOUR_EVENTS.dismissed),
      actions,
      reveals,
    });
    track(TOUR_EVENTS.started);
    tour.drive();
  }, [theme, track, actions, reveals]);

  // The top-bar "Take a tour" button re-runs the tour anytime.
  const relaunch = useCallback(() => { run(); }, [run]);

  // Auto-start whenever the tour is explicitly requested: the sample always
  // (alwaysOffer), or any project reached via ?tour=offer (the Try Playground
  // button sets it). Both are explicit user intent — it starts every time.
  const shouldOffer = useMemo(
    () => ready && (alwaysOffer || tourRequested()),
    [ready, alwaysOffer],
  );

  // Auto-start when offered. A short delay lets the playground's data-tour
  // anchors mount so driver.js positions against real elements.
  //
  // IMPORTANT: the "already started" guard is set INSIDE the timer, not before
  // it. React StrictMode (dev) and any dependency change re-invoke this effect
  // and run its cleanup, which clears the pending timer. If the guard were set
  // up-front, that re-invocation would early-return without rescheduling and
  // the tour would never start. Setting the guard only once the timer fires
  // lets each re-invocation reschedule, so it fires exactly once.
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
