"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { RoadmapVideoWatchPage } from "@/components/pages/path-video-watch";
import { routes } from "@/lib/routes";
import { useParams, useRouter } from "next/navigation";

export default function PathVideoWatchRoute() {
  const router = useRouter();
  const { pathId, topicId, courseSlug, chapterId, videoId } = useParams() as {
    pathId: string;
    topicId: string;
    courseSlug: string;
    chapterId: string;
    videoId: string;
  };

  return (
    <DashboardLayout>
      <RoadmapVideoWatchPage
        slug={pathId}
        topicId={topicId}
        courseId={courseSlug}
        chapterId={chapterId}
        videoId={videoId}
        onNavigate={(path) => router.push(path)}
        routeBuilder={(cs, ch, vs) =>
          routes.pathVideoWatch(pathId, topicId, cs, ch, vs)
        }
        backUrl={routes.pathContinue(pathId)}
      />
    </DashboardLayout>
  );
}
