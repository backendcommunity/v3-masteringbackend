"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { InterviewProjectPage } from "@/components/pages/interview-project";
import { useRouter } from "next/navigation";

interface InterviewProjectEditorRouteProps {
  params: {
    interviewId: string;
  };
}

export default function InterviewProjectEditorRoute({
  params,
}: InterviewProjectEditorRouteProps) {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <DashboardLayout fluid>
      <InterviewProjectPage
        interviewId={params.interviewId}
        onNavigate={handleNavigate}
      />
    </DashboardLayout>
  );
}
