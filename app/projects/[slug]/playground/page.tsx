"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { ProjectPlaygroundPage } from "@/components/pages/project-playground";
import { useParams, useRouter } from "next/navigation";

type ProjectPlaygroundPageRouteProps = {
  slug: string;
};

export default function ProjectPlaygroundPageRoute() {
  const router = useRouter();
  const { slug } = useParams() as ProjectPlaygroundPageRouteProps;

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <DashboardLayout fluid>
      <ProjectPlaygroundPage slug={slug} onNavigate={handleNavigate} />
    </DashboardLayout>
  );
}
