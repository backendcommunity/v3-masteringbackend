import { DashboardLayout } from "@/components/dashboard-layout";
import { SubscriptionPlansPage } from "@/components/pages/subscription-plans";

// No server-side pricing fetch — see app/pricing/page.tsx.
export default function SubscriptionPlansPageRoute() {
  return (
    <DashboardLayout>
      <SubscriptionPlansPage />
    </DashboardLayout>
  );
}
