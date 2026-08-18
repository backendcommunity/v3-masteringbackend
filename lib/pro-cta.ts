// Pure label builders for "Go Pro" surfaces that fetch pricing client-side
// (see hooks/use-pricing.ts) and must never flash a wrong price while that
// fetch is in flight. `pricing === null` is exactly that loading (or
// failed) state — both builders render without a price in that case rather
// than guess one. Split out as pure functions so the loading-state contract
// is unit testable without mounting StepPaywall or PaymentDialog (see
// lib/__tests__/pro-cta.test.ts).

import { formatPrice, type PublicPricing } from "@/lib/pricing";

/** StepPaywall's primary CTA text. */
export function formatGoProCtaLabel(pricing: PublicPricing | null): string {
  if (!pricing) return "Go Pro";
  return `Go Pro — ${formatPrice(pricing.monthly, pricing.currency)}/mo`;
}

/** PaymentDialog's subscription-card price text. Blank while loading. */
export function formatSubscriptionCardPrice(pricing: PublicPricing | null): string {
  if (!pricing) return "";
  return `${formatPrice(pricing.monthly, pricing.currency)}/mo`;
}
