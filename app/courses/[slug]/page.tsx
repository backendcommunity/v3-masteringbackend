"use client";

import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { CourseDetailPage } from "@/components/pages/course-detail";

export default function CourseDetailPageRoute() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <DashboardLayout>
      <CourseDetailPage slug={slug} onNavigate={handleNavigate} />
    </DashboardLayout>
  );
}
