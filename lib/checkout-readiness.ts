// Pure decision logic for the checkout page's Subscribe button, split out so
// the readiness matrix is unit-testable without mounting CheckoutPage (see
// lib/__tests__/checkout-readiness.test.ts).
//
// The distinction that matters: a missing price ID is a PERMANENT condition
// (an unset PADDLE_PRICE_MONTHLY / ASYNCPAY_PLAN_MONTHLY_NGN env var on the
// backend — see academy's tiers.ts pricingForTier) that will never resolve
// on its own. An unresolved SDK is TRANSIENT — Paddle's CDN script or the
// AsyncPay chunk is still loading, and that normally clears within moments.
// These must never present identically to the buyer: "unavailable" needs an
// explicit "we can't take your money right now" state; "loading" is just
// loading.
export type CheckoutReadiness = "unavailable" | "loading" | "ready";

export function classifyCheckoutReadiness(params: {
  hasPriceId: boolean;
  sdkResolved: boolean;
}): CheckoutReadiness {
  if (!params.hasPriceId) return "unavailable";
  if (!params.sdkResolved) return "loading";
  return "ready";
}

/** Subscribe button label for each readiness state. */
export function checkoutSubscribeLabel(
  readiness: CheckoutReadiness,
  isProcessing: boolean,
): string {
  if (readiness === "unavailable") return "Checkout unavailable";
  if (readiness === "loading") return "Loading...";
  return isProcessing ? "Processing..." : "Subscribe";
}

// Deliberately generic: never names an env var or blames "configuration" to
// an end user — that's an internal detail the operator-facing report (see
// checkout.tsx's reportCheckoutUnavailable) carries instead.
export const CHECKOUT_UNAVAILABLE_MESSAGE =
  "Checkout is temporarily unavailable. Please try again shortly, or contact support if this continues.";
