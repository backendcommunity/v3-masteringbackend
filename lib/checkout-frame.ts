/**
 * What the open Paddle frame should be told next.
 *
 * ── Why this is a function and not three `if`s in an effect ───────────────
 *
 * The bug this exists to prevent was one line of comparison inside that
 * effect: `if (openedForRef.current === priceId) return;`. Since `priceId`
 * does not change when the buyer changes the seat count, a seat change
 * matched that guard and returned — updating our order summary and never
 * telling Paddle. The page could read "8 users x $25.00 = $200.00" while the
 * frame the buyer was about to pay in was still priced for 2 seats.
 *
 * Pulling the decision out means the three cases can be stated once, read at
 * a glance, and pinned by tests that do not need a Paddle SDK, a store, or a
 * mounted checkout page.
 */
export interface OpenFrame {
  priceId: string;
  quantity: number;
}

export type FrameAction = "none" | "open" | "update";

export function nextFrameAction(
  open: OpenFrame | null,
  priceId: string,
  quantity: number,
  paymentInFlight: boolean,
): FrameAction {
  // Nothing to show yet. resolveCheckoutPrice returns no price id when the
  // plan or the seat count cannot be charged, and opening on that would put
  // an empty frame in front of the buyer.
  if (!priceId) return "none";

  // Nothing open: this is the first paint, or a retry after a stall.
  if (!open) return "open";

  // A different price is a different product — an annual/monthly switch, or
  // a different plan. Paddle needs a new checkout, not an amended one.
  if (open.priceId !== priceId) return "open";

  // Same price, same seats: the ordinary re-render.
  if (open.quantity === quantity) return "none";

  // Same price, new seat count. Paddle refuses item changes on a transaction
  // it is already processing, and refuses them silently — so during that
  // window the seat control is frozen and nothing is pushed. Outside it, the
  // open frame is updated in place rather than reopened, which keeps card
  // details the buyer has already typed.
  if (paymentInFlight) return "none";
  return "update";
}
