// Client-safe pricing exports only. Nothing here may name a payment
// processor, read a processor env var, or make a network call — this module
// is imported by components/pages/pricing.tsx, a client component, and
// EVERY export here ships in the browser JS bundle, publicly readable.
//
// GLOBAL_FALLBACK and fetchPricing live in lib/pricing.server.ts instead —
// that module names "PADDLE" — and must only ever be imported from server
// components (app/pricing/page.tsx).

export interface RegionalPricing {
  tier: "NG" | "PPP" | "GLOBAL";
  country: string;
  provider: "ASYNCPAY" | "PADDLE";
  currency: "NGN" | "USD";
  monthly: number;
  annual: number;
  monthlyPriceId: string;
  annualPriceId: string;
  /**
   * Enterprise, nested — NOT flattened alongside Pro's fields. The two plans
   * are priced in different units: Pro's `monthly` is what one subscriber
   * pays, Enterprise's `monthlyPerUser` is what ONE SEAT costs and means
   * nothing until multiplied by a seat count. Nesting makes it impossible to
   * read one as the other, and keeps Pro's field names exactly where every
   * existing consumer already expects them.
   */
  enterprise: EnterprisePricing;
}

/**
 * Per-user Enterprise pricing for the region this request resolved to.
 * Mirrors the backend's EnterpriseTierPricing verbatim (academy's
 * src/extensions/payment/pricing/tiers.ts) — this is a wire type, not a
 * second opinion about pricing. Nothing in this repo may invent, adjust, or
 * default these amounts; the API is the only source.
 */
export interface EnterprisePricing {
  tier: RegionalPricing["tier"];
  provider: "ASYNCPAY" | "PADDLE";
  currency: "NGN" | "USD";
  /** ONE SEAT for one month, in major units. Never a team total. */
  monthlyPerUser: number;
  /** ONE SEAT for one year, in major units. Always 10x the monthly figure. */
  annualPerUser: number;
  /** Smallest team we sell to. 2 — a one-seat "team" is just Pro. */
  minSeats: number;
  /**
   * There is deliberately NO `maxSeats` field. Enterprise has no maximum
   * team size — see academy's tiers.ts, which used to publish
   * `ENTERPRISE_MAX_SEATS` and no longer does. The checkout seat selector
   * (components/pages/checkout.tsx's `SeatSelector`) still guards against a
   * fat-fingered or pasted value via `ENTERPRISE_SEAT_CONFIRM_THRESHOLD`
   * below, but that is a typo safeguard, not a ceiling: values above it are
   * confirmed, never rejected.
   */
  /**
   * Whether this region can complete a per-seat purchase without a human.
   * Decided ENTIRELY by the backend (see enterpriseSelfServe() in academy's
   * tiers.ts, which explains why one region cannot) — this repo reads the
   * flag and holds no country logic of its own. When the underlying
   * limitation lifts, nothing in this repo changes.
   */
  selfServe: boolean;
  monthlyPriceId: string;
  annualPriceId: string;
}

// The client never needs the payment processor's identity or its price IDs —
// Next.js serializes every prop passed to a client component into the RSC
// payload embedded in the raw HTML response, so a full RegionalPricing prop
// would put "PADDLE"/"ASYNCPAY" in the response even though nothing renders
// it. app/pricing/page.tsx strips those fields (see toPublicPricing) before
// PricingView ever sees them.
export type PublicPricing = Omit<
  RegionalPricing,
  "provider" | "monthlyPriceId" | "annualPriceId" | "enterprise"
> & { enterprise: PublicEnterprisePricing };

/**
 * The Enterprise half of the same strip. Nesting hid these from the original
 * Omit — `Omit<RegionalPricing, "provider">` does not reach inside
 * `enterprise`, so without this the processor name and Enterprise's price IDs
 * would have gone straight into the RSC payload the moment Enterprise pricing
 * started arriving from the API. app/pricing/page.tsx's toPublicPricing does
 * the actual stripping; lib/__tests__/pricing-page-props.test.ts pins it.
 */
export type PublicEnterprisePricing = Omit<
  EnterprisePricing,
  "provider" | "monthlyPriceId" | "annualPriceId"
>;

// Checkout is the one client surface that DOES need the processor identity
// and price IDs — it has to know which SDK to open and which price to hand
// it. `tier` is the only field nothing in checkout reads, so that's the only
// one app/checkout/page.tsx strips (see toCheckoutPricing) before handing
// pricing to the client component.
export type CheckoutPricing = Omit<RegionalPricing, "tier">;

