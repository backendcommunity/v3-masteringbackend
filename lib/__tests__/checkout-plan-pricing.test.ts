import { describe, it, expect } from "vitest";
import {
  isEnterpriseCheckout,
  isProCheckout,
  resolveCheckoutPrice,
  type ResolveCheckoutPriceInput,
} from "@/lib/checkout-plan-pricing";
import type { Plan } from "@/lib/data";
import type { CheckoutPricing, EnterprisePricing } from "@/lib/pricing";
import { PADDLE_MAX_QUANTITY } from "@/lib/pricing";

// Per-user Enterprise pricing as the API returns it, one object per tier.
// ₦15,000 / $15 / $25 per SEAT per month, annual at exactly 10x.
const ngEnterprise: EnterprisePricing = {
  tier: "NG",
  provider: "ASYNCPAY",
  currency: "NGN",
  monthlyPerUser: 15000,
  annualPerUser: 150000,
  minSeats: 2,
  // The naira provider cannot bill a seat quantity — this tier is sales-led.
  selfServe: false,
  monthlyPriceId: "asyncpay_ent_monthly",
  annualPriceId: "asyncpay_ent_annual",
};

const pppEnterprise: EnterprisePricing = {
  tier: "PPP",
  provider: "PADDLE",
  currency: "USD",
  monthlyPerUser: 15,
  annualPerUser: 150,
  minSeats: 2,
  selfServe: true,
  monthlyPriceId: "pri_ent_monthly",
  annualPriceId: "pri_ent_annual",
};

const usEnterprise: EnterprisePricing = {
  tier: "GLOBAL",
  provider: "PADDLE",
  currency: "USD",
  monthlyPerUser: 25,
  annualPerUser: 250,
  minSeats: 2,
  selfServe: true,
  monthlyPriceId: "pri_ent_monthly",
  annualPriceId: "pri_ent_annual",
};

// The region-resolved PRO pricing object. Nigeria is the sharpest case:
// ₦9,999/mo against Enterprise's $99.99/mo, so a fallback to these numbers
// is unmistakable in an assertion.
const ngProPricing: CheckoutPricing = {
  country: "NG",
  provider: "ASYNCPAY",
  currency: "NGN",
  monthly: 9999,
  annual: 99990,
  monthlyPriceId: "asyncpay_pro_monthly",
  annualPriceId: "asyncpay_pro_annual",
  enterprise: ngEnterprise,
};

const usProPricing: CheckoutPricing = {
  country: "US",
  provider: "PADDLE",
  currency: "USD",
  monthly: 19.99,
  annual: 199.99,
  monthlyPriceId: "pri_pro_monthly",
  annualPriceId: "pri_pro_annual",
  enterprise: usEnterprise,
};

// A generic non-Pro plan priced from its OWN plan record, both channels
// included — the mechanism every non-Pro, non-Enterprise plan still uses.
//
// This fixture used to be the Enterprise plan. It no longer can be:
// Enterprise is sold per user now and is priced from the region-resolved
// `enterprise` block, never from these channels (which hold the superseded
// flat amounts). The plan-record path itself is unchanged and still needs
// covering, so the same shape is exercised under a different plan name.
const bootcampPlan = {
  id: "plan_bootcamp",
  name: "Bootcamp",
  paymentChannels: [
    {
      id: "pc_bc_asyncpay",
      channel: "ASYNCPAY",
      planId: "plan_bootcamp",
      originalMonthlyPrice: 150000,
      discountedMonthlyPrice: 100000,
      originalYearlyPrice: 1500000,
      discountedYearlyPrice: 1000000,
      monthlyPlanId: "asyncpay_bc_monthly",
      yearlyPlanId: "asyncpay_bc_yearly",
    },
    {
      id: "pc_bc_paddle",
      channel: "PADDLE",
      planId: "plan_bootcamp",
      originalMonthlyPrice: 99.99,
      discountedMonthlyPrice: 99.99,
      originalYearlyPrice: 999.99,
      discountedYearlyPrice: 899.99,
      monthlyPlanId: "pri_bc_monthly",
      yearlyPlanId: "pri_bc_yearly",
    },
  ],
} as unknown as Plan;

