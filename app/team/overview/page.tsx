"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { TeamHubLayout } from "@/components/team/team-hub-layout";
import { TeamOverviewPage } from "@/components/pages/team-overview";
import { useRouter } from "next/navigation";

export default function TeamOverviewRoute() {
  const router = useRouter();
  return (
    <DashboardLayout hideSidebar>
      <TeamHubLayout>
        <TeamOverviewPage onNavigate={(p) => router.push(p)} />
      </TeamHubLayout>
    </DashboardLayout>
  );
}
