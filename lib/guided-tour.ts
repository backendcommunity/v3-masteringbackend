// lib/guided-tour.ts
// Feature-agnostic driver.js tour engine. Both the playground and the mock
// interview walkthrough drive this with their own steps/actions/reveals.
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

export type TourStep = {
  id: string;
  title: string;
  body: string;
  anchor?: string;
};

/** A real action a step performs when it becomes active. */
export type TourAction = () => Promise<void> | void;

export function buildGuidedTour(opts: {
  /** The ordered steps to drive. Anchored steps target [data-tour="<anchor>"]. */
  steps: TourStep[];
  theme: "dark" | "light";
  onStep: (index: number, id: string) => void;
  onComplete?: () => void;
  onDismiss?: () => void;
  /** step id -> real action run once when that step becomes active. */
  actions?: Record<string, TourAction>;
  /**
   * step id -> "reveal" callback that makes the step's target visible BEFORE we
   * highlight it. Must be a fast synchronous state change; we wait two frames
   * for React to mount the target before highlighting.
   */
  reveals?: Record<string, () => void>;
}) {
  const visible = opts.steps;

  const fired = new Set<string>(); // each step's action runs at most once
  const seen = new Set<string>(); // each step_viewed reported at most once

  const runAction = (id: string) => {
    if (fired.has(id)) return;
    const action = opts.actions?.[id];
    if (!action) return;
    fired.add(id);
    Promise.resolve()
      .then(action)
      .catch((e) => console.warn(`[guided-tour] action "${id}" failed:`, e));
  };

  const steps: DriveStep[] = visible.map((s, i) => ({
    element: s.anchor ? `[data-tour="${s.anchor}"]` : undefined,
    onHighlightStarted: () => {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        opts.onStep(i, s.id);
      }
      runAction(s.id);
    },
    popover: { title: s.title, description: s.body },
  }));

  let finished = false;
  let navigating = false;

  // eslint-disable-next-line prefer-const
  let d: ReturnType<typeof driver>;

  const twoFrames = () =>
    new Promise<void>((resolve) => {
      if (typeof requestAnimationFrame === "undefined") {
        setTimeout(resolve, 60);
        return;
      }
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

  const show = async (i: number) => {
    if (navigating) return;
    navigating = true;
    try {
      opts.reveals?.[visible[i]?.id]?.();
      await twoFrames();
      d.moveTo(i);
    } finally {
      navigating = false;
    }
  };

  d = driver({
    showProgress: true,
    allowClose: true,
    prevBtnText: "Back",
    nextBtnText: "Next",
    doneBtnText: "Finish",
    popoverClass: opts.theme === "dark" ? "mb-tour-dark" : "mb-tour-light",
    steps,
    onNextClick: () => {
      const i = d.getActiveIndex() ?? 0;
      if (d.isLastStep()) {
        if (!finished) {
          finished = true;
          opts.onComplete?.();
        }
        d.destroy();
      } else {
        void show(i + 1);
      }
    },
    onPrevClick: () => {
      const i = d.getActiveIndex() ?? 0;
      if (i > 0) void show(i - 1);
    },
    onCloseClick: () => {
      if (!finished) {
        finished = true;
        opts.onDismiss?.();
      }
      d.destroy();
    },
    onDestroyStarted: () => {
      if (!finished) {
        finished = true;
        opts.onDismiss?.();
      }
      d.destroy();
    },
  });

  return {
    drive: async () => {
      opts.reveals?.[visible[0]?.id]?.();
      await twoFrames();
      d.drive(0);
    },
  };
}
