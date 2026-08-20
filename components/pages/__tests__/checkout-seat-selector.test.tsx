// The team-size stepper used to live on /pricing's Enterprise card — see
// components/pages/__tests__/pricing-enterprise-card.test.tsx for the note
// on why it moved. It is now checkout.tsx's SeatSelector, rendered in the
// Order Summary above the computed total, and this file is where its
// interactive behaviour (default value, +/- buttons, min-disabled, typed
// validation, large-value confirmation) is pinned — moved, not deleted,
// from the old pricing-card tests.
//
// Enterprise has NO product maximum on team size (see the removed
// `ENTERPRISE_MAX_SEATS` in academy's tiers.ts) — there is deliberately no
// `maxSeats` prop on this component any more. What it still guards against
// is a TYPO: a non-integer, a value below the minimum, or a suspiciously
// large typed/pasted number (>= ENTERPRISE_SEAT_CONFIRM_THRESHOLD) held for
// one explicit confirmation click rather than applied silently.
//
// This tests the SeatSelector component directly rather than mounting the
// full CheckoutPage: CheckoutPage pulls in Paddle/AsyncPay SDK
// initialization, Sentry, and a zustand store, none of which this
// stepper's own behaviour depends on. The seats -> total arithmetic it
// drives is already covered end to end by
// lib/__tests__/checkout-plan-pricing.test.ts (resolveCheckoutPrice's
// 2-seat/10-seat/250-seat/monthly/annual/PPP-vs-GLOBAL cases).
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { SeatSelector } from "@/components/pages/checkout";
import { ENTERPRISE_SEAT_CONFIRM_THRESHOLD } from "@/lib/pricing";

/** Mounts SeatSelector with real, controlled state — same as CheckoutPage does. */
function renderSeatSelector({
  initialSeats = 2,
  minSeats = 2,
}: { initialSeats?: number; minSeats?: number } = {}) {
  function Harness() {
    const [seats, setSeats] = useState(initialSeats);
    return (
      <SeatSelector seats={seats} setSeats={setSeats} minSeats={minSeats} />
    );
  }
  return render(<Harness />);
}

describe("SeatSelector", () => {
  it("shows the seeded seat count", () => {
    renderSeatSelector({ initialSeats: 2 });
    expect(screen.getByLabelText(/team size/i)).toHaveValue(2);
  });

  it("steps up and down with the +/- buttons", () => {
    renderSeatSelector({ initialSeats: 2 });

    fireEvent.click(screen.getByLabelText(/add a seat/i));
    expect(screen.getByLabelText(/team size/i)).toHaveValue(3);

    fireEvent.click(screen.getByLabelText(/remove a seat/i));
    expect(screen.getByLabelText(/team size/i)).toHaveValue(2);
  });

  it("cannot be walked below the minimum — the minus button disables there", () => {
    renderSeatSelector({ initialSeats: 2, minSeats: 2 });
    expect(screen.getByLabelText(/remove a seat/i)).toBeDisabled();
  });

  it("has no maximum — the plus button never disables, even from a very large seed", () => {
    // Enterprise has no product ceiling; the stepper must never behave as
    // though one exists.
    renderSeatSelector({ initialSeats: 5000, minSeats: 2 });
    expect(screen.getByLabelText(/add a seat/i)).not.toBeDisabled();
  });

  it("rejects a typed value below the minimum — reverts, does not clamp up", () => {
    renderSeatSelector({ initialSeats: 2, minSeats: 2 });
    const input = screen.getByLabelText(/team size/i);

    fireEvent.change(input, { target: { value: "1" } });
    // Rejected outright: the field falls back to the last good value.
    expect(input).toHaveValue(2);
  });

  it("rejects a non-integer typed value", () => {
    renderSeatSelector({ initialSeats: 6, minSeats: 2 });
    const input = screen.getByLabelText(/team size/i);

    fireEvent.change(input, { target: { value: "4.5" } });
    expect(input).toHaveValue(6);
  });

  it("rejects non-numeric garbage", () => {
    renderSeatSelector({ initialSeats: 6, minSeats: 2 });
    const input = screen.getByLabelText(/team size/i);

    fireEvent.change(input, { target: { value: "abc" } });
    expect(input).toHaveValue(6);
  });

  it("re-clamps on blur so a half-typed value cannot be left sitting in the field", () => {
    renderSeatSelector({ initialSeats: 2, minSeats: 2 });
    const input = screen.getByLabelText(/team size/i);

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(input).toHaveValue(2);
  });

  it("applies an ordinary typed value immediately — no confirmation needed below the threshold", () => {
    renderSeatSelector({ initialSeats: 2, minSeats: 2 });
    const input = screen.getByLabelText(/team size/i);

    fireEvent.change(input, { target: { value: "42" } });
    expect(input).toHaveValue(42);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  // Not a cap: a typed/pasted value at or above the threshold is HELD, not
  // rejected — the buyer sees a confirmation step and can accept it exactly
  // as typed, however large.
  describe("large-value confirmation", () => {
    it("holds a value at or above the threshold instead of applying it immediately", () => {
      renderSeatSelector({ initialSeats: 2, minSeats: 2 });
      const input = screen.getByLabelText(/team size/i);

      fireEvent.change(input, {
        target: { value: String(ENTERPRISE_SEAT_CONFIRM_THRESHOLD) },
      });

      // The field shows the pending value (so the buyer can see what they
      // typed) but it has not been committed to `seats` yet.
      expect(input).toHaveValue(ENTERPRISE_SEAT_CONFIRM_THRESHOLD);
      expect(screen.getByRole("alert")).toHaveTextContent(
        ENTERPRISE_SEAT_CONFIRM_THRESHOLD.toLocaleString(),
      );
    });

    it("applies the value, exactly as typed, once confirmed — no cap on how large", () => {
      renderSeatSelector({ initialSeats: 2, minSeats: 2 });
      const input = screen.getByLabelText(/team size/i);
      const bigValue = ENTERPRISE_SEAT_CONFIRM_THRESHOLD * 50;

      fireEvent.change(input, { target: { value: String(bigValue) } });
      fireEvent.click(
        screen.getByRole("button", {
          name: new RegExp(`confirm.*${bigValue.toLocaleString()}`, "i"),
        }),
      );

      expect(input).toHaveValue(bigValue);
      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("reverts to the last good value when the confirmation is cancelled", () => {
      renderSeatSelector({ initialSeats: 6, minSeats: 2 });
      const input = screen.getByLabelText(/team size/i);

      fireEvent.change(input, {
        target: { value: String(ENTERPRISE_SEAT_CONFIRM_THRESHOLD) },
      });
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

      expect(input).toHaveValue(6);
      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("a value just below the threshold needs no confirmation", () => {
      renderSeatSelector({ initialSeats: 2, minSeats: 2 });
      const input = screen.getByLabelText(/team size/i);

      fireEvent.change(input, {
        target: { value: String(ENTERPRISE_SEAT_CONFIRM_THRESHOLD - 1) },
      });

      expect(input).toHaveValue(ENTERPRISE_SEAT_CONFIRM_THRESHOLD - 1);
      expect(screen.queryByRole("alert")).toBeNull();
    });
  });
});
