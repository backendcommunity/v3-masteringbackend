"use client";

import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ProjectDetailPage } from "@/components/pages/project-detail";

export default function ProjectDetailPageRoute() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <DashboardLayout>
      <ProjectDetailPage slug={slug} onNavigate={handleNavigate} />
    </DashboardLayout>
  );
}
