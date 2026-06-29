// lib/mock-interview-tour.ts
import type { TourStep, TourAction } from "@/lib/guided-tour";

// Single-surface tour over the chat interview room + its result. Cross-screen
// steps (template browse, booking dialog) are narration-only so the same script
// is honest on the demo page AND a real interview (where those screens are
// already behind the user).
export const MOCK_INTERVIEW_STEPS: TourStep[] = [
  { id: "welcome", title: "Meet Mock Interviews", body: "Practice real interviews with Kap AI and get scored like the real thing. Here's a 60-second taste - click Next." },
  { id: "templates", title: "Pick a role", body: "Normally you'd choose a template - a company + role like \"Backend Engineer at a fintech.\" We've set one up for you here." },
  { id: "format", title: "Choose a format", body: "Every interview runs as Chat, Audio, or Video. This walkthrough uses Chat so you can see the whole loop fast." },
  { id: "chat", title: "Your live interview", body: "Kap asks real questions and you answer in the conversation - exactly like a human interviewer.", anchor: "mi-chat" },
  { id: "input", title: "Answer your way", body: "Type your answer here - or attach code and diagrams for technical and system-design rounds.", anchor: "mi-input" },
  { id: "code", title: "Write code", body: "Switch to the Code editor to write and share your solution in real time - just like a live coding round.", anchor: "mi-code" },
  { id: "whiteboard", title: "Sketch the design", body: "Or open the Whiteboard to diagram architecture and data flow for system-design interviews.", anchor: "mi-whiteboard" },
  { id: "timer", title: "Stay on the clock", body: "A real countdown keeps the pressure realistic - just like an onsite.", anchor: "mi-timer" },
  { id: "end", title: "Finish anytime", body: "Wrap up when you're done, or let the timer end it. Then Kap scores your performance.", anchor: "mi-end" },
  { id: "result", title: "Get scored", body: "An overall score plus technical, communication, and problem-solving breakdowns - with strengths, weaknesses, and recommended next steps to fix.", anchor: "mi-result-score" },
  { id: "done", title: "Your turn", body: "That's the full loop: pick a role -> interview -> get scored -> improve. Start a real one whenever you're ready." },
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
