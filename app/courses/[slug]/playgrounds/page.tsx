"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { CoursePlaygroundsPage } from "@/components/pages/course-playgrounds";
import { useRouter } from "next/navigation";
import React from "react";

interface CoursePlaygroundsPageRouteProps {
  params: {
    roadmapId: string;
    courseId: string;
  };
}

export default function CoursePlaygroundsPageRoute({
  params,
}: CoursePlaygroundsPageRouteProps) {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <DashboardLayout fluid>
      <CoursePlaygroundsPage
        courseId={params.courseId}
        onNavigate={handleNavigate}
      />
    </DashboardLayout>
  );
}
