"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { TeamHubLayout } from "@/components/team/team-hub-layout";
import { TeamGroupsPage } from "@/components/pages/team-groups";

export default function TeamGroupsRoute() {
  return (
    <DashboardLayout>
      <TeamHubLayout>
        <TeamGroupsPage />
      </TeamHubLayout>
    </DashboardLayout>
  );
}