function input(
  overrides: Partial<ResolveCheckoutPriceInput> = {},
): ResolveCheckoutPriceInput {
  return {
    checkoutId: "pro",
    cycle: "monthly",
    pricing: ngProPricing,
    plan: undefined,
    planResolved: false,
    ...overrides,
  };
}

describe("isProCheckout", () => {
  it("treats a missing ?plan= as Pro — that has always been the default", () => {
    expect(isProCheckout(undefined)).toBe(true);
    expect(isProCheckout(null)).toBe(true);
    expect(isProCheckout("")).toBe(true);
  });

  it("matches 'pro' regardless of case or surrounding whitespace", () => {
    expect(isProCheckout("pro")).toBe(true);
    expect(isProCheckout("Pro")).toBe(true);
    expect(isProCheckout("  PRO ")).toBe(true);
  });

  it("does not claim any other plan is Pro", () => {
    expect(isProCheckout("enterprise")).toBe(false);
    expect(isProCheckout("Enterprise")).toBe(false);
    expect(isProCheckout("free")).toBe(false);
  });
});

describe("resolveCheckoutPrice — Pro keeps the regional behaviour", () => {
  it("prices Pro monthly from the regional object", () => {
    const result = resolveCheckoutPrice(input({ checkoutId: "pro" }));

    expect(result).toEqual({
      status: "resolved",
      price: {
        amount: 9999,
        currency: "NGN",
        provider: "ASYNCPAY",
        priceId: "asyncpay_pro_monthly",
        regional: true,
      },
    });
  });

  it("prices Pro annual from the regional object", () => {
    const result = resolveCheckoutPrice(
      input({ checkoutId: "pro", cycle: "annual" }),
    );

    expect(result).toEqual({
      status: "resolved",
      price: {
        amount: 99990,
        currency: "NGN",
        provider: "ASYNCPAY",
        priceId: "asyncpay_pro_annual",
        regional: true,
      },
    });
  });

  it("prices the default (no ?plan=) checkout as regional Pro", () => {
    const result = resolveCheckoutPrice(
      input({ checkoutId: undefined, pricing: usProPricing }),
    );

    expect(result).toEqual({
      status: "resolved",
      price: {
        amount: 19.99,
        currency: "USD",
        provider: "PADDLE",
        priceId: "pri_pro_monthly",
        regional: true,
      },
    });
  });

  it("never waits on a plan record — Pro resolves before any fetch settles", () => {
    const result = resolveCheckoutPrice(
      input({ checkoutId: "pro", plan: undefined, planResolved: false }),
    );

    expect(result.status).toBe("resolved");
  });

  it("still hands back an empty price ID for Pro so the existing readiness classifier owns that case", () => {
    const result = resolveCheckoutPrice(
      input({
        checkoutId: "pro",
        pricing: { ...ngProPricing, monthlyPriceId: "" },
      }),
    );

    expect(result).toMatchObject({
      status: "resolved",
      price: { priceId: "", amount: 9999 },
    });
  });
});

