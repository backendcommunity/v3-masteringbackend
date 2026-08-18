// ⚠️ SERVER-ONLY MODULE — never import this from a client component
// ("use client") or from anything a client component transitively imports.
//
// This file names payment processors ("PADDLE") and reads processor env vars
// (NEXT_PUBLIC_PADDLE_PRICE_*). Next.js inlines every import a client
// component reaches into the browser JS bundle, so importing this from
// components/pages/pricing.tsx (or anything it imports) would ship those
// literals to the browser — publicly readable — even though the UI never
// renders them. Only app/pricing/page.tsx (a server component) may import
// from here; lib/pricing.ts holds everything client-safe (types, formatPrice,
// monthlyEquivalent).
//
// Not guarded with the `server-only` package: it isn't a dependency of this
// project (checked node_modules and yarn.lock — absent), and this repo's
// vitest config runs with `environment: "jsdom"`, which defines a global
// `window` — the same signal `server-only` throws on. Adding it would also
// break the legitimate test that imports GLOBAL_FALLBACK from this file to
// assert its shape. This comment is the guard; enforce it at review time.

import type { EnterprisePricing, RegionalPricing } from "@/lib/pricing";

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
  // Enterprise falls back the same way and for the same reason: the most
  // expensive per-seat tier ($25/user/month, $250/user/year). Quoting $15 or
  // ₦15,000 to the whole world because the pricing API blipped is the exact
  // leak the fail-closed rule exists to stop. `selfServe: true` matches the
  // GLOBAL tier it is standing in for — the fallback must not invent a
  // sales-led flow for a region that has self-serve checkout.
  enterprise: {
    tier: "GLOBAL",
    provider: "PADDLE",
    currency: "USD",
    monthlyPerUser: 25,
    annualPerUser: 250,
    minSeats: 2,
    maxSeats: 100,
    selfServe: true,
    monthlyPriceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ENTERPRISE_MONTHLY ?? "",
    annualPriceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ENTERPRISE_ANNUAL ?? "",
  },
};

/**
 * A payload from an API that predates Enterprise per-seat pricing — or one
 * whose `enterprise` object is malformed — must not reach the UI with a
 * missing or half-built price. It is normalised to the GLOBAL fallback here,
 * at the boundary, so every downstream consumer can rely on `enterprise`
 * being present and complete rather than each inventing its own guard (and
 * each getting the fail-closed direction subtly wrong).
 *
 * Deliberately strict: a single missing or non-finite amount discards the
 * whole object rather than patching the hole, because a half-trusted price
 * is not a price.
 */
function normalizeEnterprise(value: unknown): EnterprisePricing {
  const e = value as Partial<EnterprisePricing> | null | undefined;
  const numeric = (n: unknown): n is number =>
    typeof n === "number" && Number.isFinite(n) && n > 0;

  if (
    !e ||
    !numeric(e.monthlyPerUser) ||
    !numeric(e.annualPerUser) ||
    !numeric(e.minSeats) ||
    !numeric(e.maxSeats) ||
    typeof e.selfServe !== "boolean" ||
    (e.currency !== "NGN" && e.currency !== "USD")
  ) {
    return GLOBAL_FALLBACK.enterprise;
  }
  return e as EnterprisePricing;
}

/**
 * Server-side fetch. Geo headers must be FORWARDED from the incoming request —
 * without them the API sees the Netlify function's own IP and everyone in the
 * world gets quoted the GLOBAL price.
 *
 * `geoOverride`, when present, is forwarded verbatim as the `__geo` query
 * param — a developer-only affordance (`?__geo=NG` on /pricing or /checkout)
 * for exercising regional pricing on localhost, where no edge geo header
 * exists at all. It is safe to forward unconditionally in every environment:
 * the API only honours it when ITS OWN context is LOCAL/DEVELOP and ignores
 * it outright in STAGING/PRODUCTION (see academy's resolveCountryWithOverride
 * in src/extensions/payment/pricing/resolve-country.ts) — this file has no
 * gating to do and must not attempt to duplicate that decision.
 */
export async function fetchPricing(
  headers?: Record<string, string>,
  geoOverride?: string,
): Promise<RegionalPricing> {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v3";
  const url = new URL(`${base}/public/pricing`);
  if (geoOverride) url.searchParams.set("__geo", geoOverride);
  try {
    const res = await fetch(url.toString(), {
      headers: headers ?? {},
      cache: "no-store",
    });
    if (!res.ok) return GLOBAL_FALLBACK;
    const json = await res.json();
    const data = json?.data as RegionalPricing | undefined;
    if (!data) return GLOBAL_FALLBACK;
    // Pro's fields pass through untouched, exactly as before. Only the newer
    // nested Enterprise object is validated, because only it can be absent
    // from an older API deployment.
    return { ...data, enterprise: normalizeEnterprise(data.enterprise) };
  } catch {
    return GLOBAL_FALLBACK;
  }
}
