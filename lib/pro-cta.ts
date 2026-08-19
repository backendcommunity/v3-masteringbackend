// Pure label builders for "Go Pro" surfaces that fetch pricing client-side
// (see hooks/use-pricing.ts) and must never flash a wrong price while that
// fetch is in flight. `pricing === null` is exactly that loading (or
// failed) state — both builders render without a price in that case rather
// than guess one. Split out as pure functions so the loading-state contract
// is unit testable without mounting StepPaywall or the payment gate (see
// lib/__tests__/pro-cta.test.ts).

import { formatPrice, type PublicPricing } from "@/lib/pricing";

/** StepPaywall's primary CTA text. */
export function formatGoProCtaLabel(pricing: PublicPricing | null): string {
  if (!pricing) return "Go Pro";
  return `Go Pro — ${formatPrice(pricing.monthly, pricing.currency)}/mo`;
}

/** The gate's subscription-rail price text. Blank while loading. */
export function formatSubscriptionCardPrice(pricing: PublicPricing | null): string {
  if (!pricing) return "";
  return `${formatPrice(pricing.monthly, pricing.currency)}/mo`;
}

/**
 * The onboarding upsell's headline number: the monthly rate, on its own.
 * The annual alternative is carried by formatUpsellQualifier below rather
 * than crowded into this line.
 */
export function formatUpsellPrice(pricing: PublicPricing | null): string {
  if (!pricing) return "";
  return formatPrice(pricing.monthly, pricing.currency);
}

/**
 * How many whole months a year of Pro saves against paying monthly.
 *
 * DERIVED, never asserted. Annual is currently 10x monthly everywhere, so
 * this returns 2 — but if a region's annual multiplier ever changes, the
 * copy follows it instead of continuing to promise two free months that no
 * longer exist. Returns 0 when the saving isn't a clean whole number of
 * months, which the caller renders as no claim at all.
 */
export function monthsFreeOnAnnual(
  pricing: Pick<PublicPricing, "monthly" | "annual">,
): number {
  if (pricing.monthly <= 0 || pricing.annual <= 0) return 0;
  const monthsCharged = pricing.annual / pricing.monthly;
  const saved = 12 - monthsCharged;
  // Tolerate float dust from the division; anything that isn't within a
  // hair of a whole number is not a claim we can make in words.
  const rounded = Math.round(saved);
  if (rounded < 1 || Math.abs(saved - rounded) > 0.01) return 0;
  return rounded;
}

const MONTH_WORDS = ["", "one", "two", "three", "four", "five", "six"];

/**
 * The line under the upsell's price: "per month · or ₦99,990 a year, two
 * months free". Blank while pricing is loading, and the free-months clause
 * drops out entirely when the maths doesn't support it.
 */
export function formatUpsellQualifier(pricing: PublicPricing | null): string {
  if (!pricing) return "";
  const annual = formatPrice(pricing.annual, pricing.currency);
  const free = monthsFreeOnAnnual(pricing);
  if (free === 0) return `per month · or ${annual} a year`;
  const word = MONTH_WORDS[free] ?? String(free);
  const noun = free === 1 ? "month" : "months";
  return `per month · or ${annual} a year, ${word} ${noun} free`;
}
