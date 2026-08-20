import { headers } from "next/headers";
import { fetchPricing } from "@/lib/pricing.server";
import { toPublicPricing } from "@/app/pricing/page";
import { DashboardLayout } from "@/components/dashboard-layout";
import { SubscriptionPlansPage } from "@/components/pages/subscription-plans";

/**
 * MUST stay dynamic, same reason as /pricing and /checkout: this page shows
 * ONE visitor's region-priced amount, so a cached copy would serve a stale
 * region's price to the next visitor. Do not add revalidate/ISR here.
 */
export const dynamic = "force-dynamic";

export default async function SubscriptionPlansPageRoute() {
  const incoming = await headers();
  // Forward geo headers so the API resolves the VISITOR's country, not this
  // server's.
  const forwarded: Record<string, string> = {};
  for (const key of ["cf-ipcountry", "x-nf-geo", "x-vercel-ip-country"]) {
    const value = incoming.get(key);
    if (value) forwarded[key] = value;
  }

  const pricing = await fetchPricing(forwarded);

  return (
    <DashboardLayout>
      <SubscriptionPlansPage pricing={toPublicPricing(pricing)} />
    </DashboardLayout>
  );
}
