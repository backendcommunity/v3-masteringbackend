import { describe, it, expect } from "vitest";
import {
  classifyFreeCardCta,
  classifyGrandfathered,
  classifyPremiumTierStatus,
  formatGrandfatheredSubLabel,
} from "@/lib/subscription-pricing";
import type { Subscription } from "@/lib/data";
import type { PublicPricing } from "@/lib/pricing";

const currentNG: Pick<PublicPricing, "monthly" | "currency"> = {
  monthly: 9999,
  currency: "NGN",
};

const currentGlobal: Pick<PublicPricing, "monthly" | "currency"> = {
  monthly: 19.99,
  currency: "USD",
};

function sub(overrides: Partial<Subscription>): Subscription {
  return {
    id: "sub_1",
    name: "Pro",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...overrides,
  } as Subscription;
}

describe("classifyGrandfathered", () => {
  it("is NOT grandfathered when the subscriber's rate matches the current monthly tier price exactly", () => {
    const result = classifyGrandfathered(
      sub({ amount: 9999, currency: "NGN" }),
      true,
      currentNG,
    );
    expect(result.isProSubscriber).toBe(true);
    expect(result.isGrandfathered).toBe(false);
  });

  it("IS grandfathered when the currency matches but the amount differs", () => {
    const result = classifyGrandfathered(
      sub({ amount: 6999, currency: "NGN" }),
      true,
      currentNG,
    );
    expect(result.isGrandfathered).toBe(true);
    expect(result.legacyAmount).toBe(6999);
    expect(result.legacyCurrency).toBe("NGN");
  });

  it("IS grandfathered when the currency itself differs, even if we don't compare amounts meaningfully — this is the Nigerian-viewer/USD-subscriber case the feature exists for", () => {
    const result = classifyGrandfathered(
      sub({ amount: 19.99, currency: "USD" }),
      true,
      currentNG, // visitor resolves to NGN today
    );
    expect(result.isGrandfathered).toBe(true);
    expect(result.legacyAmount).toBe(19.99);
    expect(result.legacyCurrency).toBe("USD");
  });

  it("is NOT grandfathered — and not even a Pro subscriber — when there is no subscription at all", () => {
    const result = classifyGrandfathered(undefined, false, currentGlobal);
    expect(result.isProSubscriber).toBe(false);
    expect(result.isGrandfathered).toBe(false);
    expect(result.legacyAmount).toBeNull();
  });

  it("is NOT grandfathered for a non-Pro premium subscriber (e.g. Enterprise) even with a mismatched amount", () => {
    const result = classifyGrandfathered(
      sub({ name: "Enterprise", amount: 499, currency: "USD" }),
      true,
      currentGlobal,
    );
    expect(result.isProSubscriber).toBe(false);
    expect(result.isGrandfathered).toBe(false);
  });

  it("classifies a legacy ANNUAL amount as grandfathered (same currency, amount doesn't match the current MONTHLY price)", () => {
    // This is the exact case review caught: a $199.99/year legacy
    // subscriber, viewed against today's $19.99/month GLOBAL price.
    const result = classifyGrandfathered(
      sub({ amount: 199.99, currency: "USD" }),
      true,
      currentGlobal,
    );
    expect(result.isGrandfathered).toBe(true);
    expect(result.legacyAmount).toBe(199.99);
  });

  it("falls back to subscription.plan.monthlyPrice when subscription.amount is absent", () => {
    const result = classifyGrandfathered(
      sub({ amount: undefined, plan: { id: "pro", name: "Pro", monthlyPrice: 14.99 } }),
      true,
      currentGlobal,
    );
    expect(result.legacyAmount).toBe(14.99);
    expect(result.isGrandfathered).toBe(true);
  });

  it("defaults legacyCurrency to USD when the subscription predates the currency field", () => {
    const result = classifyGrandfathered(
      sub({ amount: 19.99, currency: undefined }),
      true,
      currentGlobal,
    );
    expect(result.legacyCurrency).toBe("USD");
    expect(result.isGrandfathered).toBe(false); // matches current GLOBAL rate exactly
  });
});

describe("formatGrandfatheredSubLabel", () => {
  it("never claims a billing period — the $199.99/year case must not render 'per month'", () => {
    const label = formatGrandfatheredSubLabel("2026-09-03T00:00:00.000Z", "mdy");
    expect(label.toLowerCase()).not.toContain("month");
    expect(label).toContain("renews");
  });

  it("falls back to a period-free label when there is no renewal date", () => {
    const label = formatGrandfatheredSubLabel(undefined);
    expect(label.toLowerCase()).not.toContain("month");
    expect(label).toBe("Your current rate");
  });
});

describe("classifyFreeCardCta", () => {
  it("offers an explicit downgrade action for a premium user instead of a 'get started' CTA", () => {
    const result = classifyFreeCardCta(true);
    expect(result.ctaLabel).toBe("Downgrade to Free");
    expect(result.ctaDisabled).toBe(false);
  });

  it("shows a disabled 'Current Plan' state for a non-premium (already-free) user", () => {
    const result = classifyFreeCardCta(false);
    expect(result.ctaLabel).toBe("Current Plan");
    expect(result.ctaDisabled).toBe(true);
  });
});

describe("classifyPremiumTierStatus", () => {
  it("is 'none' for a logged-out or non-premium visitor", () => {
    expect(classifyPremiumTierStatus(false, undefined)).toBe("none");
    expect(classifyPremiumTierStatus(undefined, undefined)).toBe("none");
  });

  it("is 'pro' for a premium subscriber named Pro", () => {
    expect(classifyPremiumTierStatus(true, "Pro")).toBe("pro");
  });

  it("is 'enterprise' for a premium subscriber named Enterprise", () => {
    expect(classifyPremiumTierStatus(true, "Enterprise")).toBe("enterprise");
  });

  it("defaults an unnamed/legacy premium subscription to 'pro', not a no-CTA state", () => {
    expect(classifyPremiumTierStatus(true, undefined)).toBe("pro");
  });
});
