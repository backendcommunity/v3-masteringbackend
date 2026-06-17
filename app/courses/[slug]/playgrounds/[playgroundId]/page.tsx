"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { CoursePlaygroundPage } from "@/components/pages/course-playground";
import { useRouter } from "next/navigation";

interface CoursePlaygroundPageProps {
  params: {
    playgroundId: string;
    courseId: string;
  };
}

export default function CoursePlaygroundPageRoute({
  params,
}: CoursePlaygroundPageProps) {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <DashboardLayout fluid>
      <CoursePlaygroundPage
        playgroundId={params.playgroundId}
        courseId={params.courseId}
        onNavigate={handleNavigate}
      />
    </DashboardLayout>
  );
}
