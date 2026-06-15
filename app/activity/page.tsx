"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { MyActivityPage } from "@/components/pages/my-activity";
import { useRouter } from "next/navigation";

export default function ActivityPageRoute() {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <DashboardLayout>
      <MyActivityPage onNavigate={handleNavigate} />
    </DashboardLayout>
  );
}
