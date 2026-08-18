"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { routes } from "@/lib/routes";
import { useAppStore } from "@/lib/store";
import countries from "@/lib/countries.json";
import { dataStore, Plan } from "@/lib/data";
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { useUser } from "@/hooks/use-user";
import ConfettiCelebration from "../confetti-celebration";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { formatDate } from "@/lib/utils";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { formatPrice } from "@/lib/pricing";
import type { CheckoutPricing, RegionalPricing } from "@/lib/pricing";
import {
  classifyCheckoutReadiness,
  checkoutSubscribeLabel,
  CHECKOUT_UNAVAILABLE_MESSAGE,
} from "@/lib/checkout-readiness";
import { analytics } from "@/lib/analytics";
import { PRICING_EVENTS } from "@/lib/analytics-events";

// The AsyncPay SDK appends its checkout UI as a single element with this id,
// as a DIRECT child of <body> — verified in
// node_modules/@asyncpay/checkout/dist/bundle.js (`e.id =
// "asyncpay-checkout-sdk-wrapper"` ... `document.body.appendChild(e)`).
// Watching for that node is how we know the checkout is actually on screen.
const ASYNCPAY_WRAPPER_ID = "asyncpay-checkout-sdk-wrapper";

// The watchdog guards exactly one window: Subscribe click -> checkout UI on
// screen. Inside that window the SDK does a single POST to
// /v1/sdk/initialize-payment-request and nothing else, so this is sized for
// one API round trip, not for a buyer typing card details. ~8s is roughly
// double a pessimistic slow-mobile round trip for a single request, while
// being short enough that a genuinely hung request doesn't leave Subscribe
// dead for an uncomfortable stretch. It used to be 20s and stayed armed
// while the modal was open, which is the bug this replaces.
const CHECKOUT_OPEN_TIMEOUT_MS = 8000;

interface CheckoutPageProps {
  // Resolved server-side (see app/checkout/page.tsx) from the visitor's
  // region. The buyer never chooses a processor — it's implied by `provider`
  // and only ever used to pick which SDK call to make, never rendered.
  pricing: CheckoutPricing;
  // Passed as its OWN prop rather than folded into `pricing`: CheckoutPricing
  // (lib/pricing.ts) deliberately strips `tier` before crossing into this
  // client component, and lib/__tests__/checkout-page-props.test.ts pins
  // that. This is used only for the operator-facing unavailable report
  // below (never rendered to the buyer), so it goes through a separate,
  // narrower channel instead of reopening that boundary.
  tier: RegionalPricing["tier"];
}

