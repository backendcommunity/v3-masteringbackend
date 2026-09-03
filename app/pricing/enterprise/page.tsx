import PricingEnterpriseView from "@/components/pages/pricing-enterprise";

// No server-side pricing fetch, so no `force-dynamic` — see app/pricing/page.tsx
// for why the server could never resolve the visitor's region in the first
// place. This page's per-seat price AND its sales-vs-self-serve CTA are both
// decided by the client fetch now, so a cached copy is correct for everyone.
export const metadata = {
  // No dash in the title separator, and none anywhere in this page's copy:
  // an em dash reads as machine-written to the buyers this page is for.
  title: "Enterprise Pricing for Engineering Teams | MasteringBackend",
  description:
    "Team pricing for MasteringBackend. Pay per person, from 2 seats. Every course, project, and mock interview for each person, plus a training plan you build, an admin dashboard, reports, and coaching.",
};

export default function EnterprisePricingPage() {
  return <PricingEnterpriseView />;
}
