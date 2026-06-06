"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { MockInterviewResultsPage } from "@/components/pages/mock-interview-results";
import { useParams, useRouter } from "next/navigation";

export default function MockInterviewResultsPageRoute() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  if (!id) return null;

  return (
    <DashboardLayout>
      <MockInterviewResultsPage sessionId={id} onNavigate={handleNavigate} />
    </DashboardLayout>
  );
}
