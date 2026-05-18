"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { DeveloperPortfolioPage } from "@/components/pages/developer-portfolio";
import { useRouter, useParams } from "next/navigation";

export default function PortfolioPageRoute() {
  const router = useRouter();
  const params = useParams();
  const userId = (params?.userId ?? "") as string;

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <DashboardLayout>
      <DeveloperPortfolioPage userId={userId} onNavigate={handleNavigate} />
    </DashboardLayout>
  );
}
