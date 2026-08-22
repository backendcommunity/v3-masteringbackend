"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { TeamHubLayout } from "@/components/team/team-hub-layout";
import { TeamLeaderboardPage } from "@/components/pages/team-leaderboard";

export default function TeamLeaderboardRoute() {
  return (
    <DashboardLayout>
      <TeamHubLayout>
        <TeamLeaderboardPage />
      </TeamHubLayout>
    </DashboardLayout>
  );
}