/**
 * ── Enterprise seat maths ──────────────────────────────────────────────
 *
 * Enterprise is priced PER USER with a minimum team size, so every figure
 * the buyer sees is one of two things: a per-seat rate, or that rate times a
 * seat count. Both live here, pure and tested, because getting them wrong is
 * a money bug — and because /pricing (which quotes) and /checkout (which
 * charges) must compute them the same way or display and charge disagree.
 *
 * There is deliberately NO static price table in this file any more. The
 * amounts used to be mirrored here from the seeded plan channels; they now
 * come from the API on every request, and a stale mirror would be exactly
 * the drift the mirror was meant to prevent.
 */

/**
 * Per-seat amount for the billing cycle, in major units.
 *
 * This is the amount CHARGED per seat per cycle — the annual figure is the
 * full year's per-seat price (10x monthly), not a monthly slice of it. Use
 * `enterprisePerUserMonthlyDisplay` for the "per user /month billed
 * annually" line the card shows.
 */
export function enterprisePerUser(
  pricing: Pick<EnterprisePricing, "monthlyPerUser" | "annualPerUser">,
  cycle: "monthly" | "annual",
): number {
  return cycle === "annual" ? pricing.annualPerUser : pricing.monthlyPerUser;
}

/**
 * Adapts Enterprise's per-user amounts into the {monthly, annual, currency}
 * shape `monthlyEquivalent` and `tablePriceLine` already take, so the card
 * and the comparison table render Enterprise through exactly the same
 * formatting path as Pro rather than a parallel one that could drift.
 */
export function enterpriseDisplayAmounts(
  pricing: Pick<
    EnterprisePricing,
    "monthlyPerUser" | "annualPerUser" | "currency"
  >,
): Pick<RegionalPricing, "monthly" | "annual" | "currency"> {
  return {
    monthly: pricing.monthlyPerUser,
    annual: pricing.annualPerUser,
    currency: pricing.currency,
  };
}

/**
 * The big number on the Enterprise card: per user, per MONTH — on the annual
 * cycle that is the yearly seat price divided across twelve months, shown
 * with "billed annually" beneath it. Same treatment Pro gets, and the same
 * treatment the reference card uses ("$28 per user /month billed annually").
 */
export function enterprisePerUserMonthlyDisplay(
  pricing: Pick<
    EnterprisePricing,
    "monthlyPerUser" | "annualPerUser" | "currency"
  >,
  cycle: "monthly" | "annual",
): string {
  return monthlyEquivalent(enterpriseDisplayAmounts(pricing), cycle);
}

/**
 * Paddle's own upper bound on the `quantity` a price can be sold at — see
 * academy's scripts/provision-pricing.ts, which sets the Enterprise price's
 * `quantity.maximum` to this exact figure (the highest Paddle's create-price
 * API accepts; Paddle rejects anything past it with "Quantity maximum must
 * be equal to or lower than 999999999").
 *
 * This is NOT a product limit on team size — there is deliberately no
 * `maxSeats` anywhere in this codebase any more. It exists purely so
 * `resolveSeats`/`clampSeats` fail closed on a number Paddle's own price
 * object is guaranteed to refuse (e.g. a `?seats=` URL param edited by
 * hand), rather than opening a checkout call doomed to error. No real team
 * will ever approach it.
 */
export const PADDLE_MAX_QUANTITY = 999_999_999;

/**
 * A typed or pasted seat count at or above this many seats is held back by
 * the checkout seat selector for an explicit "are you sure?" confirmation
 * instead of being applied straight away. This is NOT a cap — nothing is
 * rejected, and confirming applies the value exactly as typed, however
 * large. It exists only to catch the fat-finger/paste-mishap case (an extra
 * digit, a pasted phone number) before it silently becomes a five- or
 * six-figure line item. 1,000 was chosen because it comfortably exceeds any
 * seat count a buyer would plausibly type by hand without a second thought,
 * while staying far below anything that would actually inconvenience a
 * genuinely large team — they simply click "confirm" once.
 */
export const ENTERPRISE_SEAT_CONFIRM_THRESHOLD = 1000;

/**
 * A seat count that is safe to charge for, or null.
 *
 * FAILS CLOSED, and that is the entire point: null is not "assume the
 * minimum" and never "assume 1". A checkout that cannot establish how many
 * seats it is selling must not take money — a wrong quantity is a wrong
 * charge, in the buyer's favour or ours, and both are the same defect.
 *
 * Rejects: absent, non-numeric, fractional, below `minSeats`, above
 * `PADDLE_MAX_QUANTITY` (Paddle's own technical ceiling, not a product
 * limit — see its comment). Numeric strings are accepted because this reads
 * a URL param.
 */
