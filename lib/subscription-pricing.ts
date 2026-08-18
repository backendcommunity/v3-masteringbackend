// Pure classification helpers for the subscription plans page — split out
// from components/pages/subscription-plans.tsx so the grandfathered-pricing
// matrix and the premium-user Free-card state can be unit tested without
// mounting the page (see lib/__tests__/subscription-pricing.test.ts).

import type { Subscription } from "@/lib/data";
import type { PublicPricing } from "@/lib/pricing";
import { formatDate } from "@/lib/utils";

export interface GrandfatheredClassification {
  isProSubscriber: boolean;
  isGrandfathered: boolean;
  // null when there's nothing to compare (no subscription, or a Pro
  // subscriber whose amount we genuinely don't know).
  legacyAmount: number | null;
  legacyCurrency: "NGN" | "USD";
}

type SubscriptionLike = Pick<Subscription, "amount" | "currency" | "name" | "plan">;

/**
 * Classifies whether a user's Pro subscription is "grandfathered" — billed
 * at a rate that no longer matches what the current tier would charge them
 * today, either because the amount differs or (more commonly) because the
 * subscription predates regional pricing and is in a different currency.
 *
 * IMPORTANT — `Subscription` carries no `interval` (monthly vs. annual)
 * field anywhere in this codebase (checked lib/data.ts, lib/store.ts, and
 * every consumer — subscription-management.tsx already assumes "/month" for
 * the same reason). This function therefore only ever compares against
 * `pricing.monthly` and makes NO claim about which period the legacy amount
 * was billed on. Callers MUST NOT render a period suffix ("/month",
 * "per month") next to `legacyAmount` — the renewal date is the one fact
 * about a grandfathered subscription this data model actually gives us. If
 * a real `interval` field is ever added to `Subscription`, this is where
 * that comparison should switch to use it directly instead of only
 * comparing against the monthly tier price.
 */
export function classifyGrandfathered(
  subscription: SubscriptionLike | null | undefined,
  isPremium: boolean | undefined,
  pricing: Pick<PublicPricing, "monthly" | "currency">,
): GrandfatheredClassification {
  const isProSubscriber =
    Boolean(isPremium) &&
    (subscription?.name === "Pro" || subscription?.plan?.name === "Pro");

  // Legacy subscriptions predate regional pricing and were always billed in
  // USD — `currency` only exists on subscriptions created after this
  // feature shipped, so a missing value means "USD", not "unknown".
  const legacyAmount =
    subscription?.amount ?? subscription?.plan?.monthlyPrice ?? null;
  const legacyCurrency = subscription?.currency ?? "USD";

  const isGrandfathered =
    isProSubscriber &&
    legacyAmount != null &&
    (legacyCurrency !== pricing.currency || legacyAmount !== pricing.monthly);

  return { isProSubscriber, isGrandfathered, legacyAmount, legacyCurrency };
}

/**
 * Sub-label for a grandfathered Pro card. Deliberately never claims a
 * billing period — see classifyGrandfathered's doc comment for why. The
 * renewal date is the one thing about this subscription we actually know,
 * so that's what carries the informational weight here instead.
 */
export function formatGrandfatheredSubLabel(
  expiry: Subscription["expiry"] | null | undefined,
  dateFormat?: string,
): string {
  if (!expiry) return "Your current rate";
  return `Your current rate · renews ${formatDate(String(expiry), dateFormat)}`;
}

export interface FreeCardCta {
  ctaLabel: string;
  ctaDisabled: boolean;
}

/**
 * Free card CTA for the plans page. Closes the gap where a premium user
 * used to see "Get started"/"Choose Free" as if they were a new signup —
 * they now see an explicit downgrade action instead. Non-premium users
 * (already on Free) see a disabled "Current Plan" state.
 */
export function classifyFreeCardCta(isPremium: boolean | undefined): FreeCardCta {
  if (isPremium) {
    return { ctaLabel: "Downgrade to Free", ctaDisabled: false };
  }
  return { ctaLabel: "Current Plan", ctaDisabled: true };
}
