"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { RoadmapVideoWatchPage } from "@/components/pages/path-video-watch";
import { useParams, useRouter } from "next/navigation";

export default function RoadmapVideoWatchRoute({}) {
  const router = useRouter();
  const { slug, videoId, course, chapterId, topicId } = useParams() as {
    slug: string;
    videoId: string;
    topicId: string;
    course: string;
    chapterId: string;
  };
  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <DashboardLayout>
      <RoadmapVideoWatchPage
        slug={slug}
        topicId={topicId}
        courseId={course}
        chapterId={chapterId}
        videoId={videoId}
        onNavigate={handleNavigate}
      />
    </DashboardLayout>
  );
}
