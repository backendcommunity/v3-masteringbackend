"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { HallOfFamePage } from "@/components/pages/hall-of-fame";
import { useRouter } from "next/navigation";

export default function HallOfFameRoute() {
  const router = useRouter();
  return (
    <DashboardLayout>
      <HallOfFamePage onNavigate={(p) => router.push(p)} />
    </DashboardLayout>
  );
}
