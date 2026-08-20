"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PathGlyph } from "@/components/path-glyph";
import { analytics } from "@/lib/analytics";
import { routes } from "@/lib/routes";
import { stripHtmlTags } from "@/lib/html-utils";
import type { ContinueLearningItem } from "@/lib/data";
import type { PathSession } from "@/lib/path-types";
import { ArrowRight, Compass, Loader2, Play } from "lucide-react";

interface ResumeHeroProps {
  item: ContinueLearningItem | null;
  pathSession: PathSession | null;
}

export function ResumeHero({ item, pathSession }: ResumeHeroProps) {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);

  // ---- empty state: no active path → start the journey ----
  if (!item) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Compass className="h-6 w-6 text-primary" />
        </div>
        <h2 className="mt-4 text-lg font-bold">Start building</h2>
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
    const { slug } = item;
    analytics.track("click_resume_learning_path", {
      id: item.id,
      slug,
      title: item.title,
      progress: item.progress,
      fromDashboard: true,
    });

    // Show the loading state for EVERY resume path (not just the milestone walk).
    // The button navigates via router.push, so the spinner stays until this
    // component unmounts on the new route — feedback the moment the user clicks.
    setNavigating(true);

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

    // No session cursor yet (first visit, or it has not loaded). The
    // workspace resolves its own resume point server-side, so hand it the path
    // and let it decide — this used to fetch the milestone and walk
    // courses→chapters→videos here to find the first incomplete lesson, which
    // duplicated that resolution client-side AND could only ever land on a
    // VIDEO, never the quiz or exercise the learner actually stopped on.
    router.push(routes.pathWorkspace(slug));

    // No finally reset: every branch above navigates, so the spinner should
    // stay until this component unmounts on the new route.
  };

  const pathPct = pathSession?.path.progressPct ?? item.progress;

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
          <p className="eyebrow-mono text-primary">
            Pick up where you left off
          </p>
          <h2 className="mt-1 truncate text-xl font-bold tracking-tight">
            {item.title}
          </h2>
          {item.subtitle && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {stripHtmlTags(item.subtitle)}
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
        <div className="flex flex-shrink-0 gap-2 sm:w-48 sm:flex-col">
          <Button
            onClick={handleResume}
            disabled={navigating}
            className="w-full gap-1.5"
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
        </div>
      </div>
    </div>
  );
}
