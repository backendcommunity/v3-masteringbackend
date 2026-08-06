"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Play,
  CheckCircle2,
  Clock,
  BookOpen,
  Lock,
  Brain,
  Code,
  BadgeIcon as Certificate,
  Trophy,
  Star,
  Sparkles,
  BarChart3,
  Loader2,
  RotateCcw,
  Share2,
  Link as LinkIcon,
  Wrench,
  FileText,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { analytics } from "@/lib/analytics";
import { routes } from "@/lib/routes";
import { ContentComingSoon } from "@/components/content-coming-soon";
import { stripHtmlTags } from "@/lib/html-utils";
import { sanitizeHtml } from "@/lib/sanitize";
import { isCredibleLearnerCount } from "@/lib/social-proof";
import { Chapter, Course, Video } from "@/lib/data";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { ScheduleWidget } from "@/components/schedule/ScheduleWidget";

interface CourseDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export function CourseDetailPage({ slug, onNavigate }: CourseDetailPageProps) {
  const store = useAppStore();
  const user = useUser();
  const [course, setCourse] = useState<Course>();
  const { updateCourse } = store;
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    setLoading(true);
    async function findCourse(slug: string) {
      const course = await store.getCourse(slug);
      setCourse(course);
      setLoading(false);
      if (course) {
        analytics.track("course_viewed", {
          courseId: course.id,
          courseTitle: course.title,
          isEnrolled: course.enrolled ?? false,
        });
      }
    }
    findCourse(slug);
  }, [slug]);

  const isChapterCompleted = (chapterId: string) => {
    return course?.userCourse?.userChapters?.find(
      (ch: any) => ch.chapterId === chapterId,
    )?.isCompleted;
  };

  const handlePurchase = async (
    courseId: string,
    method: "subscription" | "individual" | "mb",
    success: boolean,
  ) => {
    if (!course || !success) return;

    switch (method) {
      case "subscription":
        onNavigate(routes.subscriptionPlans);
        break;
      case "individual": {
        try {
          await store.handleCourseEnrollment(courseId);
        } catch {
          // Webhook may have already enrolled; proceed regardless
        }
        setCourse((prev) => (prev ? { ...prev, enrolled: true } : prev));
        const firstChapter = course.chapters?.[0];
        const firstVideo = firstChapter?.videos?.[0];
        if (firstChapter && firstVideo) {
          onNavigate(
            routes.courseWatch(slug, firstChapter.slug, firstVideo.slug),
          );
          return;
        }
        break;
      }
      case "mb":
        setCourse((prev) => (prev ? { ...prev, enrolled: true } : prev));
        break;
    }

    toast.success("You have successfully enrolled");
  };

  const handleEnrollNow = async () => {
    try {
      analytics.track("course_enroll_clicked", {
        courseId: course?.id,
        courseTitle: course?.title,
        isPremium: course?.isPremium,
      });
      setEnrolling(true);
      const data = await handleEnrollment(course?.id!);
      if (!data) {
        toast.error("An error occurred. Please try again");
        return;
      }
      updateCourse(slug, { ...course, enrolled: true, userCourse: data });
      Object.assign(course!, { enrolled: true });

      // Enrolled + checks passed → drop the learner straight into lesson one.
      const firstChapter = course?.chapters?.[0];
      const firstVideo = firstChapter?.videos?.[0];
      if (firstChapter) {
        onNavigate(routes.courseWatch(slug, firstChapter.slug, firstVideo?.slug));
        return;
      }
      toast.success("You have successfully enrolled");
    } catch (error: any) {
      const e = error?.response?.message ?? error?.message;
      toast.error(e ?? "An error occurred");
    } finally {
      setEnrolling(false);
    }
  };

  const handleEnrollment = async (courseId: string) => {
    const data = await store.handleCourseEnrollment(courseId);
    return data;
  };

  const handleFreeChapterClick = async (chapter: Chapter) => {
    try {
      const data = await store.handleCourseEnrollment(course?.id!, true);
      if (data) {
        updateCourse(slug, { ...course, enrolled: true, userCourse: data });
        Object.assign(course!, { enrolled: true });
      }
      const firstVideo = chapter.videos?.[0];
      onNavigate(routes.courseWatch(slug, chapter.slug, firstVideo?.slug));
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? "Could not enroll. Please try again.");
    }
  };

  const handleContinueLearning = () => {
    // Navigate to first incomplete chapter or continue from current

    const userChapters = course?.userCourse?.userChapters;
    const userVideos = course?.userCourse?.userVideos;

    const watchedVideoIds = new Set(
      userVideos?.filter((v) => v.isCompleted)?.map((v) => v.videoId),
    );
    const watchedChapterIds = new Set(
      userChapters?.filter((c) => c.isCompleted)?.map((v) => v.chapterId),
    );

    const nextChapter =
      course?.chapters.find((c) => !watchedChapterIds.has(c.id)) ||
      course?.chapters?.[0];
    const nextVideo =
      nextChapter?.videos?.find((v: Video) => !watchedVideoIds.has(v.id)) ||
      nextChapter?.videos?.[0];

    const watchPath = routes.courseWatch(
      slug,
      nextChapter?.slug!,
      nextVideo?.slug,
    );

    onNavigate(watchPath);
  };

  const handleChapterClick = (chapter: Chapter, index: number) => {
    if (course?.enrolled) {
      onNavigate(routes.courseWatch(slug, chapter.slug, chapter?.videos[0]?.slug));
    } else if (!chapter.isPremium) {
      handleFreeChapterClick(chapter);
    } else {
      handleEnrollNow();
    }
  };

  const isCompleted = course?.progress! >= 100;
  const canEarnCertificate = course?.enrolled && isCompleted;

  if (loading) return <PageSkeleton />;

  if ((course as any)?.isWaiting) {
    return (
      <ContentComingSoon
        title={course?.title}
        summary={(course?.summary || "").replace(/<[^>]+>/g, "")}
        waitingLink={(course as any)?.waitingLink}
        kindLabel="course"
        backLabel="Browse Courses"
        onBack={() => onNavigate(routes.courses)}
        onWaitlistTrack={() =>
          analytics.track("course_waitlist_clicked", { title: course?.title })
        }
      />
    );
  }

  const courseLevel = course?.level || "Beginner";
  const totalVideos =
    course?.chapters?.reduce(
      (sum: number, ch: any) => sum + (ch.videos?.length || 0),
      0,
    ) ?? 0;
  const courseProgress = course?.progress ?? 0;
  const totalMb =
    course?.chapters?.reduce(
      (sum: number, ch: any) =>
        sum +
        (ch.videos?.reduce(
          (s: number, v: any) => s + (v.mb || 0),
          0,
        ) || 0) +
        (ch.exercise?.points || 0),
      0,
    ) ?? 0;

  // ── Share helpers ──
  const shareUrl = `https://courses.masteringbackend.com/courses/${slug}?ref=app`;
  const shareText = `Check out the ${course?.title} course on MasteringBackend`;
  const openShare = (network: string, url: string) => {
    analytics.track("course_share_clicked", { courseId: course?.id, network });
    window.open(url, "_blank", "noopener,noreferrer");
  };
  const shareLinkedIn = () =>
    openShare(
      "linkedin",
      `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(`${course?.title} course`)}&summary=${encodeURIComponent(`${shareText} @masteringbackend`)}`,
    );
  const shareX = () =>
    openShare(
      "x",
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`${shareText} @master_backend`)}`,
    );
  const shareFacebook = () =>
    openShare(
      "facebook",
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    );
  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  const chapterBadgeCls =
    "inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted-foreground/20";

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      {/* Blueprint hero — navy anchor; the grid lives here only */}
      <div className="overflow-hidden dark:ring-1 dark:ring-white/10">
        <div className="bg-[#0E1F33] dark:bg-[#080F1A] text-white relative">
          <div className="hero-grid absolute inset-0" aria-hidden="true" />
          <div className="relative px-5 py-6 sm:px-8 sm:py-7">
            <div className="eyebrow-mono text-white/[.55]">course</div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-1.5">{course?.title}</h1>

            <div className="mt-4">
              {course?.enrolled ? (
                <button
                  onClick={handleContinueLearning}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold px-5 py-2.5 text-sm hover:bg-primary/90 transition"
                >
                  <Play className="w-4 h-4" /> Continue Course
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <button
                    disabled={enrolling}
                    onClick={handleEnrollNow}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold px-5 py-2.5 text-sm hover:bg-primary/90 transition disabled:opacity-60"
                  >
                    {enrolling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {enrolling ? "Enrolling…" : "Start Learning"}
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 mt-5 text-sm text-white/[.78]">
              <span className="inline-flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 opacity-70" />
                {courseLevel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-4 h-4 opacity-70" />
                {course?.totalDuration ?? 0} hours
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 opacity-70" />
                {course?.chapters?.length ?? 0} chapters
              </span>
              {totalVideos > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Play className="w-4 h-4 opacity-70" />
                  {totalVideos} videos
                </span>
              )}
              {totalMb > 0 && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-400/90 text-amber-950">
                  {totalMb} MB to earn
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Completion strip — the hero earns its keep (enrolled only) */}
        {course?.enrolled && (
          <div className="text-white px-5 sm:px-8 py-4 bg-[#0A1726] dark:bg-[#05080F]">
            <div className="eyebrow-mono text-white/[.5] mb-2">
              course completion
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full overflow-hidden bg-white/[.12]">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${courseProgress}%` }}
                />
              </div>
              <span className="text-sm font-semibold">{courseProgress}%</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Course description (rich HTML — collapsible, can be large) */}
          {(() => {
            const html = course?.description || course?.summary || "";
            if (!html) return null;
            const isLong = stripHtmlTags(html).length > 280;
            return (
              <div>
                <h3 className="font-semibold text-[15px] mb-2">
                  Course description
                </h3>
                <div className="relative">
                  <article
                    className={`prose-sm max-w-3xl text-sm leading-relaxed text-muted-foreground [&_a]:text-amber-600 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:mt-3 [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:mt-1 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-2 [&_pre]:mt-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-zinc-900 [&_pre]:p-3 [&_pre]:text-zinc-100 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 ${
                      isLong && !descExpanded
                        ? "max-h-[15rem] overflow-hidden"
                        : ""
                    }`}
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
                  />
                  {isLong && !descExpanded && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background to-transparent" />
                  )}
                </div>
                {isLong && (
                  <button
                    onClick={() => setDescExpanded((v) => !v)}
                    className="mt-2 text-sm font-medium text-primary hover:underline"
                  >
                    {descExpanded ? "Show less" : "Show more"}
                  </button>
                )}
              </div>
            );
          })()}

          {/* Tags */}
          {course?.tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {course?.tags?.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}

          {/* Curriculum timeline (chapters → accordion items) */}
          <Card>
            <CardHeader>
              <CardTitle>Course Curriculum</CardTitle>
              <CardDescription>
                {course?.chapters?.length ?? 0} chapters ·{" "}
                {course?.totalDuration ?? 0} total hours
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-0">
              <div className="relative px-4 py-3">
                <div className="absolute left-[1.625rem] top-5 bottom-5 w-px bg-border" />
                <Accordion type="single" collapsible className="space-y-3">
                  {course?.chapters?.map((chapter: Chapter, index) => {
                    const completed = isChapterCompleted(chapter.id);
                    const accessible = course?.enrolled || !chapter.isPremium;
                    const num = index + 1;
                    const numBgCls = completed ? "bg-emerald-600" : "bg-foreground";
                    return (
                      <AccordionItem
                        key={chapter.id}
                        value={chapter.id}
                        id={`chapter-${chapter.id}`}
                        className="border-0 scroll-mt-6"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`relative z-10 mt-4 w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-background ${
                              completed ? "bg-emerald-600" : "bg-foreground/20"
                            }`}
                          />
                          <div className="flex-1 rounded-xl border bg-card shadow-sm overflow-hidden">
                            <AccordionTrigger className="w-full px-4 py-4 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/10">
                              <div className="space-y-1.5 text-left flex-1 pr-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={chapterBadgeCls}>Chapter</span>
                                  {completed && (
                                    <Badge className="bg-emerald-600 text-[10px] py-0 px-1.5 h-auto text-white hover:bg-emerald-700">
                                      ✓ Done
                                    </Badge>
                                  )}
                                  {(chapter.quizzes?.length ?? 0) > 0 && (
                                    <span className={chapterBadgeCls}>Quiz</span>
                                  )}
                                  {chapter.exercise && (
                                    <span className={chapterBadgeCls}>
                                      Exercise
                                    </span>
                                  )}
                                  {chapter.playground && (
                                    <span className={chapterBadgeCls}>
                                      Playground
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white ${numBgCls}`}
                                  >
                                    {String(num).padStart(2, "0")}
                                  </span>
                                  <span className="font-bold text-sm leading-snug">
                                    {chapter.title}
                                  </span>
                                  {!accessible && (
                                    <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                  )}
                                </div>
                                {chapter.duration && (
                                  <p className="text-xs text-muted-foreground">
                                    {chapter.duration}
                                  </p>
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4 pt-0">
                              <div className="border-t pt-3 space-y-3">
                                {(chapter.summary || chapter.description) && (
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {stripHtmlTags(
                                      chapter.summary || chapter.description,
                                    )}
                                  </p>
                                )}
                                {(() => {
                                  const items: {
                                    icon: any;
                                    label: string;
                                    mb?: number;
                                    order?: number;
                                  }[] = [];
                                  const videoItems = (chapter.videos || []).map(
                                    (v) => ({
                                      icon: Play,
                                      label: v.title,
                                      mb: v.mb,
                                      order: v.order,
                                    }),
                                  );
                                  const articleItems = (
                                    chapter.articles || []
                                  ).map((a) => ({
                                    icon: FileText,
                                    label: a.title,
                                    order: a.order,
                                  }));
                                  const merged = [
                                    ...videoItems,
                                    ...articleItems,
                                  ].sort(
                                    (x, y) =>
                                      (x.order ?? Infinity) -
                                      (y.order ?? Infinity),
                                  );
                                  merged.forEach((item) => items.push(item));
                                  (chapter.quizzes || []).forEach((q) =>
                                    items.push({ icon: Brain, label: q.title }),
                                  );
                                  if (chapter.exercise)
                                    items.push({
                                      icon: Code,
                                      label: chapter.exercise.title,
                                      mb: chapter.exercise.points,
                                    });
                                  if (chapter.playground)
                                    items.push({
                                      icon: Wrench,
                                      label:
                                        chapter.playground.title || "Playground",
                                    });
                                  if (!items.length) return null;
                                  return (
                                    <ul className="space-y-1.5">
                                      {items.map((it, i) => {
                                        const Icon = it.icon;
                                        return (
                                          <li
                                            key={i}
                                            className="flex items-center gap-2 text-sm"
                                          >
                                            <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                            <span className="flex-1 truncate text-foreground/80">
                                              {it.label}
                                            </span>
                                            {it.mb ? (
                                              <span className="flex-shrink-0 text-[11px] font-semibold text-amber-600">
                                                +{it.mb} MB
                                              </span>
                                            ) : null}
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  );
                                })()}
                                {completed ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs w-full"
                                    onClick={() =>
                                      handleChapterClick(chapter, index)
                                    }
                                  >
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Review Chapter
                                  </Button>
                                ) : accessible ? (
                                  <Button
                                    size="sm"
                                    className="h-8 text-xs w-full"
                                    onClick={() =>
                                      handleChapterClick(chapter, index)
                                    }
                                  >
                                    <Play className="h-3 w-3 mr-1" />
                                    {course?.enrolled ? "Continue" : "Start"}
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs w-full"
                                    disabled={enrolling}
                                    onClick={handleEnrollNow}
                                  >
                                    {enrolling ? (
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    ) : (
                                      <Lock className="h-3 w-3 mr-1" />
                                    )}
                                    {enrolling
                                      ? "Enrolling…"
                                      : "Enroll to Unlock"}
                                  </Button>
                                )}
                              </div>
                            </AccordionContent>
                          </div>
                        </div>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 self-start">
          {/* Primary action — buy (cold) or continue (warm) */}
          {course?.enrolled ? (
            <>
              {/* Continue card */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-semibold text-[15px]">
                    Your progress
                  </span>
                  <span className="font-bold text-primary">
                    {courseProgress}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-muted mb-4">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${courseProgress}%` }}
                  />
                </div>
                <button
                  onClick={handleContinueLearning}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold px-5 py-2.5 text-sm hover:bg-primary/90 transition"
                >
                  <Play className="w-4 h-4" />
                  {/* Enrolled → always "Continue Learning", regardless of % */}
                  Continue Learning
                </button>
              </div>

              {course?.userCourse?.id && (
                <ScheduleWidget courseId={course.userCourse.id} />
              )}
            </>
          ) : (
            /* Buy card */
            <div className="rounded-2xl border border-border bg-card p-5">
              {(() => {
                // Social proof for a young catalog: never expose tiny absolute
                // counts (2–3 learners reads as "nobody's here" — negative
                // proof). Only surface a learner count once it's credible;
                // below that, lead with novelty + risk reversal. Threshold is
                // shared across course / path / project — see lib/social-proof.
                const learners = course?.totalStudents || course?.students || 0;
                const rating = course?.rating || 0;
                const showLearners = isCredibleLearnerCount(learners);
                const showRating = rating > 0;
                if (showLearners || showRating) {
                  return (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                      {showRating && (
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          {rating.toFixed(1)}
                        </span>
                      )}
                      {showLearners && (
                        <span>{learners.toLocaleString()} learners</span>
                      )}
                    </div>
                  );
                }
                // No credible numbers yet → freshness framing, not fake counts.
                return (
                  <div className="flex items-center gap-2 text-sm mb-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                      <Sparkles className="w-3 h-3" />
                      Newly launched
                    </span>
                    <span className="text-muted-foreground">
                      Be among the first to complete it
                    </span>
                  </div>
                );
              })()}

              <button
                disabled={enrolling}
                onClick={handleEnrollNow}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold px-5 py-3 text-sm hover:bg-primary/90 transition disabled:opacity-60"
              >
                {enrolling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {enrolling ? "Enrolling…" : "Start Learning"}
              </button>

              <p className="mt-3 text-xs text-center text-muted-foreground">
                Cancel anytime · Earn a verified certificate
              </p>
            </div>
          )}

          {/* Certification Card */}
          <Card
            className={`rounded-2xl ${
              canEarnCertificate
                ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
                : ""
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    canEarnCertificate
                      ? "bg-emerald-100 dark:bg-emerald-950/40"
                      : "bg-primary/10"
                  }`}
                >
                  {canEarnCertificate ? (
                    <Trophy className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <Certificate className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg">Course Certificate</CardTitle>
                  <CardDescription className="text-sm">
                    {canEarnCertificate
                      ? "Ready to claim!"
                      : "Complete course to earn"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {canEarnCertificate
                    ? "Congratulations! You've completed the course and earned your certificate."
                    : "Complete all chapters and pass the final assessment to earn your verified certificate."}
                </p>

                {totalMb > 0 && (
                  <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-950/20">
                    <span className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                      <Trophy className="h-4 w-4" />
                      {canEarnCertificate ? "MB earned" : "MB to earn"}
                    </span>
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                      {totalMb} MB
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Shareable on LinkedIn</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Verifiable credential</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Industry recognized</span>
                </div>
              </div>

              {canEarnCertificate ? (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => onNavigate(routes.courseCertificate(slug))}
                >
                  <Certificate className="mr-2 h-4 w-4" />
                  View Certificate
                </Button>
              ) : course?.enrolled ? (
                <Button variant="outline" className="w-full" disabled>
                  <Certificate className="mr-2 h-4 w-4" />
                  Complete Course to Earn
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleEnrollNow}
                  disabled={enrolling}
                >
                  {enrolling ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Certificate className="mr-2 h-4 w-4" />
                  )}
                  {enrolling ? "Enrolling..." : "Enroll to Earn Certificate"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Share — demoted below the primary action + certificate */}
          {(() => {
            const tileCls =
              "flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border py-3 text-xs font-semibold text-muted-foreground transition-colors";
            return (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-[15px] mb-1">
                  <Share2 className="w-4 h-4" />
                  Share this course
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Help a friend level up their backend skills.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={shareLinkedIn}
                    aria-label="Share on LinkedIn"
                    className={`${tileCls} hover:border-[#0A66C2] hover:bg-[#0A66C2] hover:text-white`}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.3c0-1.27-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.8V21h-4z" />
                    </svg>
                    LinkedIn
                  </button>
                  <button
                    onClick={shareX}
                    aria-label="Share on X"
                    className={`${tileCls} hover:border-foreground hover:bg-foreground hover:text-background`}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    X
                  </button>
                  <button
                    onClick={shareFacebook}
                    aria-label="Share on Facebook"
                    className={`${tileCls} hover:border-[#1877F2] hover:bg-[#1877F2] hover:text-white`}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.86.24-1.45 1.48-1.45H17V4.1c-.27-.04-1.2-.12-2.28-.12-2.26 0-3.8 1.38-3.8 3.9V10H8.2v3h2.72v8z" />
                    </svg>
                    Facebook
                  </button>
                </div>
                <button
                  onClick={copyShareLink}
                  aria-label="Copy link"
                  className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <LinkIcon className="w-4 h-4" />
                  Copy link
                </button>
              </div>
            );
          })()}
        </div>
      </div>

    </div>
  );
}
