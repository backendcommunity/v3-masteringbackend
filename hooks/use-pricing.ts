"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { PublicPricing, RegionalPricing } from "@/lib/pricing";

/**
 * Client-side pricing fetch for surfaces mounted too deep in a "use client"
 * tree to receive pricing as a server-fetched prop the way app/pricing/page.tsx
 * and app/subscription/plans/page.tsx do (both forward geo headers through
 * next/headers() server-side). The path workspace is client-rendered end to
 * end, so this hits the same public endpoint directly from the browser —
 * Cloudflare/Netlify set the geo headers on that request from the visitor's
 * real connection, same as any other client-side API call in this app (see
 * lib/api.ts's `api` instance).
 *
 * Strips the payment processor's identity and price IDs the moment the
 * response arrives, before it's ever stored in state or handed to a
 * component's props — this hook's callers only ever render a currency +
 * amount, never open an SDK directly.
 *
 * Returns null while loading and if the fetch fails. There is no
 * client-safe fallback constant to reach for here — GLOBAL_FALLBACK lives in
 * lib/pricing.server.ts, which must never be imported from a client
 * component. Callers must render their CTA WITHOUT a price while this is
 * null rather than flash a guessed one.
 *
 * @param enabled - Pass false to skip the fetch entirely (e.g. PaymentDialog
 * already received pricing as a prop, or its subscription card is disabled)
 * — several callers mount this dialog unconditionally even when it's never
 * opened, so an unguarded fetch would fire on every page that renders one.
 */
export function usePricing(enabled = true): PublicPricing | null {
  const [pricing, setPricing] = useState<PublicPricing | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    api
      .get("/public/pricing")
      .then(({ data }) => {
        if (cancelled) return;
        const regional = data?.data as RegionalPricing | undefined;
        if (!regional) return;
        const {
          provider: _provider,
          monthlyPriceId: _monthlyPriceId,
          annualPriceId: _annualPriceId,
          ...publicPricing
        } = regional;
        setPricing(publicPricing);
      })
      .catch(() => {
        // Swallow — callers stay in the "no price yet" loading state rather
        // than flashing a wrong one.
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return pricing;
}
