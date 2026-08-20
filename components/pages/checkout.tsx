"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import {
  ArrowLeft,
  AlertTriangle,
  Minus,
  Plus,
  Lock,
  CreditCard,
  Landmark,
  Smartphone,
  Loader2,
} from "lucide-react";
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
import {
  asyncpayBaseOptions,
  PADDLE_ENVIRONMENT,
} from "@/lib/payment-environment";
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
import {
  clampSeats,
  ENTERPRISE_SEAT_CONFIRM_THRESHOLD,
  formatPrice,
  resolveSeats,
} from "@/lib/pricing";
import type { CheckoutPricing, RegionalPricing } from "@/lib/pricing";
import {
  classifyCheckoutReadiness,
  checkoutSubscribeLabel,
  CHECKOUT_UNAVAILABLE_MESSAGE,
} from "@/lib/checkout-readiness";
import { resolveCheckoutPrice } from "@/lib/checkout-plan-pricing";
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
/**
 * How long the inline frame may sit blank after a successful open() before we
 * call it stalled. Longer than the click watchdog: Paddle has to fetch and
 * paint a whole iframe here, and a false "try again" on a slow connection is
 * worse than a couple of extra seconds of skeleton.
 */
const CHECKOUT_FRAME_STALL_MS = 12000;

/**
 * Where a buyer goes when checkout itself is unavailable and they want a
 * human. Same reasoning as pricing.tsx's SALES_CONTACT_HREF: there is no
 * contact/support route in lib/routes.ts (checked — dashboard, courses,
 * billing, subscription, XP store and auth, nothing support-shaped) and no
 * /contact page under app/, so this is a mailto to the address the site
 * already publishes as its own (lib/seo.ts's organization email) rather
 * than an invented route that would 404. Replace with a real route the
 * moment one exists.
 */
const CHECKOUT_SUPPORT_HREF = `mailto:hi@masteringbackend.com?subject=${encodeURIComponent(
  "Checkout unavailable",
)}`;

/**
 * Team-size stepper — lives HERE, not on /pricing. Seat selection is a
 * checkout-time decision: the pricing card only ever quotes a per-user
 * rate, and the buyer now picks how many seats to buy right before they
 * pay, with the total below recomputed live from that count.
 *
 * There is deliberately no upper bound on team size — Enterprise has no
 * maximum (see the removed `ENTERPRISE_MAX_SEATS` in academy's tiers.ts).
 * What this control DOES guard against is a typo: a non-integer, a value
 * below `minSeats`, or a suspiciously large pasted/typed number (>=
 * `ENTERPRISE_SEAT_CONFIRM_THRESHOLD`) is never applied silently. The first
 * two are rejected outright — the field simply reverts to the last good
 * value, exactly like `resolveCheckoutPrice` (via `resolveSeats`) would
 * refuse to charge for them anyway. The third is held for one explicit
 * confirmation click rather than blocked, because a genuinely large team is
 * a real, valid order this control must never stand in the way of.
 */
