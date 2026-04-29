"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { RoadmapCourseQuiz } from "@/components/pages/roadmap-course-quiz";
import { routes } from "@/lib/routes";
import { useParams, useRouter } from "next/navigation";

export default function PathQuizRoute() {
  const router = useRouter();
  const { pathId, topicId, quizId } = useParams() as {
    pathId: string;
    topicId: string;
    quizId: string;
  };

  return (
    <DashboardLayout>
      <RoadmapCourseQuiz
        roadmapId={pathId}
        quizId={quizId}
        handleQuizSubmit={() => router.push(routes.pathContinue(pathId))}
        onNavigate={(path) => router.push(path)}
      />
    </DashboardLayout>
  );
}
