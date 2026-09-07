"use client";

import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { BootcampDashboardPage } from "@/components/pages/bootcamp-dashboard";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useParams, useRouter } from "next/navigation";

type BootcampDashboardPageRouteProps = {
  bootcampId: string;
};

export default function BootcampDashboardPageRoute() {
  const router = useRouter();
  const { bootcampId } = useParams() as BootcampDashboardPageRouteProps;

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <DashboardLayout>
      <Suspense fallback={<PageSkeleton />}>
        <BootcampDashboardPage
          bootcampId={bootcampId}
          onNavigate={handleNavigate}
        />
      </Suspense>
    </DashboardLayout>
  );
}
