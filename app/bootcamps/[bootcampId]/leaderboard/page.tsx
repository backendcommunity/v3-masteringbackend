"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { BootcampLeaderboard } from "@/components/pages/bootcamp-leaderboard";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { Loader } from "@/components/ui/loader";

type BootcampLeaderboardPageRouteProps = {
  bootcampId: string;
};

export default function BootcampLeaderboardPageRoute() {
  const router = useRouter();
  const store = useAppStore();
  const { bootcampId } = useParams() as BootcampLeaderboardPageRouteProps;
  const [cohortId, setCohortId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBootcamp = async () => {
      try {
        const bootcamp = await store.getBootcamp(bootcampId);
        const id = bootcamp?.userCohort?.cohortId;
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
  }, [bootcampId, store]);

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  if (loading || !cohortId) {
    return (
      <DashboardLayout>
        <Loader isLoader={false} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <BootcampLeaderboard
        bootcampId={bootcampId}
        cohortId={cohortId}
        onNavigate={handleNavigate}
      />
    </DashboardLayout>
  );
}
