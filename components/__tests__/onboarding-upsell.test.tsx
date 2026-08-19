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

  it("shows naira to a Nigerian visitor, with the annual alternative", () => {
    render(
      <OnboardingUpsell
        pathTitle="Backend Engineering"
        pricing={ngPricing}
        onGoPro={noop}
        onSkip={noop}
      />,
    );
    expect(screen.getByText("₦9,999")).toBeInTheDocument();
    expect(
      screen.getByText("per month · or ₦99,990 a year, two months free"),
    ).toBeInTheDocument();
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
    expect(
      screen.getByText("per month · or $150.00 a year, two months free"),
    ).toBeInTheDocument();
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
