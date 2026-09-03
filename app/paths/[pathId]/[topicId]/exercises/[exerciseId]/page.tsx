"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { RoadmapCourseExercise } from "@/components/pages/roadmap-course-exercise";
import { routes } from "@/lib/routes";
import { useParams, useRouter } from "next/navigation";

export default function PathExerciseRoute() {
  const router = useRouter();
  const { pathId, topicId, exerciseId } = useParams() as {
    pathId: string;
    topicId: string;
    exerciseId: string;
  };

  return (
    <DashboardLayout>
      <RoadmapCourseExercise
        roadmapId={pathId}
        milestoneId={topicId}
        courseId=""
        exerciseId={exerciseId}
        onBack={() => router.push(routes.pathContinue(pathId))}
        onComplete={() => router.push(routes.pathContinue(pathId))}
      />
    </DashboardLayout>
  );
}
