"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { MockInterviewResultsPage } from "@/components/pages/mock-interview-results";
import { useParams, useRouter } from "next/navigation";

type MockInterviewResultsPageRouteProps = {
  id: string;
};

export default function MockInterviewResultsPageRoute() {
  const router = useRouter();
  const params = useParams<MockInterviewResultsPageRouteProps>();
  const id = params?.id ?? "";

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <DashboardLayout>
      <MockInterviewResultsPage sessionId={id} onNavigate={handleNavigate} />
    </DashboardLayout>
  );
}
