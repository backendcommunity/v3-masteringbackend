"use client";

import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { BootcampWeekPage } from "@/components/pages/bootcamp-week";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useParams, useRouter } from "next/navigation";

type BootcampWeekPageRouteProps = {
  bootcampId: string;
  weekId: string;
  cohort: string;
};

export default function BootcampWeekPageRoute() {
  const router = useRouter();
  const { bootcampId, weekId, cohort } = useParams() as BootcampWeekPageRouteProps;

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <DashboardLayout>
      <Suspense fallback={<PageSkeleton />}>
        <BootcampWeekPage
          bootcampId={bootcampId}
          weekId={weekId}
          cohort={cohort}
          onNavigate={handleNavigate}
        />
      </Suspense>
    </DashboardLayout>
  );
}
