"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { TeamHubLayout } from "@/components/team/team-hub-layout";
import { TeamSettingsPage } from "@/components/pages/team-settings";

export default function TeamSettingsRoute() {
  return (
    <DashboardLayout hideSidebar>
      <TeamHubLayout>
        <TeamSettingsPage />
      </TeamHubLayout>
    </DashboardLayout>
  );
}