describe("resolveCheckoutPrice — a non-Pro plan is priced from its OWN record, by region", () => {
  it("prices the plan monthly for a US buyer from the plan's USD channel", () => {
    const result = resolveCheckoutPrice(
      input({
        checkoutId: "bootcamp",
        cycle: "monthly",
        pricing: usProPricing,
        plan: bootcampPlan,
        planResolved: true,
      }),
    );

    expect(result).toEqual({
      status: "resolved",
      price: {
        amount: 99.99,
        currency: "USD",
        provider: "PADDLE",
        priceId: "pri_bc_monthly",
        regional: true,
      },
    });
  });

  it("prices the plan annual for a US buyer from the plan's USD channel", () => {
    const result = resolveCheckoutPrice(
      input({
        checkoutId: "bootcamp",
        cycle: "annual",
        pricing: usProPricing,
        plan: bootcampPlan,
        planResolved: true,
      }),
    );

    expect(result).toEqual({
      status: "resolved",
      price: {
        amount: 999.99,
        currency: "USD",
        provider: "PADDLE",
        priceId: "pri_bc_yearly",
        regional: true,
      },
    });
  });

  it("prices the plan monthly for a Nigerian buyer in naira, off the naira channel", () => {
    const result = resolveCheckoutPrice(
      input({
        checkoutId: "bootcamp",
        cycle: "monthly",
        pricing: ngProPricing,
        plan: bootcampPlan,
        planResolved: true,
      }),
    );

    expect(result).toEqual({
      status: "resolved",
      price: {
        amount: 150000,
        currency: "NGN",
        provider: "ASYNCPAY",
        priceId: "asyncpay_bc_monthly",
        regional: true,
      },
    });
  });

  it("prices the plan annual for a Nigerian buyer in naira, off the naira channel", () => {
    const result = resolveCheckoutPrice(
      input({
        checkoutId: "bootcamp",
        cycle: "annual",
        pricing: ngProPricing,
        plan: bootcampPlan,
        planResolved: true,
      }),
    );

    expect(result).toEqual({
      status: "resolved",
      price: {
        amount: 1500000,
        currency: "NGN",
        provider: "ASYNCPAY",
        priceId: "asyncpay_bc_yearly",
        regional: true,
      },
    });
  });

  it("bills the original prices, never the discounted ones — the plan carries hasDiscount: false, so display and charge only agree on original*", () => {
    const discounted = [100000, 1000000, 899.99];

    for (const pricing of [ngProPricing, usProPricing]) {
      for (const cycle of ["monthly", "annual"] as const) {
        const result = resolveCheckoutPrice(
          input({
            checkoutId: "bootcamp",
            cycle,
            pricing,
            plan: bootcampPlan,
            planResolved: true,
          }),
        );

        expect(result.status).toBe("resolved");
        if (result.status !== "resolved") continue;
        expect(discounted).not.toContain(result.price.amount);
      }
    }
  });

  it("REGRESSION: a plan-record checkout never returns the Pro amount or Pro price ID", () => {
    for (const cycle of ["monthly", "annual"] as const) {
      for (const pricing of [ngProPricing, usProPricing]) {
        const result = resolveCheckoutPrice(
          input({
            checkoutId: "bootcamp",
            cycle,
            pricing,
            plan: bootcampPlan,
            planResolved: true,
          }),
        );

        expect(result.status).toBe("resolved");
        if (result.status !== "resolved") continue;

        // The exact mispricing this fix exists to eliminate: ₦9,999 /
        // ₦99,990 / $19.99 / $199.99 charged for a plan that costs
        // ₦150,000 / ₦1,500,000 / $99.99 / $999.99.
        expect(result.price.amount).not.toBe(pricing.monthly);
        expect(result.price.amount).not.toBe(pricing.annual);
        expect(result.price.priceId).not.toBe(pricing.monthlyPriceId);
        expect(result.price.priceId).not.toBe(pricing.annualPriceId);
        // A plan-record plan is region-priced like Pro: the currency the buyer is
        // charged in is always the one their own region's channel bills in.
        expect(result.price.currency).toBe(pricing.currency);
        expect(result.price.provider).toBe(pricing.provider);
      }
    }
  });

  it("REGRESSION: a Nigerian is never quoted the USD channel's dollars", () => {
    for (const cycle of ["monthly", "annual"] as const) {
      const result = resolveCheckoutPrice(
        input({
          checkoutId: "bootcamp",
          cycle,
          pricing: ngProPricing,
          plan: bootcampPlan,
          planResolved: true,
        }),
      );

      expect(result.status).toBe("resolved");
      if (result.status !== "resolved") continue;
      expect(result.price.currency).toBe("NGN");
      expect(result.price.amount).not.toBe(99.99);
      expect(result.price.amount).not.toBe(999.99);
      expect(result.price.priceId).not.toBe("pri_bc_monthly");
      expect(result.price.priceId).not.toBe("pri_bc_yearly");
    }
  });

  it("REGRESSION: a non-NG buyer is never quoted the naira channel", () => {
    for (const cycle of ["monthly", "annual"] as const) {
      const result = resolveCheckoutPrice(
        input({
          checkoutId: "bootcamp",
          cycle,
          // PPP resolves to the USD provider exactly as GLOBAL does — see
          // the backend tier table — so a PPP visitor must land on the USD
          // channel, not the naira one.
          pricing: usProPricing,
          plan: bootcampPlan,
          planResolved: true,
        }),
      );

      expect(result.status).toBe("resolved");
      if (result.status !== "resolved") continue;
      expect(result.price.currency).toBe("USD");
      expect(result.price.provider).toBe("PADDLE");
      expect(result.price.amount).not.toBe(150000);
      expect(result.price.amount).not.toBe(1500000);
      expect(result.price.priceId).not.toBe("asyncpay_bc_monthly");
      expect(result.price.priceId).not.toBe("asyncpay_bc_yearly");
    }
  });

  it("matches the channel by name regardless of casing on the wire", () => {
    const lowercased = {
      ...bootcampPlan,
      paymentChannels: [
        { ...(bootcampPlan.paymentChannels ?? [])[1], channel: "paddle" },
      ],
    } as unknown as Plan;

    const result = resolveCheckoutPrice(
      input({
        checkoutId: "bootcamp",
        pricing: usProPricing,
        plan: lowercased,
        planResolved: true,
      }),
    );

    expect(result).toMatchObject({ status: "resolved" });
  });
});

