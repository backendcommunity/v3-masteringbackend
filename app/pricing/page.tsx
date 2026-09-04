import PricingView from "@/components/pages/pricing";

/**
 * No server-side pricing fetch, and therefore no `force-dynamic`.
 *
 * This page used to resolve the visitor's region on the server and render one
 * region's price into the HTML, which is why it had to stay dynamic. It could
 * not actually resolve the region: the API reads the country from the geo
 * headers ITS OWN edge writes, and those describe the caller — for a server
 * render, this app server. Every Nigerian visitor was quoted USD on staging.
 *
 * PricingView now fetches from the browser (hooks/use-pricing.ts), where the
 * connection belongs to the visitor and the edge writes the right country.
 * With no per-request data left on the server, a cached copy of this page is
 * correct for everyone, so static is both allowed and better.
 */
export const metadata = {
  title: "Pricing — MasteringBackend",
  description: "Go Pro and unlock every path, project, and mock interview.",
};

export default function PricingPage() {
  return <PricingView />;
}
