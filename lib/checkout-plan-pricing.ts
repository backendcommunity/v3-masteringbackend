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
// A non-Pro plan is still REGION-PRICED: it just reads its own record
// instead of Pro's. The plan's `paymentChannels` hold one row per region
// (naira and USD), so the channel is selected by the region the request
// already resolved to. Routing a buyer to the other region's channel while
// a working one exists is the same class of bug as billing them Pro's
// amount.
//
// ENTERPRISE IS DIFFERENT AGAIN
// -----------------------------
// Enterprise is now sold PER USER with a minimum team size, and its prices
// come from the SAME region-resolved pricing object Pro's do (the nested
// `enterprise` block, see lib/pricing.ts) — NOT from the plan record's
// payment channels. Those seeded channels hold the superseded flat amounts
// ($99.99/mo, ₦150,000/mo) and must never be charged again; reading them
// would resurrect exactly the pricing this change replaces. Enterprise gets
// its own branch below, before the generic plan-record path, so it can
// never fall through to them.
//
// THE INVARIANT
// -------------
// A non-Pro plan NEVER falls back to Pro's regional numbers, and never
// falls back to the OTHER region's channel. If the region-appropriate
// channel, its price, or its price ID cannot be resolved, this returns
// "unavailable" and the page renders its existing unavailable state.
// Charging (or displaying) a resolvable-but-wrong amount or currency is
// exactly the failure being eliminated here; either fallback would
// reintroduce it.

import type { PaymentChannel, Plan } from "@/lib/data";
import type { CheckoutPricing } from "@/lib/pricing";
import { enterprisePerUser, enterpriseTotal, resolveSeats } from "@/lib/pricing";

/** The `?plan=` value that means "the regionally-tiered Pro plan". */
export const PRO_PLAN_SLUG = "pro";

/** The `?plan=` value that means "the per-user, per-seat Enterprise plan". */
export const ENTERPRISE_PLAN_SLUG = "enterprise";

/**
 * The backend seeds every sellable plan with BOTH channels — the naira one
 * and the USD one — each carrying its own prices and its own provider-side
 * price IDs for sandbox and production (see academy's prisma/seed.ts: the
 * Enterprise block provisions ASYNCPAY at ₦150,000/mo, ₦1,500,000/yr
 * alongside PADDLE at $99.99/mo, $999.99/yr). A non-Pro plan is therefore
 * region-priced in exactly the same way Pro is, and this resolver picks the
 * channel that matches the visitor's resolved region.
 *
 * These are the channel names as the backend serializes
 * PaymentChannel.channel. Internal identifiers only — never rendered. No
 * user-visible string in this codebase names a payment processor.
 */
export const GLOBAL_USD_CHANNEL = "PADDLE";
export const NGN_CHANNEL = "ASYNCPAY";

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
   * True when this price was selected for the visitor's resolved region —
   * which is now every resolved price, Pro from the regional object and
   * every other plan from its region-matched channel. The page uses this to
   * decide whether it may claim the price is specific to the visitor's
   * country; it is still absent (via `resolved?.regional`) whenever nothing
   * resolved at all.
   */
  regional: boolean;
  /**
   * Seat count handed to the processor as the line item's `quantity`.
   *
   * Present ONLY for per-seat plans. Absent means "one of this thing", which
   * is every non-seat plan including Pro — deliberately absent rather than
   * `1`, so Pro's resolution is byte-for-byte what it always was and no
   * existing assertion about it changes meaning.
   */
  quantity?: number;
  /**
   * Price of ONE seat, when `quantity` is present. `amount` is already
   * quantity x this; keeping the unit alongside it lets the order summary
   * show the buyer the arithmetic ("6 seats x $25") instead of a bare total
   * they cannot check.
   */
  unitAmount?: number;
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
 * Whether this checkout is the per-seat Enterprise plan. Unlike Pro, an
 * absent `?plan=` is NEVER Enterprise — a plan that charges per seat must be
 * asked for explicitly.
 */
