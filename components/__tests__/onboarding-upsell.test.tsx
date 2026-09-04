import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OnboardingUpsell } from "@/components/onboarding/onboarding-upsell";
import type { PublicPricing } from "@/lib/pricing";

// The component falls back to its own fetch when no pricing prop is given.
// Stubbing the hook keeps that path deterministic (and off the network) so
// the "still loading" case can be asserted rather than raced.
const usePricing = vi.fn(
  (_enabled?: boolean) => null as PublicPricing | null,
);
vi.mock("@/hooks/use-pricing", () => ({
  usePricing: (enabled?: boolean) => usePricing(enabled),
}));

const ngPricing: PublicPricing = {
  tier: "NG",
  country: "NG",
  currency: "NGN",
  monthly: 9999,
  annual: 99990,
  enterprise: {
    tier: "NG",
    currency: "NGN",
    monthlyPerUser: 15000,
    annualPerUser: 150000,
    minSeats: 2,
    selfServe: false,
  },
};

const usPricing: PublicPricing = {
  ...ngPricing,
  tier: "GLOBAL",
  country: "US",
  currency: "USD",
  monthly: 15,
  annual: 150,
};

const noop = () => {};

describe("OnboardingUpsell", () => {
  it("names the path the learner was just enrolled in", () => {
    render(
      <OnboardingUpsell
        pathTitle="Backend Engineering"
        pricing={ngPricing}
        onGoPro={noop}
        onSkip={noop}
      />,
    );
    // The copy uses a typographic apostrophe (&rsquo;), so match around it.
    expect(
      screen.getByText(/set up for Backend Engineering/i),
    ).toBeInTheDocument();
  });

  it("shows naira to a Nigerian visitor, with the cadence beside it", () => {
    render(
      <OnboardingUpsell
        pathTitle="Backend Engineering"
        pricing={ngPricing}
        onGoPro={noop}
        onSkip={noop}
      />,
    );
    expect(screen.getByText("₦9,999")).toBeInTheDocument();
    // The cadence sits on the price's baseline; the annual alternative is
    // deliberately gone, so this step quotes exactly one number.
    expect(screen.getByText("per month")).toBeInTheDocument();
    expect(screen.queryByText(/a year/)).not.toBeInTheDocument();
    expect(screen.queryByText(/months free/)).not.toBeInTheDocument();
  });

  it("shows dollars to a global visitor — the same component, no branch of its own", () => {
    render(
      <OnboardingUpsell
        pathTitle="Backend Engineering"
        pricing={usPricing}
        onGoPro={noop}
        onSkip={noop}
      />,
    );
    expect(screen.getByText("$15.00")).toBeInTheDocument();
    expect(screen.getByText("per month")).toBeInTheDocument();
    expect(screen.queryByText(/a year/)).not.toBeInTheDocument();
  });

  it("renders NO price at all while pricing is still resolving — never a guessed currency", () => {
    usePricing.mockReturnValueOnce(null);
    render(
      <OnboardingUpsell pathTitle="Backend Engineering" onGoPro={noop} onSkip={noop} />,
    );
    // The CTA is present, so the card is up; the price simply isn't there yet.
    expect(screen.getByRole("button", { name: "Go Pro" })).toBeInTheDocument();
    expect(screen.queryByText(/₦/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/per month/)).not.toBeInTheDocument();
  });

  it("keeps the free exit reachable and calls back on both actions", () => {
    const onGoPro = vi.fn();
    const onSkip = vi.fn();
    render(
      <OnboardingUpsell
        pathTitle="Backend Engineering"
        pricing={ngPricing}
        onGoPro={onGoPro}
        onSkip={onSkip}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Go Pro" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with the free plan" }),
    );
    expect(onGoPro).toHaveBeenCalledTimes(1);
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("disables both actions while a navigation is already in flight", () => {
    render(
      <OnboardingUpsell
        pathTitle="Backend Engineering"
        pricing={ngPricing}
        onGoPro={noop}
        onSkip={noop}
        busy
      />,
    );
    expect(screen.getByRole("button", { name: "Go Pro" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Continue with the free plan" }),
    ).toBeDisabled();
  });
});

/**
 * Regression: clicking "Go Pro" on the onboarding payment step navigated to
 * /checkout instead of opening the payment sheet.
 *
 * Two fetches were in play. The wizard held the pricing that `subscribe()`
 * charges against; this card fetched its OWN copy in parallel and enabled the
 * CTA the moment THAT one landed. A click in the gap reached `subscribe()`
 * with no pricing, which reports failure, which the wizard reads as "inline
 * cannot work" and routes to /checkout.
 *
 * The fix makes the ownership explicit through the `pricing` prop:
 * `undefined` means "fetch your own", `null` means "mine is coming".
 */
describe("OnboardingUpsell — who owns the price", () => {
  it("fetches its own only when nobody is supplying one", () => {
    usePricing.mockClear();
    render(
      <OnboardingUpsell pathTitle="Backend" onGoPro={noop} onSkip={noop} />,
    );
    expect(usePricing).toHaveBeenCalledWith(true);
  });

  it("does NOT fetch while the caller's request is still in flight", () => {
    usePricing.mockClear();
    render(
      <OnboardingUpsell
        pathTitle="Backend"
        pricing={null}
        onGoPro={noop}
        onSkip={noop}
      />,
    );
    // null = "the caller owns this and it hasn't arrived". A second request
    // here is the race that produced the bug, not a redundancy.
    expect(usePricing).toHaveBeenCalledWith(false);
  });

  it("refuses to offer a purchase it cannot price", () => {
    render(
      <OnboardingUpsell
        pathTitle="Backend"
        pricing={null}
        onGoPro={noop}
        onSkip={noop}
      />,
    );
    expect(screen.getByRole("button", { name: /go pro/i })).toBeDisabled();
  });

  it("does not fire onGoPro while the price is unknown", () => {
    const onGoPro = vi.fn();
    render(
      <OnboardingUpsell
        pathTitle="Backend"
        pricing={null}
        onGoPro={onGoPro}
        onSkip={noop}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /go pro/i }));
    expect(onGoPro).not.toHaveBeenCalled();
  });

  it("enables Go Pro once the price lands", () => {
    render(
      <OnboardingUpsell
        pathTitle="Backend"
        pricing={ngPricing}
        onGoPro={noop}
        onSkip={noop}
      />,
    );
    expect(screen.getByRole("button", { name: /go pro/i })).toBeEnabled();
  });

  /**
   * The free exit delivers the lesson they are ALREADY enrolled in. It never
   * depends on a price, so a pricing outage must not strip a learner of the
   * thing this whole flow exists to hand them.
   */
  it("keeps the free exit available with no price at all", () => {
    const onSkip = vi.fn();
    render(
      <OnboardingUpsell
        pathTitle="Backend"
        pricing={null}
        onGoPro={noop}
        onSkip={onSkip}
      />,
    );
    const skip = screen.getByRole("button", { name: /free plan/i });
    expect(skip).toBeEnabled();
    fireEvent.click(skip);
    expect(onSkip).toHaveBeenCalled();
  });
});
