import { headers } from "next/headers";
import { fetchPricing } from "@/lib/pricing";
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

export default async function PricingPage() {
  const incoming = await headers();
  // Forward geo headers so the API resolves the VISITOR's country, not the
  // Netlify function's.
  const forwarded: Record<string, string> = {};
  for (const key of ["cf-ipcountry", "x-nf-geo", "x-vercel-ip-country"]) {
    const value = incoming.get(key);
    if (value) forwarded[key] = value;
  }

  const pricing = await fetchPricing(forwarded);
  // Strip the payment processor's identity and price IDs before crossing
  // into the client component — Next.js embeds every client-component prop
  // into the page's RSC payload, so passing the full object would put
  // "PADDLE"/"ASYNCPAY" in the raw HTML response even though the UI never
  // renders it.
  const { provider: _provider, monthlyPriceId: _m, annualPriceId: _a, ...publicPricing } =
    pricing;
  return <PricingView pricing={publicPricing} />;
}
