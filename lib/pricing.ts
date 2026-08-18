// Client-safe pricing exports only. Nothing here may name a payment
// processor, read a processor env var, or make a network call — this module
// is imported by components/pages/pricing.tsx, a client component, and
// EVERY export here ships in the browser JS bundle, publicly readable.
//
// GLOBAL_FALLBACK and fetchPricing live in lib/pricing.server.ts instead —
// that module names "PADDLE" and reads NEXT_PUBLIC_PADDLE_PRICE_* — and must
// only ever be imported from server components (app/pricing/page.tsx).

export interface RegionalPricing {
  tier: "NG" | "PPP" | "GLOBAL";
  country: string;
  provider: "ASYNCPAY" | "PADDLE";
  currency: "NGN" | "USD";
  monthly: number;
  annual: number;
  monthlyPriceId: string;
  annualPriceId: string;
}

// The client never needs the payment processor's identity or its price IDs —
// Next.js serializes every prop passed to a client component into the RSC
// payload embedded in the raw HTML response, so a full RegionalPricing prop
// would put "PADDLE"/"ASYNCPAY" in the response even though nothing renders
// it. app/pricing/page.tsx strips those fields (see toPublicPricing) before
// PricingView ever sees them.
export type PublicPricing = Omit<
  RegionalPricing,
  "provider" | "monthlyPriceId" | "annualPriceId"
>;

export function formatPrice(amount: number, currency: "NGN" | "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    // WITHOUT narrowSymbol, en-US renders NGN as the ISO code — "NGN 9,999"
    // instead of "₦9,999". Verified in Node: the default currencyDisplay only
    // uses a glyph for currencies the locale considers local. Do not remove.
    currencyDisplay: "narrowSymbol",
    // Naira prices are whole numbers; showing ₦9,999.00 reads like a
    // conversion artifact rather than a price.
    minimumFractionDigits: currency === "NGN" ? 0 : 2,
    maximumFractionDigits: currency === "NGN" ? 0 : 2,
  }).format(amount);
}

/**
 * Annual price shown as its per-month equivalent — "₦8,333 /mo billed
 * annually" reads cheaper than the monthly plan, which is the entire reason
 * annual converts. Rounding is the formatter's (₦99,990/12 = ₦8,332.50 → ₦8,333).
 */
export function monthlyEquivalent(
  pricing: Pick<RegionalPricing, "monthly" | "annual" | "currency">,
  cycle: "monthly" | "annual",
): string {
  const amount =
    cycle === "annual" ? pricing.annual / 12 : pricing.monthly;
  return formatPrice(amount, pricing.currency);
}
