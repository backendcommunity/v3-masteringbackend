"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Loader } from "@/components/ui/loader";
import { routes } from "@/lib/routes";

type CourseWatchRouteParams = {
  slug: string;
  chapterId: string;
  videoId: string;
};

// Legacy watch URL → new full-bleed course workspace. The watch page no longer
// renders its own UI: it resolves the session step that matches the old
// chapter/video slugs and redirects to /courses/:slug/learn/:stepId so old
// links keep working. Kept intentionally minimal (a client redirector).
export default function CourseWatchRedirectRoute() {
  const router = useRouter();
  const store = useAppStore();
  const {
    slug,
    chapterId: chapterSlug,
    videoId: videoSlug,
  } = useParams() as CourseWatchRouteParams;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const session = await store.getCourseSession(slug);

        // Find the VIDEO step matching the legacy video slug, looking across
        // the fields a video step exposes (itemId, url, payload endpoint).
        const needle = (videoSlug ?? chapterSlug ?? "").toLowerCase();
        const match =
          (needle &&
            session?.steps?.find((s) =>
              [s.itemId, s.url, s.payloadRef?.endpoint]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(needle)),
            )) ||
          undefined;

        // Fall back to the resume/first step so the link still lands the
        // learner inside the course workspace even if the slug can't be matched.
        const target =
          match?.id ??
          session?.cursor?.resumeStepId ??
          session?.steps?.[0]?.id;

        if (cancelled) return;

        if (target) {
          router.replace(
            `/courses/${slug}/learn/${encodeURIComponent(target)}`,
          );
        } else {
          router.replace(routes.courseDetail(slug));
        }
      } catch {
        if (!cancelled) router.replace(routes.courseDetail(slug));
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, chapterSlug, videoSlug]);

  return (
    <main className="h-screen overflow-hidden bg-background">
      <Loader />
    </main>
  );
}
