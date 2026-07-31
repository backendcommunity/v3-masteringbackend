// lib/playground-tour.ts
// Playground-specific tour steps. The engine itself lives in lib/guided-tour.ts;
// this module supplies the playground's steps and a thin builder for back-compat.
import { buildGuidedTour, type TourStep, type TourAction } from "@/lib/guided-tour";

export type { TourStep, TourAction };

export const TOUR_STEPS: TourStep[] = [
  { id: "welcome", title: "Build a real backend, right here", body: "This is the actual playground, not a video. Everything you are about to see really runs. Hit Next." },
  { id: "file-tree", title: "Your starter files are ready", body: "We scaffolded the project so you skip the boring setup. Open a file and read along.", anchor: "file-tree" },
  { id: "editor", title: "Write real code", body: "A full editor with the file open and ready. Edit anything you want as you go.", anchor: "editor" },
  { id: "kap", title: "Stuck? Ask Kap", body: "Kap is your AI mentor. Ask it anything about the task and get unblocked in seconds.", anchor: "kap" },
  { id: "run-server", title: "Your server is starting", body: "We are booting it live right now. Give it a few seconds to come online.", anchor: "run-server" },
  { id: "terminal", title: "Watch it happen", body: "Your logs and output stream right here, just like your own terminal.", anchor: "terminal" },
  { id: "run-test", title: "Run the real test", body: "We check your code against the actual test and show the result. Pass it to score MB.", anchor: "run-test" },
  { id: "github-sync", title: "Ship it to GitHub", body: "Push your work to a real repo whenever you are ready. We will skip that for the demo.", anchor: "github-sync" },
  { id: "preview", title: "Your app is live", body: "There it is, running in the browser. You built it, ran it, and shipped it. That is the job.", anchor: "preview" },
  { id: "done", title: "Your turn to build", body: "You just shipped a working backend in minutes. Pick a real project and build something worth putting on your portfolio." },
];

/** Back-compat builder: drives the engine with the playground steps. */
export function buildPlaygroundTour(opts: {
  theme: "dark" | "light";
  onStep: (index: number, id: string) => void;
  onComplete?: () => void;
  onDismiss?: () => void;
  actions?: Record<string, TourAction>;
  reveals?: Record<string, () => void>;
}) {
  return buildGuidedTour({ steps: TOUR_STEPS, ...opts });
}
