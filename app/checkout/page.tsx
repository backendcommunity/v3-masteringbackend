import { fetchPricing, forwardedGeoHeaders } from "@/lib/pricing.server";
import type { CheckoutPricing, RegionalPricing } from "@/lib/pricing";
import { DashboardLayout } from "@/components/dashboard-layout";
import { CheckoutPage } from "@/components/pages/checkout";

/**
 * MUST stay dynamic, same reason as /pricing: this page resolves and
 * displays ONE visitor's region-priced amount and price ID. A cached copy
 * would serve a stale region's price (or, worse, a stale price ID) to the
 * next visitor. Do not add revalidate/ISR here.
 */
export const dynamic = "force-dynamic";

/**
 * Unlike toPublicPricing on the pricing page, checkout genuinely needs the
 * processor identity and both price IDs to open the right SDK with the
 * right price — so only `tier` (unused here) is stripped before the object
 * crosses into the client component.
 *
 * Exported (not inlined) so a test can pin this the same way
 * lib/__tests__/pricing-page-props.test.ts pins toPublicPricing.
 */
export function toCheckoutPricing(pricing: RegionalPricing): CheckoutPricing {
  const { tier: _tier, ...checkoutPricing } = pricing;
  return checkoutPricing;
}

interface CheckoutPageRouteProps {
  params: {};
  // Next.js 15: searchParams is async. `__geo` is a developer-only override
  // (see lib/pricing.server.ts's fetchPricing) — the API enforces it is
  // honoured ONLY in LOCAL/DEVELOP, so simply forwarding whatever is on the
  // URL here is safe in every environment.
  searchParams: Promise<{ __geo?: string | string[] }>;
}

export default async function CheckoutPageRoute({
  params,
  searchParams,
}: CheckoutPageRouteProps) {
  const forwarded = await forwardedGeoHeaders();

  const { __geo } = await searchParams;
  const geoOverride = typeof __geo === "string" ? __geo : undefined;

  const pricing = await fetchPricing(forwarded, geoOverride);

  return (
    <DashboardLayout>
      <CheckoutPage pricing={toCheckoutPricing(pricing)} tier={pricing.tier} />
    </DashboardLayout>
  );
}
