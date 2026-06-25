import { useAppStore } from "./store";
import type { RecapItemType } from "./data";

const keyFor = (t: RecapItemType, id: string) => `mb_recap_${t}_${id}`;

export async function triggerItemRecap(itemType: RecapItemType, itemId: string): Promise<void> {
  if (typeof window === "undefined") return;
  const sk = keyFor(itemType, itemId);
  if (sessionStorage.getItem(sk)) return; // already shown this session
  try {
    const payload = await useAppStore.getState().getJourneyRecap(itemType, itemId);
    if (!payload) return;
    sessionStorage.setItem(sk, payload.eventId);
    useAppStore.getState().setReturnRecap(payload);
  } catch { /* recap never blocks the workspace */ }
}

export async function triggerWelcomeBack(): Promise<void> {
  if (typeof window === "undefined") return;
  const sk = "mb_welcome_back";
  const today = new Date().toISOString().slice(0, 10);
  if (sessionStorage.getItem(sk) === today) return;
  try {
    const payload = await useAppStore.getState().getWelcomeBack();
    if (!payload) return;
    sessionStorage.setItem(sk, today);
    useAppStore.getState().setReturnRecap(payload);
  } catch { /* no-op */ }
}
