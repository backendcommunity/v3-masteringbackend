"use client";

/**
 * Pricing + SDK-open logic for the ₦9,999 ads landing page — no UI, no
 * account, no login. Kept separate from the page's markup because this is
 * the one piece of code on the route that actually moves money, and it
 * needs to be testable without rendering the whole page.
 *
 * The price shown to the buyer and the price ID sent to the processor
 * ALWAYS come from the same useCheckoutPricing() response — see
 * lib/pricing.ts's comment on GLOBAL_FALLBACK for the exact bug this
 * guards against (a Nigerian buyer quoted ₦9,999 and charged the legacy
 * USD amount because the two were read from different places).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useCheckoutPricing } from "@/hooks/use-pricing";
import type { CheckoutCapablePricing } from "@/hooks/use-pricing";
import {
  asyncpayBaseOptions,
  PADDLE_ENVIRONMENT,
} from "@/lib/payment-environment";
import { formatPrice } from "@/lib/pricing";

/** The one export @asyncpay/checkout's chunk actually has. */
type AsyncpayModule = { AsyncpayCheckout: (...args: any[]) => unknown };

export interface LpBuyer {
  name: string;
  email: string;
}

export type LpCheckoutStatus =
  | "loading"
  | "ready"
  | "processing"
  | "succeeded"
  | "error";

export interface UseLpCheckoutResult {
  status: LpCheckoutStatus;
  priceLabel: string;
  provider: "ASYNCPAY" | "PADDLE" | null;
  error: string | null;
  pay: (buyer: LpBuyer) => void;
  reset: () => void;
}

const PADDLE_TOKEN = process.env.NEXT_PUBLIC_PADDLE_TOKEN as string;

// Launch gate: the page is public and crawlable and CAN charge a real card
// today, but academy's `subscriptionSuccessful` webhook does not yet
// provision an account on success (see the amber DECISION callout in
// lp-pro-9999.tsx's CHECKOUT section) — a paying stranger would get a debit
// and no account. Defaults OFF. Flip NEXT_PUBLIC_LP_9999_LIVE to "true" in
// env ONLY once that webhook fix has landed; until then `pay()` below
// short-circuits before any SDK is touched.
const LP_9999_LIVE = process.env.NEXT_PUBLIC_LP_9999_LIVE === "true";

/**
 * Dev-only regional preview: `?region=ng` (or `?region=global`) on the
 * landing page renders it as a visitor in that region would see it.
 *
 * This exists because the pricing API sits behind Cloudflare and its CORS
 * list does not admit localhost:3001, so a dev machine ALWAYS falls back
 * to the global tier and the Nigerian page — the one the whole campaign is
 * for — cannot be looked at locally at all.
 *
 * Hard-gated on NODE_ENV !== "production", and the gate is a build-time
 * constant so the override is dead code stripped from the production
 * bundle entirely. That matters: this substitutes the object the charge
 * path reads, so in production a query parameter could otherwise change
 * what a stranger is billed.
 *
 * The plan UUID here is AsyncPay's TEST-ACCOUNT plan, never production's
 * dea62b89… — see scripts/pricing/pricing-catalog.ts in academy, which
 * keeps the two separated. AsyncPay selects environment by key prefix
 * (async_pkt_ test vs async_pk_ live) rather than by host, so a dev
 * machine holding a test key cannot move real money against it; pairing
 * the test plan with the test key is what makes a local run openable at
 * all, since the production plan does not exist on the test account.
 */
const DEV_REGION_PREVIEW = process.env.NODE_ENV !== "production";

const NG_PREVIEW: CheckoutCapablePricing = {
  tier: "NG",
  country: "NG",
  provider: "ASYNCPAY",
  currency: "NGN",
  monthly: 9999,
  annual: 99990,
  monthlyPriceId: "ee1e371f-9b6a-11f1-8e83-2a667c266b94",
  annualPriceId: "2e449d97-9b6b-11f1-8e83-2a667c266b94",
  // `enterprise` is the PUBLIC shape: provider and price IDs are stripped
  // from it by design (see PublicEnterprisePricing), so they are absent here
  // too rather than being added back to satisfy the compiler.
  enterprise: {
    tier: "NG",
    currency: "NGN",
    monthlyPerUser: 15000,
    annualPerUser: 150000,
    minSeats: 2,
    selfServe: true,
  },
};

/** Reads ?region= once on mount. Returns null unless dev AND ?region=ng. */
function useDevRegionOverride(): CheckoutCapablePricing | null {
  const [override, setOverride] = useState<CheckoutCapablePricing | null>(null);
  useEffect(() => {
    if (!DEV_REGION_PREVIEW) return;
    const region = new URLSearchParams(window.location.search)
      .get("region")
      ?.toLowerCase();
    setOverride(region === "ng" || region === "nigeria" ? NG_PREVIEW : null);
  }, []);
  return override;
}

