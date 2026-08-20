import { describe, it, expect } from "vitest";
import {
  formatUpsellPrice,
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

