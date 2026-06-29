// lib/playground-tour.ts
// Playground-specific tour steps. The engine itself lives in lib/guided-tour.ts;
// this module supplies the playground's steps and a thin builder for back-compat.
import { buildGuidedTour, type TourStep, type TourAction } from "@/lib/guided-tour";

export type { TourStep, TourAction };

export const TOUR_STEPS: TourStep[] = [
  { id: "welcome", title: "Welcome to the Playground", body: "A quick guided demo — each step actually happens as you go. Click Next to begin." },
  { id: "file-tree", title: "Build your app", body: "We just added the project files for you — see them appear in the explorer and open in the editor.", anchor: "file-tree" },
  { id: "editor", title: "Write code", body: "This is where you write your code. The file we created is open right here.", anchor: "editor" },
  { id: "kap", title: "Ask Kap", body: "Stuck on a task? Kap, your AI tutor, explains and unblocks you right here.", anchor: "kap" },
  { id: "run-server", title: "Booting your server", body: "We're starting the dev server for real — give it a few seconds to go live.", anchor: "run-server" },
  { id: "terminal", title: "Terminal", body: "Server logs and output stream here — we just opened it for you.", anchor: "terminal" },
  { id: "run-test", title: "Running a test", body: "We're grading a task against its real test — watch the result come back.", anchor: "run-test" },
  { id: "github-sync", title: "Sync to GitHub", body: "When you're ready, connect GitHub to push your work. (We won't connect during the demo.)", anchor: "github-sync" },
  { id: "preview", title: "🎉 Your app is live", body: "And there it is — your running app, live in the preview. You built it, started it, and it works. This is what you ship.", anchor: "preview" },
  { id: "done", title: "That's the whole loop", body: "Build → run → test → ship a live app. Now it's your turn — start building for real." },
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
