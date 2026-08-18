// Pure plan-to-price resolution for /checkout, split out of
// components/pages/checkout.tsx so the money path is unit-testable without
// mounting the page (see lib/__tests__/checkout-plan-pricing.test.ts) —
// same pattern as lib/pro-cta.ts and lib/subscription-pricing.ts.
//
// WHY THIS EXISTS
// ---------------
// Regional pricing made /checkout derive its entire price, currency,
// provider and price ID from ONE region-resolved object. That object is the
// **Pro** resolver's output (see lib/pricing.server.ts's fetchPricing), so
// any other plan arriving as `?plan=<something-else>` was billed the
// regional PRO amount — an Enterprise buyer paying $19.99 (or ₦9,999 in
// Nigeria) for a $99.99 plan. This module restores the pre-regional
// mechanism for non-Pro plans — the plan's own record, fetched by name via
// the app store's `getPlan`, priced from its own `paymentChannels` row —
// while leaving the Pro path byte-for-byte on the regional object.
//
// THE INVARIANT
// -------------
// A non-Pro plan NEVER falls back to regional pricing. If its own price or
// price ID cannot be resolved, this returns "unavailable" and the page
// renders its existing unavailable state. Charging a resolvable-but-wrong
// amount is exactly the failure being eliminated here; a fallback would
// reintroduce it.

import type { PaymentChannel, Plan } from "@/lib/data";
import type { CheckoutPricing } from "@/lib/pricing";

/** The `?plan=` value that means "the regionally-tiered Pro plan". */
export const PRO_PLAN_SLUG = "pro";

/**
 * Non-Pro plans are billed globally in USD — deliberately NOT regionally
 * tiered (see the same decision recorded on ENTERPRISE_PRICING in
 * lib/pricing.ts and on the Enterprise card in
 * components/pages/subscription-plans.tsx). The USD channel is the one
 * named PADDLE in the backend's PaymentChannel rows, so that is the channel
 * this resolver reads. The seed also provisions an NGN ASYNCPAY channel for
 * Enterprise; it is intentionally unused, because using it would make
 * Enterprise region-priced, which is the opposite of the product decision.
 *
 * Internal identifier only — never rendered. No user-visible string in this
 * codebase names a payment processor.
 */
export const GLOBAL_USD_CHANNEL = "PADDLE";

export interface ResolvedCheckoutPrice {
  /** The amount the buyer is actually charged, in `currency`. */
  amount: number;
  currency: "NGN" | "USD";
  /** Which SDK the page must open. */
  provider: "ASYNCPAY" | "PADDLE";
  /**
   * The processor-side price identifier handed to the SDK. May be "" only
   * on the Pro path, where an unset ID is an already-handled, already-tested
   * condition (see lib/checkout-readiness.ts). Non-Pro resolutions with no
   * usable ID come back as "unavailable" instead, never as a resolved price.
   */
  priceId: string;
  /**
   * True only for the region-tiered Pro path. The page uses this to decide
   * whether it may claim the price is specific to the visitor's country.
   */
  regional: boolean;
}

export type CheckoutPriceResolution =
  /** Safe to show a price and to take money. */
  | { status: "resolved"; price: ResolvedCheckoutPrice }
  /** The plan record hasn't come back yet. Show no price, take no money. */
  | { status: "pending" }
  /** Permanently unresolvable. `reason` is operator-facing, never rendered. */
  | { status: "unavailable"; reason: string };

/**
 * Whether this checkout is the regionally-tiered Pro plan. `?plan=` absent
 * means Pro — that has always been the default and several CTAs rely on it.
 */
export function isProCheckout(checkoutId: string | null | undefined): boolean {
  const id = (checkoutId ?? PRO_PLAN_SLUG).trim().toLowerCase();
  return id === "" || id === PRO_PLAN_SLUG;
}

