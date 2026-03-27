"use client";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PathContentWatchPage } from "@/components/pages/path-content-watch";

interface PathContentWatchPageRouteProps {
  params: {
    pathId: string;
    stepId: string;
  };
}

export default function PathContentWatchPageRoute({
  params,
}: PathContentWatchPageRouteProps) {
  const router = useRouter();

  return (
    <DashboardLayout>
      <PathContentWatchPage
        pathId={params.pathId}
        stepId={params.stepId}
        onNavigate={(path) => router.push(path)}
      />
    </DashboardLayout>
  );
}
