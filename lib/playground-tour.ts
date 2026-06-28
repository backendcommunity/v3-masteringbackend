// lib/playground-tour.ts
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

export type TourStep = { id: string; title: string; body: string; anchor?: string };

export const TOUR_STEPS: TourStep[] = [
  { id: "welcome", title: "Welcome to the Playground", body: "A 60-second tour of how to build here." },
  { id: "file-tree", title: "Your files", body: "Create or open project files here.", anchor: "file-tree" },
  { id: "editor", title: "Write code", body: "Edit your files in the editor.", anchor: "editor" },
  { id: "kap", title: "Ask Kap", body: "Stuck? Kap is your AI tutor.", anchor: "kap" },
  { id: "run-server", title: "Run your app", body: "Boot the dev server.", anchor: "run-server" },
  { id: "terminal", title: "Terminal", body: "Watch logs and output here.", anchor: "terminal" },
  { id: "run-test", title: "Run a test", body: "Check a task against its test.", anchor: "run-test" },
  { id: "preview", title: "Preview", body: "See your running app or API.", anchor: "preview" },
  { id: "github-sync", title: "Sync to GitHub", body: "Push your work to GitHub.", anchor: "github-sync" },
  { id: "done", title: "You're set!", body: "That's it — start building." },
];

export function buildPlaygroundTour(opts: {
  theme: "dark" | "light";
  onStep: (index: number, id: string) => void;
  onComplete?: () => void;
  onDismiss?: () => void;
}) {
  const steps: DriveStep[] = TOUR_STEPS.map((s, i) => ({
    element: s.anchor ? `[data-tour="${s.anchor}"]` : undefined,
    popover: {
      title: s.title,
      description: s.body,
      onPopoverRender: () => opts.onStep(i, s.id),
    },
  }));
  const filteredSteps = steps.filter(
    (st) => !st.element || typeof document === "undefined" || document.querySelector(st.element as string),
  );
  const d = driver({
    showProgress: true,
    allowClose: true,
    nextBtnText: "Next",
    prevBtnText: "Back",
    doneBtnText: "Done",
    popoverClass: opts.theme === "dark" ? "mb-tour-dark" : "mb-tour-light",
    // Skip a step whose anchor element is absent (hidden on mobile/embedded).
    steps: filteredSteps,
    onDestroyStarted: () => {
      // isLastStep() returns true when the user is on the final step (Done button).
      // Any other close gesture (ESC, overlay, X) is a dismissal.
      if (d.isLastStep()) {
        opts.onComplete?.();
      } else {
        opts.onDismiss?.();
      }
      d.destroy();
    },
  });
  return { drive: () => d.drive() };
}