export function isEnterpriseCheckout(
  checkoutId: string | null | undefined,
): boolean {
  return (checkoutId ?? "").trim().toLowerCase() === ENTERPRISE_PLAN_SLUG;
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

/**
 * Which payment channel a visitor in this region buys through, and the
 * currency that channel charges in.
 *
 * The region signal is the one the pricing resolver already computed:
 * `provider`. The backend's tier table (academy's
 * src/extensions/payment/pricing/tiers.ts) maps the NG tier to ASYNCPAY/NGN
 * and both PPP and GLOBAL to PADDLE/USD, so reading `provider` here is
 * reading the same regional decision Pro's branch bills from verbatim — no
 * second, drift-prone country list in the frontend.
 *
 * Currency is derived from the CHANNEL, not copied from the Pro object: the
 * amount being returned comes off that channel's row, so its currency has
 * to be the channel's own or display and charge could disagree.
 */
function channelForRegion(pricing: Pick<CheckoutPricing, "provider">): {
  channel: string;
  currency: "NGN" | "USD";
  provider: "ASYNCPAY" | "PADDLE";
} {
  return pricing.provider === "ASYNCPAY"
    ? { channel: NGN_CHANNEL, currency: "NGN", provider: "ASYNCPAY" }
    : { channel: GLOBAL_USD_CHANNEL, currency: "USD", provider: "PADDLE" };
}

export interface ResolveCheckoutPriceInput {
  /** Raw `?plan=` value from the URL. */
  checkoutId: string | null | undefined;
  /** Raw `?cycle=` value from the URL; anything but "annual" is monthly. */
  cycle: string | null | undefined;
  /**
   * The region-resolved PRO pricing object. The Pro path is priced straight
   * off it; every other path reads only its `provider` — the resolver's own
   * decision about which processor this visitor pays through — to pick the
   * matching channel on the plan's own record.
   */
  pricing: Pick<
    CheckoutPricing,
    | "provider"
    | "currency"
    | "monthly"
    | "annual"
    | "monthlyPriceId"
    | "annualPriceId"
    | "enterprise"
  >;
  /** The plan record fetched by name. Only used for the non-Pro path. */
  plan: Plan | null | undefined;
  /** False until the plan fetch has settled (resolved OR failed). */
  planResolved: boolean;
  /**
   * Raw `?seats=` value from the URL. Per-seat plans only. Left unvalidated
   * on the way in on purpose — `resolveSeats` is the single gate, so there
   * is exactly one place that decides whether a seat count may be charged.
   */
  seats?: string | number | null;
}

/**
 * Resolves what the buyer is actually charged for the plan they asked for.
 *
 * Pro keeps exactly the regional behaviour: price, currency, provider and
 * price ID all come from `pricing`, including the "" price ID case that the
 * readiness classifier already handles. Every other plan is priced from its
 * own record — from the channel matching the SAME resolved region — with no
 * path back to Pro's numbers and none to the other region's channel.
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

  // ---- Enterprise: per user, per seat ----------------------------------
  //
  // Priced entirely off the region-resolved `enterprise` block. Never off
  // the plan record (whose seeded channels hold the superseded flat prices),
  // and never off Pro. Every failure below returns "unavailable" — there is
  // no branch here that produces a number when any input is in doubt,
  // because the only wrong-but-plausible total is worse than no total.
  if (isEnterpriseCheckout(input.checkoutId)) {
    const enterprise = input.pricing.enterprise;
    if (!enterprise) {
      return {
        status: "unavailable",
        reason: "no enterprise pricing in the region-resolved pricing object",
      };
    }

    // ══ THE NG BRANCH, frontend side — one condition, no country logic ══
    //
    // `selfServe` is computed once, in the backend's tier table, from
    // whether that region's payment provider can accept a seat QUANTITY at
    // all (see enterpriseSelfServe() in academy's
    // src/extensions/payment/pricing/tiers.ts, which documents exactly which
    // SDK cannot and why). This repo does not know or care which region that
    // is — it reads the flag.
    //
    // A region that cannot be charged per seat must not reach a checkout at
    // all: the pricing page routes it to sales instead, and this stops the
    // hand-typed URL, the stale bookmark and the shared link. The
    // alternative — opening a checkout that charges one seat, or a flat
    // amount, or the old price — is the precise failure this whole branch
    // exists to prevent.
    if (!enterprise.selfServe) {
      return {
        status: "unavailable",
        reason:
          "enterprise is sales-led in this region — its provider cannot bill a seat quantity",
      };
    }

    // No seat count, a fractional one, one below the minimum team size, or
    // above Paddle's own technical quantity ceiling (there is no product
    // maximum — see PADDLE_MAX_QUANTITY in lib/pricing.ts): all the same
    // answer. Not "assume the minimum" — a checkout that guesses how many
    // seats it is selling is a checkout that charges the wrong amount.
    const seats = resolveSeats(input.seats, enterprise);
    if (seats === null) {
      return {
        status: "unavailable",
        reason: `enterprise checkout has no usable seat count (got ${JSON.stringify(input.seats)}; need an integer >= ${enterprise.minSeats})`,
      };
    }

    const unitAmount = enterprisePerUser(enterprise, isAnnual ? "annual" : "monthly");
    const amount = enterpriseTotal(
      enterprise,
      isAnnual ? "annual" : "monthly",
      seats,
    );
    if (amount === null) {
      return {
        status: "unavailable",
        reason: `enterprise has no billable ${isAnnual ? "annual" : "monthly"} per-user price`,
      };
    }

    const enterprisePriceId = toPriceId(
      isAnnual ? enterprise.annualPriceId : enterprise.monthlyPriceId,
    );
    if (enterprisePriceId === null) {
      return {
        status: "unavailable",
        reason: `enterprise has no ${isAnnual ? "annual" : "monthly"} price ID`,
      };
    }

    return {
      status: "resolved",
      price: {
        // The TOTAL — seats x per-seat price. What the buyer is shown and
        // what the processor charges, computed once, here.
        amount,
        currency: enterprise.currency,
        provider: enterprise.provider,
        priceId: enterprisePriceId,
        regional: true,
        // The processor multiplies the per-seat price by this. `amount`
        // above is the same multiplication done locally so the page can show
        // the total BEFORE the buyer pays; if the two ever disagree, this
        // module is where they were computed together.
        quantity: seats,
        unitAmount,
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
  // The region-appropriate channel, and ONLY that one. No `?? channels[0]`,
  // no "fall back to the USD row" — either this region's channel is present
  // and billable or the checkout is unavailable.
  const region = channelForRegion(input.pricing);
  const channel = channels.find((pc) => channelName(pc) === region.channel);
  if (!channel) {
    return {
      status: "unavailable",
      reason: `plan="${label}" has no ${region.channel} payment channel`,
    };
  }

  const amount = toBillableAmount(
    isAnnual ? channel.originalYearlyPrice : channel.originalMonthlyPrice,
  );
  if (amount === null) {
    return {
      status: "unavailable",
      reason: `plan="${label}" ${region.channel} channel has no billable ${isAnnual ? "annual" : "monthly"} price`,
    };
  }

  const priceId = toPriceId(
    isAnnual ? channel.yearlyPlanId : channel.monthlyPlanId,
  );
  if (priceId === null) {
    return {
      status: "unavailable",
      reason: `plan="${label}" ${region.channel} channel has no ${isAnnual ? "annual" : "monthly"} price ID`,
    };
  }

  return {
    status: "resolved",
    price: {
      amount,
      // Both from the channel this region buys through — never mixed with
      // the other region's currency or the Pro object's.
      currency: region.currency,
      provider: region.provider,
      priceId,
      regional: true,
    },
  };
}