/**
 * The backend serializes PaymentChannel.channel as a string ("PADDLE" /
 * "ASYNCPAY"); the local TS mirror types it as a numeric enum. Normalizing
 * through String() keeps this correct for the wire shape without depending
 * on the enum's numbering — the same assumption the pre-regional checkout
 * made when it matched channels by name.
 */
function channelName(channel: PaymentChannel): string {
  return String(channel?.channel ?? "")
    .trim()
    .toUpperCase();
}

/**
 * A price is only billable if it is a finite number greater than zero.
 * Rejecting 0/NaN/null here is deliberate: a zero would otherwise sail
 * through as a "successful" resolution and hand the buyer a free plan.
 * Numeric strings are accepted because JSON price fields have arrived that
 * way from decimal columns before.
 */
function toBillableAmount(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
}

function toPriceId(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export interface ResolveCheckoutPriceInput {
  /** Raw `?plan=` value from the URL. */
  checkoutId: string | null | undefined;
  /** Raw `?cycle=` value from the URL; anything but "annual" is monthly. */
  cycle: string | null | undefined;
  /** The region-resolved PRO pricing object. Only used for the Pro path. */
  pricing: Pick<
    CheckoutPricing,
    "provider" | "currency" | "monthly" | "annual" | "monthlyPriceId" | "annualPriceId"
  >;
  /** The plan record fetched by name. Only used for the non-Pro path. */
  plan: Plan | null | undefined;
  /** False until the plan fetch has settled (resolved OR failed). */
  planResolved: boolean;
}

/**
 * Resolves what the buyer is actually charged for the plan they asked for.
 *
 * Pro keeps exactly the regional behaviour: price, currency, provider and
 * price ID all come from `pricing`, including the "" price ID case that the
 * readiness classifier already handles. Every other plan is priced from its
 * own record, with no path back to the regional numbers.
 */
export function resolveCheckoutPrice(
  input: ResolveCheckoutPriceInput,
): CheckoutPriceResolution {
  const isAnnual = input.cycle === "annual";

  // ---- Pro: unchanged regional behaviour -------------------------------
  if (isProCheckout(input.checkoutId)) {
    const { pricing } = input;
    return {
      status: "resolved",
      price: {
        amount: isAnnual ? pricing.annual : pricing.monthly,
        currency: pricing.currency,
        provider: pricing.provider,
        priceId: isAnnual ? pricing.annualPriceId : pricing.monthlyPriceId,
        regional: true,
      },
    };
  }

  // ---- Everything else: the plan's own record --------------------------
  const label = (input.checkoutId ?? "").trim() || "(unnamed)";

  // Still in flight. NOT "unavailable" (that's a permanent condition) and
  // emphatically not a reason to reach for the regional numbers.
  if (!input.planResolved) return { status: "pending" };

  const plan = input.plan;
  if (!plan) {
    return {
      status: "unavailable",
      reason: `no plan record returned for plan="${label}"`,
    };
  }

  const channels = Array.isArray(plan.paymentChannels)
    ? plan.paymentChannels
    : [];
  const channel = channels.find((pc) => channelName(pc) === GLOBAL_USD_CHANNEL);
  if (!channel) {
    return {
      status: "unavailable",
      reason: `plan="${label}" has no ${GLOBAL_USD_CHANNEL} payment channel`,
    };
  }

  const amount = toBillableAmount(
    isAnnual ? channel.originalYearlyPrice : channel.originalMonthlyPrice,
  );
  if (amount === null) {
    return {
      status: "unavailable",
      reason: `plan="${label}" has no billable ${isAnnual ? "annual" : "monthly"} price`,
    };
  }

  const priceId = toPriceId(
    isAnnual ? channel.yearlyPlanId : channel.monthlyPlanId,
  );
  if (priceId === null) {
    return {
      status: "unavailable",
      reason: `plan="${label}" has no ${isAnnual ? "annual" : "monthly"} price ID`,
    };
  }

  return {
    status: "resolved",
    price: {
      amount,
      currency: "USD",
      provider: GLOBAL_USD_CHANNEL,
      priceId,
      regional: false,
    },
  };
}
