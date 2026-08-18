import { describe, it, expect } from "vitest";
import { formatPrice, monthlyEquivalent } from "@/lib/pricing";
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
