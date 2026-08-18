import { describe, it, expect } from "vitest";
import {
  clampSeats,
  enterprisePerUser,
  enterprisePerUserMonthlyDisplay,
  enterpriseTotal,
  formatPrice,
  monthlyEquivalent,
  resolveSeats,
} from "@/lib/pricing";
import type { EnterprisePricing, RegionalPricing } from "@/lib/pricing";
// GLOBAL_FALLBACK lives in the server-only module (see lib/pricing.server.ts) —
// it names "PADDLE" and must never be reachable from a client-component
// import chain. Importing it here (a plain Node test, not a client bundle) is
// the legitimate case that module's top-of-file comment carves out.
import { GLOBAL_FALLBACK } from "@/lib/pricing.server";
import { isPublicPath } from "@/lib/public-paths";

// The three tiers exactly as the API serves them: ₦15,000 / $15 / $25 per
// SEAT per month, annual at exactly 10x, minimum 2 seats. Only the naira
// tier is sales-led.
const ngEnterprise: EnterprisePricing = {
  tier: "NG", provider: "ASYNCPAY", currency: "NGN",
  monthlyPerUser: 15000, annualPerUser: 150000,
  minSeats: 2, maxSeats: 100, selfServe: false,
  monthlyPriceId: "ap_ent_m", annualPriceId: "ap_ent_a",
};
const pppEnterprise: EnterprisePricing = {
  tier: "PPP", provider: "PADDLE", currency: "USD",
  monthlyPerUser: 15, annualPerUser: 150,
  minSeats: 2, maxSeats: 100, selfServe: true,
  monthlyPriceId: "pri_ent_m", annualPriceId: "pri_ent_a",
};
const globalEnterprise: EnterprisePricing = {
  tier: "GLOBAL", provider: "PADDLE", currency: "USD",
  monthlyPerUser: 25, annualPerUser: 250,
  minSeats: 2, maxSeats: 100, selfServe: true,
  monthlyPriceId: "pri_ent_m", annualPriceId: "pri_ent_a",
};

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
    enterprise: ngEnterprise,
  };
  const global: RegionalPricing = {
    tier: "GLOBAL", country: "US", provider: "PADDLE", currency: "USD",
    monthly: 19.99, annual: 199.99, monthlyPriceId: "m", annualPriceId: "a",
    enterprise: globalEnterprise,
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

describe("enterprisePerUser", () => {
  it("returns the per-SEAT amount for the cycle — the annual figure is a full year, not a month", () => {
    expect(enterprisePerUser(globalEnterprise, "monthly")).toBe(25);
    expect(enterprisePerUser(globalEnterprise, "annual")).toBe(250);
    expect(enterprisePerUser(ngEnterprise, "monthly")).toBe(15000);
    expect(enterprisePerUser(ngEnterprise, "annual")).toBe(150000);
  });

  it("prices annual at exactly 10x monthly in every tier", () => {
    for (const e of [ngEnterprise, pppEnterprise, globalEnterprise]) {
      expect(e.annualPerUser).toBe(e.monthlyPerUser * 10);
    }
  });
});

describe("enterprisePerUserMonthlyDisplay", () => {
  it("shows the per-user MONTHLY equivalent on the annual cycle", () => {
    // $250/user/yr over twelve months. Reads cheaper than $25 — which is the
    // whole reason annual converts, and matches how Pro's card already reads.
    expect(enterprisePerUserMonthlyDisplay(globalEnterprise, "annual")).toBe("$20.83");
    expect(enterprisePerUserMonthlyDisplay(pppEnterprise, "annual")).toBe("$12.50");
    expect(enterprisePerUserMonthlyDisplay(ngEnterprise, "annual")).toBe("₦12,500");
  });

  it("passes the monthly per-user price straight through", () => {
    expect(enterprisePerUserMonthlyDisplay(globalEnterprise, "monthly")).toBe("$25.00");
    expect(enterprisePerUserMonthlyDisplay(pppEnterprise, "monthly")).toBe("$15.00");
    expect(enterprisePerUserMonthlyDisplay(ngEnterprise, "monthly")).toBe("₦15,000");
  });

  it("always makes annual look cheaper per user per month", () => {
    for (const e of [ngEnterprise, pppEnterprise, globalEnterprise]) {
      expect(e.annualPerUser / 12).toBeLessThan(e.monthlyPerUser);
    }
  });
});

describe("resolveSeats — the single gate on a chargeable seat count", () => {
  it("accepts integers within [minSeats, maxSeats], as numbers or URL strings", () => {
    expect(resolveSeats(2, globalEnterprise)).toBe(2);
    expect(resolveSeats(100, globalEnterprise)).toBe(100);
    expect(resolveSeats("7", globalEnterprise)).toBe(7);
    expect(resolveSeats(" 12 ", globalEnterprise)).toBe(12);
  });

  it("REFUSES anything it cannot be certain of — never a default, never the minimum", () => {
    for (const bad of [
      undefined, null, "", "  ", "five", 0, -1, 1, 2.5, 101, 1000,
      Number.NaN, Number.POSITIVE_INFINITY, {}, [],
    ]) {
      expect(resolveSeats(bad, globalEnterprise)).toBeNull();
    }
  });

  it("refuses 1 — a one-seat team is Pro, not Enterprise", () => {
    expect(resolveSeats(1, globalEnterprise)).toBeNull();
    expect(resolveSeats(2, globalEnterprise)).toBe(2);
  });
});

describe("clampSeats — for the selector only", () => {
  it("nudges out-of-range values into range instead of rejecting them", () => {
    expect(clampSeats(1, globalEnterprise)).toBe(2);
    expect(clampSeats(0, globalEnterprise)).toBe(2);
    expect(clampSeats(-5, globalEnterprise)).toBe(2);
    expect(clampSeats(500, globalEnterprise)).toBe(100);
    expect(clampSeats(7, globalEnterprise)).toBe(7);
  });

  it("falls to the MINIMUM on non-finite garbage, never to the maximum", () => {
    // NaN and Infinity are both "we have no idea", and the safe answer to
    // that in a selector is the smallest billable team — not the largest,
    // which would pre-load the buyer's cart with 100 seats.
    expect(clampSeats(Number.NaN, globalEnterprise)).toBe(2);
    expect(clampSeats(Number.POSITIVE_INFINITY, globalEnterprise)).toBe(2);
    // A merely-large finite number IS clamped to the ceiling, as intended.
    expect(clampSeats(999999, globalEnterprise)).toBe(100);
  });

  it("rounds a fractional value to a whole seat", () => {
    expect(clampSeats(4.4, globalEnterprise)).toBe(4);
    expect(clampSeats(4.6, globalEnterprise)).toBe(5);
  });
});

describe("enterpriseTotal — seats x per-user price", () => {
  it("charges a 2-seat team the minimum team price in every region", () => {
    expect(enterpriseTotal(globalEnterprise, "monthly", 2)).toBe(50);
    expect(enterpriseTotal(globalEnterprise, "annual", 2)).toBe(500);
    expect(enterpriseTotal(pppEnterprise, "monthly", 2)).toBe(30);
    expect(enterpriseTotal(pppEnterprise, "annual", 2)).toBe(300);
    expect(enterpriseTotal(ngEnterprise, "monthly", 2)).toBe(30000);
    expect(enterpriseTotal(ngEnterprise, "annual", 2)).toBe(300000);
  });

  it("charges a 10-seat team ten times the per-seat price", () => {
    expect(enterpriseTotal(globalEnterprise, "monthly", 10)).toBe(250);
    expect(enterpriseTotal(globalEnterprise, "annual", 10)).toBe(2500);
    expect(enterpriseTotal(pppEnterprise, "monthly", 10)).toBe(150);
    expect(enterpriseTotal(pppEnterprise, "annual", 10)).toBe(1500);
    expect(enterpriseTotal(ngEnterprise, "monthly", 10)).toBe(150000);
    expect(enterpriseTotal(ngEnterprise, "annual", 10)).toBe(1500000);
  });

  it("is exact at every seat count — no binary-float dust in a price", () => {
    // 15 * 3 in naive float arithmetic is fine, but 0.1-style prices are not;
    // the minor-unit multiply is what keeps this true for any price we set.
    for (let seats = 2; seats <= 100; seats++) {
      expect(enterpriseTotal(pppEnterprise, "monthly", seats)).toBe(15 * seats);
      expect(enterpriseTotal(globalEnterprise, "annual", seats)).toBe(250 * seats);
      const total = enterpriseTotal(globalEnterprise, "monthly", seats)!;
      expect(Number.isInteger(Math.round(total * 100))).toBe(true);
    }
  });

  it("returns null — never a number — when the seat count is unusable", () => {
    for (const bad of [undefined, null, "", "many", 0, 1, -4, 2.5, 101]) {
      expect(enterpriseTotal(globalEnterprise, "monthly", bad)).toBeNull();
      expect(enterpriseTotal(globalEnterprise, "annual", bad)).toBeNull();
    }
  });

  it("returns null when the per-user price is missing, zero or negative", () => {
    for (const perUser of [0, -25, Number.NaN]) {
      expect(
        enterpriseTotal({ ...globalEnterprise, monthlyPerUser: perUser }, "monthly", 5),
      ).toBeNull();
      expect(
        enterpriseTotal({ ...globalEnterprise, annualPerUser: perUser }, "annual", 5),
      ).toBeNull();
    }
  });

  it("never returns a Pro amount for any tier, seat count or cycle", () => {
    // Pro's published figures. An Enterprise total landing on one of these
    // would make a fallback-to-Pro bug invisible in the rendered price.
    const proAmounts = [9999, 99990, 6.99, 69.99, 19.99, 199.99];
    for (const e of [ngEnterprise, pppEnterprise, globalEnterprise]) {
      for (const cycle of ["monthly", "annual"] as const) {
        for (let seats = 2; seats <= 40; seats++) {
          expect(proAmounts).not.toContain(enterpriseTotal(e, cycle, seats));
        }
      }
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

  it("falls back to the most expensive Enterprise SEAT price too", () => {
    // A pricing-API blip must not hand the world the $15 or ₦15,000 seat.
    expect(GLOBAL_FALLBACK.enterprise.monthlyPerUser).toBe(25);
    expect(GLOBAL_FALLBACK.enterprise.annualPerUser).toBe(250);
    expect(GLOBAL_FALLBACK.enterprise.currency).toBe("USD");
    expect(GLOBAL_FALLBACK.enterprise.minSeats).toBe(2);
    // The GLOBAL tier it stands in for IS self-serve; the fallback must not
    // invent a sales-led flow for a region that has checkout.
    expect(GLOBAL_FALLBACK.enterprise.selfServe).toBe(true);
  });
});

describe("public paths", () => {
  it("treats /pricing as public so middleware does not bounce logged-out visitors", () => {
    expect(isPublicPath("/pricing")).toBe(true);
  });
});
