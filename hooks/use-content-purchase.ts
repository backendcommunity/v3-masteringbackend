"use client";

import { useEffect, useRef, useState } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { useUser } from "@/hooks/use-user";
import {
  asyncpayBaseOptions,
  PADDLE_ENVIRONMENT,
} from "@/lib/payment-environment";
import type { CheckoutCapablePricing } from "@/hooks/use-pricing";
import { fetchUser } from "@/lib/auth";
import { setStoredUser } from "@/lib/user-store";
import { useAppStore } from "@/lib/store";
import { analytics } from "@/lib/analytics";
import countries from "@/lib/countries.json";

/**
 * The one-off purchase rails for a single piece of content: buy it outright
 * (Paddle), or redeem MB points.
 *
 * Extracted from the old PaymentDialog so PaymentGateOverlay can offer the rails
 * without a second copy of the money-handling code. The logic here is a
 * verbatim move — same Paddle environment switch, same country resolution,
 * same MB balance check, same analytics events. Two components calling one
 * implementation is the point; do not inline a variant of this anywhere.
 *
 * Subscriptions used to be excluded here on the grounds that only /checkout
 * could resolve processor, currency and price ID together. That premise was
 * wrong: GET /public/pricing has always returned `provider` and both price
 * IDs, and useCheckoutPricing surfaces them. `subscribe()` below therefore
 * opens the right SDK in place, which is what lets a paywall take payment
 * without navigating the learner off the lesson they were reading.
 *
 * The invariant that actually mattered is preserved and is the reason
 * `subscribe` takes a whole pricing object rather than a bare price ID: the
 * amount on screen and the price handed to the processor must come from ONE
 * response, and `countryCode` must come from that same response so the
 * processor cannot geo-detect its way to a different tier. An earlier inline
 * attempt quoted a Nigerian buyer ₦9,999 and charged them the legacy USD
 * amount by getting exactly this wrong.
 */

const PADDLE_TOKEN = process.env.NEXT_PUBLIC_PADDLE_TOKEN as string;
const NODE_ENV = process.env.NEXT_PUBLIC_NODE_ENV;

// Both SDK environments come from lib/payment-environment.ts so the pair
// cannot drift — AsyncPay silently used its dev API for want of this.

export interface PurchasableContent {
  /**
   * Optional because call sites spread a loaded entity (`{...project}`) whose
   * id is only populated after the fetch resolves. Both rails below refuse to
   * act without one rather than posting `undefined` to the server.
   */
  id?: string;
  type?: string;
  title?: string;
  amount?: number | null;
  paddle_price_id?: string | null;
  bootcampId?: string;
  asyncpay_plan_id?: string | null;
}

