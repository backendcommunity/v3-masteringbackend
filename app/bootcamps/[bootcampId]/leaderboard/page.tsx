"use client";

import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { BootcampLeaderboard } from "@/components/pages/bootcamp-leaderboard";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useCohortParam } from "@/components/bootcamps/cohort-switcher";

type BootcampLeaderboardPageRouteProps = {
  bootcampId: string;
};

function LeaderboardRouteInner() {
  const router = useRouter();
  const store = useAppStore();
  const { bootcampId } = useParams() as BootcampLeaderboardPageRouteProps;
  const { cohortId: cohortParam } = useCohortParam();
  const [cohortId, setCohortId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBootcamp = async () => {
      try {
        const bootcamp = await store.getBootcamp(bootcampId, cohortParam);
        const id = bootcamp?.cohort?.id;
        if (id) {
          setCohortId(id);
        }
      } catch (error) {
        console.error("Error loading bootcamp:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBootcamp();
  }, [bootcampId, store, cohortParam]);

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  if (loading || !cohortId) {
    return <PageSkeleton />;
  }

  return (
    <BootcampLeaderboard
      bootcampId={bootcampId}
      cohortId={cohortId}
      onNavigate={handleNavigate}
    />
  );
}

export default function BootcampLeaderboardPageRoute() {
  return (
    <DashboardLayout>
      <Suspense fallback={<PageSkeleton />}>
        <LeaderboardRouteInner />
      </Suspense>
    </DashboardLayout>
  );
}
