import { describe, it, expect } from "vitest";
import {
  formatGoProCtaLabel,
  formatSubscriptionCardPrice,
  formatUpsellPrice,
  formatUpsellQualifier,
  monthsFreeOnAnnual,
} from "@/lib/pro-cta";
import type { PublicPricing } from "@/lib/pricing";

const ngPricing: PublicPricing = {
  tier: "NG",
  country: "NG",
  currency: "NGN",
  monthly: 9999,
  annual: 99990,
  // Present because the type requires it; nothing in the Pro CTA reads it.
  enterprise: {
    tier: "NG",
    currency: "NGN",
    monthlyPerUser: 15000,
    annualPerUser: 150000,
    minSeats: 2,
    selfServe: false,
  },
};

describe("formatGoProCtaLabel", () => {
  it("renders WITHOUT a price while pricing is still loading (null) — never a guessed number", () => {
    expect(formatGoProCtaLabel(null)).toBe("Go Pro");
  });

  it("renders the region-resolved monthly price once pricing has loaded", () => {
    expect(formatGoProCtaLabel(ngPricing)).toBe("Go Pro — ₦9,999/mo");
  });
});

describe("formatSubscriptionCardPrice", () => {
  it("is blank while pricing is still loading (null) — never a flash of the wrong price", () => {
    expect(formatSubscriptionCardPrice(null)).toBe("");
  });

  it("renders the region-resolved monthly price once loaded", () => {
    expect(formatSubscriptionCardPrice(ngPricing)).toBe("₦9,999/mo");
  });
});

const usPricing: PublicPricing = {
  tier: "GLOBAL",
  country: "US",
  currency: "USD",
  monthly: 15,
  annual: 150,
  enterprise: {
    tier: "GLOBAL",
    currency: "USD",
    monthlyPerUser: 25,
    annualPerUser: 250,
    minSeats: 2,
    selfServe: true,
  },
};

describe("formatUpsellPrice", () => {
  it("is blank while pricing is still loading (null)", () => {
    expect(formatUpsellPrice(null)).toBe("");
  });

  it("renders naira for a Nigerian visitor, with no kobo", () => {
    expect(formatUpsellPrice(ngPricing)).toBe("₦9,999");
  });

  it("renders dollars for a global visitor", () => {
    expect(formatUpsellPrice(usPricing)).toBe("$15.00");
  });
});

describe("monthsFreeOnAnnual", () => {
  it("returns 2 when a year costs ten months", () => {
    expect(monthsFreeOnAnnual({ monthly: 9999, annual: 99990 })).toBe(2);
  });

  it("returns 0 when annual carries no whole-month saving — no claim we can word", () => {
    expect(monthsFreeOnAnnual({ monthly: 10, annual: 115 })).toBe(0);
  });

  it("returns 0 when annual is not a discount at all", () => {
    expect(monthsFreeOnAnnual({ monthly: 10, annual: 120 })).toBe(0);
  });

  it("returns 0 rather than dividing by zero on a missing monthly price", () => {
    expect(monthsFreeOnAnnual({ monthly: 0, annual: 99990 })).toBe(0);
  });
});

describe("formatUpsellQualifier", () => {
  it("is blank while pricing is still loading (null)", () => {
    expect(formatUpsellQualifier(null)).toBe("");
  });

  it("spells out the free months for a Nigerian visitor", () => {
    expect(formatUpsellQualifier(ngPricing)).toBe(
      "per month · or ₦99,990 a year, two months free",
    );
  });

  it("spells out the free months for a global visitor", () => {
    expect(formatUpsellQualifier(usPricing)).toBe(
      "per month · or $150.00 a year, two months free",
    );
  });

  it("drops the free-months clause when the maths does not support it", () => {
    expect(
      formatUpsellQualifier({ ...usPricing, monthly: 10, annual: 115 }),
    ).toBe("per month · or $115.00 a year");
  });
});
