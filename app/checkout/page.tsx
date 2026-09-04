import { DashboardLayout } from "@/components/dashboard-layout";
import { CheckoutPage } from "@/components/pages/checkout";

// No server-side pricing fetch — see app/pricing/page.tsx. Checkout is the
// surface where getting the region wrong is most expensive: it needs the
// processor's price ID and the displayed amount to come from ONE response, and
// only a browser-side fetch resolves the visitor's region at all.
export default function CheckoutPageRoute() {
  return (
    <DashboardLayout>
      <CheckoutPage />
    </DashboardLayout>
  );
}
