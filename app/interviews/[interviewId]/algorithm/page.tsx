"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { InterviewAlgorithmPage } from "@/components/pages/interview-algorithm";
import { useRouter } from "next/navigation";

interface InterviewAlgorithmEditorRouteProps {
  params: {
    interviewId: string;
  };
}

export default function InterviewAlgorithmEditorRoute({
  params,
}: InterviewAlgorithmEditorRouteProps) {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <DashboardLayout fluid>
      <InterviewAlgorithmPage
        interviewId={params.interviewId}
        onNavigate={handleNavigate}
      />
    </DashboardLayout>
  );
}
