// hooks/use-playground-tour.ts
import { useCallback, useEffect, useMemo, useRef } from "react";
import { buildPlaygroundTour, type TourAction } from "@/lib/playground-tour";
import { TOUR_EVENTS } from "@/lib/analytics-events";

export const TOUR_FLAG = "mb_pg_tour_v2";

function flagSet(): boolean {
  try { return typeof window !== "undefined" && localStorage.getItem(TOUR_FLAG) === "1"; }
  catch { return false; }
}

function setFlag() {
  try { localStorage.setItem(TOUR_FLAG, "1"); } catch { /* private mode */ }
}

function tourRequested(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("tour") === "offer";
}

export function usePlaygroundTour(opts: {
  ready: boolean;
  theme: "dark" | "light";
  track: (event: string, extra?: Record<string, unknown>) => void;
  /** When true, the tour auto-starts once as soon as it would be offered. */
  autoStart?: boolean;
  /** step id -> real action run when the user advances past that step. */
  actions?: Record<string, TourAction>;
  /** step id -> reveal callback that opens the step's panel before highlight. */
  reveals?: Record<string, () => void>;
  /**
   * When true (the sample project), offer + auto-start EVERY time the page is
   * opened — ignore the ?tour=offer flag and the one-time localStorage flag.
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

  const start = useCallback(() => { setFlag(); run(); }, [run]);
  const skip = useCallback(() => { setFlag(); track(TOUR_EVENTS.skipped); }, [track]);
  const relaunch = useCallback(() => { run(); }, [run]);

  // Sample project: always offer (ignore opt-in + flag). Otherwise: only via
  // ?tour=offer and only until the user has seen it once.
  const shouldOffer = useMemo(
    () => ready && (alwaysOffer || (tourRequested() && !flagSet())),
    [ready, alwaysOffer],
  );

  // Auto-start when offered. A short delay lets the playground's data-tour
  // anchors mount so driver.js positions against real elements. The sample
  // (alwaysOffer) starts via run() so it never sets the "seen" flag — it must
  // re-run on every visit; non-sample uses start() to record the one-time flag.
  //
  // IMPORTANT: the "already started" guard is set INSIDE the timer, not before
  // it. React StrictMode (dev) and any dependency change re-invoke this effect
  // and run its cleanup, which clears the pending timer. If the guard were set
  // up-front, that re-invocation would early-return without rescheduling and
  // the tour would never start. Setting the guard only once the timer actually
  // fires lets each re-invocation reschedule, so it fires exactly once.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (!autoStart || !shouldOffer || autoStarted.current) return;
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled || autoStarted.current) return;
      autoStarted.current = true;
      if (alwaysOffer) run();
      else start();
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [autoStart, shouldOffer, alwaysOffer, run, start]);

  return { shouldOffer, start, skip, relaunch };
}
