import { describe, it, expect } from "vitest";
import {
  enterprisePricingForTier,
  formatPrice,
  monthlyEquivalent,
} from "@/lib/pricing";
import type { RegionalPricing } from "@/lib/pricing";
// GLOBAL_FALLBACK lives in the server-only module (see lib/pricing.server.ts) —
// it names "PADDLE" and must never be reachable from a client-component
// import chain. Importing it here (a plain Node test, not a client bundle) is
// the legitimate case that module's top-of-file comment carves out.
import { GLOBAL_FALLBACK } from "@/lib/pricing.server";
import { isPublicPath } from "@/lib/public-paths";

describe("formatPrice", () => {
  it("renders naira with the ₦ glyph, not the ISO code", () => {
    // Regression guard: without currencyDisplay:"narrowSymbol", en-US renders
    // this as "NGN 9,999".
    expect(formatPrice(9999, "NGN")).toBe("₦9,999");
    expect(formatPrice(99990, "NGN")).toBe("₦99,990");
  });

  it("formats USD with two decimals", () => {
    expect(formatPrice(6.99, "USD")).toBe("$6.99");
    expect(formatPrice(19.99, "USD")).toBe("$19.99");
    expect(formatPrice(199.99, "USD")).toBe("$199.99");
  });
});

describe("monthlyEquivalent", () => {
  const ng: RegionalPricing = {
    tier: "NG", country: "NG", provider: "ASYNCPAY", currency: "NGN",
    monthly: 9999, annual: 99990, monthlyPriceId: "m", annualPriceId: "a",
  };
  const global: RegionalPricing = {
    tier: "GLOBAL", country: "US", provider: "PADDLE", currency: "USD",
    monthly: 19.99, annual: 199.99, monthlyPriceId: "m", annualPriceId: "a",
  };

  it("divides the annual price across twelve months", () => {
    expect(monthlyEquivalent(ng, "annual")).toBe("₦8,333");
    expect(monthlyEquivalent(global, "annual")).toBe("$16.67");
  });

  it("passes the monthly price through untouched", () => {
    expect(monthlyEquivalent(ng, "monthly")).toBe("₦9,999");
    expect(monthlyEquivalent(global, "monthly")).toBe("$19.99");
  });

  it("always makes annual look cheaper per month than monthly", () => {
    for (const p of [ng, global]) {
      expect(p.annual / 12).toBeLessThan(p.monthly);
    }
  });
});

describe("enterprisePricingForTier", () => {
  // The seeded Enterprise channels (academy prisma/seed.ts): ASYNCPAY at
  // ₦150,000 / ₦1,500,000 and PADDLE at $99.99 / $999.99 — the `original*`
  // columns, which is what /checkout bills from.
  it("quotes a Nigerian the naira figures from the naira channel", () => {
    expect(enterprisePricingForTier("NG")).toEqual({
      monthly: 150000,
      annual: 1500000,
      currency: "NGN",
    });
  });

  it("quotes every other tier the USD figures", () => {
    for (const tier of ["GLOBAL", "PPP"] as const) {
      expect(enterprisePricingForTier(tier)).toEqual({
        monthly: 99.99,
        annual: 999.99,
        currency: "USD",
      });
    }
  });

  it("fails closed to USD on an unrecognised or missing tier — a bad region read must never leak the naira price", () => {
    for (const tier of [undefined, null, "", "ng", "XX"]) {
      expect(enterprisePricingForTier(tier)).toMatchObject({
        currency: "USD",
        monthly: 99.99,
      });
    }
  });

  it("never quotes the discounted seed values — the plan carries hasDiscount: false", () => {
    const discounted = [100000, 1000000, 899.99];
    for (const tier of ["NG", "GLOBAL", "PPP"] as const) {
      const p = enterprisePricingForTier(tier);
      expect(discounted).not.toContain(p.monthly);
      expect(discounted).not.toContain(p.annual);
    }
  });

  it("renders as a naira figure for NG and a dollar figure elsewhere", () => {
    const ng = enterprisePricingForTier("NG");
    const global = enterprisePricingForTier("GLOBAL");
    expect(monthlyEquivalent(ng, "monthly")).toBe("₦150,000");
    expect(monthlyEquivalent(ng, "annual")).toBe("₦125,000");
    expect(monthlyEquivalent(global, "monthly")).toBe("$99.99");
    expect(monthlyEquivalent(global, "annual")).toBe("$83.33");
  });
});

describe("GLOBAL_FALLBACK", () => {
  it("is the most expensive tier, so a failed fetch never leaks regional pricing", () => {
    expect(GLOBAL_FALLBACK.tier).toBe("GLOBAL");
    expect(GLOBAL_FALLBACK.monthly).toBe(19.99);
    expect(GLOBAL_FALLBACK.annual).toBe(199.99);
    expect(GLOBAL_FALLBACK.provider).toBe("PADDLE");
  });
});

describe("public paths", () => {
  it("treats /pricing as public so middleware does not bounce logged-out visitors", () => {
    expect(isPublicPath("/pricing")).toBe(true);
  });
});
