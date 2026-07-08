"use client";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { CourseDetailPage } from "@/components/pages/course-detail";

export default function CourseDetailPageClient({ slug }: { slug: string }) {
  const router = useRouter();
  return (
    <DashboardLayout>
      <CourseDetailPage slug={slug} onNavigate={(path) => router.push(path)} />
    </DashboardLayout>
  );
}
