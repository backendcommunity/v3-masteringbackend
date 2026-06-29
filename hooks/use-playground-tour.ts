// hooks/use-playground-tour.ts
import { useGuidedTour } from "@/hooks/use-guided-tour";
import { TOUR_STEPS, type TourAction } from "@/lib/playground-tour";

export function usePlaygroundTour(opts: {
  ready: boolean;
  theme: "dark" | "light";
  track: (event: string, extra?: Record<string, unknown>) => void;
  autoStart?: boolean;
  actions?: Record<string, TourAction>;
  reveals?: Record<string, () => void>;
  alwaysOffer?: boolean;
}) {
  return useGuidedTour({ ...opts, steps: TOUR_STEPS, eventPrefix: "playground" });
}
