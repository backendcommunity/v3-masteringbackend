"use client";

import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { RoadmapDetailPage } from "@/components/pages/roadmap-detail";

export default function RoadmapDetailPageRoute() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <DashboardLayout>
      <RoadmapDetailPage slug={slug} onNavigate={handleNavigate} />
    </DashboardLayout>
  );
}
