"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { PathContentWatchPage } from "@/components/pages/path-content-watch";
import { useRouter } from "next/navigation";

interface LearningPathContentWatchPageRouteProps {
  params: {
    pathId: string;
    stepId: string;
  };
}

export default function LearningPathContentWatchPageRoute({
  params,
}: LearningPathContentWatchPageRouteProps) {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <DashboardLayout>
      <PathContentWatchPage
        pathId={params.pathId}
        stepId={params.stepId}
        onNavigate={handleNavigate}
      />
    </DashboardLayout>
  );
}
