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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { analytics } from "@/lib/analytics";
import { routes } from "@/lib/routes";
import DisqusCommentBlock from "../ui/comment";
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
  const [currentChapter] = useState(course?.chapters[0]);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
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

  const courseLevel = course?.level || "Beginner";
  const totalVideos =
    course?.chapters?.reduce(
      (sum: number, ch: any) => sum + (ch.videos?.length || 0),
      0,
    ) ?? 0;
  const courseProgress = course?.progress ?? 0;

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      {/* Blueprint hero — navy anchor; the grid lives here only */}
      <div className="overflow-hidden dark:ring-1 dark:ring-white/10">
        <div className="bg-[#0E1F33] text-white relative">
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
          <div className="text-white px-5 sm:px-8 py-4 bg-[#0A1726]">
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
          {/* Short Description */}
          <article
            className="text-lg text-muted-foreground [&>*>span]:!text-foreground [&>p]:text-foreground dark:[&>*>span]:!text-muted-foreground dark:[&>p]:text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: course?.summary!,
            }}
          ></article>

          <div className="flex flex-wrap gap-2">
            {course?.tags?.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Expandable Long Description */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Course Overview
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setIsDescriptionExpanded(!isDescriptionExpanded)
                  }
                >
                  {isDescriptionExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`space-y-4 ${
                  isDescriptionExpanded ? "" : "line-clamp-3"
                }`}
              >
                {course?.description
                  ?.split("\n\n")
                  .map((paragraph: string, index: number) => (
                    <article
                      dangerouslySetInnerHTML={{ __html: paragraph }}
                      key={index}
                      className="text-muted-foreground leading-relaxed [&>*>table]:p-3 [&>*>table]:border [&>*>code]:rounded-xl [&>*>code]:bg-zinc-800 [&>*>code]:p-1 [&>*>code]:text-sm [&>*>code]:font-medium [&>*>code]:text-zinc-100 [&>*>code]:overflow-x-auto w-full [&>*>li>pre]:mt-5 [&>*>li>pre]:rounded-xl [&>*>li>pre]:bg-zinc-800 [&>*>li>pre]:p-4 [&>*>li>pre]:text-sm [&>*>li>pre]:font-medium [&>*>li>pre]:text-zinc-100 [&>*>li>pre]:overflow-x-auto [&>*>li>a]:text-amber-300 [&>p>a]:text-amber-300 mx-auto w-full text-zinc-700 dark:text-zinc-300 [&>pre]:overflow-x-auto [&>h2]:text-2xl [&>h2]:font-bold [&>h3]:text-xl [&>h3]:font-bold [&>p]:mt-2 [&>p]:leading-relaxed [&>pre]:mt-5 [&>pre]:rounded-xl [&>pre]:bg-zinc-800 [&>pre]:p-4 [&>pre]:text-sm [&>pre]:font-medium [&>pre]:text-zinc-100 [&>ul]:mt-5 [&>ul]:flex [&>ul]:list-disc [&>ul]:flex-col [&>ul]:gap-2 [&>ul]:pl-6 [&>ol]:mt-5 [&>ol]:flex [&>ol]:list-decimal [&>ol]:flex-col [&>ol]:gap-2 [&>ol]:pl-6 [&>*>span]:!text-black [&>p]:text-black dark:[&>*>span]:!text-muted-foreground dark:[&>p]:text-muted-foreground"
                    >
                      {/* {paragraph} */}
                    </article>
                  ))}
              </div>
              {!isDescriptionExpanded && (
                <Button
                  variant="link"
                  className="p-0 h-auto mt-2"
                  onClick={() => setIsDescriptionExpanded(true)}
                >
                  Read more
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Course Features Section */}
          {/* {course?.enrolled && ( */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Course Features</CardTitle>
              <CardDescription>
                Interactive learning tools and resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {course?.hasQuizzes && (
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => onNavigate(routes.courseQuizzes(slug))}
                  >
                    <Brain className="h-6 w-6" />
                    <span className="text-sm">Quizzes</span>
                  </Button>
                )}
                {course?.hasExercises && (
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => onNavigate(routes.courseExercises(slug))}
                  >
                    <Code className="h-6 w-6" />
                    <span className="text-sm">Exercises</span>
                  </Button>
                )}
                {course?.hasPlaygrounds && (
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => onNavigate(routes.coursePlaygrounds(slug))}
                  >
                    <Gamepad2 className="h-6 w-6" />
                    <span className="text-sm">Playgrounds</span>
                  </Button>
                )}
                {course?.hasProjects && (
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => onNavigate(routes.courseProjects(slug))}
                  >
                    <FolderOpen className="h-6 w-6" />
                    <span className="text-sm">Projects</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          {/* )} */}
        </div>

        <div className="space-y-6">
          {/* Course Enrollment Card */}
          <Card className="rounded-2xl">
            <CardHeader>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={course?.banner ?? "/placeholder.svg"}
                  alt={course?.title}
                  className="h-full w-full object-cover"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {course?.enrolled ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Your Progress</span>
                    <span>{course?.progress}%</span>
                  </div>
                  <Progress value={course?.progress ?? 0} className="h-2" />
                  <Button className="w-full" onClick={handleContinueLearning}>
                    <Play className="mr-2 h-4 w-4" />
                    Continue Learning
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {course?.isPremium && !user?.isPremium && (
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900 text-xs"
                    >
                      <Crown className="mr-1 h-3 w-3" />
                      Included in Pro
                    </Badge>
                  )}
                  <Button className="w-full" onClick={handleEnrollNow} disabled={enrolling}>
                    {enrolling ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    {enrolling ? "Enrolling..." : "Start Learning"}
                  </Button>
                </div>
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

              {/* <Separator /> */}

              {/* <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Heart className="mr-2 h-4 w-4" />
                  Wishlist
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div> */}
            </CardContent>
          </Card>

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

      {/* Course Content */}
      <Tabs defaultValue="curriculum" className="space-y-4">
        <TabsList>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="instructor">Instructor</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="curriculum" className="space-y-4">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Course Curriculum</CardTitle>
              <CardDescription>
                {course?.chapters.length} chapters •{" "}
                {course?.totalDuration ?? 0} total hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {course?.chapters.map((chapter: Chapter, index) => {
                  return (
                    <div
                      key={chapter.id}
                      className={`flex items-center justify-between p-3 rounded-xl border border-border cursor-pointer hover:bg-muted/50 hover:border-primary/30 transition-colors ${
                        currentChapter?.id === chapter.id ? "bg-muted" : ""
                      }`}
                      onClick={() => handleChapterClick(chapter, index)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          {isChapterCompleted(chapter.id) ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : course?.enrolled || !chapter.isPremium ? (
                            <span className="text-sm font-medium">
                              {index + 1}
                            </span>
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{chapter.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
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
                            <span>{chapter.duration}</span>
                            <Badge variant="secondary" className="text-xs">
                              {chapter?.type?.toUpperCase()}
                            </Badge>
                            {/* Feature indicators */}
                            {chapter?.quizzes?.length! > 0 && (
                              <Badge
                                variant="outline"
                                className="text-xs border-border text-muted-foreground"
                              >
                                QUIZ
                              </Badge>
                            )}
                            {chapter.exercise && (
                              <Badge
                                variant="outline"
                                className="text-xs border-border text-muted-foreground"
                              >
                                EXERCISE
                              </Badge>
                            )}
                            {chapter.playground && (
                              <Badge
                                variant="outline"
                                className="text-xs border-border text-muted-foreground"
                              >
                                PLAYGROUND
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            course?.enrolled &&
                            isChapterCompleted(chapter.id)
                          ) {
                            handleChapterComplete(chapter.id);
                          }
                        }}
                      >
                        {isChapterCompleted(chapter.id) ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : course?.enrolled || !chapter.isPremium ? (
                          <Play className="h-4 w-4" />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instructor">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>About the Instructor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  {course?.instructor
                    ?.split(" ")
                    .map((n: string) => n.charAt(0))
                    .join("") ?? "MB"}
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    {course?.instructor ?? "Mastering Backend"}
                  </h3>
                  <p className="text-muted-foreground">
                    Senior Backend Engineer with 8+ years of experience building
                    scalable systems. Previously worked at Google and Netflix.
                  </p>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>15 courses</span>

                    <span>4.9 rating</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Student Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <DisqusCommentBlock
                  config={{
                    url: "/courses/" + slug,
                    identifier: slug,
                    title: course?.title,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}
