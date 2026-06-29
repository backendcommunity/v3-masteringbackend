// lib/mock-interview-tour.ts
import type { TourStep, TourAction } from "@/lib/guided-tour";

// Single-surface tour over the chat interview room + its result. Cross-screen
// steps (template browse, booking dialog) are narration-only so the same script
// is honest on the demo page AND a real interview (where those screens are
// already behind the user).
export const MOCK_INTERVIEW_STEPS: TourStep[] = [
  { id: "welcome", title: "Meet Mock Interviews", body: "Practice real interviews with Kap AI and get scored like the real thing. Here's a 60-second taste — click Next." },
  { id: "templates", title: "Pick a role", body: "Normally you'd choose a template — a company + role like \"Backend Engineer at a fintech.\" We've set one up for you here." },
  { id: "format", title: "Choose a format", body: "Every interview runs as Chat, Audio, or Video. This walkthrough uses Chat so you can see the whole loop fast." },
  { id: "chat", title: "Your live interview", body: "Kap asks real questions and you answer in the conversation — exactly like a human interviewer.", anchor: "mi-chat" },
  { id: "input", title: "Answer your way", body: "Type your answer here. You can also attach code or a whiteboard diagram for technical and system-design rounds.", anchor: "mi-input" },
  { id: "timer", title: "Stay on the clock", body: "A real countdown keeps the pressure realistic — just like an onsite.", anchor: "mi-timer" },
  { id: "end", title: "Finish anytime", body: "Wrap up when you're done, or let the timer end it. Then Kap scores your performance.", anchor: "mi-end" },
  { id: "result-score", title: "Get scored", body: "You get an overall score plus technical, communication, and problem-solving breakdowns.", anchor: "mi-result-score" },
  { id: "result-breakdown", title: "Know exactly what to fix", body: "Strengths, weaknesses, and recommended next steps — turned into an action plan for your next attempt.", anchor: "mi-result-breakdown" },
  { id: "done", title: "Your turn", body: "That's the full loop: pick a role → interview → get scored → improve. Start a real one whenever you're ready." },
];

export type DemoControls = {
  playNextTurn: () => void;
  revealResult: () => void;
};

/**
 * Sample (demo) controls: drive the scripted demo room. `chat` and `input`
 * play scripted turns; `result-score` reveals the canned report.
 */
export function mockInterviewSampleControls(demo: { current: DemoControls | null }): {
  actions: Record<string, TourAction>;
  reveals: Record<string, () => void>;
} {
  return {
    actions: {
      chat: () => demo.current?.playNextTurn(),
      input: () => demo.current?.playNextTurn(),
      "result-score": () => demo.current?.revealResult(),
    },
    reveals: {},
  };
}

/**
 * Guide (real interview) controls: highlight-only. The room is already fully
 * rendered, so there is nothing to reveal and nothing to mutate.
 */
export function mockInterviewGuideControls(): {
  actions?: Record<string, TourAction>;
  reveals?: Record<string, () => void>;
} {
  return {};
}
