import { describe, it, expect } from "vitest";
import {
  isProCheckout,
  resolveCheckoutPrice,
  type ResolveCheckoutPriceInput,
} from "@/lib/checkout-plan-pricing";
import type { Plan } from "@/lib/data";
import type { CheckoutPricing } from "@/lib/pricing";

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
};

const usProPricing: CheckoutPricing = {
  country: "US",
  provider: "PADDLE",
  currency: "USD",
  monthly: 19.99,
  annual: 199.99,
  monthlyPriceId: "pri_pro_monthly",
  annualPriceId: "pri_pro_annual",
};

// Shaped exactly like what GET /api/v3/plans/enterprise returns — the seeded
// Enterprise plan, both channels included, mirroring academy's prisma/seed.ts.
const enterprisePlan = {
  id: "plan_enterprise",
  name: "Enterprise",
  paymentChannels: [
    {
      id: "pc_en_asyncpay",
      channel: "ASYNCPAY",
      planId: "plan_enterprise",
      originalMonthlyPrice: 150000,
      discountedMonthlyPrice: 100000,
      originalYearlyPrice: 1500000,
      discountedYearlyPrice: 1000000,
      monthlyPlanId: "asyncpay_en_monthly",
      yearlyPlanId: "asyncpay_en_yearly",
    },
    {
      id: "pc_en_paddle",
      channel: "PADDLE",
      planId: "plan_enterprise",
      originalMonthlyPrice: 99.99,
      discountedMonthlyPrice: 99.99,
      originalYearlyPrice: 999.99,
      discountedYearlyPrice: 899.99,
      monthlyPlanId: "pri_en_monthly",
      yearlyPlanId: "pri_en_yearly",
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
  it("prices Enterprise monthly for a US buyer from Enterprise's USD channel", () => {
    const result = resolveCheckoutPrice(
      input({
        checkoutId: "enterprise",
        cycle: "monthly",
        pricing: usProPricing,
        plan: enterprisePlan,
        planResolved: true,
      }),
    );

    expect(result).toEqual({
      status: "resolved",
      price: {
        amount: 99.99,
        currency: "USD",
        provider: "PADDLE",
        priceId: "pri_en_monthly",
        regional: true,
      },
    });
  });

  it("prices Enterprise annual for a US buyer from Enterprise's USD channel", () => {
    const result = resolveCheckoutPrice(
      input({
        checkoutId: "enterprise",
        cycle: "annual",
        pricing: usProPricing,
        plan: enterprisePlan,
        planResolved: true,
      }),
    );

    expect(result).toEqual({
      status: "resolved",
      price: {
        amount: 999.99,
        currency: "USD",
        provider: "PADDLE",
        priceId: "pri_en_yearly",
        regional: true,
      },
    });
  });

  it("prices Enterprise monthly for a Nigerian buyer in naira, off the naira channel", () => {
    const result = resolveCheckoutPrice(
      input({
        checkoutId: "enterprise",
        cycle: "monthly",
        pricing: ngProPricing,
        plan: enterprisePlan,
        planResolved: true,
      }),
    );

    expect(result).toEqual({
      status: "resolved",
      price: {
        amount: 150000,
        currency: "NGN",
        provider: "ASYNCPAY",
        priceId: "asyncpay_en_monthly",
        regional: true,
      },
    });
  });

  it("prices Enterprise annual for a Nigerian buyer in naira, off the naira channel", () => {
    const result = resolveCheckoutPrice(
      input({
        checkoutId: "enterprise",
        cycle: "annual",
        pricing: ngProPricing,
        plan: enterprisePlan,
        planResolved: true,
      }),
    );

    expect(result).toEqual({
      status: "resolved",
      price: {
        amount: 1500000,
        currency: "NGN",
        provider: "ASYNCPAY",
        priceId: "asyncpay_en_yearly",
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
            checkoutId: "enterprise",
            cycle,
            pricing,
            plan: enterprisePlan,
            planResolved: true,
          }),
        );

        expect(result.status).toBe("resolved");
        if (result.status !== "resolved") continue;
        expect(discounted).not.toContain(result.price.amount);
      }
    }
  });

  it("REGRESSION: an Enterprise-shaped checkout never returns the Pro amount or Pro price ID", () => {
    for (const cycle of ["monthly", "annual"] as const) {
      for (const pricing of [ngProPricing, usProPricing]) {
        const result = resolveCheckoutPrice(
          input({
            checkoutId: "enterprise",
            cycle,
            pricing,
            plan: enterprisePlan,
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
        // Enterprise is region-priced like Pro: the currency the buyer is
        // charged in is always the one their own region's channel bills in.
        expect(result.price.currency).toBe(pricing.currency);
        expect(result.price.provider).toBe(pricing.provider);
      }
    }
  });

  it("REGRESSION: a Nigerian is never quoted the USD channel's dollars for Enterprise", () => {
    for (const cycle of ["monthly", "annual"] as const) {
      const result = resolveCheckoutPrice(
        input({
          checkoutId: "enterprise",
          cycle,
          pricing: ngProPricing,
          plan: enterprisePlan,
          planResolved: true,
        }),
      );

      expect(result.status).toBe("resolved");
      if (result.status !== "resolved") continue;
      expect(result.price.currency).toBe("NGN");
      expect(result.price.amount).not.toBe(99.99);
      expect(result.price.amount).not.toBe(999.99);
      expect(result.price.priceId).not.toBe("pri_en_monthly");
      expect(result.price.priceId).not.toBe("pri_en_yearly");
    }
  });

  it("REGRESSION: a non-NG buyer is never quoted the naira channel", () => {
    for (const cycle of ["monthly", "annual"] as const) {
      const result = resolveCheckoutPrice(
        input({
          checkoutId: "enterprise",
          cycle,
          // PPP resolves to the USD provider exactly as GLOBAL does — see
          // the backend tier table — so a PPP visitor must land on the USD
          // channel, not the naira one.
          pricing: { ...usProPricing, country: "KE" },
          plan: enterprisePlan,
          planResolved: true,
        }),
      );

      expect(result.status).toBe("resolved");
      if (result.status !== "resolved") continue;
      expect(result.price.currency).toBe("USD");
      expect(result.price.provider).toBe("PADDLE");
      expect(result.price.amount).not.toBe(150000);
      expect(result.price.amount).not.toBe(1500000);
      expect(result.price.priceId).not.toBe("asyncpay_en_monthly");
      expect(result.price.priceId).not.toBe("asyncpay_en_yearly");
    }
  });

  it("matches the channel by name regardless of casing on the wire", () => {
    const lowercased = {
      ...enterprisePlan,
      paymentChannels: [
        { ...(enterprisePlan.paymentChannels ?? [])[1], channel: "paddle" },
      ],
    } as unknown as Plan;

    const result = resolveCheckoutPrice(
      input({
        checkoutId: "enterprise",
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
      input({ checkoutId: "enterprise", plan: undefined, planResolved: false }),
    );

    expect(result).toEqual({ status: "pending" });
  });

  it("is unavailable when the plan record does not exist", () => {
    const result = resolveCheckoutPrice(
      input({ checkoutId: "enterprise", plan: null, planResolved: true }),
    );

    expect(result.status).toBe("unavailable");
  });

  it("is unavailable — never the USD channel — when a Nigerian's naira channel is missing", () => {
    const usdOnly = {
      ...enterprisePlan,
      paymentChannels: [(enterprisePlan.paymentChannels ?? [])[1]],
    } as unknown as Plan;

    for (const cycle of ["monthly", "annual"] as const) {
      const result = resolveCheckoutPrice(
        input({
          checkoutId: "enterprise",
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
      ...enterprisePlan,
      paymentChannels: [(enterprisePlan.paymentChannels ?? [])[0]],
    } as unknown as Plan;

    for (const cycle of ["monthly", "annual"] as const) {
      const result = resolveCheckoutPrice(
        input({
          checkoutId: "enterprise",
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
      ...enterprisePlan,
      paymentChannels: [
        { ...(enterprisePlan.paymentChannels ?? [])[1], yearlyPlanId: "" },
      ],
    } as unknown as Plan;

    const result = resolveCheckoutPrice(
      input({
        checkoutId: "enterprise",
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
      ...enterprisePlan,
      paymentChannels: [
        { ...(enterprisePlan.paymentChannels ?? [])[0], monthlyPlanId: "" },
        (enterprisePlan.paymentChannels ?? [])[1],
      ],
    } as unknown as Plan;

    const result = resolveCheckoutPrice(
      input({
        checkoutId: "enterprise",
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
      ...enterprisePlan,
      paymentChannels: [
        {
          ...(enterprisePlan.paymentChannels ?? [])[1],
          originalMonthlyPrice: price,
        },
      ],
    } as unknown as Plan;

    const result = resolveCheckoutPrice(
      input({
        checkoutId: "enterprise",
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
        ...enterprisePlan,
        paymentChannels: [
          {
            ...(enterprisePlan.paymentChannels ?? [])[0],
            originalMonthlyPrice: price,
          },
          (enterprisePlan.paymentChannels ?? [])[1],
        ],
      } as unknown as Plan;

      const result = resolveCheckoutPrice(
        input({
          checkoutId: "enterprise",
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
        plan: { ...enterprisePlan, paymentChannels: [] } as unknown as Plan,
        planResolved: true,
      },
      {
        // Only the USD channel present, but the buyer is in Nigeria.
        plan: {
          ...enterprisePlan,
          paymentChannels: [(enterprisePlan.paymentChannels ?? [])[1]],
        } as unknown as Plan,
        planResolved: true,
      },
      {
        plan: {
          ...enterprisePlan,
          paymentChannels: [
            {
              ...(enterprisePlan.paymentChannels ?? [])[0],
              monthlyPlanId: undefined,
            },
          ],
        } as unknown as Plan,
        planResolved: true,
      },
    ];

    for (const overrides of broken) {
      const result = resolveCheckoutPrice(
        input({ checkoutId: "enterprise", pricing: ngProPricing, ...overrides }),
      );

      // No `price` key at all — there is no shape in which a caller could
      // read a number off an unavailable resolution.
      expect(result).not.toHaveProperty("price");
      expect(result.status).toBe("unavailable");
    }
  });

  it("accepts a decimal price that arrived as a numeric string", () => {
    const stringPrice = {
      ...enterprisePlan,
      paymentChannels: [
        {
          ...(enterprisePlan.paymentChannels ?? [])[1],
          originalMonthlyPrice: "99.99",
        },
      ],
    } as unknown as Plan;

    const result = resolveCheckoutPrice(
      input({
        checkoutId: "enterprise",
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
