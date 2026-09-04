"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { GEO_OVERRIDE_PARAM } from "@/lib/geo-override";
import {
  GLOBAL_FALLBACK,
  normalizeRegionalPricing,
  type PublicPricing,
  type RegionalPricing,
} from "@/lib/pricing";

/**
 * Pricing is fetched FROM THE BROWSER, always. This is not a convenience —
 * it is the only place the visitor's region can be resolved correctly.
 *
 * The API decides the region from the geo headers its own edge writes onto
 * the inbound request, and an edge describes whoever opened the connection.
 * A server render therefore asks the API "where am I?" and is truthfully
 * told "Amsterdam", which is where the app server lives. Forwarding the
 * visitor's country or IP alongside does not help: the API reads
 * `cf-ipcountry` first, its own Cloudflare zone always sets that header, and
 * so the forwarded value is never reached. `cf-connecting-ip` is worse than
 * useless — Cloudflare rejects it inbound with error 1000 and fails the whole
 * request. All of that was measured against staging, where every Nigerian
 * visitor was quoted USD.
 *
 * Fetched from the browser, the connection IS the visitor's, so the edge
 * writes the right country with nothing to forward, nothing to trust, and
 * no shared secret to configure. The cost is that a price cannot be in the
 * server-rendered HTML; callers render without one until this resolves.
 */
function pricingRequestParams(): Record<string, string> | undefined {
  if (typeof window === "undefined") return undefined;
  const geo = new URLSearchParams(window.location.search).get(
    GEO_OVERRIDE_PARAM,
  );
  return geo ? { [GEO_OVERRIDE_PARAM]: geo } : undefined;
}

/**
 * The raw regional pricing, processor identity and price IDs included.
 *
 * @param enabled - false skips the fetch entirely. Several callers mount a
 * pricing dialog unconditionally even when it never opens, so an unguarded
 * fetch would fire on every page that renders one.
 * @param fallback - what to return if the request fails. Pass GLOBAL_FALLBACK
 * on a surface whose whole job is to show a price (the pricing pages), so an
 * API outage shows honest global amounts instead of an endless skeleton. Leave
 * it null anywhere a missing price is better than a possibly-wrong one.
 */
export function useRegionalPricing(
  enabled = true,
  fallback: RegionalPricing | null = null,
): RegionalPricing | null {
  const [pricing, setPricing] = useState<RegionalPricing | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    api
      .get("/public/pricing", { params: pricingRequestParams() })
      .then(({ data }) => {
        if (cancelled) return;
        if (!data?.data) {
          setPricing(fallback);
          return;
        }
        setPricing(normalizeRegionalPricing(data.data));
      })
      .catch(() => {
        if (!cancelled) setPricing(fallback);
      });

    return () => {
      cancelled = true;
    };
    // `fallback` is a module constant or null at every call site; excluded so
    // an inline object literal could never restart the fetch on each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return pricing;
}

/**
 * The same fetch with the processor identity and price IDs stripped on
 * arrival, before the object is ever stored in state.
 *
 * For surfaces that render a currency and an amount and nothing else. Hygiene
 * rather than secrecy: GET /public/pricing is unauthenticated and has always
 * returned these fields, so they are in the network tab either way.
 */
export function usePricing(enabled = true): PublicPricing | null {
  const regional = useRegionalPricing(enabled);
  // Memoised on the state object, so the returned reference is stable across
  // renders. The previous version held the stripped object in state and
  // callers rely on that: several put pricing in an effect's dependency
  // array, and a fresh object each render would re-run those forever.
  return useMemo(() => {
    if (!regional) return null;
    const {
      provider: _provider,
      monthlyPriceId: _monthlyPriceId,
      annualPriceId: _annualPriceId,
      ...publicPricing
    } = regional;
    return publicPricing as PublicPricing;
  }, [regional]);
}

/**
 * The same fetch, KEEPING the processor identity and price IDs.
 *
 * Only for surfaces that open a payment SDK themselves.
 *
 * What these fields must NOT be used for is picking a price independently of
 * the amount on screen. The price ID and the displayed number have to come
 * from THE SAME response, or the buyer is quoted one figure and charged
 * another — the exact failure an earlier inline-Paddle attempt shipped (a
 * Nigerian buyer quoted ₦9,999 and charged the legacy USD amount). Callers
 * pass `countryCode` from this same object for that reason.
 */
export type CheckoutCapablePricing = PublicPricing &
  Pick<RegionalPricing, "provider" | "monthlyPriceId" | "annualPriceId">;

export function useCheckoutPricing(
  enabled = true,
): CheckoutCapablePricing | null {
  return useRegionalPricing(enabled) as CheckoutCapablePricing | null;
}

export { GLOBAL_FALLBACK };
