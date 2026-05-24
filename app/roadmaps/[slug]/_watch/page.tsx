"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { RoadmapWatchPage } from "@/components/pages/roadmap-watch";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function RoadmapWatchInner() {
  const { slug } = useParams() as { slug: string };
  const searchParams = useSearchParams();
  const topicId = searchParams?.get("topicId") ?? "";
  const router = useRouter();

  return (
    <DashboardLayout>
      <RoadmapWatchPage slug={slug} topicId={topicId} onNavigate={(path) => router.push(path)} />
    </DashboardLayout>
  );
}

export default function RoadmapWatchPageRoute() {
  return (
    <Suspense>
      <RoadmapWatchInner />
    </Suspense>
  );
}
