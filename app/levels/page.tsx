"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { LevelsPage } from "@/components/pages/levels";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LevelsPageRoute() {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <DashboardLayout>
      <LevelsPage onNavigate={handleNavigate} />
    </DashboardLayout>
  );
}
