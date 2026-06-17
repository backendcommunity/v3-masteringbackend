"use client";

// TEMP preview route for CourseExercisePage (mock data, self-contained).
// Visit /preview/exercise. Delete this file when done — not for production.
import { DashboardLayout } from "@/components/dashboard-layout";
import { CourseExercisePage } from "@/components/pages/course-exercise";
import { useRouter } from "next/navigation";

export default function ExercisePreviewRoute() {
  const router = useRouter();
  return (
    <DashboardLayout>
      <CourseExercisePage
        courseId="preview-course"
        exerciseId="preview-exercise"
        onNavigate={(path) => router.push(path)}
      />
    </DashboardLayout>
  );
}