describe("resolveCheckoutPrice — unresolvable non-Pro plans fail safe", () => {
  it("is pending (not priced, not unavailable) until the plan fetch settles", () => {
    const result = resolveCheckoutPrice(
      input({ checkoutId: "bootcamp", plan: undefined, planResolved: false }),
    );

    expect(result).toEqual({ status: "pending" });
  });

  it("is unavailable when the plan record does not exist", () => {
    const result = resolveCheckoutPrice(
      input({ checkoutId: "bootcamp", plan: null, planResolved: true }),
    );

    expect(result.status).toBe("unavailable");
  });

  it("is unavailable — never the USD channel — when a Nigerian's naira channel is missing", () => {
    const usdOnly = {
      ...bootcampPlan,
      paymentChannels: [(bootcampPlan.paymentChannels ?? [])[1]],
    } as unknown as Plan;

    for (const cycle of ["monthly", "annual"] as const) {
      const result = resolveCheckoutPrice(
        input({
          checkoutId: "bootcamp",
          cycle,
          pricing: ngProPricing,
          plan: usdOnly,
          planResolved: true,
        }),
      );

      // Silently charging $99.99 to a buyer who was quoted naira is the
      // exact class of bug this feature eliminates.
      expect(result).not.toHaveProperty("price");
      expect(result.status).toBe("unavailable");
    }
  });

  it("is unavailable — never the naira channel — when a US buyer's USD channel is missing", () => {
    const ngOnly = {
      ...bootcampPlan,
      paymentChannels: [(bootcampPlan.paymentChannels ?? [])[0]],
    } as unknown as Plan;

    for (const cycle of ["monthly", "annual"] as const) {
      const result = resolveCheckoutPrice(
        input({
          checkoutId: "bootcamp",
          cycle,
          pricing: usProPricing,
          plan: ngOnly,
          planResolved: true,
        }),
      );

      expect(result).not.toHaveProperty("price");
      expect(result.status).toBe("unavailable");
    }
  });

  it("is unavailable when the price ID for the selected cycle is missing", () => {
    const noAnnualId = {
      ...bootcampPlan,
      paymentChannels: [
        { ...(bootcampPlan.paymentChannels ?? [])[1], yearlyPlanId: "" },
      ],
    } as unknown as Plan;

    const result = resolveCheckoutPrice(
      input({
        checkoutId: "bootcamp",
        cycle: "annual",
        pricing: usProPricing,
        plan: noAnnualId,
        planResolved: true,
      }),
    );

    expect(result.status).toBe("unavailable");
  });

  it("is unavailable when the naira channel's price ID for the selected cycle is missing", () => {
    const noMonthlyId = {
      ...bootcampPlan,
      paymentChannels: [
        { ...(bootcampPlan.paymentChannels ?? [])[0], monthlyPlanId: "" },
        (bootcampPlan.paymentChannels ?? [])[1],
      ],
    } as unknown as Plan;

    const result = resolveCheckoutPrice(
      input({
        checkoutId: "bootcamp",
        cycle: "monthly",
        pricing: ngProPricing,
        plan: noMonthlyId,
        planResolved: true,
      }),
    );

    expect(result).not.toHaveProperty("price");
    expect(result.status).toBe("unavailable");
  });

  it.each([
    ["zero", 0],
    ["negative", -10],
    ["null", null],
    ["undefined", undefined],
    ["NaN", Number.NaN],
    ["non-numeric string", "free"],
  ])("is unavailable when the monthly price is %s", (_label, price) => {
    const badPrice = {
      ...bootcampPlan,
      paymentChannels: [
        {
          ...(bootcampPlan.paymentChannels ?? [])[1],
          originalMonthlyPrice: price,
        },
      ],
    } as unknown as Plan;

    const result = resolveCheckoutPrice(
      input({
        checkoutId: "bootcamp",
        pricing: usProPricing,
        plan: badPrice,
        planResolved: true,
      }),
    );

    expect(result.status).toBe("unavailable");
  });

  it.each([
    ["zero", 0],
    ["negative", -10],
    ["null", null],
    ["undefined", undefined],
    ["NaN", Number.NaN],
    ["non-numeric string", "free"],
  ])(
    "is unavailable — not the USD price — when the naira monthly price is %s",
    (_label, price) => {
      const badPrice = {
        ...bootcampPlan,
        paymentChannels: [
          {
            ...(bootcampPlan.paymentChannels ?? [])[0],
            originalMonthlyPrice: price,
          },
          (bootcampPlan.paymentChannels ?? [])[1],
        ],
      } as unknown as Plan;

      const result = resolveCheckoutPrice(
        input({
          checkoutId: "bootcamp",
          pricing: ngProPricing,
          plan: badPrice,
          planResolved: true,
        }),
      );

      expect(result).not.toHaveProperty("price");
      expect(result.status).toBe("unavailable");
    },
  );

  it("NEVER falls back to the regional Pro price, or to the other region's channel, on any unresolvable path", () => {
    const broken: Array<Partial<ResolveCheckoutPriceInput>> = [
      { plan: null, planResolved: true },
      {
        plan: { ...bootcampPlan, paymentChannels: [] } as unknown as Plan,
        planResolved: true,
      },
      {
        // Only the USD channel present, but the buyer is in Nigeria.
        plan: {
          ...bootcampPlan,
          paymentChannels: [(bootcampPlan.paymentChannels ?? [])[1]],
        } as unknown as Plan,
        planResolved: true,
      },
      {
        plan: {
          ...bootcampPlan,
          paymentChannels: [
            {
              ...(bootcampPlan.paymentChannels ?? [])[0],
              monthlyPlanId: undefined,
            },
          ],
        } as unknown as Plan,
        planResolved: true,
      },
    ];

    for (const overrides of broken) {
      const result = resolveCheckoutPrice(
        input({ checkoutId: "bootcamp", pricing: ngProPricing, ...overrides }),
      );

      // No `price` key at all — there is no shape in which a caller could
      // read a number off an unavailable resolution.
      expect(result).not.toHaveProperty("price");
      expect(result.status).toBe("unavailable");
    }
  });

  it("accepts a decimal price that arrived as a numeric string", () => {
    const stringPrice = {
      ...bootcampPlan,
      paymentChannels: [
        {
          ...(bootcampPlan.paymentChannels ?? [])[1],
          originalMonthlyPrice: "99.99",
        },
      ],
    } as unknown as Plan;

    const result = resolveCheckoutPrice(
      input({
        checkoutId: "bootcamp",
        pricing: usProPricing,
        plan: stringPrice,
        planResolved: true,
      }),
    );

    expect(result).toMatchObject({
      status: "resolved",
      price: { amount: 99.99 },
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Enterprise: per user, per seat
// ═══════════════════════════════════════════════════════════════════════

describe("isEnterpriseCheckout", () => {
  it("matches 'enterprise' regardless of case or whitespace", () => {
    expect(isEnterpriseCheckout("enterprise")).toBe(true);
    expect(isEnterpriseCheckout("Enterprise")).toBe(true);
    expect(isEnterpriseCheckout("  ENTERPRISE  ")).toBe(true);
  });

  it("never treats an ABSENT ?plan= as Enterprise — a per-seat plan must be asked for", () => {
    expect(isEnterpriseCheckout(undefined)).toBe(false);
    expect(isEnterpriseCheckout(null)).toBe(false);
    expect(isEnterpriseCheckout("")).toBe(false);
    expect(isEnterpriseCheckout("pro")).toBe(false);
  });
});

describe("resolveCheckoutPrice — Enterprise charges seats x per-user price", () => {
  it("charges a 2-seat US team $50/month", () => {
    const result = resolveCheckoutPrice(
      input({
        checkoutId: "enterprise",
        cycle: "monthly",
        pricing: usProPricing,
        seats: 2,
        planResolved: true,
      }),
    );

    expect(result).toEqual({
      status: "resolved",
      price: {
        amount: 50,
        currency: "USD",
        provider: "PADDLE",
        priceId: "pri_ent_monthly",
        regional: true,
        quantity: 2,
        unitAmount: 25,
      },
    });
  });

  it("charges a 10-seat US team $250/month and $2,500/year", () => {
    const monthly = resolveCheckoutPrice(
      input({ checkoutId: "enterprise", cycle: "monthly", pricing: usProPricing, seats: 10, planResolved: true }),
    );
    const annual = resolveCheckoutPrice(
      input({ checkoutId: "enterprise", cycle: "annual", pricing: usProPricing, seats: 10, planResolved: true }),
    );

    expect(monthly).toMatchObject({ status: "resolved", price: { amount: 250, quantity: 10, unitAmount: 25 } });
    expect(annual).toMatchObject({ status: "resolved", price: { amount: 2500, quantity: 10, unitAmount: 250, priceId: "pri_ent_annual" } });
  });

  it("charges a PPP team $15 a seat, not the GLOBAL $25", () => {
    const result = resolveCheckoutPrice(
      input({
        checkoutId: "enterprise",
        cycle: "monthly",
        pricing: { ...usProPricing, enterprise: pppEnterprise },
        seats: 4,
        planResolved: true,
      }),
    );

    expect(result).toMatchObject({
      status: "resolved",
      price: { amount: 60, unitAmount: 15, quantity: 4 },
    });
  });

  it("multiplies exactly — no float dust on any seat count in range", () => {
    for (let seats = 2; seats <= 100; seats++) {
      const result = resolveCheckoutPrice(
        input({ checkoutId: "enterprise", pricing: usProPricing, seats, planResolved: true }),
      );
      expect(result.status).toBe("resolved");
      if (result.status !== "resolved") continue;
      expect(result.price.amount).toBe(25 * seats);
      expect(result.price.quantity).toBe(seats);
    }
  });

  it("accepts a seat count that arrived as a URL string", () => {
    const result = resolveCheckoutPrice(
      input({ checkoutId: "enterprise", pricing: usProPricing, seats: "7", planResolved: true }),
    );
    expect(result).toMatchObject({ status: "resolved", price: { amount: 175, quantity: 7 } });
  });

  it("never waits on the plan record — Enterprise is priced off the regional object alone", () => {
    const result = resolveCheckoutPrice(
      input({
        checkoutId: "enterprise",
        pricing: usProPricing,
        seats: 3,
        plan: undefined,
        planResolved: false,
      }),
    );
    expect(result.status).toBe("resolved");
  });

  it("REGRESSION: Enterprise never resolves to Pro's amount, price ID, or per-seat rate of 1", () => {
    for (const cycle of ["monthly", "annual"] as const) {
      for (const seats of [2, 3, 10, 100]) {
        const result = resolveCheckoutPrice(
          input({ checkoutId: "enterprise", cycle, pricing: usProPricing, seats, planResolved: true }),
        );
        expect(result.status).toBe("resolved");
        if (result.status !== "resolved") continue;

        // The mispricing this branch exists to prevent: an Enterprise team
        // billed $19.99/$199.99 because the resolver reached for Pro's
        // regional object.
        expect(result.price.amount).not.toBe(usProPricing.monthly);
        expect(result.price.amount).not.toBe(usProPricing.annual);
        expect(result.price.priceId).not.toBe(usProPricing.monthlyPriceId);
        expect(result.price.priceId).not.toBe(usProPricing.annualPriceId);
        // ...and the quieter one: a per-seat plan billed for a single seat.
        expect(result.price.quantity).toBe(seats);
        expect(result.price.amount).toBeGreaterThan(result.price.unitAmount!);
      }
    }
  });

  it("REGRESSION: Enterprise never reads the plan record's superseded flat channel prices", () => {
    const result = resolveCheckoutPrice(
      input({
        checkoutId: "enterprise",
        pricing: usProPricing,
        seats: 2,
        // A plan record IS present and carries the old flat amounts. It must
        // be ignored entirely.
        plan: bootcampPlan,
        planResolved: true,
      }),
    );

    expect(result).toMatchObject({ status: "resolved" });
    if (result.status !== "resolved") return;
    expect(result.price.amount).not.toBe(99.99);
    expect(result.price.amount).not.toBe(999.99);
    expect(result.price.priceId).not.toBe("pri_bc_monthly");
  });
});

describe("resolveCheckoutPrice — Enterprise fails closed", () => {
  it("refuses the sales-led region outright, rather than charging it wrongly", () => {
    for (const cycle of ["monthly", "annual"] as const) {
      for (const seats of [2, 10, undefined]) {
        const result = resolveCheckoutPrice(
          input({ checkoutId: "enterprise", cycle, pricing: ngProPricing, seats, planResolved: true }),
        );

        // No `price` key at all — nothing a caller could read a number off.
        expect(result).not.toHaveProperty("price");
        expect(result.status).toBe("unavailable");
      }
    }
  });

  it("never charges the naira team a flat amount or the Pro amount as a consolation", () => {
    const result = resolveCheckoutPrice(
      input({ checkoutId: "enterprise", pricing: ngProPricing, seats: 5, planResolved: true }),
    );
    expect(JSON.stringify(result)).not.toContain("15000");
    expect(JSON.stringify(result)).not.toContain("9999");
  });

  it.each([
    ["absent", undefined],
    ["null", null],
    ["empty string", ""],
    ["non-numeric", "five"],
    ["fractional", 2.5],
    ["zero", 0],
    ["negative", -3],
    ["below the 2-seat minimum", 1],
    // 101 is deliberately NOT in this list any more — Enterprise has no
    // product maximum, and 101 seats must resolve successfully (see the
    // dedicated test below). Only Paddle's own technical quantity ceiling
    // remains an "unavailable" boundary.
    ["above Paddle's technical quantity ceiling", PADDLE_MAX_QUANTITY + 1],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
  ])("is unavailable when the seat count is %s", (_label, seats) => {
    const result = resolveCheckoutPrice(
      input({ checkoutId: "enterprise", pricing: usProPricing, seats: seats as never, planResolved: true }),
    );

    expect(result).not.toHaveProperty("price");
    expect(result.status).toBe("unavailable");
  });

  it("enforces the 2-seat minimum at the boundary: 1 refused, 2 accepted", () => {
    const one = resolveCheckoutPrice(
      input({ checkoutId: "enterprise", pricing: usProPricing, seats: 1, planResolved: true }),
    );
    const two = resolveCheckoutPrice(
      input({ checkoutId: "enterprise", pricing: usProPricing, seats: 2, planResolved: true }),
    );

    expect(one.status).toBe("unavailable");
    expect(two.status).toBe("resolved");
  });

  // Product-level regression guard: seat counts well above the OLD 100-seat
  // cap (which no longer exists) must resolve and price correctly. 250 is
  // comfortably above that old ceiling.
  it("resolves and prices a 250-seat team — well above the old 100-seat product cap", () => {
    const result = resolveCheckoutPrice(
      input({ checkoutId: "enterprise", pricing: usProPricing, seats: 250, planResolved: true }),
    );

    expect(result.status).toBe("resolved");
    if (result.status === "resolved") {
      expect(result.price.quantity).toBe(250);
      expect(result.price.amount).toBe(250 * 25);
    }
  });

  it("still resolves at exactly Paddle's technical quantity ceiling, and refuses one past it", () => {
    const atCeiling = resolveCheckoutPrice(
      input({
        checkoutId: "enterprise",
        pricing: usProPricing,
        seats: PADDLE_MAX_QUANTITY,
        planResolved: true,
      }),
    );
    const overCeiling = resolveCheckoutPrice(
      input({
        checkoutId: "enterprise",
        pricing: usProPricing,
        seats: PADDLE_MAX_QUANTITY + 1,
        planResolved: true,
      }),
    );

    expect(atCeiling.status).toBe("resolved");
    expect(overCeiling.status).toBe("unavailable");
  });

  it.each([
    ["zero", 0],
    ["negative", -25],
    ["NaN", Number.NaN],
  ])("is unavailable when the per-user price is %s", (_label, perUser) => {
    const result = resolveCheckoutPrice(
      input({
        checkoutId: "enterprise",
        pricing: {
          ...usProPricing,
          enterprise: { ...usEnterprise, monthlyPerUser: perUser as number },
        },
        seats: 5,
        planResolved: true,
      }),
    );

    expect(result).not.toHaveProperty("price");
    expect(result.status).toBe("unavailable");
  });

  it("is unavailable when the price ID for the selected cycle is missing", () => {
    const noAnnual = resolveCheckoutPrice(
      input({
        checkoutId: "enterprise",
        cycle: "annual",
        pricing: { ...usProPricing, enterprise: { ...usEnterprise, annualPriceId: "" } },
        seats: 5,
        planResolved: true,
      }),
    );
    const noMonthly = resolveCheckoutPrice(
      input({
        checkoutId: "enterprise",
        cycle: "monthly",
        pricing: { ...usProPricing, enterprise: { ...usEnterprise, monthlyPriceId: "   " } },
        seats: 5,
        planResolved: true,
      }),
    );

    expect(noAnnual.status).toBe("unavailable");
    expect(noMonthly.status).toBe("unavailable");
  });

  it("NEVER falls back to Pro on any unresolvable Enterprise path", () => {
    const broken: Array<Partial<ResolveCheckoutPriceInput>> = [
      { seats: undefined },
      { seats: 1 },
      // Past Paddle's own technical quantity ceiling — not the old, now-
      // removed 100-seat product cap. 1000 seats alone is a perfectly valid
      // order now (see the dedicated 250/PADDLE_MAX_QUANTITY tests above).
      { seats: PADDLE_MAX_QUANTITY + 1 },
      { pricing: ngProPricing, seats: 4 },
      { pricing: { ...usProPricing, enterprise: { ...usEnterprise, monthlyPriceId: "" } }, seats: 4 },
      { pricing: { ...usProPricing, enterprise: { ...usEnterprise, monthlyPerUser: 0 } }, seats: 4 },
    ];

    for (const overrides of broken) {
      const result = resolveCheckoutPrice(
        input({ checkoutId: "enterprise", pricing: usProPricing, planResolved: true, ...overrides }),
      );

      expect(result).not.toHaveProperty("price");
      expect(result.status).toBe("unavailable");
    }
  });
});
