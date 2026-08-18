import { describe, it, expect } from "vitest";
import { formatGoProCtaLabel, formatSubscriptionCardPrice } from "@/lib/pro-cta";
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
