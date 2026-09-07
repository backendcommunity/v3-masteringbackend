"use client";

import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { BootcampDetailPage } from "@/components/pages/bootcamp-detail";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useParams, useRouter } from "next/navigation";

type BootcampDetailPageRouteProps = {
  bootcampId: string;
};

export default function BootcampDetailPageRoute() {
  const router = useRouter();
  const { bootcampId } = useParams() as BootcampDetailPageRouteProps;

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <DashboardLayout>
      <Suspense fallback={<PageSkeleton />}>
        <BootcampDetailPage bootcampId={bootcampId} onNavigate={handleNavigate} />
      </Suspense>
    </DashboardLayout>
  );
}