export function resolveSeats(
  raw: unknown,
  pricing: Pick<EnterprisePricing, "minSeats">,
): number | null {
  const seats =
    typeof raw === "number"
      ? raw
      : typeof raw === "string" && raw.trim() !== ""
        ? Number(raw)
        : NaN;
  if (!Number.isInteger(seats)) return null;
  if (seats < pricing.minSeats) return null;
  if (seats > PADDLE_MAX_QUANTITY) return null;
  return seats;
}

/**
 * Nudges a seat count into range instead of rejecting it. For the seat
 * SELECTOR only — a stepper must not be able to walk below the minimum, and
 * clamping there is friendly rather than dangerous because nothing is
 * charged yet. Never use this on the checkout path; `resolveSeats` is the
 * one that guards money. Upper bound is `PADDLE_MAX_QUANTITY`, Paddle's own
 * technical ceiling — not a product maximum, see that constant's comment.
 */
export function clampSeats(
  seats: number,
  pricing: Pick<EnterprisePricing, "minSeats">,
): number {
  if (!Number.isFinite(seats)) return pricing.minSeats;
  return Math.min(
    PADDLE_MAX_QUANTITY,
    Math.max(pricing.minSeats, Math.round(seats)),
  );
}

/**
 * What the team actually pays this cycle: seats x per-seat price.
 *
 * Returns null — never a number — when the seat count is unusable or the
 * per-seat price is missing/zero/negative. Callers must render nothing and
 * charge nothing in that case. Returning a "best effort" total here is the
 * single most dangerous thing this module could do.
 */
export function enterpriseTotal(
  pricing: Pick<
    EnterprisePricing,
    "monthlyPerUser" | "annualPerUser" | "minSeats"
  >,
  cycle: "monthly" | "annual",
  seats: unknown,
): number | null {
  const resolvedSeats = resolveSeats(seats, pricing);
  if (resolvedSeats === null) return null;

  const perUser = enterprisePerUser(pricing, cycle);
  if (!Number.isFinite(perUser) || perUser <= 0) return null;

  // Currency-safe multiply: $15 x 3 in binary floats is 45.00000000000001.
  // Round to minor units, multiply as integers, convert back.
  return Math.round(perUser * 100) * resolvedSeats / 100;
}

/**
 * `currency` is a plain ISO 4217 code, not the narrow "NGN" | "USD" union
 * every other price on this site happens to use. Team seat pricing goes
 * through Paddle's currency localization, which can preview a USD-priced
 * plan in a third currency entirely (e.g. INR) depending on the buyer's
 * location — so the seat-preview call site (components/team/invite-dialog.tsx)
 * needs to format whatever code the API actually returned. Widening this
 * signature is strictly additive: every existing caller already passes a
 * "NGN" | "USD" literal or variable, which is still a valid `string`.
 *
 * Because `currency` is now an arbitrary string instead of a two-member
 * union, it can be malformed or missing in a way the type system no longer
 * catches — `Intl.NumberFormat` throws a `RangeError` on an invalid ISO
 * code, and every existing caller of this function is inside render, so an
 * uncaught throw here would white-screen the page, not just misprint a
 * price. A bad/missing code degrades to the plain number (no symbol) rather
 * than taking the page down — a wrong-looking price is recoverable, a
 * crashed dialog is not.
 */
export function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      // WITHOUT narrowSymbol, en-US renders NGN as the ISO code — "NGN 9,999"
      // instead of "₦9,999". Verified in Node: the default currencyDisplay only
      // uses a glyph for currencies the locale considers local. Do not remove.
      currencyDisplay: "narrowSymbol",
      // Naira prices are whole numbers; showing ₦9,999.00 reads like a
      // conversion artifact rather than a price.
      minimumFractionDigits: currency === "NGN" ? 0 : 2,
      maximumFractionDigits: currency === "NGN" ? 0 : 2,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}

/**
 * Annual price shown as its per-month equivalent — "₦8,333 /mo billed
 * annually" reads cheaper than the monthly plan, which is the entire reason
 * annual converts. Rounding is the formatter's (₦99,990/12 = ₦8,332.50 → ₦8,333).
 */
export function monthlyEquivalent(
  pricing: Pick<RegionalPricing, "monthly" | "annual" | "currency">,
  cycle: "monthly" | "annual",
): string {
  const amount =
    cycle === "annual" ? pricing.annual / 12 : pricing.monthly;
  return formatPrice(amount, pricing.currency);
}
