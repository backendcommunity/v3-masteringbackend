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

import type { RegionalPricing } from "@/lib/pricing";

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
