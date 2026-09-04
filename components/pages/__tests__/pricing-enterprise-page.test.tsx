import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import PricingEnterpriseView from "@/components/pages/pricing-enterprise";
import type { PublicEnterprisePricing, PublicPricing } from "@/lib/pricing";

const track = vi.fn();

let searchParams = new URLSearchParams("");
vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => (
    <img alt={String(props.alt ?? "")} />
  ),
}));
vi.mock("@/hooks/use-user", () => ({ useUser: () => null }));
vi.mock("@/lib/analytics", () => ({ analytics: { track: (...args: unknown[]) => track(...args) } }));

const globalEnterprise: PublicEnterprisePricing = {
  tier: "GLOBAL",
  currency: "USD",
  monthlyPerUser: 25,
  annualPerUser: 250,
  minSeats: 2,
  selfServe: true,
};

// The naira provider cannot bill a seat quantity — sales-led, no checkout.
const ngEnterprise: PublicEnterprisePricing = {
  tier: "NG",
  currency: "NGN",
  monthlyPerUser: 15000,
  annualPerUser: 150000,
  minSeats: 2,
  selfServe: false,
};

const usPricing: PublicPricing = {
  tier: "GLOBAL",
  country: "US",
  currency: "USD",
  monthly: 19.99,
  annual: 199.99,
  enterprise: globalEnterprise,
};

const ngPricing: PublicPricing = {
  tier: "NG",
  country: "NG",
  currency: "NGN",
  monthly: 9999,
  annual: 99990,
  enterprise: ngEnterprise,
};

function seatInput() {
  return screen.getByLabelText("Team size") as HTMLInputElement;
}

describe("PricingEnterpriseView", () => {
  beforeEach(() => {
    track.mockClear();
    searchParams = new URLSearchParams("");
  });

  // The page opens on the annual cycle, so the headline figure is the YEARLY
  // per-user price over twelve — not the monthly one. Getting this wrong
  // quotes a team 20% over the price they will actually pay.
  it("shows the per-user monthly equivalent on the annual cycle", () => {
    render(<PricingEnterpriseView pricing={usPricing} />);
    expect(screen.getByText("$20.83")).toBeInTheDocument();
    expect(screen.getByText(/billed annually/)).toBeInTheDocument();
  });

  it("switches the headline figure to the plain monthly rate", () => {
    render(<PricingEnterpriseView pricing={usPricing} />);
    fireEvent.click(screen.getByRole("button", { name: "Monthly" }));
    expect(screen.getByText("$25.00")).toBeInTheDocument();
    expect(screen.queryByText(/billed annually/)).not.toBeInTheDocument();
  });

  // The total is what the card is CHARGED, on the chosen cycle: seats x the
  // per-user price for that interval. A total computed from the monthly
  // equivalent would understate an annual invoice by two months.
  it("charges seats x the cycle's per-user price", () => {
    render(<PricingEnterpriseView pricing={usPricing} />);
    fireEvent.click(screen.getByRole("button", { name: "Add a seat" }));
    fireEvent.click(screen.getByRole("button", { name: "Add a seat" }));
    expect(seatInput().value).toBe("4");
    // 4 seats x $250/user/year
    expect(screen.getByText("$1,000.00")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Monthly" }));
    // 4 seats x $25/user/month
    expect(screen.getByText("$100.00")).toBeInTheDocument();
  });

  it("cannot be stepped below the seat minimum", () => {
    render(<PricingEnterpriseView pricing={usPricing} />);
    expect(seatInput().value).toBe("2");
    expect(screen.getByRole("button", { name: "Remove a seat" })).toBeDisabled();
  });

  // Typing is clamped by the same gate the stepper uses, so no path can put a
  // seat count in state that /checkout would then reject.
  it("clamps a typed seat count below the minimum", () => {
    render(<PricingEnterpriseView pricing={usPricing} />);
    fireEvent.click(screen.getByRole("button", { name: "Add a seat" }));
    fireEvent.change(seatInput(), { target: { value: "1" } });
    expect(seatInput().value).toBe("2");
  });

  it("seeds the seat count from a valid ?seats= link", () => {
    searchParams = new URLSearchParams("seats=12");
    render(<PricingEnterpriseView pricing={usPricing} />);
    expect(seatInput().value).toBe("12");
  });

  it("ignores an invalid ?seats= and falls back to the minimum", () => {
    searchParams = new URLSearchParams("seats=1");
    render(<PricingEnterpriseView pricing={usPricing} />);
    expect(seatInput().value).toBe("2");
  });

  // The seat count the buyer quoted themselves must ride to checkout, or they
  // are asked to pick a team size twice and the second answer is the one that
  // gets charged.
  it("carries cycle and seats into the checkout link", () => {
    render(<PricingEnterpriseView pricing={usPricing} />);
    fireEvent.click(screen.getByRole("button", { name: "Add a seat" }));
    const cta = screen.getByRole("link", { name: "Start your team" });
    expect(cta).toHaveAttribute(
      "href",
      "/checkout?plan=enterprise&cycle=annual&seats=3",
    );
  });

  it("forwards the __geo developer override to checkout", () => {
    searchParams = new URLSearchParams("__geo=NG");
    render(<PricingEnterpriseView pricing={usPricing} />);
    const cta = screen.getByRole("link", { name: "Start your team" });
    expect(cta.getAttribute("href")).toContain("__geo=NG");
  });

  // A region whose provider takes no seat quantity must never be offered a
  // checkout that would bill the team the wrong amount.
  it("offers sales, not checkout, where the provider cannot bill per seat", () => {
    render(<PricingEnterpriseView pricing={ngPricing} />);
    expect(
      screen.queryByRole("link", { name: "Start your team" }),
    ).not.toBeInTheDocument();
    const sales = screen.getAllByRole("link", { name: "Talk to sales" })[0];
    expect(sales.getAttribute("href")).toContain("mailto:");
  });

  it("prices naira with no fractional units", () => {
    render(<PricingEnterpriseView pricing={ngPricing} />);
    // ₦150,000 per user per year / 12
    expect(screen.getByText("₦12,500")).toBeInTheDocument();
  });

  // Sold, not built. A buyer must not read these as shipping today.
  it("chips the unbuilt team features", () => {
    render(<PricingEnterpriseView pricing={usPricing} />);
    const hiring = screen.getByRole("heading", { name: /Hiring services/ });
    expect(within(hiring).getByText("Coming soon")).toBeInTheDocument();

    const cobranded = screen.getByRole("heading", {
      name: /Co-branded landing page/,
    });
    expect(within(cobranded).getByText("Coming soon")).toBeInTheDocument();
  });

  // The mirror of the test above, and the reason it exists: custom paths
  // already ship, so programme building must NOT wear a caveat that would
  // tell a manager to wait for something they can do today.
  it("does not chip programme building, which ships today", () => {
    render(<PricingEnterpriseView pricing={usPricing} />);
    const programs = screen.getByRole("heading", {
      name: /Build learning programs/,
    });
    expect(within(programs).queryByText("Coming soon")).not.toBeInTheDocument();
  });

  it("names the team page's own analytics event, not the upsell's", () => {
    render(<PricingEnterpriseView pricing={usPricing} />);
    expect(track).toHaveBeenCalledWith("enterprise_pricing_viewed", {
      tier: "GLOBAL",
      country: "US",
      cycle: "annual",
      seats: 2,
    });
  });
});
