"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { TeamHubLayout } from "@/components/team/team-hub-layout";
import { TeamPage } from "@/components/pages/team";
import { useRouter } from "next/navigation";

export default function TeamMembersRoute() {
  const router = useRouter();
  return (
    <DashboardLayout>
      <TeamHubLayout>
        <TeamPage onNavigate={(p) => router.push(p)} />
      </TeamHubLayout>
    </DashboardLayout>
  );
}
