import { describe, it, expect } from "vitest";
import { toCheckoutPricing } from "@/app/checkout/page";
import type { RegionalPricing } from "@/lib/pricing";

// Pins the checkout pricing prop shape in app/checkout/page.tsx. Unlike
// toPublicPricing (lib/__tests__/pricing-page-props.test.ts), which strips
// provider/price IDs for the pricing page, checkout genuinely needs those to
// pick an SDK and hand it the right price — so this test pins the OPPOSITE
// shape: everything survives except `tier`, which nothing in checkout reads.
// It fails the moment someone widens the shape back to the full
// RegionalPricing (re-adding `tier`) or starts passing the raw object
// through without calling toCheckoutPricing at all.
describe("toCheckoutPricing", () => {
  const full: RegionalPricing = {
    tier: "NG",
    country: "NG",
    provider: "ASYNCPAY",
    currency: "NGN",
    monthly: 9999,
    annual: 99990,
    monthlyPriceId: "pri_monthly_123",
    annualPriceId: "pri_annual_456",
    enterprise: {
      tier: "NG",
      provider: "ASYNCPAY",
      currency: "NGN",
      monthlyPerUser: 15000,
      annualPerUser: 150000,
      minSeats: 2,
      selfServe: false,
      monthlyPriceId: "pri_ent_monthly_789",
      annualPriceId: "pri_ent_annual_012",
    },
  };

  it("drops only `tier`", () => {
    const result = toCheckoutPricing(full);

    expect(result).not.toHaveProperty("tier");
  });

  it("keeps every field checkout needs — including provider and both price IDs", () => {
    const result = toCheckoutPricing(full);

    expect(result).toEqual({
      country: "NG",
      provider: "ASYNCPAY",
      currency: "NGN",
      monthly: 9999,
      annual: 99990,
      monthlyPriceId: "pri_monthly_123",
      annualPriceId: "pri_annual_456",
      // Enterprise's price IDs and provider survive here on purpose:
      // checkout is the surface that opens the SDK and must hand it a price.
      enterprise: full.enterprise,
    });
  });

  it("never lets the top-level `tier` ride along into the hydration payload", () => {
    const result = toCheckoutPricing(full);

    expect(Object.keys(result)).not.toContain("tier");
    // Asserted on the key list rather than the serialized string: the nested
    // `enterprise` object carries its OWN `tier`, which is a different field
    // — checkout is free to receive it, and a substring match on the whole
    // payload would fail on it while saying nothing about the field this
    // test is actually about.
    expect(JSON.stringify({ ...result, enterprise: undefined })).not.toContain(
      '"tier"',
    );
  });
});
