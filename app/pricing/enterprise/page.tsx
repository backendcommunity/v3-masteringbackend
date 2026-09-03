import { fetchPricing, forwardedGeoHeaders } from "@/lib/pricing.server";
import { toPublicPricing } from "@/lib/pricing";
import PricingEnterpriseView from "@/components/pages/pricing-enterprise";

/**
 * MUST stay dynamic, same reason as /pricing: this page renders ONE region's
 * per-seat price AND the sales-vs-self-serve CTA that region's payment
 * provider dictates, so a cached copy would quote a Lagos team the global
 * rate — or offer them a checkout that cannot bill them. Dynamic rendering is
 * the entire cache-safety story for regional pricing; do not add
 * revalidate/ISR here.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  // No dash in the title separator, and none anywhere in this page's copy:
  // an em dash reads as machine-written to the buyers this page is for.
  title: "Enterprise Pricing for Engineering Teams | MasteringBackend",
  description:
    "Team pricing for MasteringBackend. Pay per person, from 2 seats. Every course, project, and mock interview for each person, plus a training plan you build, an admin dashboard, reports, and coaching.",
};

interface EnterprisePricingPageProps {
  // Next.js 15: searchParams is async. `__geo` is a developer-only override
  // (see lib/pricing.server.ts's fetchPricing) — the API enforces it is
  // honoured ONLY in LOCAL/DEVELOP, so simply forwarding whatever is on the
  // URL here is safe in every environment.
  searchParams: Promise<{ __geo?: string | string[] }>;
}

export default async function EnterprisePricingPage({
  searchParams,
}: EnterprisePricingPageProps) {
  const forwarded = await forwardedGeoHeaders();

  const { __geo } = await searchParams;
  const geoOverride = typeof __geo === "string" ? __geo : undefined;

  const pricing = await fetchPricing(forwarded, geoOverride);
  // Same strip /pricing performs, for the same reason: every prop handed to a
  // client component is serialized into the RSC payload embedded in the raw
  // HTML, so the processor name and price IDs must not travel with it.
  return <PricingEnterpriseView pricing={toPublicPricing(pricing)} />;
}
