"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PathGlyph } from "@/components/path-glyph";
import { useAppStore } from "@/lib/store";
import { analytics } from "@/lib/analytics";
import { routes } from "@/lib/routes";
import type { ContinueLearningItem } from "@/lib/data";
import type { PathSession, PathSessionStep } from "@/lib/path-types";
import { ArrowRight, BookOpen, Compass, Loader2, Play, Target } from "lucide-react";

interface ResumeHeroProps {
  item: ContinueLearningItem | null;
  pathSession: PathSession | null;
  gateStep: PathSessionStep | null;
}

export function ResumeHero({ item, pathSession, gateStep }: ResumeHeroProps) {
  const store = useAppStore();
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);
  const milestoneCache = useRef<Record<string, any>>({});

  // ---- empty state: no active path → start the journey ----
  if (!item) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Compass className="h-6 w-6 text-primary" />
        </div>
        <h2 className="mt-4 text-lg font-bold">Start your journey</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Pick a learning path and we&apos;ll keep your spot here every time you
          come back.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Button onClick={() => router.push(routes.paths)} className="gap-1.5">
            Browse paths <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(routes.courses)}
          >
            Explore courses
          </Button>
        </div>
      </div>
    );
  }

  const handleResume = async () => {
    const { slug, currentTopicId } = item;
    analytics.track("click_resume_learning_path", {
      id: item.id,
      slug,
      title: item.title,
      progress: item.progress,
      fromDashboard: true,
    });

    // Exact resume: the path session knows the precise step the learner stopped
    // on (any type — video, quiz, exercise, project…), not just the next video.
    const resumeStepId =
      pathSession?.cursor.resumeStepId ??
      pathSession?.cursor.currentStepId ??
      pathSession?.cursor.nextStepId;
    if (resumeStepId) {
      router.push(routes.pathWorkspace(slug, resumeStepId));
      return;
    }

    // Fallback (no live session): first-uncompleted-video walk via the milestone.
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
        for (const chapter of course.chapters ?? []) {
          for (const video of chapter.videos ?? []) {
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

  const pathPct = pathSession?.path.progressPct ?? item.progress;
  const pathTitle = pathSession?.path.title ?? item.title;

  const gateLabel =
    gateStep?.type === "QUIZ"
      ? `Take ${gateStep.title} (≥80%) →`
      : gateStep
        ? `${gateStep.title} unlocks what's next →`
        : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_18px_rgba(14,31,51,0.05)]">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
        {/* Cover — consistent path glyph for every path (banner ignored) */}
        <div className="relative flex h-32 w-full flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#0E1F33] text-white sm:h-24 sm:w-36">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,.25) 1.5px, transparent 1.5px)",
              backgroundSize: "15px 15px",
            }}
          />
          <PathGlyph className="relative h-12 w-12" />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
            Pick up where you left off
          </p>
          <h2 className="mt-1 truncate text-xl font-extrabold tracking-tight">
            {item.title}
          </h2>
          {item.subtitle && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {item.subtitle}
            </p>
          )}
          <div className="mt-3 h-2 max-w-md overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pathPct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {pathPct}% complete
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-shrink-0 gap-2 sm:flex-col">
          <Button
            onClick={handleResume}
            disabled={navigating}
            className="flex-1 gap-1.5 sm:flex-none"
          >
            {navigating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" /> Resume
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(routes.pathContinue(item.slug))}
            className="flex-1 gap-1.5 sm:flex-none"
          >
            <BookOpen className="h-4 w-4" /> Syllabus
          </Button>
        </div>
      </div>

      {/* Path-gate footer */}
      <button
        type="button"
        onClick={() =>
          router.push(
            gateStep
              ? routes.pathWorkspace(item.slug, gateStep.id)
              : routes.pathContinue(item.slug),
          )
        }
        className="flex w-full items-center gap-2 border-t border-border bg-muted/30 px-5 py-3 text-left text-[13px] text-muted-foreground transition-colors hover:bg-muted/50 sm:px-6"
      >
        <Target className="h-4 w-4 flex-shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          You&apos;re <b className="text-foreground">{pathPct}% through {pathTitle}</b>
          {gateLabel ? (
            <>
              {" "}
              — <span className="font-semibold text-primary">{gateLabel}</span>
            </>
          ) : (
            " — keep going to your next milestone →"
          )}
        </span>
      </button>
    </div>
  );
}
