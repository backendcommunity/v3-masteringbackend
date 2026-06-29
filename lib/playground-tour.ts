// lib/playground-tour.ts
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

export type TourStep = {
  id: string;
  title: string;
  body: string;
  anchor?: string;
};

export const TOUR_STEPS: TourStep[] = [
  { id: "welcome", title: "Welcome to the Playground", body: "A quick guided demo — each step actually happens as you go. Click Next to begin." },
  { id: "file-tree", title: "Build your app", body: "We just added the project files for you — see them appear in the explorer and open in the editor.", anchor: "file-tree" },
  { id: "editor", title: "Write code", body: "This is where you write your code. The file we created is open right here.", anchor: "editor" },
  { id: "kap", title: "Ask Kap", body: "Stuck on a task? Kap, your AI tutor, explains and unblocks you right here.", anchor: "kap" },
  { id: "run-server", title: "Booting your server", body: "We're starting the dev server for real — give it a few seconds to go live.", anchor: "run-server" },
  { id: "terminal", title: "Terminal", body: "Server logs and output stream here — we just opened it for you.", anchor: "terminal" },
  { id: "run-test", title: "Running a test", body: "We're grading a task against its real test — watch the result come back.", anchor: "run-test" },
  { id: "github-sync", title: "Sync to GitHub", body: "When you're ready, connect GitHub to push your work. (We won't connect during the demo.)", anchor: "github-sync" },
  // THE finale — a real, running frontend preview. This is the payoff: the
  // learner sees their app actually live in the browser, end to end.
  { id: "preview", title: "🎉 Your app is live", body: "And there it is — your running app, live in the preview. You built it, started it, and it works. This is what you ship.", anchor: "preview" },
  { id: "done", title: "That's the whole loop", body: "Build → run → test → ship a live app. Now it's your turn — start building for real." },
];

/** A real action a step performs when it becomes active. */
export type TourAction = () => Promise<void> | void;

export function buildPlaygroundTour(opts: {
  theme: "dark" | "light";
  onStep: (index: number, id: string) => void;
  onComplete?: () => void;
  onDismiss?: () => void;
  /** step id -> real action run once when that step becomes active. */
  actions?: Record<string, TourAction>;
  /**
   * step id -> "reveal" callback that makes the step's target visible BEFORE we
   * highlight it (open its rail tab, panel, drawer, terminal). This is what
   * makes every step strict/visible even when its panel isn't open by default.
   * Must be a fast, synchronous state change; we wait two frames for React to
   * mount the target before highlighting.
   */
  reveals?: Record<string, () => void>;
}) {
  // Strict: keep ALL steps. Each step's target is revealed just-in-time, so we
  // no longer drop steps whose panel happens to be closed.
  const visible = TOUR_STEPS;

  const fired = new Set<string>(); // each step's action runs at most once
  const seen = new Set<string>(); // each step_viewed is reported at most once

  const runAction = (id: string) => {
    if (fired.has(id)) return;
    const action = opts.actions?.[id];
    if (!action) return;
    fired.add(id);
    // Fire-and-forget: the popover narrates while the real action runs. A
    // failed demo action must never break the tour, but log it — a silent
    // catch is why "nothing happens" is impossible to diagnose otherwise.
    Promise.resolve()
      .then(action)
      .catch((e) => console.warn(`[playground-tour] action "${id}" failed:`, e));
  };

  const steps: DriveStep[] = visible.map((s, i) => ({
    element: s.anchor ? `[data-tour="${s.anchor}"]` : undefined,
    // onHighlightStarted is a STEP-level hook in driver.js — NOT a popover hook.
    onHighlightStarted: () => {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        opts.onStep(i, s.id);
      }
      runAction(s.id);
    },
    popover: {
      title: s.title,
      description: s.body,
    },
  }));

  let finished = false;
  let navigating = false;

  // eslint-disable-next-line prefer-const
  let d: ReturnType<typeof driver>;

  // Wait two animation frames so a reveal()'s React state change has actually
  // mounted the target element before driver.js measures/highlights it.
  const twoFrames = () =>
    new Promise<void>((resolve) => {
      if (typeof requestAnimationFrame === "undefined") {
        setTimeout(resolve, 60);
        return;
      }
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

  // Reveal step i's target (open its panel), let it mount, then highlight it.
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
    // Drive navigation ourselves so each target is revealed + mounted before it
    // is highlighted. Returning from these hooks suppresses driver's default
    // move, and we advance manually via show().
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
      // ESC / overlay / X before the last step = dismissal.
      if (!finished) {
        finished = true;
        opts.onDismiss?.();
      }
      d.destroy();
    },
  });

  // Reveal the first step's target, let it mount, then start at index 0.
  return {
    drive: async () => {
      opts.reveals?.[visible[0]?.id]?.();
      await twoFrames();
      d.drive(0);
    },
  };
}
