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
  maxSeats: 100,
  // The naira provider cannot bill a seat quantity — sales-led.
  selfServe: false,
};

const globalEnterprise: PublicEnterprisePricing = {
  tier: "GLOBAL",
  currency: "USD",
  monthlyPerUser: 25,
  annualPerUser: 250,
  minSeats: 2,
  maxSeats: 100,
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

describe("Enterprise seat selector — self-serve regions", () => {
  it("starts at the 2-seat minimum and shows the computed total", () => {
    render(<PricingView pricing={usPricing} />);
    selectMonthly();
    const card = enterpriseCard();

    expect(within(card).getByLabelText(/team size/i)).toHaveValue(2);
    // 2 x $25.
    expect(within(card).getByText("$50.00")).toBeInTheDocument();
    expect(within(card).getByText(/2 users x \$25\.00 per user/i)).toBeInTheDocument();
  });

  it("recomputes the total as seats change — 10 seats is 10x one seat", () => {
    render(<PricingView pricing={usPricing} />);
    selectMonthly();
    const card = enterpriseCard();

    fireEvent.change(within(card).getByLabelText(/team size/i), {
      target: { value: "10" },
    });

    expect(within(card).getByText("$250.00")).toBeInTheDocument();
    expect(within(card).getByText(/10 users x \$25\.00 per user/i)).toBeInTheDocument();
  });

  it("totals the ANNUAL cycle per year, not per month", () => {
    render(<PricingView pricing={usPricing} />);
    const card = enterpriseCard();

    fireEvent.change(within(card).getByLabelText(/team size/i), {
      target: { value: "10" },
    });

    // 10 seats x $250/user/year.
    expect(within(card).getByText("$2,500.00")).toBeInTheDocument();
    expect(within(card).getByText("/year")).toBeInTheDocument();
  });

  it("cannot be walked below 2 seats — the stepper's minus is disabled there", () => {
    render(<PricingView pricing={usPricing} />);
    const card = enterpriseCard();

    expect(within(card).getByLabelText(/remove a seat/i)).toBeDisabled();
    fireEvent.click(within(card).getByLabelText(/add a seat/i));
    expect(within(card).getByLabelText(/team size/i)).toHaveValue(3);
    fireEvent.click(within(card).getByLabelText(/remove a seat/i));
    expect(within(card).getByLabelText(/team size/i)).toHaveValue(2);
  });

  it("clamps a typed value below the minimum back up to 2", () => {
    render(<PricingView pricing={usPricing} />);
    const card = enterpriseCard();
    const input = within(card).getByLabelText(/team size/i);

    fireEvent.change(input, { target: { value: "1" } });
    expect(input).toHaveValue(2);
    fireEvent.change(input, { target: { value: "999" } });
    expect(input).toHaveValue(100);
  });

  it("carries the chosen seat count and cycle to checkout", () => {
    render(<PricingView pricing={usPricing} />);
    const card = enterpriseCard();

    fireEvent.change(within(card).getByLabelText(/team size/i), {
      target: { value: "6" },
    });

    const cta = within(card).getByRole("link", { name: /choose enterprise/i });
    expect(cta).toHaveAttribute(
      "href",
      "/checkout?plan=enterprise&cycle=annual&seats=6",
    );
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
