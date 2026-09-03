"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { TeamHubLayout } from "@/components/team/team-hub-layout";
import { TeamPathsPage } from "@/components/pages/team-paths";

export default function TeamPathsRoute() {
  return (
    <DashboardLayout>
      <TeamHubLayout>
        <TeamPathsPage />
      </TeamHubLayout>
    </DashboardLayout>
  );
}