export function SeatSelector({
  seats,
  setSeats,
  minSeats,
}: {
  seats: number;
  setSeats: (n: number) => void;
  minSeats: number;
}) {
  // A typed/pasted value >= ENTERPRISE_SEAT_CONFIRM_THRESHOLD sits here,
  // unapplied, until the buyer confirms it. Null the rest of the time.
  const [pendingSeats, setPendingSeats] = useState<number | null>(null);

  const step = (delta: number) => {
    setPendingSeats(null);
    setSeats(clampSeats(seats + delta, { minSeats }));
  };

  // Single entry point for both onChange and onBlur: parses the raw field
  // text and either applies it, holds it for confirmation, or rejects it
  // back to the last good value (by simply not touching `seats` — the
  // controlled input re-renders from it automatically).
  const commitTyped = (raw: string) => {
    if (raw.trim() === "") {
      setPendingSeats(null);
      return;
    }
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < minSeats) {
      // Reject: not a whole number, or below the minimum team size. Do NOT
      // clamp a garbled value up to something that looks like an accepted
      // answer — just fall back to what was last valid.
      setPendingSeats(null);
      return;
    }
    if (parsed >= ENTERPRISE_SEAT_CONFIRM_THRESHOLD) {
      setPendingSeats(parsed);
      return;
    }
    setPendingSeats(null);
    setSeats(parsed);
  };

  const displaySeats = pendingSeats ?? seats;

  return (
    <div>
      <label
        htmlFor="enterprise-seats"
        className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        Team size
      </label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 flex-none"
          onClick={() => step(-1)}
          disabled={seats <= minSeats}
          aria-label="Remove a seat"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <input
          id="enterprise-seats"
          type="number"
          inputMode="numeric"
          min={minSeats}
          value={displaySeats}
          onChange={(e) => commitTyped(e.target.value)}
          // Re-commit on blur so a half-typed value ("" or "1") cannot be
          // left sitting in the field looking like an accepted team size.
          onBlur={(e) => commitTyped(e.target.value)}
          className="h-9 w-20 rounded-md border border-input bg-background px-3 text-center font-mono text-sm font-semibold text-foreground [appearance:textfield] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          aria-describedby="enterprise-seats-hint"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 flex-none"
          onClick={() => step(1)}
          aria-label="Add a seat"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <span
          id="enterprise-seats-hint"
          className="text-xs text-muted-foreground"
        >
          users (min {minSeats})
        </span>
      </div>
      {pendingSeats !== null && (
        <div
          role="alert"
          className="mt-2 flex flex-wrap items-center gap-2 rounded-md border border-amber-400 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300"
        >
          <span>
            That&apos;s {pendingSeats.toLocaleString()} seats — is that right?
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7"
            onClick={() => {
              const confirmed = pendingSeats;
              setPendingSeats(null);
              setSeats(confirmed);
            }}
          >
            Confirm {pendingSeats.toLocaleString()} seats
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7"
            onClick={() => setPendingSeats(null)}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

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
  const [plan, setPlan] = useState<Plan | null>();
  // Whether the plan fetch has SETTLED — success, "no such plan", or network
  // failure alike. Distinct from `plan` being falsy, because "not back yet"
  // and "came back empty" must lead to different states: the first shows a
  // skeleton, the second is a hard unavailable. Distinct from `loading` too,
  // which starts false and so cannot represent "not started yet".
  const [planResolved, setPlanResolved] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  // Deliberately state, not a ref: the auto-open effect below has to re-run
  // the instant this node attaches, and a ref assignment cannot do that.
  const [frameEl, setFrameEl] = useState<HTMLDivElement | null>(null);
  // Proof the buyer can actually SEE a payment form, from Paddle's own
  // checkout.loaded event — not merely that we called open().
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [frameStalled, setFrameStalled] = useState(false);
  // Which priceId we have already handed to Paddle, so a re-render cannot
  // open a second frame over the first.
  const openedForRef = useRef<string | null>(null);
  const frameStallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameLoadedRef = useRef(false);
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
  const asyncpayWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
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
  // Per-seat plans only. Used ONLY to seed the initial seat count below —
  // resolveCheckoutPrice validates the LIVE `seats` state on every render
  // (via resolveSeats), so there is still exactly one gate deciding whether
  // a seat count may be charged, and it is the same one the tests pin.
  const seatsParam = searchParams?.get("seats");
  // Team size the buyer is quoting for — a checkout-time decision now (see
  // SeatSelector above). Seeded from `?seats=` when it arrives already
  // valid (e.g. a shared link, or a back/forward nav within this page), and
  // from the plan's own minimum otherwise — the pricing card no longer
  // decides a seat count, so this is the ONLY place that does, and it
  // always starts at a real, payable number rather than nothing.
  const [seats, setSeats] = useState<number>(
    () =>
      resolveSeats(seatsParam, pricing.enterprise) ??
      pricing.enterprise.minSeats,
  );
  // `?plan=free` is the cancellation flow, not a purchase: it early-returns
  // to the cancellation card below and never prices or charges anything.
  // There is no Free plan record to look up, so it must not be treated as an
  // unresolvable purchase and must not page anyone.
  const isCancellationFlow = Boolean(checkoutId?.includes("free"));

  paddleEventCtxRef.current = { country: pricing.country, cycle, checkoutId };

  const PADDLE_TOKEN = process.env.NEXT_PUBLIC_PADDLE_TOKEN as string;
  const NODE_ENV = process.env.NEXT_PUBLIC_NODE_ENV;
  // Same "is this a real production deploy" gate as sentry.server.config.ts,
  // instrumentation-client.ts and posthog-provider.tsx — NEXT_PUBLIC_NODE_ENV
  // (falling back to NODE_ENV) is only ever "production" for a real
  // production build, so a developer-only diagnostic gated on `!== "production"`
  // can never render there, regardless of exactly which non-prod value
  // ("dev" / "development" / "staging") this deploy happens to use.
  const isNonProductionEnv =
    (NODE_ENV ?? process.env.NODE_ENV) !== "production";

  const subscription = user?.subscription;
  const plans = dataStore.plans;
  // A subscriber must never be able to complete a SECOND purchase. /pricing
  // guards its CTAs the same way, but this page is directly reachable (a
  // bookmark, a hand-typed URL, a stale tab), so the guard has to live here
  // too — and it has to also stop the payment SDK initialising, not merely
  // hide the button.
  const isPro = Boolean(user?.isPremium);

  // What the buyer is ACTUALLY charged, for the plan they actually asked
  // for. Pro keeps the regional object verbatim (both intervals are valid
  // for every tier — NG annual ships too — so no tier-conditional branch);
  // every other plan is priced from its own record, off the channel that
  // matches this same region, and can never fall back to Pro's numbers nor
  // to the other region's channel. See lib/checkout-plan-pricing.ts for the full
  // rationale and lib/__tests__/checkout-plan-pricing.test.ts for the
  // regression pin.
  const resolution = resolveCheckoutPrice({
    checkoutId,
    cycle,
    pricing,
    // The tier arrives as its own prop (CheckoutPricing omits it) and is what
    // selects the plan's own channel row — the only key that separates two
    // rows sharing a processor and a price id.
    tier,
    plan,
    planResolved,
    // The live seat count from the selector below, not the raw URL param —
    // resolveCheckoutPrice re-validates it via resolveSeats either way, but
    // the amount shown and the amount charged must come from the SAME
    // number the buyer is currently looking at, not a stale query string.
    seats,
  });
  const resolved = resolution.status === "resolved" ? resolution.price : null;
  const priceId = resolved?.priceId ?? "";
  const amount = resolved?.amount ?? 0;
  // Seat count for a per-seat plan; absent for everything else, including
  // Pro. `?? 1` at the point of use, never here — an unresolved per-seat
  // checkout must reach the unavailable state, not silently bill one seat.
  const quantity = resolved?.quantity;
  const unitAmount = resolved?.unitAmount;
  const currency = resolved?.currency ?? pricing.currency;
  const provider = resolved?.provider ?? pricing.provider;
  // Every resolved price is now region-selected — Pro from the regional
  // object, other plans from the channel matching that same region — so
  // naming the visitor's country beside it is an accurate claim. It stays
  // undefined whenever nothing resolved (pending / unavailable), which is
  // what this optional chain guards.
  const countryName = resolved?.regional
    ? countries.find((c) => c.code === pricing.country)?.name
    : undefined;

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
  const sdkResolved = provider === "ASYNCPAY" ? asyncpayReady : Boolean(paddle);
  // "pending" is a THIRD condition the classifier doesn't model: the plan
  // record for a non-Pro checkout hasn't come back yet. It is transient, so
  // it maps to "loading" — never to "unavailable" (permanent) and never to a
  // price. The page also renders a skeleton in this state (see below) rather
  // than a price of 0.
  const readiness =
    resolution.status === "pending"
      ? "loading"
      : classifyCheckoutReadiness({
          hasPriceId: Boolean(priceId),
          sdkResolved,
        });
  const subscribeReady = readiness === "ready";
  const subscribeLabel = checkoutSubscribeLabel(readiness, isProcessing);

  // Operator-facing reason this checkout is dead, when it is. Two distinct
  // causes land here: the regional Pro path having no price ID for the
  // selected cycle/tier, and a non-Pro plan whose own price or price ID
  // could not be resolved (lib/checkout-plan-pricing.ts spells out which).
  // Not rendered to the buyer — CHECKOUT_UNAVAILABLE_MESSAGE is.
  const unavailableReason = isCancellationFlow
    ? null
    : resolution.status === "unavailable"
      ? resolution.reason
      : readiness === "unavailable"
        ? `no usable price ID for plan="${checkoutId}"`
        : null;

  // Fires once when checkout is permanently unavailable so operators find
  // out instead of only a buyer staring at a dead button. Deliberately does
  // not run for the transient "loading"/"pending" states. console.error is
  // the floor; Sentry.captureMessage adds the tier/provider/cycle tags so
  // this is triageable without reproducing it locally.
  useEffect(() => {
    if (!unavailableReason) return;
    console.error(
      "[checkout] %s (tier=%s provider=%s cycle=%s) — checkout cannot start",
      unavailableReason,
      tier,
      provider,
      cycle,
    );
    Sentry.captureMessage("Checkout unavailable: price could not be resolved", {
      level: "error",
      tags: { tier, provider, cycle, plan: checkoutId },
      extra: { reason: unavailableReason },
    });
  }, [unavailableReason, tier, provider, cycle, checkoutId]);

  useEffect(() => {
    let cancelled = false;
    setPlanResolved(false);

    async function load(name: string) {
      setLoading(true);
      try {
        const plan = await store.getPlan(name);
        if (!cancelled) setPlan(plan ?? null);
      } catch (e) {
        // A failed lookup must SETTLE, not hang. For a non-Pro checkout this
        // is what turns an infinite skeleton into the explicit unavailable
        // state; it must never leave the page free to price the plan off the
        // regional Pro object instead.
        console.error("[checkout] plan lookup failed for plan=%s", name, e);
        if (!cancelled) setPlan(null);
      } finally {
        if (!cancelled) {
          setPlanResolved(true);
          setLoading(false);
        }
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
    if (provider !== "ASYNCPAY") return;
    let cancelled = false;
    import("@asyncpay/checkout").then((mod) => {
      if (cancelled) return;
      asyncpayModuleRef.current = mod;
      setAsyncpayReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [provider]);

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
    if (!priceId || !frameEl || !paddle?.Checkout?.open) return false;
    paddle.Checkout.open({
      settings: { displayMode: "inline" },
      // `quantity` is how a per-seat plan is actually charged: the processor
      // multiplies the per-seat price by it, so the transaction total equals
      // seats x per-user price — the same number the order summary shows,
      // because both come from the one resolution above.
      //
      // Defaulting to 1 here is safe ONLY because a per-seat plan can never
      // arrive here without a quantity: resolveCheckoutPrice returns
      // "unavailable" (not a price) when the seat count is missing or out of
      // range, so `priceId` is "" and this function returns false before
      // reaching this line. The default therefore only ever applies to
      // single-unit plans like Pro, where 1 is what Paddle assumes anyway.
      items: [{ priceId, quantity: quantity ?? 1 }],
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
  }, [priceId, quantity, paddle, user, pricing.country, frameEl]);

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
        ...asyncpayBaseOptions(user ?? {}),
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
          fail(description || "We couldn't start checkout. Please try again.");
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
  }, [
    priceId,
    user,
    pricing.country,
    cycle,
    armAsyncpayWatchdog,
    clearAsyncpayWatchdog,
  ]);

  // Routes the Subscribe click to the correct processor SDK based on the
  // region-resolved provider. The buyer never chooses this — it's decided
  // upstream. AsyncPay is gated on `asyncpayReady` purely so a click before
  // the chunk finishes loading is a no-op instead of erroring — not because
  // a later call would be blocked (see openAsyncpayCheckout).
  const handleSubscribeClick = useCallback(() => {
    if (!priceId) return;
    if (provider === "ASYNCPAY") {
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
    provider,
    pricing.country,
    cycle,
    asyncpayReady,
    openAsyncpayCheckout,
    openPaddleCheckout,
    armPaddleWatchdog,
    clearPaddleWatchdog,
  ]);

  // Auto-open the inline frame for Paddle.
  //
  // `frameEl` is in the dep list on purpose: it is the piece that used to be a
  // ref, and its absence was the whole bug. This effect now re-runs whenever
  // ANY precondition becomes true — SDK ready, price resolved, or the frame
  // node attaching — so the open cannot be permanently missed by ordering.
  //
  // Guarded by openedForRef so re-renders cannot stack a second frame on the
  // first, and followed by a stall timer: calling open() is not proof the
  // buyer can see anything, so if checkout.loaded never arrives we surface a
  // retry rather than leaving the panel silently empty (which is exactly the
  // reported symptom).
  useEffect(() => {
    if (provider === "ASYNCPAY") return;
    if (isPro) return;
    if (openedForRef.current === priceId) return;
    if (!openPaddleCheckout()) return;

    openedForRef.current = priceId;
    setFrameStalled(false);
    if (frameStallTimerRef.current) clearTimeout(frameStallTimerRef.current);
    frameStallTimerRef.current = setTimeout(() => {
      frameStallTimerRef.current = null;
      setFrameStalled((stalled) => stalled || !frameLoadedRef.current);
    }, CHECKOUT_FRAME_STALL_MS);
  }, [openPaddleCheckout, provider, isPro, priceId]);

  useEffect(
    () => () => {
      if (frameStallTimerRef.current) clearTimeout(frameStallTimerRef.current);
    },
    [],
  );

  // Explicit retry for the stalled case: forget what we opened, clear the
  // error, and let the effect above run again from scratch.
  const retryPaddleFrame = useCallback(() => {
    openedForRef.current = null;
    setFrameStalled(false);
    setFrameLoaded(false);
    frameLoadedRef.current = false;
    if (frameEl) frameEl.innerHTML = "";
    openPaddleCheckout();
  }, [frameEl, openPaddleCheckout]);

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
            // The only honest proof a payment form is on screen; open()
            // returning true says nothing about what the buyer can see.
            frameLoadedRef.current = true;
            setFrameLoaded(true);
            setFrameStalled(false);
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
    // Back to /pricing, not /subscription/plans. Pricing is where every upgrade
    // path in the app now starts, and it is the only page that shows
    // region-correct amounts — sending a buyer who backs out to the old plans
    // page dropped them somewhere they never came from.
    router.push(routes.pricing());
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

  // "pending" means a non-Pro plan's record hasn't arrived yet, so there is
  // no honest number to put in the Order Summary. Show the skeleton rather
  // than render a placeholder amount for even one frame — a wrong price on
  // screen is the class of bug this whole path exists to prevent. Pro never
  // pends, so its render is reached exactly as before.
  if (loading || resolution.status === "pending") return <PageSkeleton />;

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

              {/* Seat selector — Enterprise only, and only once a real
                  per-seat price actually resolved. That's the same
                  condition the breakdown line below uses (quantity is
                  present ONLY on a resolved per-seat plan), which is exactly
                  what keeps this off a sales-led region (NG never resolves
                  a quantity — see resolveCheckoutPrice) and off the
                  "Checkout unavailable" state (an unresolved plan has no
                  quantity either). The total below recomputes live as this
                  changes, before Subscribe is ever enabled. */}
              {quantity !== undefined && unitAmount !== undefined && (
                <>
                  <Separator />
                  <SeatSelector
                    seats={seats}
                    setSeats={setSeats}
                    minSeats={pricing.enterprise.minSeats}
                  />
                </>
              )}

              {/* Prices render only when a real one was resolved for THIS
                  plan. An unresolved non-Pro plan has no amount at all, and
                  showing a placeholder (or, far worse, Pro's amount) is the
                  exact failure this page is being fixed for — so the summary
                  simply omits the figures and the unavailable state below
                  carries the whole message. The Pro path always resolves, so
                  it renders exactly as before, including when its price ID
                  is unset. */}
              {resolved && (
                <>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Billing in {currency}
                    {countryName ? ` for ${countryName}` : ""}
                  </p>

                  <Separator />

                  {/* Per-seat plans show the arithmetic, not just the
                      total: a buyer who cannot check "6 x $25 = $150" has to
                      take the number on faith, and the seat count is the one
                      input they chose themselves. Rendered only when this
                      resolution actually carries a quantity, so Pro's
                      summary is unchanged. */}
                  {quantity !== undefined && unitAmount !== undefined && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>
                        {quantity} users x {formatPrice(unitAmount, currency)}{" "}
                        per user
                      </span>
                      <span>{formatPrice(amount, currency)}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(amount, currency)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground text-sm">
                      <span>Tax</span>
                      <span>{formatPrice(0, currency)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>{formatPrice(amount, currency)}</span>
                  </div>

                  {/* This is a forward-looking promise to charge — it must
                      not appear when checkout is unavailable, or the page
                      says "we will bill you" and "we can't take your money"
                      in the same breath. The full explanation lives in the
                      right-hand panel; this column keeps only the figures,
                      which stay true (this IS what the plan costs) even
                      though we can't collect them right now. */}
                  {readiness !== "unavailable" && (
                    <div className="text-sm text-muted-foreground pt-2">
                      <p>
                        You will be charged{" "}
                        <span>{formatPrice(amount, currency)}</span> every{" "}
                        {cycle === "monthly" ? "month" : "year"}.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Deliberately just the button, in every readiness state —
                  including "unavailable", where subscribeLabel already
                  reads "Checkout unavailable" and subscribeReady is false.
                  The full explanation (reason, retry, support) lives once,
                  in the right-hand panel, where the reader is actually
                  looking; duplicating it here as a second Alert box would
                  put two competing messages on screen for one condition. */}
              <Button
                className="w-full"
                disabled={isProcessing || !subscribeReady}
                onClick={handleSubscribeClick}
              >
                {subscribeLabel}
              </Button>
            </CardContent>
          </Card>
        </div>
        {/* Payment Form — or, when checkout is unavailable, the ONE place
            that carries the full explanation. This panel is where the eye
            actually lands, so it must never be an empty card under a
            heading that promises a form we have nothing to mount into it. */}
        <Card className="md:col-span-2 ">
          {readiness === "unavailable" ? (
            <>
              <CardHeader>
                <CardTitle>Checkout unavailable</CardTitle>
                <CardDescription>
                  We can&apos;t open the payment form for this plan right now.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>We can&apos;t process this payment</AlertTitle>
                  <AlertDescription>
                    {CHECKOUT_UNAVAILABLE_MESSAGE}
                  </AlertDescription>
                </Alert>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => router.refresh()}>
                    Try again
                  </Button>
                  <Button variant="ghost" asChild>
                    <a href={CHECKOUT_SUPPORT_HREF}>Contact support</a>
                  </Button>
                </div>

                {/* Developer-only diagnostic. Gated on isNonProductionEnv
                    (see its definition above) so this can never render on a
                    real production deploy — a buyer must never see internal
                    configuration detail. Styled deliberately unlike the
                    customer-facing alert above (dashed border, monospace,
                    amber) so nobody mistakes one for the other. */}
                {isNonProductionEnv && unavailableReason && (
                  <div className="rounded-md border border-dashed border-amber-400 bg-amber-50 p-3 dark:border-amber-500/40 dark:bg-amber-500/10">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-400">
                      Dev diagnostic — hidden in production
                    </p>
                    <p className="mt-1.5 font-mono text-xs text-amber-900 break-words dark:text-amber-300">
                      {unavailableReason}
                    </p>
                    <p className="mt-1.5 font-mono text-xs text-amber-700 dark:text-amber-400/80">
                      tier={tier} provider={provider} cycle={cycle}
                    </p>
                  </div>
                )}
              </CardContent>
            </>
          ) : provider === "ASYNCPAY" ? (
            // AsyncPay never mounts anything into this page — its SDK opens
            // its own payment surface on top of the page instead of an
            // inline frame (see the module-level comment on
            // ASYNCPAY_WRAPPER_ID). So there is nothing to embed here; this
            // panel's only job is to tell the buyer what happens when they
            // press Subscribe (and, while `isProcessing`, that the payment
            // surface on screen IS the checkout — the page behind it is
            // deliberately idle, not stuck). Never names the processor —
            // same constraint as the rest of this page.
            <>
              <CardHeader>
                <CardTitle>
                  {isProcessing ? "Complete your payment" : "Secure checkout"}
                </CardTitle>
                <CardDescription>
                  {isProcessing
                    ? "Finish up in the secure payment window on this screen — we'll update this page automatically once you're done."
                    : "Pressing Subscribe opens a secure payment window right on this screen."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-4">
                {isProcessing ? (
                  // Deliberately not a fake progress bar — the page has no
                  // way to know how far along a buyer is inside the payment
                  // window, and a bar that isn't tied to real progress would
                  // be a lie. This only confirms the page is alive and
                  // waiting, which is the one true thing it knows.
                  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-4 py-12 text-center">
                    <Loader2
                      className="h-6 w-6 animate-spin text-muted-foreground"
                      aria-hidden="true"
                    />
                    <p className="max-w-xs text-sm text-muted-foreground">
                      Waiting for your payment to complete. It&apos;s safe to
                      leave this open — nothing else to do here for now.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                      <Lock
                        className="h-5 w-5 flex-none text-primary"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-sm font-medium">
                          Your details never touch this page
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Subscribe opens a secure payment window where you
                          enter your details directly.
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Accepted payment methods
                      </p>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 text-center">
                          <CreditCard
                            className="h-5 w-5 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <span>Card</span>
                        </div>
                        <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 text-center">
                          <Landmark
                            className="h-5 w-5 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <span>Bank transfer</span>
                        </div>
                        <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 text-center">
                          <Smartphone
                            className="h-5 w-5 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <span>USSD</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Second entry point for the SAME action as the Order
                    Summary's Subscribe button — placed here, below the
                    payment methods, because that's where the eye already is
                    after reading this panel. Deliberately calls
                    handleSubscribeClick directly (not a wrapper) so there is
                    exactly one code path for starting payment, and shares
                    every prop with the left button — disabled, label — so
                    it can never enable a click the left button would
                    refuse. Rendered unconditionally within this branch
                    (including while isProcessing, when it sits disabled
                    below the "waiting" state) rather than only in the
                    non-processing half, so a buyer who tabs down to it
                    always finds it in the same state as the primary button,
                    never absent then reappearing. */}
                <Button
                  className="w-full"
                  disabled={isProcessing || !subscribeReady}
                  onClick={handleSubscribeClick}
                >
                  {subscribeLabel}
                </Button>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle>Complete your subscription</CardTitle>
                <CardDescription>
                  Fill out your details and complete your subscription.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-4">
                <div
                  ref={setFrameEl}
                  className="space-y-5 checkout-frame w-full"
                  id="checkout-frame"
                />
                {/* A blank panel with no explanation was the reported bug.
                    Whatever the cause — SDK down, blocked by an extension,
                    network — the buyer gets something to act on. */}
                {frameStalled && !frameLoaded && (
                  <div className="rounded-lg border border-border p-5 text-center">
                    <p className="text-sm font-medium text-foreground">
                      The payment form didn&rsquo;t load.
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      This is usually a slow connection or a browser extension
                      blocking the payment provider.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={retryPaddleFrame}
                    >
                      Try again
                    </Button>
                  </div>
                )}
              </CardContent>
            </>
          )}
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
