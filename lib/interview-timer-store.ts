import { create } from "zustand";

// Isolated store for an embedded mock-interview (VA or chat). The room writes
// the remaining seconds and an end handler here so the Path top bar can show
// the timer next to the points and an End Interview button (the interview's own
// header is hidden when embedded). `null` = no active embedded interview.
interface InterviewTimerState {
  seconds: number | null;
  onEnd: (() => void) | null;
  setSeconds: (s: number | null) => void;
  setOnEnd: (fn: (() => void) | null) => void;
}

export const useInterviewTimer = create<InterviewTimerState>((set) => ({
  seconds: null,
  onEnd: null,
  setSeconds: (seconds) => set({ seconds }),
  setOnEnd: (onEnd) => set({ onEnd }),
}));
