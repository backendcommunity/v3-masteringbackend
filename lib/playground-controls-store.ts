"use client";

import { create } from "zustand";

// Bridges the embedded project playground's Run/Preview controls up to the
// path top bar. The playground publishes its state + handlers here; the path
// workspace renders the buttons in the top menu.
interface PlaygroundControlsState {
  active: boolean; // a playground is mounted in embedded mode
  connected: boolean;
  isRunning: boolean;
  previewVisible: boolean;
  runServer: (() => void) | null;
  togglePreview: (() => void) | null;
  setControls: (partial: Partial<PlaygroundControlsState>) => void;
  reset: () => void;
}

const initial = {
  active: false,
  connected: false,
  isRunning: false,
  previewVisible: false,
  runServer: null,
  togglePreview: null,
};

export const usePlaygroundControls = create<PlaygroundControlsState>((set) => ({
  ...initial,
  setControls: (partial) => set(partial),
  reset: () => set(initial),
}));
