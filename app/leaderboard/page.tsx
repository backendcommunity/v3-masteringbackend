"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { LeaderboardPage } from "@/components/pages/leaderboard";
import { useRouter } from "next/navigation";

export default function LeaderboardPageRoute() {
  const router = useRouter();
  return (
    <DashboardLayout>
      <LeaderboardPage onNavigate={(p) => router.push(p)} />
    </DashboardLayout>
  );
}
