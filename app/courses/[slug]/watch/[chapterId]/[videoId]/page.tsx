"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { CourseWatchPage } from "@/components/pages/course-watch";
import { useParams, useRouter } from "next/navigation";
import React from "react";

type CourseWatchPageRouteProps = {
  slug: string;
  chapterId: string;
  videoId: string;
};

export default function CourseWatchPageRoute() {
  const router = useRouter();

  const {
    slug,
    chapterId: chapterSlug,
    videoId: videoSlug,
  } = useParams() as CourseWatchPageRouteProps;

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <DashboardLayout fluid>
      <CourseWatchPage
        slug={slug}
        chapterSlug={chapterSlug}
        videoSlug={videoSlug}
        onNavigate={handleNavigate}
      />
    </DashboardLayout>
  );
}
