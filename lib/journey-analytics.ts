import posthog from "posthog-js";

const cap = (name: string, props: Record<string, unknown>) => {
  try { posthog.capture(name, props); } catch { /* analytics never blocks UX */ }
};

export const recapShown = (p: { surface: string; tier: string; itemType?: string; source?: string }) => cap("journey_recap_shown", p);
export const recapFeedback = (p: { useful: boolean; tier: string; itemType?: string }) => cap("journey_recap_feedback", p);
export const recapCta = (p: { tier: string; itemType?: string }) => cap("journey_recap_cta_click", p);
export const recapDismissed = (p: { tier: string; itemType?: string; msOpen: number }) => cap("journey_recap_dismissed", p);
export const welcomeBackShown = (p: { tier: string; itemCount: number }) => cap("welcome_back_shown", p);