export function CheckoutPage({ pricing, tier }: CheckoutPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const store = useAppStore();
  const user = useUser();
  const fmt = (date?: string | Date | null): string =>
    formatDate(String(date ?? ""), user?.settings?.dateFormat);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [plan, setPlan] = useState<Plan>();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const paddleRef = useRef<HTMLInputElement>(null);
  const [celebration, setCelebration] = useState(false);
  const [paddle, setPaddle] = useState<Paddle>();
  // Holds the resolved @asyncpay/checkout module once its chunk has loaded
  // — a latency optimization only (see the prefetch effect below), not a
  // correctness requirement: this SDK never calls `window.open`, so there
  // is no popup/gesture chain to preserve.
  const asyncpayModuleRef = useRef<{
    // Returns a promise that rejects on every SDK error path — see the
    // `.catch()` on the call site in openAsyncpayCheckout.
    AsyncpayCheckout: (...args: any[]) => unknown;
  } | null>(null);
  const [asyncpayReady, setAsyncpayReady] = useState(false);
  // Pre-modal watchdog, in three parts: the timer itself, the observer that
  // cancels it once the checkout UI appears, and the pagehide listener that
  // cancels it when the SDK redirects the whole page away instead.
  const asyncpayWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const asyncpayWrapperObserverRef = useRef<MutationObserver | null>(null);
  const asyncpayPagehideRef = useRef<(() => void) | null>(null);
  // Paddle's equivalent pre-frame watchdog. Paddle needs no MutationObserver:
  // the SDK's own eventCallback fires the moment anything happens to the
  // checkout (loaded / closed / completed / error), so ANY event is proof the
  // buyer is no longer stranded and cancels the timer.
  const paddleWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest values for Paddle's eventCallback, which is registered once on
  // mount (see the init effect) and must not capture a stale render's props.
  const paddleEventCtxRef = useRef({
    country: "",
    cycle: "monthly",
    checkoutId: "pro",
  });

  // Extract checkout type and ID from the URL
  const checkoutId = searchParams?.get("plan") ?? "pro";
  const cycle = searchParams?.get("cycle") ?? "monthly";

  paddleEventCtxRef.current = { country: pricing.country, cycle, checkoutId };

  const PADDLE_TOKEN = process.env.NEXT_PUBLIC_PADDLE_TOKEN as string;
  const NODE_ENV = process.env.NEXT_PUBLIC_NODE_ENV;
  const PADDLE_ENVIRONMENT = ["dev", "staging"].includes(NODE_ENV!)
    ? "sandbox"
    : "production";

  const subscription = user?.subscription;
  const plans = dataStore.plans;
  // A subscriber must never be able to complete a SECOND purchase. /pricing
  // guards its CTAs the same way, but this page is directly reachable (a
  // bookmark, a hand-typed URL, a stale tab), so the guard has to live here
  // too — and it has to also stop the payment SDK initialising, not merely
  // hide the button.
  const isPro = Boolean(user?.isPremium);

  // Both intervals are valid for every tier (NG annual ships too) — no
  // tier-conditional branch here.
  const priceId =
    cycle === "annual" ? pricing.annualPriceId : pricing.monthlyPriceId;
  const amount = cycle === "annual" ? pricing.annual : pricing.monthly;
  const countryName = countries.find((c) => c.code === pricing.country)?.name;

  // A price ID alone is NOT readiness. Each provider also needs its SDK
  // actually resolved:
  //   - Paddle: `paddle` stays undefined while initializePaddle is in flight,
  //     and forever if the CDN is blocked or the token is bad. Subscribe used
  //     to be enabled in that state, so clicking it set "Processing..." and
  //     then silently did nothing — the buyer sat on a dead disabled button.
  //   - AsyncPay: waits on the eager chunk prefetch (see the effect below) so
  //     the click doesn't have to fetch a chunk before it can start.
  //
  // A missing price ID is a DIFFERENT, PERMANENT condition (see
  // lib/checkout-readiness.ts) — it must not present as the same "Loading…"
  // state as a merely-not-yet-resolved SDK, which is why classification is
  // pulled into a pure, tested function rather than inlined here.
  const sdkResolved =
    pricing.provider === "ASYNCPAY" ? asyncpayReady : Boolean(paddle);
  const readiness = classifyCheckoutReadiness({
    hasPriceId: Boolean(priceId),
    sdkResolved,
  });
  const subscribeReady = readiness === "ready";
  const subscribeLabel = checkoutSubscribeLabel(readiness, isProcessing);

  // Fires once when checkout is permanently unavailable (no price ID for the
  // selected cycle/tier) so operators find out instead of only a buyer
  // staring at a dead button. Deliberately does not run for the transient
  // "loading" state. console.error is the floor; Sentry.captureMessage adds
  // the tier/provider/cycle tags so this is triageable without reproducing
  // it locally.
  useEffect(() => {
    if (readiness !== "unavailable") return;
    console.error(
      "[checkout] no usable price ID for tier=%s provider=%s cycle=%s — checkout cannot start",
      tier,
      pricing.provider,
      cycle,
    );
    Sentry.captureMessage("Checkout unavailable: missing price ID", {
      level: "error",
      tags: { tier, provider: pricing.provider, cycle },
    });
  }, [readiness, tier, pricing.provider, cycle]);

  useEffect(() => {
    let cancelled = false;

    async function load(name: string) {
      setLoading(true);
      const plan = await store.getPlan(name);
      if (!cancelled) {
        setPlan(plan);
        setLoading(false);
      }
    }
    load(checkoutId!);

    return () => {
      cancelled = true;
    };
  }, [checkoutId, store]);

  // Eagerly prefetch the AsyncPay chunk as soon as we know it's the
  // resolved provider, instead of waiting for the Subscribe click to start
  // the dynamic import. This is a latency optimization, not a correctness
  // fix: @asyncpay/checkout never calls `window.open` (checked
  // node_modules/@asyncpay/checkout/dist/bundle.js directly — it does
  // `await fetch(.../initialize-payment-request)`, then either sets
  // `location.href` or injects an iframe modal into the DOM), so there is
  // no popup-blocking/gesture-chain risk here. The only reason to prefetch
  // is so the click doesn't have to wait on the chunk's own network fetch
  // before it can even start the SDK's fetch.
  useEffect(() => {
    if (pricing.provider !== "ASYNCPAY") return;
    let cancelled = false;
    import("@asyncpay/checkout").then((mod) => {
      if (cancelled) return;
      asyncpayModuleRef.current = mod;
      setAsyncpayReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [pricing.provider]);

  // Tears down every part of the pre-modal watchdog: timer, observer, and
  // pagehide listener. Idempotent, so it's safe to call from any exit path
  // and more than once.
  const clearAsyncpayWatchdog = useCallback(() => {
    if (asyncpayWatchdogRef.current) {
      clearTimeout(asyncpayWatchdogRef.current);
      asyncpayWatchdogRef.current = null;
    }
    if (asyncpayWrapperObserverRef.current) {
      asyncpayWrapperObserverRef.current.disconnect();
      asyncpayWrapperObserverRef.current = null;
    }
    if (asyncpayPagehideRef.current) {
      window.removeEventListener("pagehide", asyncpayPagehideRef.current);
      asyncpayPagehideRef.current = null;
    }
  }, []);

  // Arms the watchdog for the pre-modal window ONLY.
  //
  // Its single job is to stop Subscribe sticking disabled forever if the
  // SDK's initialize call hangs and no callback ever fires. Once the
  // checkout UI is on screen the buyer can see the state of things for
  // themselves, so the watchdog has no remaining purpose — and card entry
  // legitimately takes far longer than any timeout we'd want on an API
  // call. So it is cancelled the moment the checkout UI appears.
  const armAsyncpayWatchdog = useCallback(() => {
    clearAsyncpayWatchdog();

    // Already on screen — nothing to wait for. (The SDK refuses concurrent
    // sessions anyway, so this is belt-and-braces.)
    if (document.getElementById(ASYNCPAY_WRAPPER_ID)) return;

    const observer = new MutationObserver(() => {
      if (!document.getElementById(ASYNCPAY_WRAPPER_ID)) return;
      // Checkout UI is up. The watchdog's window has closed; isProcessing
      // stays true deliberately (the buyer is inside the modal) and is
      // cleared by onSuccess / onClose / onError.
      clearAsyncpayWatchdog();
    });
    // The SDK appends the wrapper as a direct child of <body>, so observing
    // body's childList is sufficient — no subtree walk needed.
    observer.observe(document.body, { childList: true });
    asyncpayWrapperObserverRef.current = observer;

    // The should_redirect branch never creates that wrapper — it assigns
    // location.href and the page navigates away. Timers keep running until
    // the new document commits, so cancel on unload to make sure a slow
    // redirect can't trip a spurious error on the way out. This also covers
    // full-page navigations, where React unmount cleanup never runs.
    const onPageHide = () => clearAsyncpayWatchdog();
    asyncpayPagehideRef.current = onPageHide;
    window.addEventListener("pagehide", onPageHide);

    asyncpayWatchdogRef.current = setTimeout(() => {
      clearAsyncpayWatchdog();
      setIsProcessing(false);
      toast.error(
        "We couldn't start checkout. Check your connection and try again.",
      );
    }, CHECKOUT_OPEN_TIMEOUT_MS);
  }, [clearAsyncpayWatchdog]);

  // Clear any pending watchdog (and its observer/listener) on unmount.
  useEffect(() => {
    return () => clearAsyncpayWatchdog();
  }, [clearAsyncpayWatchdog]);

  const clearPaddleWatchdog = useCallback(() => {
    if (paddleWatchdogRef.current) {
      clearTimeout(paddleWatchdogRef.current);
      paddleWatchdogRef.current = null;
    }
  }, []);

  // Same contract as the AsyncPay watchdog: guard the click -> checkout-UI
  // window only, so Subscribe can never sit disabled on "Processing..."
  // forever when the SDK never comes back. Cancelled by the first Paddle
  // event of any kind (see the eventCallback in the init effect below).
  const armPaddleWatchdog = useCallback(() => {
    clearPaddleWatchdog();
    paddleWatchdogRef.current = setTimeout(() => {
      paddleWatchdogRef.current = null;
      setIsProcessing(false);
      toast.error(
        "We couldn't start checkout. Check your connection and try again.",
      );
    }, CHECKOUT_OPEN_TIMEOUT_MS);
  }, [clearPaddleWatchdog]);

  useEffect(() => {
    return () => clearPaddleWatchdog();
  }, [clearPaddleWatchdog]);

  // Paddle renders an INLINE frame — safe to auto-open on mount, same as
  // today. AsyncPay is intentionally NOT auto-invoked on mount — not for
  // any popup/gesture reason (this SDK never opens a popup; see the note
  // on openAsyncpayCheckout) but because the approved design shows a
  // deliberate Subscribe button, not a payment modal that ambushes the
  // buyer the instant the page loads. Only the Subscribe button's onClick
  // opens AsyncPay's checkout (see handleSubscribeClick below).
  /**
   * Returns true only if the checkout was actually handed to the SDK. The
   * callers rely on that: a silent `return` here used to leave Subscribe
   * disabled on "Processing..." with no frame and no error.
   */
  const openPaddleCheckout = useCallback((): boolean => {
    if (!priceId || !paddleRef.current || !paddle?.Checkout?.open) return false;
    paddle.Checkout.open({
      settings: { displayMode: "inline" },
      items: [{ priceId }],
      customer: {
        email: user?.email!,
        address: {
          // Comes from the SAME country resolution that produced the price
          // on screen. Without this, Paddle geo-detects independently and
          // can bill a different tier than we just quoted.
          countryCode: pricing.country || "US",
        },
      },
    });
    return true;
  }, [priceId, paddle, user, pricing.country]);

  // Called from the Subscribe click. The chunk is normally already
  // resolved (see the eager-prefetch effect above) so this is instant, but
  // nothing here depends on being inside a click's synchronous gesture
  // window — @asyncpay/checkout does its own `await fetch(...)` before it
  // shows anything, so there's an unavoidable network round trip either
  // way. It's click-driven for UX (a deliberate Subscribe action, matching
  // the approved design), not because a delayed call would be blocked.
  //
  // isProcessing is cleared on every exit: onSuccess, onClose, onError, the
  // promise rejection backstop, the synchronous catch below, and the
  // pre-modal watchdog. The one path that leaves it true is the intended
  // one — the checkout UI is open on top of the page, and the SDK's own
  // callbacks close it out.
  const openAsyncpayCheckout = useCallback(() => {
    const mod = asyncpayModuleRef.current;
    if (!priceId || !mod) return;

    const fail = (message: string) => {
      clearAsyncpayWatchdog();
      setIsProcessing(false);
      toast.error(message);
    };

    // Armed BEFORE the SDK call, deliberately. AsyncpayCheckout runs its
    // "already in session" and field-validation checks synchronously, before
    // its first `await` — so onError can fire during this very call. Arming
    // afterwards would re-arm a timer that onError had just cleared, leaving
    // a stale watchdog to fire later over an error the buyer already saw.
    armAsyncpayWatchdog();

    try {
      const started = mod.AsyncpayCheckout({
        publicKey: process.env.NEXT_PUBLIC_ASYNCPAY_KEY,
        customer: {
          firstName: user?.name?.split(" ")?.[0],
          lastName: user?.name?.split(" ")?.[1],
          email: user?.email,
        },
        subscriptionPlanUUID: priceId,
        onSuccess: () => {
          clearAsyncpayWatchdog();
          setIsProcessing(false);
          setCelebration(true);
          analytics.track(PRICING_EVENTS.subscribed, {
            country: pricing.country,
            cycle,
          });
          toast.success("You're on Pro. Welcome in.");
        },
        onClose: () => {
          clearAsyncpayWatchdog();
          setIsProcessing(false);
        },
        // The SDK invokes this on validation errors and non-ok API
        // responses (see bundle.js's `x()`/`t()` helpers) — this is the
        // real "something went wrong" signal, not a guess based on a
        // timer.
        onError: (err?: { error_description?: unknown }) => {
          // `error_description` is only a string on the SDK's own
          // validation and API-error paths. When `fetch` itself rejects
          // (offline, DNS, CORS) the SDK's `t()` fallback passes the raw
          // thrown value straight through as `error_description`, so this
          // can be a TypeError object — never hand that to toast.
          const description =
            typeof err?.error_description === "string"
              ? err.error_description
              : "";
          fail(
            description || "We couldn't start checkout. Please try again.",
          );
        },
      });

      // Every SDK error path rejects the returned promise, and does so
      // AFTER invoking onError (verified in bundle.js: `x()` calls onError,
      // then throws). onError has therefore already messaged the buyer and
      // reset the button, so this only keeps the rejection from surfacing
      // as an unhandled promise rejection — it must not toast again.
      void Promise.resolve(started).catch(() => {
        clearAsyncpayWatchdog();
        setIsProcessing(false);
      });
    } catch {
      // Narrow safety net: AsyncpayCheckout is itself an async function, so
      // a real SDK error surfaces via onError above, not a synchronous
      // throw here. This only guards a caller-side mistake reaching the
      // SDK call itself.
      fail("We couldn't start checkout. Please try again.");
    }
  }, [priceId, user, pricing.country, cycle, armAsyncpayWatchdog, clearAsyncpayWatchdog]);

  // Routes the Subscribe click to the correct processor SDK based on the
  // region-resolved provider. The buyer never chooses this — it's decided
  // upstream. AsyncPay is gated on `asyncpayReady` purely so a click before
  // the chunk finishes loading is a no-op instead of erroring — not because
  // a later call would be blocked (see openAsyncpayCheckout).
  const handleSubscribeClick = useCallback(() => {
    if (!priceId) return;
    if (pricing.provider === "ASYNCPAY") {
      // Still loading the chunk — the button should already be disabled in
      // this state (see subscribeReady below), but guard here too as
      // defense in depth.
      if (!asyncpayReady) return;
      // `tier` isn't in scope here — CheckoutPricing (see lib/pricing.ts)
      // deliberately omits it before crossing into this client component,
      // same boundary that already strips the processor identity from the
      // pricing page's props. Not worth widening that type just for this
      // event; country + cycle are what's legitimately available.
      analytics.track(PRICING_EVENTS.checkoutStarted, {
        country: pricing.country,
        cycle,
      });
      setIsProcessing(true);
      openAsyncpayCheckout();
    } else {
      // Paddle's inline frame fires checkout.loaded, which is what cancels
      // the watchdog and is also where checkout_started is tracked (the
      // click is not the moment the buyer can see a payment UI here).
      setIsProcessing(true);
      armPaddleWatchdog();
      if (!openPaddleCheckout()) {
        // The SDK was not in a state to open anything — never leave the
        // button stranded on "Processing..." with no frame and no message.
        clearPaddleWatchdog();
        setIsProcessing(false);
        toast.error(
          "We couldn't start checkout. Please refresh the page and try again.",
        );
      }
    }
  }, [
    priceId,
    pricing.provider,
    pricing.country,
    cycle,
    asyncpayReady,
    openAsyncpayCheckout,
    openPaddleCheckout,
    armPaddleWatchdog,
    clearPaddleWatchdog,
  ]);

  // Auto-open the inline frame on mount for Paddle. No watchdog here: this
  // is not a buyer action, nothing is disabled waiting on it, and Subscribe
  // stays available to retry explicitly.
  useEffect(() => {
    if (pricing.provider === "ASYNCPAY") return;
    if (isPro) return;
    openPaddleCheckout();
  }, [openPaddleCheckout, pricing.provider, isPro]);

  // Paddle SDK init — mount-once, in an effect.
  //
  // This used to run in the render body, so every re-render registered a
  // fresh eventCallback and kicked off another initializePaddle. With
  // checkout_started now firing from checkout.loaded, that meant a duplicated
  // funnel event per render and a checkout frame that could re-open itself.
  //
  // eventCallback must still see CURRENT country/cycle/plan values without
  // becoming a dependency of the effect (which would defeat mount-once), so
  // it reads them from a ref that every render keeps up to date.
  useEffect(() => {
    // Never spin up a payment SDK for someone who already has a
    // subscription — the render below shows them a manage-subscription
    // screen instead of a checkout.
    if (isPro) return;

    let cancelled = false;
    let instance: Paddle | undefined;

    initializePaddle({
      token: PADDLE_TOKEN,
      checkout: {
        settings: {
          displayMode: "inline",
          frameTarget: "checkout-frame",
          frameInitialHeight: 450,
          variant: "one-page",
          frameStyle:
            "width: 100%; min-width: 312px; background-color: transparent; border: none;",
          allowedPaymentMethods: [
            "alipay",
            "apple_pay",
            "bancontact",
            "card",
            "google_pay",
            "ideal",
            "paypal",
          ],
        },
      },
      eventCallback: function (data: any) {
        // ANY Paddle event proves the SDK came back, so the pre-frame
        // watchdog has nothing left to guard.
        clearPaddleWatchdog();
        const { country, cycle, checkoutId } = paddleEventCtxRef.current;
        switch (data.name) {
          case "checkout.loaded":
            setIsProcessing(true);
            // Paddle's inline frame opens itself on mount rather than waiting
            // on our Subscribe button, so this SDK callback — not the click —
            // is the genuine "buyer can see the payment UI" moment for Paddle.
            analytics.track(PRICING_EVENTS.checkoutStarted, { country, cycle });
            break;
          case "checkout.closed":
            setIsProcessing(false);
            break;
          case "checkout.error":
            setIsProcessing(false);
            toast.error(
              "Something went wrong with checkout. Please try again.",
            );
            break;
          case "checkout.completed":
            // Track payment (GA or Google)
            setIsProcessing(false);
            setCelebration(true);
            analytics.track(PRICING_EVENTS.subscribed, { country, cycle });
            toast.success(
              "You have successfully subscribe to " + checkoutId + " plan",
            );
            break;
        }
      },
      environment: PADDLE_ENVIRONMENT,
    })
      .then((paddleInstance: Paddle | undefined) => {
        instance = paddleInstance;
        if (cancelled || !paddleInstance) return;
        setPaddle(paddleInstance);
      })
      .catch((e) => console.error(e));

    return () => {
      cancelled = true;
      clearPaddleWatchdog();
      // No destroy() in paddle-js; closing any open checkout is the whole of
      // the teardown available, and it stops an orphaned inline frame
      // outliving this page.
      try {
        instance?.Checkout?.close?.();
      } catch {
        /* nothing to close */
      }
    };
  }, [PADDLE_TOKEN, PADDLE_ENVIRONMENT, isPro, clearPaddleWatchdog]);

  const handleCancelSubscription = () => {
    setCancelDialogOpen(false);
    // In a real app, this would make an API call to cancel the subscription
  };

  const activePlan = plans.find((p) =>
    p.name.includes(
      subscription?.name! ?? subscription?.plan?.name! ?? subscription?.plan,
    ),
  );

  const handleBack = () => {
    router.push(routes.subscriptionPlans);
  };

  if (checkoutId?.includes("free")) {
    return (
      <div className="container max-w-4xl py-12">
        <Card>
          <CardHeader>
            <CardTitle>Cancel Your Subscription?</CardTitle>
            <CardDescription>
              Are you sure you want to cancel your subscription? You'll lose
              access to all premium features when your current billing period
              ends on {fmt(subscription?.expiry)}.
            </CardDescription>
          </CardHeader>
          <CardFooter className="gap-4">
            <Button onClick={() => router.push(routes.dashboard)}>
              Return to Dashboard
            </Button>

            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">Cancel Subscription</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel Your Subscription?</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to cancel your {subscription?.name}{" "}
                    subscription? You'll lose access to all premium features
                    when your current billing period ends on{" "}
                    {fmt(subscription?.expiry)}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Warning</AlertTitle>
                    <AlertDescription>
                      Cancelling will remove access to premium courses,
                      bootcamps, and features when your current billing period
                      ends.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <h4 className="font-medium">You'll lose access to:</h4>
                    <ul className="space-y-2 text-sm mt-3">
                      {activePlan?.features
                        ?.filter((f) => f?.included)
                        ?.map((f) => (
                          <li className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                            <span>{f?.name}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCancelDialogOpen(false)}
                  >
                    Keep Subscription
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancelSubscription}
                  >
                    Confirm Cancellation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      </div>
    );
  }
  // Already subscribed: no second purchase, no payment SDK (the init effect
  // bails on the same flag), no Subscribe button. Rendered AFTER the
  // `plan=free` branch above so a subscriber can still reach the cancellation
  // flow, which is the one thing they legitimately come to /checkout for.
  if (isPro) {
    return (
      <div className="container max-w-4xl py-12">
        <Card>
          <CardHeader>
            <CardTitle>You&apos;re on Pro</CardTitle>
            <CardDescription>
              {subscription?.expiry
                ? `Your subscription is already active and renews on ${fmt(subscription.expiry)}.`
                : "Your subscription is already active."}{" "}
              There&apos;s nothing to buy here — manage your plan any time from
              your subscription settings.
            </CardDescription>
          </CardHeader>
          <CardFooter className="gap-4">
            <Button onClick={() => router.push(routes.subscriptionManagement)}>
              Manage subscription
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(routes.dashboard)}
            >
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (loading) return <PageSkeleton />;

  return (
    <div className="container ">
      <Button variant="ghost" size="sm" className="mb-8" onClick={handleBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="gap-4 flex flex-col">
          {/* Order Summary */}
          <Card className="md:col-span-1 h-fit">
            <CardHeader className="pb-4">
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review your order details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <h3 className="font-medium">{plan?.name} Subscription</h3>
                <p className="text-sm text-muted-foreground">
                  {`${
                    cycle === "monthly" ? "Monthly" : "Yearly"
                  } subscription to MasteringBackend ${plan?.name}`}
                </p>
              </div>

              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Billing in {pricing.currency}
                {countryName ? ` for ${countryName}` : ""}
              </p>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(amount, pricing.currency)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-sm">
                  <span>Tax</span>
                  <span>{formatPrice(0, pricing.currency)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatPrice(amount, pricing.currency)}</span>
              </div>

              <div className="text-sm text-muted-foreground pt-2">
                <p>
                  You will be charged{" "}
                  <span>{formatPrice(amount, pricing.currency)}</span> every{" "}
                  {cycle === "monthly" ? "month" : "year"}.
                </p>
              </div>

              {readiness === "unavailable" ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Checkout unavailable</AlertTitle>
                  <AlertDescription>
                    {CHECKOUT_UNAVAILABLE_MESSAGE}
                  </AlertDescription>
                </Alert>
              ) : (
                <Button
                  className="w-full"
                  disabled={isProcessing || !subscribeReady}
                  onClick={handleSubscribeClick}
                >
                  {subscribeLabel}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Payment Form */}
        <Card className="md:col-span-2 ">
          <CardHeader>
            <CardTitle>Complete your subscription</CardTitle>
            <CardDescription>
              Fill out your details and complete your subscription.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <div
              ref={paddleRef}
              className="space-y-5 checkout-frame w-full"
              id="checkout-frame"
            />
          </CardContent>
        </Card>
      </div>

      {/* Terms and Conditions */}
      <div className="mt-10 text-center text-sm text-muted-foreground">
        <p>
          By completing this purchase, you agree to our{" "}
          <a
            href="https://masteringbackend.com/terms-and-conditions"
            className="h-auto p-0 text-primary"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="https://masteringbackend.com/privacy-policy"
            className="h-auto p-0 text-primary"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>

      <ConfettiCelebration
        onComplete={() => setCelebration(false)}
        isVisible={celebration}
        celebrationType="achievement"
        courseName={plan?.name! + " Subscription"}
      />
    </div>
  );
}
