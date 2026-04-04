"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { LearningPathCoursePreviewPage } from "@/components/pages/learning-path-course-preview";
import { useParams, useRouter } from "next/navigation";

type Params = {
  pathId: string;
  topicId: string;
  courseSlug: string;
};

export default function PathCoursePreviewRoute() {
  const { pathId, topicId, courseSlug } = useParams() as Params;
  const router = useRouter();

  return (
    <DashboardLayout>
      <LearningPathCoursePreviewPage
        pathId={pathId}
        topicId={topicId}
        courseSlug={courseSlug}
        onNavigate={(path) => router.push(path)}
      />
    </DashboardLayout>
  );
}
