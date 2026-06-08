"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { PathWorkspace } from "@/components/pages/path-workspace";
import { useParams, useRouter } from "next/navigation";

export default function PathLearnRoute() {
  const router = useRouter();
  const params = useParams() as { pathId: string; stepId?: string[] };
  const stepId = params.stepId?.[0]
    ? decodeURIComponent(params.stepId[0])
    : undefined;

  return (
    <DashboardLayout>
      <PathWorkspace
        pathId={params.pathId}
        initialStepId={stepId}
        onNavigate={(path) => router.push(path)}
      />
    </DashboardLayout>
  );
}
