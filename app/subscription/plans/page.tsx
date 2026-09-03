import { fetchPricing, forwardedGeoHeaders } from "@/lib/pricing.server";
import { toPublicPricing } from "@/lib/pricing";
import { DashboardLayout } from "@/components/dashboard-layout";
import { SubscriptionPlansPage } from "@/components/pages/subscription-plans";

/**
 * MUST stay dynamic, same reason as /pricing and /checkout: this page shows
 * ONE visitor's region-priced amount, so a cached copy would serve a stale
 * region's price to the next visitor. Do not add revalidate/ISR here.
 */
export const dynamic = "force-dynamic";

export default async function SubscriptionPlansPageRoute() {
  const forwarded = await forwardedGeoHeaders();

  const pricing = await fetchPricing(forwarded);

  return (
    <DashboardLayout>
      <SubscriptionPlansPage pricing={toPublicPricing(pricing)} />
    </DashboardLayout>
  );
}
