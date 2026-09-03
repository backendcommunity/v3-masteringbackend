import { fetchPricing, forwardedGeoHeaders } from "@/lib/pricing.server";
import { toPublicPricing } from "@/lib/pricing";
import PricingView from "@/components/pages/pricing";

/**
 * MUST stay dynamic. This page renders ONE region's price, so a cached copy
 * would serve (say) ₦9,999 to a US visitor. Dynamic rendering is the entire
 * cache-safety story for regional pricing — do not add revalidate/ISR here.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pricing — MasteringBackend",
  description: "Go Pro and unlock every path, project, and mock interview.",
};

interface PricingPageProps {
  // Next.js 15: searchParams is async. `__geo` is a developer-only override
  // (see lib/pricing.server.ts's fetchPricing) — the API enforces it is
  // honoured ONLY in LOCAL/DEVELOP, so simply forwarding whatever is on the
  // URL here is safe in every environment.
  searchParams: Promise<{ __geo?: string | string[] }>;
}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const forwarded = await forwardedGeoHeaders();

  const { __geo } = await searchParams;
  const geoOverride = typeof __geo === "string" ? __geo : undefined;

  const pricing = await fetchPricing(forwarded, geoOverride);
  return <PricingView pricing={toPublicPricing(pricing)} />;
}
