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
import { useCallback, useState } from "react";
import { AsyncpayCheckout } from "@asyncpay/checkout";
import { useCheckoutPricing } from "@/hooks/use-pricing";
import {
  asyncpayBaseOptions,
  PADDLE_ENVIRONMENT,
} from "@/lib/payment-environment";
import { formatPrice } from "@/lib/pricing";

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

export function useLpCheckout(): UseLpCheckoutResult {
  const pricing = useCheckoutPricing();
  const [status, setStatus] = useState<LpCheckoutStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const priceLabel = pricing ? formatPrice(pricing.monthly, pricing.currency) : "";
  const provider = pricing?.provider ?? null;

  const openAsyncpay = useCallback(
    (buyer: LpBuyer) => {
      if (!pricing?.monthlyPriceId) return;
      setStatus("processing");
      // Called synchronously (no dynamic import) — AsyncpayCheckout runs its
      // own validation checks before its first `await`, so onError can fire
      // during this very call, and every SDK error path rejects the
      // returned promise AFTER invoking onError (see
      // components/pages/checkout.tsx's identical comment). The
      // Promise.resolve(...).catch() below exists only to swallow that
      // already-handled rejection so it doesn't surface as unhandled; it
      // must not set error state again.
      const started = AsyncpayCheckout({
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

  const openPaddle = useCallback(
    (buyer: LpBuyer) => {
      if (!pricing?.monthlyPriceId) return;
      setStatus("processing");
      import("@paddle/paddle-js").then(({ initializePaddle }) => {
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
        }).then((paddle) => {
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
        });
      });
    },
    [pricing],
  );

  const pay = useCallback(
    (buyer: LpBuyer) => {
      if (!pricing) return;
      setError(null);
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