export function useLpCheckout(): UseLpCheckoutResult {
  const livePricing = useCheckoutPricing();
  // Applied after the real fetch, never instead of it, so the loading and
  // error behaviour a real visitor gets is exactly what is exercised here.
  const devOverride = useDevRegionOverride();
  const pricing = devOverride ?? livePricing;
  const [status, setStatus] = useState<LpCheckoutStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const priceLabel = pricing
    ? formatPrice(pricing.monthly, pricing.currency)
    : "";
  const provider = pricing?.provider ?? null;

  // Eagerly prefetches the @asyncpay/checkout chunk once we know THIS
  // visitor needs it, so the click handler below can call it synchronously
  // instead of waiting on the import — mirrors the identical
  // `asyncpayModuleRef` prefetch effect in components/pages/checkout.tsx
  // (see its own comment: "a latency optimization only ... this SDK never
  // calls window.open, so there is no popup/gesture-chain risk"). Keyed on
  // `provider` so a GLOBAL/Paddle visitor never fetches this chunk at all.
  const asyncpayModuleRef = useRef<AsyncpayModule | null>(null);
  useEffect(() => {
    if (provider !== "ASYNCPAY") return;
    let cancelled = false;
    import("@asyncpay/checkout")
      .then((mod) => {
        if (!cancelled) asyncpayModuleRef.current = mod;
      })
      // Background prefetch only — the on-demand fallback in openAsyncpay
      // already re-imports and retries when the ref is empty, so a failure
      // here just needs to not surface as an unhandled rejection.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [provider]);

  const runAsyncpayCheckout = useCallback(
    (mod: AsyncpayModule, buyer: LpBuyer) => {
      if (!pricing?.monthlyPriceId) return;
      // AsyncpayCheckout runs its own validation checks before its first
      // `await`, so onError can fire during this very call, and every SDK
      // error path rejects the returned promise AFTER invoking onError (see
      // components/pages/checkout.tsx's identical comment). The
      // Promise.resolve(...).catch() below exists only to swallow that
      // already-handled rejection so it doesn't surface as unhandled; it
      // must not set error state again.
      const started = mod.AsyncpayCheckout({
        ...asyncpayBaseOptions({ name: buyer.name, email: buyer.email }),
        subscriptionPlanUUID: pricing.monthlyPriceId,
        onSuccess: () => setStatus("succeeded"),
        onClose: () => setStatus("ready"),
        onError: (err?: { error_description?: unknown }) => {
          const description =
            typeof err?.error_description === "string"
              ? err.error_description
              : "";
          setError(
            description || "We couldn't start checkout. Please try again.",
          );
          setStatus("error");
        },
      });
      void Promise.resolve(started).catch(() => {});
    },
    [pricing],
  );

  const openAsyncpay = useCallback(
    (buyer: LpBuyer) => {
      if (!pricing?.monthlyPriceId) return;
      setStatus("processing");
      const mod = asyncpayModuleRef.current;
      if (mod) {
        runAsyncpayCheckout(mod, buyer);
        return;
      }
      // Fallback for a click that somehow beats the prefetch effect above
      // (e.g. a very fast click right as pricing resolves) — the same
      // dynamic import the effect uses, just requested on demand instead of
      // ahead of time.
      import("@asyncpay/checkout").then((loadedMod) => {
        asyncpayModuleRef.current = loadedMod;
        runAsyncpayCheckout(loadedMod, buyer);
      });
    },
    [pricing, runAsyncpayCheckout],
  );

  const openPaddle = useCallback(
    (buyer: LpBuyer) => {
      if (!pricing?.monthlyPriceId) return;
      setStatus("processing");
      import("@paddle/paddle-js")
        .then(({ initializePaddle }) => {
          initializePaddle({
            token: PADDLE_TOKEN,
            environment: PADDLE_ENVIRONMENT,
            // Typed `any` to match the existing eventCallback in
            // components/pages/checkout.tsx — Paddle's own PaddleEventData
            // narrows `name` to the CheckoutEventNames enum, which fights a
            // plain string-literal switch for no real safety gain here.
            eventCallback: (data: any) => {
              if (data.name === "checkout.completed") setStatus("succeeded");
              if (data.name === "checkout.closed") setStatus("ready");
            },
          })
            .then((paddle) => {
              if (!paddle) {
                setError("We couldn't start checkout. Please try again.");
                setStatus("error");
                return;
              }
              paddle.Checkout.open({
                items: [{ priceId: pricing.monthlyPriceId }],
                customer: {
                  email: buyer.email,
                  address: { countryCode: pricing.country || "US" },
                },
              });
            })
            // initializePaddle's own promise — e.g. the CDN script it loads
            // is blocked or fails after the chunk import above succeeded.
            .catch(() => {
              setError("We couldn't start checkout. Please try again.");
              setStatus("error");
            });
        })
        // The dynamic import itself — e.g. an ad-blocker or a flaky mobile
        // connection blocks Paddle's chunk before it ever runs.
        .catch(() => {
          setError("We couldn't start checkout. Please try again.");
          setStatus("error");
        });
    },
    [pricing],
  );

  const pay = useCallback(
    (buyer: LpBuyer) => {
      if (!pricing) return;
      setError(null);

      // See LP_9999_LIVE's definition above: do not remove this check
      // without confirming academy's subscriptionSuccessful webhook now
      // provisions an account on payment success.
      if (!LP_9999_LIVE) {
        setError("This page isn't accepting payments yet — check back soon.");
        setStatus("error");
        return;
      }

      // `monthlyPriceId` is a plain (non-optional) string on CheckoutPricing
      // — it CAN be "" for an unconfigured tier, in which case the deeper
      // open*() calls would just silently no-op and leave the button stuck.
      if (!pricing.monthlyPriceId) {
        setError(
          "Checkout is temporarily unavailable — please try again shortly.",
        );
        setStatus("error");
        return;
      }

      if (pricing.provider === "ASYNCPAY") {
        openAsyncpay(buyer);
      } else {
        openPaddle(buyer);
      }
    },
    [pricing, openAsyncpay, openPaddle],
  );

  const reset = useCallback(() => {
    setStatus(pricing ? "ready" : "loading");
    setError(null);
  }, [pricing]);

  return {
    status: status === "loading" && pricing ? "ready" : status,
    priceLabel,
    provider,
    error,
    pay,
    reset,
  };
}
