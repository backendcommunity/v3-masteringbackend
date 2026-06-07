"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { JDPreparePage } from "@/components/pages/mock-interviews/jd-prepare-page";
import { useRouter } from "next/navigation";

export default function PrepareInterviewPage() {
  const router = useRouter();
  return (
    <DashboardLayout>
      <JDPreparePage onNavigate={(path) => router.push(path)} />
    </DashboardLayout>
  );
}
