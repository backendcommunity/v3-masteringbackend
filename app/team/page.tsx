"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { TeamPage } from "@/components/pages/team";
import { useRouter } from "next/navigation";

export default function TeamPageRoute() {
  const router = useRouter();
  return (
    <DashboardLayout>
      <TeamPage onNavigate={(p) => router.push(p)} />
    </DashboardLayout>
  );
}
