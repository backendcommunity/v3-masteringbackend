// Pure label builders for "Go Pro" surfaces that fetch pricing client-side
// (see hooks/use-pricing.ts) and must never flash a wrong price while that
// fetch is in flight. `pricing === null` is exactly that loading (or
// failed) state — both builders render without a price in that case rather
// than guess one. Split out as pure functions so the loading-state contract
// is unit testable without mounting StepPaywall or the payment gate (see
// lib/__tests__/pro-cta.test.ts).

import { formatPrice, type PublicPricing } from "@/lib/pricing";

/**
 * The onboarding upsell's headline number: the monthly rate, on its own.
 * The cadence ("per month") is rendered beside this number by the caller;
 * there is no annual alternative on that step any more.
 */
export function formatUpsellPrice(pricing: PublicPricing | null): string {
  if (!pricing) return "";
  return formatPrice(pricing.monthly, pricing.currency);
}

