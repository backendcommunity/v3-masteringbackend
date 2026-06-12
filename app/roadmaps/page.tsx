"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { RoadmapsPage } from "@/components/pages/roadmaps";
import { useRouter } from "next/navigation";

export default function RoadmapsPageRoute() {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <DashboardLayout>
      <RoadmapsPage onNavigate={handleNavigate} />
    </DashboardLayout>
  );
}
