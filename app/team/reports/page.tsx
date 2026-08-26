"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { TeamHubLayout } from "@/components/team/team-hub-layout";
import { TeamReportsPage } from "@/components/pages/team-reports";

export default function TeamReportsRoute() {
  return (
    <DashboardLayout>
      <TeamHubLayout>
        <TeamReportsPage />
      </TeamHubLayout>
    </DashboardLayout>
  );
}
