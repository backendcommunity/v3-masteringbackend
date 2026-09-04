import { describe, it, expect } from "vitest";
import { nextFrameAction } from "@/lib/checkout-frame";

/**
 * These cases are the mischarge, stated as tests.
 *
 * Before this decision was extracted, the checkout effect compared the open
 * frame against `priceId` alone. A seat change therefore did nothing, and a
 * buyer could pay for 2 seats while the summary in front of them said 8.
 */
describe("nextFrameAction", () => {
  it("opens when nothing is open yet", () => {
    expect(nextFrameAction(null, "pri_ent", 2, false)).toBe("open");
  });

  it("does nothing without a resolved price", () => {
    expect(nextFrameAction(null, "", 2, false)).toBe("none");
  });

  it("does nothing when the frame already shows this price and seat count", () => {
    expect(
      nextFrameAction({ priceId: "pri_ent", quantity: 5 }, "pri_ent", 5, false),
    ).toBe("none");
  });

  // THE regression. A seat change must reach Paddle.
  it("updates the open frame when only the seat count changed", () => {
    expect(
      nextFrameAction({ priceId: "pri_ent", quantity: 2 }, "pri_ent", 8, false),
    ).toBe("update");
  });

  it("updates on the way down as well as up", () => {
    expect(
      nextFrameAction({ priceId: "pri_ent", quantity: 8 }, "pri_ent", 3, false),
    ).toBe("update");
  });

  // A cycle switch swaps the price id: a different product, so a new checkout.
  it("reopens when the price changes, carrying the current seat count", () => {
    expect(
      nextFrameAction(
        { priceId: "pri_ent_monthly", quantity: 4 },
        "pri_ent_annual",
        4,
        false,
      ),
    ).toBe("open");
  });

  // Paddle rejects item changes on a transaction in flight, silently. The
  // seat control is frozen for that window; this is the belt to that braces.
  it("pushes nothing while a payment is in flight", () => {
    expect(
      nextFrameAction({ priceId: "pri_ent", quantity: 2 }, "pri_ent", 9, true),
    ).toBe("none");
  });

  // A price change mid-payment cannot be silently swallowed the way a seat
  // change is: there is no valid checkout for it, so it reopens.
  it("still reopens on a price change during a payment", () => {
    expect(
      nextFrameAction({ priceId: "pri_a", quantity: 2 }, "pri_b", 2, true),
    ).toBe("open");
  });
});
