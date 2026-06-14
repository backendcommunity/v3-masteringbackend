"use client";

import { useEffect, useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Gamepad2,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  BadgeIcon as Certificate,
  Trophy,
  Crown,
  Loader2,
  RotateCcw,
  Share2,
  Link as LinkIcon,
  Wrench,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { analytics } from "@/lib/analytics";
import { routes } from "@/lib/routes";
import { ContentComingSoon } from "@/components/content-coming-soon";
import DisqusCommentBlock from "../ui/comment";
import { stripHtmlTags } from "@/lib/html-utils";
import { PaymentDialog } from "../payment-dialog";
import { Chapter, Course, UserChapter, Video } from "@/lib/data";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { Loader } from "../ui/loader";
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
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

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

  const handleChapterComplete = (chapterId: string) => {
    const updatedChapters = course?.chapters.map((chapter) =>
      chapter.id === chapterId ? { ...chapter, completed: true } : chapter,
    );
    const completedCount = updatedChapters?.filter((c) => c.isCompleted).length;
    const newProgress = Math.round(
      (completedCount! / updatedChapters?.length!) * 100,
    );

    updateCourse(slug, {
      ...course,
      chapters: updatedChapters,
      progress: newProgress,
    });
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
          toast.success("Payment successful! Taking you to your first lesson…");
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
      if (!user?.isPremium && course?.isPremium) {
        setShowPaymentDialog(!showPaymentDialog);
        return;
      }
      setEnrolling(true);
      const data = await handleEnrollment(course?.id!);
      if (!data) {
        toast.error("An error occurred. Please try again");
        return;
      }
      updateCourse(slug, { ...course, enrolled: true, userCourse: data });
      Object.assign(course!, { enrolled: true });
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

  if (loading) return <Loader isLoader={false} />;

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

  // ── Share helpers ──
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `Check out the ${course?.title} course on MasteringBackend`;
  const openShare = (network: string, url: string) => {
    analytics.track("course_share_clicked", { courseId: course?.id, network });
    window.open(url, "_blank", "noopener,noreferrer");
  };
  const shareLinkedIn = () =>
    openShare(
      "linkedin",
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    );
  const shareX = () =>
    openShare(
      "x",
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
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
            <h1 className="text-3xl font-bold mt-1.5">{course?.title}</h1>

            <div className="mt-4">
              {course?.enrolled ? (
                <button
                  onClick={handleContinueLearning}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold px-5 py-2.5 text-sm hover:bg-primary/90 transition"
                >
                  <Play className="w-4 h-4" /> Continue Course
                </button>
              ) : (
                <div className="flex items-center gap-3">
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
                  <span className="text-sm text-white/[.65]">
                    {!course?.isPremium || user?.isPremium ? (
                      <>
                        Free with{" "}
                        <span className="font-semibold text-white">Pro</span>
                      </>
                    ) : (
                      <span className="font-semibold text-white">
                        {course?.amount
                          ? `$${course.amount}`
                          : "Premium membership required"}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 mt-5 text-sm text-white/[.78]">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-400/90 text-amber-950">
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
          {/* Course description (plain block below hero — mirrors paths) */}
          {(() => {
            const descriptionText = stripHtmlTags(course?.summary || "");
            const descriptionIsLong = descriptionText.length > 240;
            return descriptionText ? (
              <div>
                <h3 className="font-semibold text-[15px] mb-1.5">
                  Course description
                </h3>
                <p
                  className={`text-sm text-muted-foreground leading-relaxed max-w-3xl ${
                    descriptionIsLong && !descExpanded ? "line-clamp-3" : ""
                  }`}
                >
                  {descriptionText}
                </p>
                {descriptionIsLong && (
                  <button
                    onClick={() => setDescExpanded((v) => !v)}
                    className="mt-1 text-sm font-medium text-primary hover:underline"
                  >
                    {descExpanded ? "Show less" : "Show more"}
                  </button>
                )}
              </div>
            ) : null;
          })()}

          {/* Tags */}
          {course?.tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {course.tags.map((tag) => (
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
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] py-0 px-1.5 h-auto ${
                                      !chapter.isPremium
                                        ? "border-emerald-600 text-emerald-600"
                                        : course?.enrolled
                                          ? "border-primary text-primary"
                                          : "border-amber-600 text-amber-600"
                                    }`}
                                  >
                                    {!chapter.isPremium
                                      ? "FREE"
                                      : course?.enrolled
                                        ? "ENROLLED"
                                        : "PREMIUM"}
                                  </Badge>
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

        <div className="space-y-6">
          {/* What's inside (paths enrollCard parity) */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-semibold text-[15px] mb-3">What&apos;s inside</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="w-4 h-4" />
                  Chapters
                </span>
                <span className="font-medium">
                  {course?.chapters?.length ?? 0}
                </span>
              </div>
              {totalVideos > 0 && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Play className="w-4 h-4" />
                    Videos
                  </span>
                  <span className="font-medium">{totalVideos}</span>
                </div>
              )}
              {(course?.hasQuizzes || (course?.totalQuizzes ?? 0) > 0) && (
                <button
                  disabled={!course?.enrolled}
                  onClick={() => onNavigate(routes.courseQuizzes(slug))}
                  className="w-full flex items-center justify-between disabled:cursor-default enabled:hover:text-primary transition-colors"
                >
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Brain className="w-4 h-4" />
                    Quizzes
                  </span>
                  <span className="font-medium">
                    {course?.totalQuizzes ?? 0}
                  </span>
                </button>
              )}
              {course?.hasExercises && (
                <button
                  disabled={!course?.enrolled}
                  onClick={() => onNavigate(routes.courseExercises(slug))}
                  className="w-full flex items-center justify-between disabled:cursor-default enabled:hover:text-primary transition-colors"
                >
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Code className="w-4 h-4" />
                    Exercises
                  </span>
                  <span className="font-medium">{course?.totalTasks ?? 0}</span>
                </button>
              )}
              {course?.hasPlaygrounds && (
                <button
                  disabled={!course?.enrolled}
                  onClick={() => onNavigate(routes.coursePlaygrounds(slug))}
                  className="w-full flex items-center justify-between disabled:cursor-default enabled:hover:text-primary transition-colors"
                >
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Wrench className="w-4 h-4" />
                    Playgrounds
                  </span>
                  <span className="font-medium">
                    {course?.totalPlaygrounds ?? 0}
                  </span>
                </button>
              )}
              {course?.hasProjects && (
                <button
                  disabled={!course?.enrolled}
                  onClick={() => onNavigate(routes.courseProjects(slug))}
                  className="w-full flex items-center justify-between disabled:cursor-default enabled:hover:text-primary transition-colors"
                >
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <FolderOpen className="w-4 h-4" />
                    Projects
                  </span>
                  <span className="font-medium">
                    {course?.totalProjects ?? 0}
                  </span>
                </button>
              )}
              {(course?.totalDuration ?? 0) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Est. time
                  </span>
                  <span className="font-medium">
                    {course?.totalDuration} hours
                  </span>
                </div>
              )}
            </div>

            {/* Footer: progress + continue (enrolled) OR price + enroll */}
            <div className="mt-4 pt-4 border-t border-border">
              {course?.enrolled ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Your progress</span>
                    <span className="font-medium">{courseProgress}%</span>
                  </div>
                  <Progress value={courseProgress} className="h-2" />
                  <button
                    onClick={handleContinueLearning}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-medium px-5 py-2.5 text-sm hover:bg-primary/90 transition"
                  >
                    <Play className="w-4 h-4" />
                    Continue Learning
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground mb-3">
                    {!course?.isPremium || user?.isPremium ? (
                      <>
                        Free with{" "}
                        <span className="font-semibold text-foreground">
                          Pro
                        </span>
                      </>
                    ) : (
                      <span className="font-semibold text-foreground">
                        {course?.amount
                          ? `$${course.amount}`
                          : "Premium membership required"}
                      </span>
                    )}
                  </div>
                  <button
                    disabled={enrolling}
                    onClick={handleEnrollNow}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-medium px-5 py-2.5 text-sm hover:bg-primary/90 transition disabled:opacity-60"
                  >
                    {enrolling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {enrolling ? "Enrolling…" : "Start Learning"}
                  </button>
                </>
              )}

              {showPaymentDialog && (
                <PaymentDialog
                  onClose={() => setShowPaymentDialog(false)}
                  open={showPaymentDialog}
                  data={{ ...course, type: "course" }}
                  onHandlePreview={() => {}}
                  onHandlePurchase={(id: string, type: any, success: boolean) =>
                    handlePurchase(id, type, success)
                  }
                />
              )}
            </div>
          </div>

          {course?.enrolled && course?.userCourse?.id && (
            <ScheduleWidget courseId={course.userCourse.id} />
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

                {course?.enrolled && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress to Certificate</span>
                      <span>{Math.floor(course?.progress)}%</span>
                    </div>
                    <Progress value={course?.progress} className="h-2" />
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
        </div>
      </div>

    </div>
  );
}
