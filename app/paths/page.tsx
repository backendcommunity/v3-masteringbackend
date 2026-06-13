"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { LearningPathsPage } from "@/components/pages/learning-paths";
import { useRouter } from "next/navigation";

export default function LearningPathsPageRoute() {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <DashboardLayout>
      <LearningPathsPage onNavigate={handleNavigate} />
    </DashboardLayout>
  );
}