export function useContentPurchase({
  data,
  pricing,
  planName = "Pro",
  onPurchased,
  onCheckoutOpened,
}: {
  data: PurchasableContent;
  /**
   * Region-resolved pricing WITH provider and price IDs. Required only by
   * `subscribe()`; the one-off rails do not use it. Omit it and `subscribe()`
   * reports failure, which callers treat as "fall back to /checkout".
   */
  pricing?: CheckoutCapablePricing | null;
  planName?: "Pro" | "Enterprise";
  /** Fired when a purchase completes (or an MB redemption resolves). */
  onPurchased: (id: string, method: string, success: boolean) => void;
  /** Lets the caller dismiss its own modal once Paddle's overlay is up. */
  onCheckoutOpened?: () => void;
}) {
  const user = useUser();
  const store = useAppStore();
  const { theme } = useTheme();
  const [paddle, setPaddle] = useState<Paddle>();
  // True while we wait for the backend to catch up with the processor.
  const [confirmingPurchase, setConfirmingPurchase] = useState(false);
  // Set immediately before opening a subscription checkout. See the event
  // callback for why this, and not the event payload, is the discriminator.
  const subscriptionInFlightRef = useRef(false);

  useEffect(() => {
    initializePaddle({
      token: PADDLE_TOKEN,
      eventCallback: function (event: any) {
        // custom_data lives at event.data.custom_data — PaddleEventData is
        // { name, data: CheckoutEventsData } and CheckoutEventsData owns the
        // field. Reading event.custom_data (as this did) is always undefined,
        // which silently passed `undefined` as the id and method of every
        // one-off purchase.
        const custom = (event?.data?.custom_data ?? {}) as {
          id?: string;
          type?: string;
          method?: string;
        };
        // The ref is the AUTHORITY, not the payload. This callback is
        // registered once at mount, so it can never read current state — and
        // a payload path is exactly the kind of thing that is wrong once and
        // then silently wrong forever. A ref reads live and does not care
        // what shape the SDK sends.
        const isSubscription =
          subscriptionInFlightRef.current || custom.method === "subscription";

        switch (event.name) {
          case "checkout.loaded":
            // Subscriptions deliberately keep the caller's sheet mounted
            // underneath. If the buyer backs out of the processor, the wall
            // is still there — dismissing it here would strand them on
            // content they still cannot open.
            if (!isSubscription) onCheckoutOpened?.();
            break;
          case "checkout.closed":
            // Cancelled. Release the flag so a later one-off purchase from
            // the same mounted hook is not mistaken for a subscription.
            subscriptionInFlightRef.current = false;
            break;
          case "checkout.completed": {
            analytics.track("payment_completed", {
              contentId: custom.id,
              contentType: custom.type,
              method: custom.method,
            });
            if (isSubscription) {
              subscriptionInFlightRef.current = false;
              // Deliberately NOT onPurchased: the caller's handler closes its
              // sheet, and the wall must stay up until the backend confirms
              // entitlement. confirmPremiumThenReload owns teardown, via a
              // reload.
              void confirmPremiumThenReload();
            } else {
              onPurchased(custom.id!, custom.method!, true);
            }
            break;
          }
        }
      },
      environment: PADDLE_ENVIRONMENT,
    }).then((instance: Paddle | undefined) => {
      if (instance) setPaddle(instance);
    });
    // Mount-once, as the original dialog did.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCheckout = (priceId: string, customData: any) => {
    if (!priceId) {
      toast.error("Price ID is not available. Please refresh and try again.");
      return;
    }
    analytics.track("checkout_initiated", {
      contentId: data?.id,
      contentType: data?.type,
      contentTitle: data?.title,
      priceId,
      ...customData,
    });
    if (!user?.email) {
      toast.error("Email is required to complete the purchase.");
      return;
    }
    const countryCode =
      countries.find(
        (c) =>
          c.name.toLowerCase() === user?.country?.toLowerCase() ||
          c.code.toLowerCase() === user?.country?.toLowerCase(),
      )?.code ||
      user?.country ||
      "";

    paddle?.Checkout.open({
      settings: {
        allowedPaymentMethods: [
          "alipay",
          "apple_pay",
          "bancontact",
          "card",
          "google_pay",
          "ideal",
          "paypal",
        ],
        theme: theme?.includes("dark") ? "dark" : "light",
      },
      items: [{ priceId }],
      customData,
      customer: { email: user?.email, address: { countryCode } },
    });
  };

  /** Buy this single item outright. */
  const buyOnce = () => {
    if (!data.id) {
      toast.error("This item isn't ready for purchase yet. Please refresh.");
      return;
    }
    let priceId: string | undefined;
    if (NODE_ENV === "dev") {
      priceId = "pri_01k051ksx2kx847wq6y48kpfj5";
    } else {
      priceId = data?.paddle_price_id?.trim() ?? undefined;
    }
    if (!priceId) {
      toast.error(
        `This ${data?.type ?? "item"} is not available for purchase right now. Please try again later.`,
      );
      return;
    }
    analytics.track("payment_plan_selected", {
      plan: "individual",
      contentId: data.id,
    });
    openCheckout(priceId, {
      method: "individual",
      id: data?.id,
      type: data?.type ?? "course",
    });
  };

  /** Nigerian one-off via AsyncPay. Amount comes from the resolved plan. */
  const payWithAsyncpay = async () => {
    // The endpoint keys on (bootcampId, cohortId). Only bootcamps carry a
    // bootcampId, and this rail only ever renders for them — but the old
    // call site typed `data` as `any` and would have sent `undefined`
    // silently. Fail loudly instead of asking the server to guess.
    if (!data.bootcampId || !data.id) {
      toast.error("This item can't be paid for with Paystack.");
      return;
    }
    const cohortId = data.id;
    try {
      const res = await store.initiateAsyncpayCheckout(
        data.bootcampId,
        cohortId,
      );
      const { AsyncpayCheckout } = await import("@asyncpay/checkout");
      AsyncpayCheckout({
        ...asyncpayBaseOptions(user ?? {}),
        subscriptionPlanUUID: res.asyncpay_plan_id,
        onSuccess: () => onPurchased(cohortId, "asyncpay", true),
        onClose: () => toast.info("Payment window closed"),
      });
    } catch (error: any) {
      const res = error?.response?.data ?? error;
      toast.error(res?.message ?? "An error occurred");
    }
  };

  /**
   * How long to wait for the processor's webhook to reach our backend. The
   * SDK's "completed" event only means the buyer finished paying at the
   * PROVIDER; entitlement lands separately and can lag by seconds.
   */
  const PREMIUM_CONFIRM_ATTEMPTS = 15;
  const PREMIUM_CONFIRM_INTERVAL_MS = 2000;

  /**
   * Poll the backend until it agrees the buyer is premium, then hard-reload.
   *
   * A reload rather than local state juggling because entitlement affects the
   * whole page — gated steps, the outline, the action bar — and re-deriving
   * all of it in place is far more fragile than letting the app boot once
   * with `isPremium: true` already true.
   *
   * Reloading BEFORE the webhook lands would drop the buyer straight back
   * onto the paywall they just paid to remove, so a timeout explains itself
   * instead and leaves the sheet up.
   */
  const confirmPremiumThenReload = async () => {
    setConfirmingPurchase(true);
    for (let attempt = 0; attempt < PREMIUM_CONFIRM_ATTEMPTS; attempt++) {
      try {
        const { data: fresh } = await fetchUser();
        if (fresh) setStoredUser(fresh);
        if (fresh?.isPremium) {
          window.location.reload();
          return;
        }
      } catch {
        // Keep polling: a single failed refresh is not a failed payment.
      }
      await new Promise((r) => setTimeout(r, PREMIUM_CONFIRM_INTERVAL_MS));
    }
    setConfirmingPurchase(false);
    toast.success(
      "Payment received. Access can take a minute to apply — refresh shortly.",
    );
  };

  /**
   * Open a subscription checkout in place.
   *
   * Returns false when inline cannot start — no pricing, no price ID, no
   * email, Enterprise, or an SDK that will not open. Callers treat false as
   * "send them to /checkout" rather than showing an error, so a blocked SDK
   * or a missing price never dead-ends a buyer.
   *
   * `cycle` is REQUIRED to match what the caller has on screen. The paywall
   * quotes the annual-equivalent monthly rate; onboarding quotes the plain
   * monthly rate. Hardcoding either one here would charge some buyers a price
   * they were never shown — the same class of bug as letting the processor
   * geo-detect its own country.
   */
  const subscribe = async (cycle: "monthly" | "annual"): Promise<boolean> => {
    // Enterprise is per-seat: it needs the seat selector and per-seat maths
    // that only /checkout implements, and one region cannot self-serve at
    // all (see enterpriseSelfServe in academy's tiers.ts).
    if (planName === "Enterprise") return false;
    const priceId =
      cycle === "annual" ? pricing?.annualPriceId : pricing?.monthlyPriceId;
    if (!pricing || !priceId || !user?.email) return false;

    analytics.track("payment_plan_selected", {
      plan: "pro",
      surface: "inline",
      cycle,
      provider: pricing.provider,
      country: pricing.country,
    });

    if (pricing.provider === "ASYNCPAY") {
      subscriptionInFlightRef.current = true;
      let mod: typeof import("@asyncpay/checkout");
      try {
        mod = await import("@asyncpay/checkout");
      } catch {
        // The chunk itself failed. Nothing was shown, so reporting failure is
        // honest and the caller can route to /checkout.
        subscriptionInFlightRef.current = false;
        return false;
      }

      try {
        // NOT awaited — mirrors checkout.tsx, and the distinction matters.
        // This promise settles when the whole payment FLOW ends, not when the
        // modal opens. Awaiting it meant a rejection at any later point (a
        // closed window, a declined card) came back as "inline could not
        // start", and the caller then navigated to /checkout — on top of a
        // modal the SDK had already shown.
        const started = mod.AsyncpayCheckout({
          ...asyncpayBaseOptions(user),
          subscriptionPlanUUID: priceId,
          onSuccess: () => {
            void confirmPremiumThenReload();
          },
          // Deliberately empty: backing out returns the buyer to the paywall,
          // which is still mounted. Dismissing it here would be the same bug
          // as closing on checkout.loaded.
          onClose: () => {},
          onError: () =>
            toast.error("We couldn't start checkout. Please try again."),
        });

        // Rejections are surfaced by the SDK's own onError; this only stops an
        // unhandled rejection and releases the flag. It must NOT navigate.
        void Promise.resolve(started).catch(() => {
          subscriptionInFlightRef.current = false;
        });
      } catch {
        // Synchronous throw — validation, before anything was rendered.
        subscriptionInFlightRef.current = false;
        return false;
      }
      return true;
    }

    if (!paddle?.Checkout?.open) return false;
    // Set BEFORE open(): checkout.loaded can fire before this call returns,
    // and the callback reads this ref to decide whether to dismiss the
    // caller's sheet.
    subscriptionInFlightRef.current = true;
    try {
      paddle.Checkout.open({
        // Paddle's own modal over the page — no container element needed,
        // unlike /checkout's inline frame which has a panel to fill.
        settings: {
          displayMode: "overlay",
          theme: theme?.includes("dark") ? "dark" : "light",
        },
        items: [{ priceId, quantity: 1 }],
        customData: {
          method: "subscription",
          id: planName.toLowerCase(),
          type: "subscription",
        },
        customer: {
          email: user.email,
          // From the SAME response that produced the price on screen. Without
          // it Paddle geo-detects independently and can bill a tier we did
          // not quote.
          address: { countryCode: pricing.country || "US" },
        },
      });
      return true;
    } catch {
      subscriptionInFlightRef.current = false;
      return false;
    }
  };

  return {
    buyOnce,
    payWithAsyncpay,
    subscribe,
    confirmingPurchase,
  };
}
