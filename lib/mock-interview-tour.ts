// lib/mock-interview-tour.ts
import type { TourStep, TourAction } from "@/lib/guided-tour";

// Single-surface tour over the chat interview room + its result. Cross-screen
// steps (template browse, booking dialog) are narration-only so the same script
// is honest on the demo page AND a real interview (where those screens are
// already behind the user).
export const MOCK_INTERVIEW_STEPS: TourStep[] = [
  { id: "welcome", title: "See if you're interview-ready", body: "Real questions, a real score, honest feedback. Here's the 60-second tour. Tap Next." },
  { id: "templates", title: "Pick your target role", body: "You choose the company and role, like Backend Engineer at a fintech. We lined one up for you here." },
  { id: "format", title: "Chat, audio, or video", body: "Run it however you interview best. This walkthrough uses chat so you see the full loop fast." },
  { id: "chat", title: "A real conversation", body: "Kap asks real questions and you answer back, exactly like a human interviewer.", anchor: "mi-chat" },
  { id: "input", title: "Answer your way", body: "Type your reply, or attach code and diagrams when the round calls for it.", anchor: "mi-input" },
  { id: "code", title: "Write code, live", body: "Open the code editor and share your solution in real time, like a live coding round.", anchor: "mi-code" },
  { id: "whiteboard", title: "Sketch the system", body: "Switch to the whiteboard to diagram architecture and data flow for system-design rounds.", anchor: "mi-whiteboard" },
  { id: "timer", title: "On the clock", body: "A real countdown keeps the pressure honest, just like the real thing.", anchor: "mi-timer" },
  { id: "end", title: "Wrap up anytime", body: "Finish when you're done, or let the clock run out. Then Kap scores you.", anchor: "mi-end" },
  { id: "result", title: "Get a real score", body: "An overall score plus technical, communication, and problem-solving breakdowns, with your strengths, gaps, and exactly what to fix next.", anchor: "mi-result-score" },
  { id: "done", title: "Now do it for real", body: "Pick a role, run a full interview, and walk in ready. Your first one is one click away." },
];

// Real-interview guide: the user already picked a role + format to get here, so
// drop those orientation steps. Same anchors otherwise.
export const MOCK_INTERVIEW_GUIDE_STEPS: TourStep[] = MOCK_INTERVIEW_STEPS.filter(
  (s) => s.id !== "templates" && s.id !== "format",
);

export type DemoControls = {
  playNextTurn: () => void;
  revealResult: () => void;
  showCode: () => void;
  showWhiteboard: () => void;
};

/** Sample (demo) controls. chat/input play scripted turns; result reveals the
 *  canned report; code/whiteboard switch the workspace panel into view. */
export function mockInterviewSampleControls(demo: { current: DemoControls | null }): {
  actions: Record<string, TourAction>;
  reveals: Record<string, () => void>;
} {
  return {
    actions: {
      chat: () => demo.current?.playNextTurn(),
      input: () => demo.current?.playNextTurn(),
      result: () => demo.current?.revealResult(),
    },
    reveals: {
      code: () => demo.current?.showCode(),
      whiteboard: () => demo.current?.showWhiteboard(),
    },
  };
}

/** Real-interview guide controls: highlight-only EXCEPT it switches the
 *  workspace panel so the code/whiteboard anchors are visible when highlighted.
 *  The room supplies its own panel switchers. */
export type GuideControls = { showCode: () => void; showWhiteboard: () => void };
export function mockInterviewGuideControls(ui: GuideControls): {
  actions?: Record<string, TourAction>;
  reveals?: Record<string, () => void>;
} {
  return {
    reveals: {
      code: ui.showCode,
      whiteboard: ui.showWhiteboard,
    },
  };
}
