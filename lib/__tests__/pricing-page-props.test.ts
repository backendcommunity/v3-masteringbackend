import { describe, it, expect } from "vitest";
import { toPublicPricing } from "@/app/pricing/page";
import type { RegionalPricing } from "@/lib/pricing";

// Pins the RSC-payload leak fix in app/pricing/page.tsx: Next.js serializes
// every prop passed to a client component into the page's RSC payload, which
// is embedded verbatim in the raw HTML response. A full RegionalPricing prop
// puts the literal "PADDLE"/"ASYNCPAY" in that response even though the UI
// never renders it — this test fails the moment someone widens the shape
// toPublicPricing returns (or stops calling it before handing pricing to
// <PricingView>) back to include those fields.
describe("toPublicPricing", () => {
  const full: RegionalPricing = {
    tier: "NG",
    country: "NG",
    provider: "ASYNCPAY",
    currency: "NGN",
    monthly: 9999,
    annual: 99990,
    monthlyPriceId: "pri_monthly_123",
    annualPriceId: "pri_annual_456",
  };

  it("drops the processor identity and price IDs", () => {
    const result = toPublicPricing(full);

    expect(result).not.toHaveProperty("provider");
    expect(result).not.toHaveProperty("monthlyPriceId");
    expect(result).not.toHaveProperty("annualPriceId");
  });

  it("keeps every field the UI actually renders", () => {
    const result = toPublicPricing(full);

    expect(result).toEqual({
      tier: "NG",
      country: "NG",
      currency: "NGN",
      monthly: 9999,
      annual: 99990,
    });
  });

  it("never lets a processor name or a price ID survive into the serialized result", () => {
    const result = toPublicPricing(full);
    const serialized = JSON.stringify(result);

    expect(serialized.toLowerCase()).not.toContain("paddle");
    expect(serialized.toLowerCase()).not.toContain("asyncpay");
    expect(serialized).not.toContain("pri_monthly_123");
    expect(serialized).not.toContain("pri_annual_456");
  });
});
