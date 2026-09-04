"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { TeamHubLayout } from "@/components/team/team-hub-layout";
import { TeamAssignmentsPage } from "@/components/pages/team-assignments";

export default function TeamAssignmentsRoute() {
  return (
    <DashboardLayout>
      <TeamHubLayout>
        <TeamAssignmentsPage />
      </TeamHubLayout>
    </DashboardLayout>
  );
}
