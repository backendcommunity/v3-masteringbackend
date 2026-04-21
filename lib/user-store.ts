"use client";

import { create } from "zustand";
import type { User } from "./data";

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
  patchUser: (updates: Partial<User>) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  patchUser: (updates) => {
    const current = get().user;
    if (!current) return;
    set({ user: { ...current, ...updates } });
  },
}));

// Imperative accessors for use outside of React components (store.ts, data.ts)
export const getStoredUser = (): User | null => useUserStore.getState().user;
export const setStoredUser = (user: User | null) => useUserStore.setState({ user });
export const patchStoredUser = (updates: Partial<User>) => {
  const current = getStoredUser();
  if (!current) return;
  setStoredUser({ ...current, ...updates });
};
