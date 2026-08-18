// The team-size stepper used to live on /pricing's Enterprise card — see
// components/pages/__tests__/pricing-enterprise-card.test.tsx for the note
// on why it moved. It is now checkout.tsx's SeatSelector, rendered in the
// Order Summary above the computed total, and this file is where its
// interactive behaviour (default value, +/- buttons, min-disabled, typed
// clamping) is pinned — moved, not deleted, from the old pricing-card
// tests.
//
// This tests the SeatSelector component directly rather than mounting the
// full CheckoutPage: CheckoutPage pulls in Paddle/AsyncPay SDK
// initialization, Sentry, and a zustand store, none of which this
// stepper's own behaviour depends on. The seats -> total arithmetic it
// drives is already covered end to end by
// lib/__tests__/checkout-plan-pricing.test.ts (resolveCheckoutPrice's
// 2-seat/10-seat/monthly/annual/PPP-vs-GLOBAL cases).
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { SeatSelector } from "@/components/pages/checkout";

/** Mounts SeatSelector with real, controlled state — same as CheckoutPage does. */
function renderSeatSelector({
  initialSeats = 2,
  minSeats = 2,
  maxSeats = 100,
}: { initialSeats?: number; minSeats?: number; maxSeats?: number } = {}) {
  function Harness() {
    const [seats, setSeats] = useState(initialSeats);
    return (
      <SeatSelector
        seats={seats}
        setSeats={setSeats}
        minSeats={minSeats}
        maxSeats={maxSeats}
      />
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

  it("cannot be walked above the maximum — the plus button disables there", () => {
    renderSeatSelector({ initialSeats: 100, maxSeats: 100 });
    expect(screen.getByLabelText(/add a seat/i)).toBeDisabled();
  });

  it("clamps a typed value below the minimum back up to it", () => {
    renderSeatSelector({ initialSeats: 2, minSeats: 2, maxSeats: 100 });
    const input = screen.getByLabelText(/team size/i);

    fireEvent.change(input, { target: { value: "1" } });
    expect(input).toHaveValue(2);
  });

  it("clamps a typed value above the maximum back down to it", () => {
    renderSeatSelector({ initialSeats: 2, minSeats: 2, maxSeats: 100 });
    const input = screen.getByLabelText(/team size/i);

    fireEvent.change(input, { target: { value: "999" } });
    expect(input).toHaveValue(100);
  });

  it("re-clamps on blur so a half-typed value cannot be left sitting in the field", () => {
    renderSeatSelector({ initialSeats: 2, minSeats: 2, maxSeats: 100 });
    const input = screen.getByLabelText(/team size/i);

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(input).toHaveValue(2);
  });
});
