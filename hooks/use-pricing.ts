"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { GEO_OVERRIDE_PARAM } from "@/lib/geo-override";
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
 * @param enabled - Pass false to skip the fetch entirely (e.g. the payment gate
 * already received pricing as a prop, or its subscription card is disabled)
 * — several callers mount this dialog unconditionally even when it's never
 * opened, so an unguarded fetch would fire on every page that renders one.
 */
/**
 * Forwards the developer-only `__geo` override onto the pricing request.
 *
 * lib/geo-override.ts copies `__geo` across internal NAVIGATION, which covers
 * /pricing and /checkout because both resolve their region server-side. These
 * hooks fetch from the browser instead, so without this the override stopped
 * at the address bar: localhost sends no geo header, the request carried no
 * override, and every local visitor resolved to GLOBAL no matter what the URL
 * said — making the NG and PPP paywalls untestable locally.
 *
 * Safe by the same gate as the rest: academy's resolveCountryWithOverride
 * returns early WITHOUT reading the param unless its own context is LOCAL or
 * DEVELOP, so this is inert in staging and production.
 */
function pricingRequestParams(): Record<string, string> | undefined {
  if (typeof window === "undefined") return undefined;
  const geo = new URLSearchParams(window.location.search).get(
    GEO_OVERRIDE_PARAM,
  );
  return geo ? { [GEO_OVERRIDE_PARAM]: geo } : undefined;
}

export function usePricing(enabled = true): PublicPricing | null {
  const [pricing, setPricing] = useState<PublicPricing | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    api
      .get("/public/pricing", { params: pricingRequestParams() })
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


/**
 * The same fetch, KEEPING the processor identity and price IDs.
 *
 * Only for surfaces that open a payment SDK themselves. Everything that
 * merely renders a currency and an amount must keep using `usePricing`
 * above, which discards these three fields.
 *
 * Why this is not a new exposure: GET /public/pricing is unauthenticated and
 * has always returned `provider`, `monthlyPriceId` and `annualPriceId` (see
 * academy's src/modules/plans/queries/get-pricing.ts, which spreads the whole
 * resolved object). `usePricing` strips them on arrival as a hygiene measure,
 * and app/pricing/page.tsx strips them for a different and stronger reason —
 * anything passed to a client component is serialized into the RSC payload
 * embedded in the HTML, so a server-fetched prop would put them in the
 * document itself. This hook fetches client-side, so that concern does not
 * apply: the values are already in the browser's network tab either way.
 *
 * What the fields must NOT be used for is picking a price. The processor's
 * price ID and the amount on screen have to come from THE SAME response, or
 * the buyer can be quoted one number and charged another — that is the exact
 * failure an earlier inline-Paddle attempt shipped (a Nigerian buyer quoted
 * ₦9,999 and charged the legacy USD amount). Callers pass `countryCode` from
 * this same object for that reason.
 */
export type CheckoutCapablePricing = PublicPricing &
  Pick<RegionalPricing, "provider" | "monthlyPriceId" | "annualPriceId">;

export function useCheckoutPricing(
  enabled = true,
): CheckoutCapablePricing | null {
  const [pricing, setPricing] = useState<CheckoutCapablePricing | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    api
      .get("/public/pricing", { params: pricingRequestParams() })
      .then(({ data }) => {
        if (cancelled) return;
        const regional = data?.data as RegionalPricing | undefined;
        if (!regional) return;
        setPricing(regional as CheckoutCapablePricing);
      })
      .catch(() => {
        // Swallow, as above: callers fall back to /checkout rather than
        // rendering a guessed price or a dead button.
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return pricing;
}
