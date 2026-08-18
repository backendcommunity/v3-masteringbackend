import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import PricingView from "@/components/pages/pricing";
import type { PublicEnterprisePricing, PublicPricing } from "@/lib/pricing";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
}));
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => <img alt={String(props.alt ?? "")} />,
}));
vi.mock("@/hooks/use-user", () => ({ useUser: () => null }));
vi.mock("@/lib/analytics", () => ({ analytics: { track: vi.fn() } }));

const ngEnterprise: PublicEnterprisePricing = {
  tier: "NG",
  currency: "NGN",
  monthlyPerUser: 15000,
  annualPerUser: 150000,
  minSeats: 2,
  // The naira provider cannot bill a seat quantity — sales-led.
  selfServe: false,
};

const globalEnterprise: PublicEnterprisePricing = {
  tier: "GLOBAL",
  currency: "USD",
  monthlyPerUser: 25,
  annualPerUser: 250,
  minSeats: 2,
  selfServe: true,
};

const pppEnterprise: PublicEnterprisePricing = {
  ...globalEnterprise,
  tier: "PPP",
  monthlyPerUser: 15,
  annualPerUser: 150,
};

const ngPricing: PublicPricing = {
  tier: "NG",
  country: "NG",
  currency: "NGN",
  monthly: 9999,
  annual: 99990,
  enterprise: ngEnterprise,
};

const usPricing: PublicPricing = {
  tier: "GLOBAL",
  country: "US",
  currency: "USD",
  monthly: 19.99,
  annual: 199.99,
  enterprise: globalEnterprise,
};

const inPricing: PublicPricing = {
  tier: "PPP",
  country: "IN",
  currency: "USD",
  monthly: 6.99,
  annual: 69.99,
  enterprise: pppEnterprise,
};

/** The Enterprise card, located by its own heading rather than by index. */
function enterpriseCard(): HTMLElement {
  const heading = screen
    .getAllByRole("heading", { name: "Enterprise" })
    .find((h) => h.tagName === "H2")!;
  return heading.closest("div.relative") as HTMLElement;
}

/** Switch the page to the monthly cycle (it loads on annual). */
function selectMonthly() {
  fireEvent.click(screen.getByRole("switch", { name: /bill yearly/i }));
}

describe("Enterprise card — per-user pricing", () => {
  beforeEach(() => vi.clearAllMocks());

  it("leads with the team minimum and quotes a PER USER rate, unmissably", () => {
    render(<PricingView pricing={usPricing} />);
    const card = enterpriseCard();

    expect(within(card).getByText(/For teams of 2 and up/i)).toBeInTheDocument();
    // $250/user/yr shown as its monthly equivalent. The qualifiers are
    // asserted on the PRICE BLOCK itself, not anywhere on the card — "per
    // user" also appears in the feature list and the total breakdown, and a
    // loose match would pass even if the big number lost its qualifier
    // entirely, which is the one thing this test exists to catch.
    const priceBlock = within(card).getByText("$20.83").parentElement!;
    expect(priceBlock.textContent).toMatch(/per user/i);
    expect(priceBlock.textContent).toMatch(/\/month/);
    expect(priceBlock.textContent).toMatch(/billed annually/i);
  });

  it("shows the monthly per-seat rate on the monthly cycle", () => {
    render(<PricingView pricing={usPricing} />);
    selectMonthly();
    expect(within(enterpriseCard()).getByText("$25.00")).toBeInTheDocument();
  });

  it("quotes a PPP team $15 a seat, not the global $25", () => {
    render(<PricingView pricing={inPricing} />);
    selectMonthly();
    expect(within(enterpriseCard()).getByText("$15.00")).toBeInTheDocument();
  });

  it("REGRESSION: never renders Pro's amount as the Enterprise price", () => {
    for (const pricing of [usPricing, inPricing, ngPricing]) {
      const { unmount } = render(<PricingView pricing={pricing} />);
      const card = enterpriseCard();
      // Pro's monthly-equivalent figures for each region.
      for (const proFigure of ["$16.67", "$19.99", "$5.83", "$6.99", "₦8,333", "₦9,999"]) {
        expect(within(card).queryByText(proFigure)).toBeNull();
      }
      unmount();
    }
  });
});

