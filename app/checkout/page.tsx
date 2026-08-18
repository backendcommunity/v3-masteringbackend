import { headers } from "next/headers";
import { fetchPricing } from "@/lib/pricing.server";
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
}

export default async function CheckoutPageRoute({
  params,
}: CheckoutPageRouteProps) {
  const incoming = await headers();
  // Forward geo headers so the API resolves the VISITOR's country, not the
  // server's.
  const forwarded: Record<string, string> = {};
  for (const key of ["cf-ipcountry", "x-nf-geo", "x-vercel-ip-country"]) {
    const value = incoming.get(key);
    if (value) forwarded[key] = value;
  }

  const pricing = await fetchPricing(forwarded);

  return (
    <DashboardLayout>
      <CheckoutPage pricing={toCheckoutPricing(pricing)} />
    </DashboardLayout>
  );
}
