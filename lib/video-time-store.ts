import { create } from "zustand";

// Isolated, high-frequency store for the currently-playing video position.
// Kept separate from the main app store so only the transcript (which selects
// `videoTime`) re-renders on each tick — not the whole watch page.
interface VideoTimeState {
  videoTime: number;
  setVideoTime: (t: number) => void;
}

export const useVideoTime = create<VideoTimeState>((set) => ({
  videoTime: 0,
  setVideoTime: (t) => set({ videoTime: t }),
}));
