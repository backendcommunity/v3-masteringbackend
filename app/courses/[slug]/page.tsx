"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { CourseDetailPage } from "@/components/pages/course-detail";
import { useParams, useRouter } from "next/navigation";
import React from "react";

type CourseDetailPageRouteProps = {
  slug: string;
};

export default function CourseDetailPageRoute() {
  const router = useRouter();
  const { slug } = useParams() as CourseDetailPageRouteProps;
  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <DashboardLayout>
      <CourseDetailPage slug={slug} onNavigate={handleNavigate} />
    </DashboardLayout>
  );
}
