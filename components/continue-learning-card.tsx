"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { type ContinueLearningItem } from "@/lib/data";
import { BookOpen, ArrowRight, Loader2 } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { routes } from "@/lib/routes";

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-muted rounded-full h-1.5">
      <div
        className="bg-primary h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex gap-4 p-5 rounded-xl border border-border bg-card animate-pulse">
      <div className="w-24 h-24 rounded-lg bg-muted flex-shrink-0" />
      <div className="flex-1 space-y-3 py-1">
        <div className="h-2.5 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-1.5 bg-muted rounded w-full" />
        <div className="flex gap-2">
          <div className="h-9 bg-muted rounded w-36" />
          <div className="h-9 bg-muted rounded w-28" />
        </div>
      </div>
    </div>
  );
}

export function ContinueLearningCard() {
  const store = useAppStore();
  const router = useRouter();
  const [item, setItem] = useState<ContinueLearningItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const milestoneCache = useRef<Record<string, any>>({});

  useEffect(() => {
    store
      .getContinueLearning()
      .then((data) => setItem(data ?? null))
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [store]);

  if (loading) return <Skeleton />;
  if (!item) return null;

  /**
   * Exact same logic as navigateToFirstUncompletedVideo in learning-path-detail.tsx:
   * 1. Fetch milestone for the current topic (cached)
   * 2. Collect completed video IDs from userTopic.completedItems
   * 3. Walk courses → chapters → videos, navigate to first uncompleted
   * 4. Fallback to last video, then path detail
   */
  const handleResume = async () => {
    const { slug, currentTopicId } = item;

    analytics.track("click_resume_learning_path", {
      id: item.id,
      slug,
      title: item.title,
      progress: item.progress,
      fromDashboard: true,
    });

    if (!currentTopicId) {
      router.push(routes.pathContinue(slug));
      return;
    }

    setNavigating(true);
    try {
      const milestone =
        milestoneCache.current[currentTopicId] ??
        (await store.getMilestone(slug, currentTopicId));
      milestoneCache.current[currentTopicId] = milestone;

      const completedVideoIds = new Set<string>(
        (milestone?.userTopic?.completedItems ?? [])
          .filter((ci: any) => ci.itemType === "VIDEO")
          .map((ci: any) => ci.itemId),
      );

      const courses: any[] = milestone?.courses ?? [];

      for (const course of courses) {
        const chapters: any[] = course.chapters ?? [];
        for (const chapter of chapters) {
          const videos: any[] = chapter.videos ?? [];
          for (const video of videos) {
            if (!completedVideoIds.has(video.id)) {
              router.push(
                routes.pathVideoWatch(
                  slug,
                  currentTopicId,
                  course.slug,
                  chapter.slug,
                  video.slug,
                ),
              );
              return;
            }
          }
        }
      }

      // All videos complete — land on the last video of the last chapter
      const lastCourse = courses[courses.length - 1];
      const lastChapter =
        lastCourse?.chapters?.[lastCourse.chapters.length - 1];
      const lastVideo = lastChapter?.videos?.[lastChapter.videos.length - 1];
      if (lastVideo) {
        router.push(
          routes.pathVideoWatch(
            slug,
            currentTopicId,
            lastCourse.slug,
            lastChapter.slug,
            lastVideo.slug,
          ),
        );
      } else {
        router.push(routes.pathContinue(slug));
      }
    } catch {
      router.push(routes.pathContinue(slug));
    } finally {
      setNavigating(false);
    }
  };

  const handleSyllabus = () => {
    router.push(routes.pathContinue(item.slug));
  };

  return (
    <div className="flex flex-col sm:flex-row gap-5 p-5 rounded-xl border border-border bg-card">
      {/* Thumbnail */}
      <div className="w-full sm:w-28 h-40 sm:h-28 rounded-lg overflow-hidden flex-shrink-0 bg-muted relative">
        {item.banner ? (
          <Image
            src={item.banner}
            alt={item.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <p className="text-xs font-semibold tracking-widest uppercase text-primary">
          Continue where you left off
        </p>

        <h3 className="font-bold text-lg leading-tight truncate">
          {item.title}
        </h3>

        {item.subtitle && (
          <p className="text-sm text-muted-foreground truncate">
            {item.subtitle}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1">
          <ProgressBar value={item.progress} />
          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
            {item.progress}% complete
          </span>
        </div>

        <div className="flex items-center gap-3 mt-1">
          <Button
            size="sm"
            onClick={handleResume}
            disabled={navigating}
            className="gap-1.5"
          >
            {navigating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading…
              </>
            ) : (
              <>
                Resume learning
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSyllabus}
            className="gap-1.5"
          >
            <BookOpen className="h-3.5 w-3.5" />
            View syllabus
          </Button>
        </div>
      </div>
    </div>
  );
}
