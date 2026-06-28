// hooks/use-playground-tour.ts
import { useCallback, useMemo } from "react";
import { buildPlaygroundTour } from "@/lib/playground-tour";
import { TOUR_EVENTS } from "@/lib/analytics-events";

export const TOUR_FLAG = "mb_pg_tour_v1";

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
}) {
  const { ready, theme, track } = opts;

  const run = useCallback(() => {
    const tour = buildPlaygroundTour({
      theme,
      onStep: (index, id) => track(TOUR_EVENTS.stepViewed, { step_index: index, step_id: id }),
      onComplete: () => track(TOUR_EVENTS.completed),
      onDismiss: () => track(TOUR_EVENTS.dismissed),
    });
    track(TOUR_EVENTS.started);
    tour.drive();
  }, [theme, track]);

  const start = useCallback(() => { setFlag(); run(); }, [run]);
  const skip = useCallback(() => { setFlag(); track(TOUR_EVENTS.skipped); }, [track]);
  const relaunch = useCallback(() => { run(); }, [run]);

  const shouldOffer = useMemo(
    () => ready && tourRequested() && !flagSet(),
    [ready],
  );

  return { shouldOffer, start, skip, relaunch };
}
