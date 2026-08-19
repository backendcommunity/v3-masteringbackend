"use client";

import { useEffect, useState } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { useUser } from "@/hooks/use-user";
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
 * NOT included, deliberately: subscriptions. Both callers send those to
 * /checkout, which is the only surface that resolves processor, currency and
 * price ID together from one region. See the block comment in
 * components/payment-gate-overlay.tsx for why that separation exists.
 */

const PADDLE_TOKEN = process.env.NEXT_PUBLIC_PADDLE_TOKEN as string;
const NODE_ENV = process.env.NEXT_PUBLIC_NODE_ENV;

const PADDLE_ENVIRONMENT = ["dev", "staging"].includes(NODE_ENV!)
  ? "sandbox"
  : "production";

/** 1 USD = 100 MB. */
export function mbCostFor(amount: number | null | undefined): number | null {
  if (typeof amount !== "number" || amount <= 0) return null;
  return Math.round(amount * 100);
}

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
  onPurchased,
  onCheckoutOpened,
}: {
  data: PurchasableContent;
  /** Fired when a purchase completes (or an MB redemption resolves). */
  onPurchased: (id: string, method: string, success: boolean) => void;
  /** Lets the caller dismiss its own modal once Paddle's overlay is up. */
  onCheckoutOpened?: () => void;
}) {
  const user = useUser();
  const store = useAppStore();
  const { theme } = useTheme();
  const [paddle, setPaddle] = useState<Paddle>();

  useEffect(() => {
    initializePaddle({
      token: PADDLE_TOKEN,
      eventCallback: function (event: any) {
        switch (event.name) {
          case "checkout.loaded":
            onCheckoutOpened?.();
            break;
          case "checkout.completed": {
            const c = event?.custom_data;
            analytics.track("payment_completed", {
              contentId: c?.id,
              contentType: c?.type,
              method: c?.method,
            });
            onPurchased(c?.id, c?.method, true);
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

  /** Redeem MB points against this item. */
  const redeemMB = async () => {
    if (!data.id) {
      toast.error("This item isn't ready for purchase yet. Please refresh.");
      return;
    }
    analytics.track("payment_plan_selected", { plan: "mb", contentId: data.id });
    const cost = mbCostFor(data?.amount);
    if (cost == null) {
      toast.error("This item can't be redeemed with MB.");
      return;
    }
    try {
      const balance = user?.points ?? 0;
      if (balance < cost) {
        toast.warning("Insufficient MB to purchase");
        return;
      }
      const payload: any = { type: data.type, id: data.id, mb: cost };
      if (data.type === "bootcamp" && data.bootcampId) {
        payload.bootcampId = data.bootcampId;
      }
      const purchased = await store.handleMBPayment(payload);
      onPurchased(data.id, "mb", Boolean(purchased));
    } catch (error: any) {
      const res = error?.response?.data ?? error;
      toast.error(res?.message ?? "An error occurred");
    }
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
        publicKey: process.env.NEXT_PUBLIC_ASYNCPAY_KEY,
        customer: {
          firstName: user?.name?.split(" ")[0],
          lastName: user?.name?.split(" ")[1],
          email: user?.email,
        },
        subscriptionPlanUUID: res.asyncpay_plan_id,
        onSuccess: () => onPurchased(cohortId, "asyncpay", true),
        onClose: () => toast.info("Payment window closed"),
      });
    } catch (error: any) {
      const res = error?.response?.data ?? error;
      toast.error(res?.message ?? "An error occurred");
    }
  };

  return { buyOnce, redeemMB, payWithAsyncpay, paddleReady: Boolean(paddle) };
}