// The team-size stepper, its clamping behaviour, and the live total it used
// to drive on THIS card have all moved to /checkout — the reference's team
// card is price, CTA, features, nothing else; the buyer now picks seats at
// checkout, where the total is computed and shown before they pay. Those
// behaviours are covered by:
//   - components/pages/__tests__/checkout-seat-selector.test.tsx (the
//     stepper component itself: default value, +/- buttons, min-disabled,
//     typed-value clamping)
//   - lib/__tests__/checkout-plan-pricing.test.ts (the seats x per-user
//     arithmetic resolveCheckoutPrice performs — 2-seat, 10-seat, monthly
//     vs. annual, PPP vs. GLOBAL, all already pinned there)
// This describe block is deliberately gone from here, not deleted outright —
// see the two files above for where each assertion now lives.
describe("Enterprise card — no in-card seat machinery", () => {
  it("shows no seat selector and no total on the card, self-serve or not", () => {
    for (const pricing of [usPricing, inPricing, ngPricing]) {
      const { unmount } = render(<PricingView pricing={pricing} />);
      const card = enterpriseCard();

      expect(within(card).queryByLabelText(/team size/i)).toBeNull();
      expect(within(card).queryByText(/^Total$/)).toBeNull();
      unmount();
    }
  });

  it("links a self-serve region straight to checkout, with no seat count on the URL — checkout owns seat selection now", () => {
    render(<PricingView pricing={usPricing} />);
    const card = enterpriseCard();

    const cta = within(card).getByRole("link", { name: /choose enterprise/i });
    expect(cta).toHaveAttribute("href", "/checkout?plan=enterprise&cycle=annual");
  });
});

describe("Enterprise in a sales-led region", () => {
  it("routes to sales, NOT to checkout", () => {
    render(<PricingView pricing={ngPricing} />);
    const card = enterpriseCard();

    const cta = within(card).getByRole("link", { name: /talk to sales/i });
    expect(cta.getAttribute("href")).toMatch(/^mailto:/);
    // The exact failure being prevented: a buyer we cannot charge per seat
    // being dropped into a checkout that would charge them something else.
    expect(cta.getAttribute("href")).not.toContain("/checkout");
    expect(within(card).queryByRole("link", { name: /choose enterprise/i })).toBeNull();
  });

  it("offers no seat selector and no total it could not honour", () => {
    render(<PricingView pricing={ngPricing} />);
    const card = enterpriseCard();

    expect(within(card).queryByLabelText(/team size/i)).toBeNull();
    expect(within(card).queryByText(/^Total$/)).toBeNull();
  });

  it("still shows the real per-user naira rate — the price is honest, only the route differs", () => {
    render(<PricingView pricing={ngPricing} />);
    selectMonthly();
    expect(within(enterpriseCard()).getByText("₦15,000")).toBeInTheDocument();
  });

  it("names no payment processor anywhere on the page", () => {
    const { container } = render(<PricingView pricing={ngPricing} />);
    expect(container.textContent?.toLowerCase()).not.toContain("paddle");
    expect(container.textContent?.toLowerCase()).not.toContain("asyncpay");
  });
});

describe("Comparison table — Enterprise column", () => {
  it("prints the same per-user line the card does", () => {
    render(<PricingView pricing={usPricing} />);
    expect(
      screen.getByText("$20.83 per user /month billed annually"),
    ).toBeInTheDocument();
  });

  it("routes the sales-led region to sales there too", () => {
    render(<PricingView pricing={ngPricing} />);
    const salesLinks = screen.getAllByRole("link", { name: /talk to sales/i });
    // Card and table both.
    expect(salesLinks.length).toBe(2);
    for (const link of salesLinks) {
      expect(link.getAttribute("href")).toMatch(/^mailto:/);
    }
  });
});
