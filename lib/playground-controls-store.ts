"use client";

import { create } from "zustand";

// Bridges the embedded project playground's Run/Preview controls up to the
// path top bar. The playground publishes its state + handlers here; the path
// workspace renders the buttons in the top menu.
interface PlaygroundControlsState {
  active: boolean; // a playground is mounted in embedded mode
  connected: boolean;
  isRunning: boolean;
  isStopping: boolean;
  sandboxLive: boolean; // server believed running → show Stop instead of Run
  previewVisible: boolean;
  runServer: (() => void) | null;
  stopServer: (() => void) | null;
  togglePreview: (() => void) | null;
  setControls: (partial: Partial<PlaygroundControlsState>) => void;
  reset: () => void;
}

const initial = {
  active: false,
  connected: false,
  isRunning: false,
  isStopping: false,
  sandboxLive: false,
  previewVisible: false,
  runServer: null,
  stopServer: null,
  togglePreview: null,
};

export const usePlaygroundControls = create<PlaygroundControlsState>((set) => ({
  ...initial,
  setControls: (partial) => set(partial),
  reset: () => set(initial),
}));
