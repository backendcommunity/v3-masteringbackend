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
 * Enterprise IS regionally priced, exactly as Pro is. The backend seeds it
 * with two payment channels (academy's prisma/seed.ts, the Enterprise
 * block): a naira channel at ₦150,000/mo and ₦1,500,000/yr, and a USD
 * channel at $99.99/mo and $999.99/yr — both with real provider price IDs
 * for sandbox and production. Quoting a Nigerian $99.99 while a working
 * naira channel exists is precisely the mispricing regional pricing exists
 * to eliminate.
 *
 * These are the `original*` figures on those channels — the same ones
 * /checkout bills from (see lib/checkout-plan-pricing.ts, which selects the
 * channel by the same resolved region). The plan record carries
 * `hasDiscount: false`, so the discounted columns are not in play; display
 * and charge must agree, and they do only if both read `original*`.
 *
 * Kept as a static frontend mirror rather than round-tripping through the
 * public pricing API, which is specifically the *Pro* resolver and must keep
 * its current shape. If the seeded Enterprise amounts change, change them
 * here in the same commit.
 */
const ENTERPRISE_NGN: Pick<RegionalPricing, "monthly" | "annual" | "currency"> =
  { monthly: 150000, annual: 1500000, currency: "NGN" };

const ENTERPRISE_USD: Pick<RegionalPricing, "monthly" | "annual" | "currency"> =
  { monthly: 99.99, annual: 999.99, currency: "USD" };

/**
 * Enterprise's price for the region this request already resolved to.
 *
 * Keyed on `tier` because that is the region signal the client actually
 * receives — PublicPricing strips `provider` (see the comment above it), and
 * the backend's tier table maps NG to the naira channel and PPP/GLOBAL alike
 * to the USD one (academy's src/extensions/payment/pricing/tiers.ts). That
 * is the same regional decision /checkout reads off `provider`, so the price
 * shown here is the price billed there.
 *
 * Fails to the more expensive USD tier for any unrecognised tier, mirroring
 * the backend's fail-closed tierForCountry(): a bad region read must never
 * hand a global visitor the naira price.
 */
export function enterprisePricingForTier(
  tier: RegionalPricing["tier"] | string | null | undefined,
): Pick<RegionalPricing, "monthly" | "annual" | "currency"> {
  return tier === "NG" ? ENTERPRISE_NGN : ENTERPRISE_USD;
}

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
