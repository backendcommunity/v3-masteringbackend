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

export function useLpCheckout(): UseLpCheckoutResult {
  const pricing = useCheckoutPricing();
  const [status, setStatus] = useState<LpCheckoutStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const priceLabel = pricing ? formatPrice(pricing.monthly, pricing.currency) : "";
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
          setError(description || "We couldn't start checkout. Please try again.");
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
        setError("Checkout is temporarily unavailable — please try again shortly.");
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
