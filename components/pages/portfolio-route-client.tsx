"use client";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DeveloperPortfolioPage } from "@/components/pages/developer-portfolio";
import type { PortfolioResponse } from "@/lib/portfolio-types";

interface PortfolioRouteClientProps {
  userId: string;
  initialData?: PortfolioResponse;
}

export function PortfolioRouteClient({
  userId,
  initialData,
}: PortfolioRouteClientProps) {
  const router = useRouter();
  const handleNavigate = (path: string) => router.push(path);

  return (
    <DashboardLayout>
      <DeveloperPortfolioPage
        userId={userId}
        onNavigate={handleNavigate}
        initialData={initialData}
      />
    </DashboardLayout>
  );
}
