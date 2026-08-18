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

/**
 * Used when the pricing endpoint is unreachable. Deliberately the MOST
 * expensive tier: a network blip must never hand a global visitor the naira
 * or PPP price. Mirrors the backend's fail-closed tierForCountry().
 */
export const GLOBAL_FALLBACK: RegionalPricing = {
  tier: "GLOBAL",
  country: "",
  provider: "PADDLE",
  currency: "USD",
  monthly: 19.99,
  annual: 199.99,
  monthlyPriceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_MONTHLY ?? "",
  annualPriceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ANNUAL ?? "",
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

/**
 * Server-side fetch. Geo headers must be FORWARDED from the incoming request —
 * without them the API sees the Netlify function's own IP and everyone in the
 * world gets quoted the GLOBAL price.
 */
export async function fetchPricing(
  headers?: Record<string, string>,
): Promise<RegionalPricing> {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v3";
  try {
    const res = await fetch(`${base}/public/pricing`, {
      headers: headers ?? {},
      cache: "no-store",
    });
    if (!res.ok) return GLOBAL_FALLBACK;
    const json = await res.json();
    return (json?.data as RegionalPricing) ?? GLOBAL_FALLBACK;
  } catch {
    return GLOBAL_FALLBACK;
  }
}
