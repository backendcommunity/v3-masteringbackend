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

// Checkout is the one client surface that DOES need the processor identity
// and price IDs — it has to know which SDK to open and which price to hand
// it. `tier` is the only field nothing in checkout reads, so that's the only
// one app/checkout/page.tsx strips (see toCheckoutPricing) before handing
// pricing to the client component.
export type CheckoutPricing = Omit<RegionalPricing, "tier">;

/**
 * Enterprise is a single global USD price — deliberately NOT regionally
 * tiered (see components/pages/subscription-plans.tsx's comment on this
 * same decision, ~line 153). It's a team/B2B plan, so the purchasing-power
 * rationale behind Pro's PPP tier doesn't transfer, and it already has
 * working Paddle price IDs provisioned for both channels. These figures are
 * the same ones seeded in prisma/seed.ts (the academy backend repo) —
 * $99.99/mo, $999.99/yr — kept here as the one static frontend source
 * instead of round-tripping through the regional pricing API, which is
 * specifically the Pro resolver and must keep its current shape.
 */
export const ENTERPRISE_PRICING: Pick<
  RegionalPricing,
  "monthly" | "annual" | "currency"
> = {
  monthly: 99.99,
  annual: 999.99,
  currency: "USD",
};

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
