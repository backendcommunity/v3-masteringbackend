"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { TeamSetupPage } from "@/components/pages/team-setup";
import { useRouter } from "next/navigation";

export default function TeamSetupPageRoute() {
  const router = useRouter();
  return (
    <DashboardLayout>
      <TeamSetupPage onNavigate={(p) => router.push(p)} />
    </DashboardLayout>
  );
}
