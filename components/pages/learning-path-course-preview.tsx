"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Play,
  Lock,
  Eye,
  Clock,
  BookOpen,
  Award,
  Target,
  CheckCircle2,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import { stripHtmlTags } from "@/lib/html-utils";
import { PaymentDialog } from "@/components/payment-dialog";
import ConfettiCelebration from "@/components/confetti-celebration";
import { VimeoPlayer } from "@/components/ui/vimeo-player";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";

interface LearningPathCoursePreviewPageProps {
  pathId: string;
  topicId: string;
  courseSlug: string;
  onNavigate?: (route: string) => void;
}

export function LearningPathCoursePreviewPage({
  pathId,
  topicId,
  courseSlug,
  onNavigate,
}: LearningPathCoursePreviewPageProps) {
  const store = useAppStore();
  const user = useUser();

  const [roadmap, setRoadmap] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [userRoadmap, setUserRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [freeVideos, setFreeVideos] = useState<any[]>([]);
  const [freeChapters, setFreeChapters] = useState<any[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [celebration, setCelebration] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [roadmapData, courseData] = await Promise.all([
          store.getRoadmapBySlug(pathId),
          store.getCourse(courseSlug),
        ]);
        setRoadmap(roadmapData);
        setUserRoadmap(roadmapData?.userRoadmap ?? null);
        setCourse(courseData);

        // Build free chapters/videos list
        const chapters = (courseData?.chapters ?? [])
          ?.map((ch: any) => ({
            ...ch,
            videos: (ch.videos ?? []).filter((v: any) => !v.isPremium),
          }))
          .filter((ch: any) => ch.videos.length > 0);
        setFreeChapters(chapters);

        const videos = chapters.flatMap((ch: any) => ch.videos);
        setFreeVideos(videos);

        // Auto-select first free video, fall back to roadmap preview
        if (videos.length > 0) {
          setSelectedVideo(videos[0]);
        } else if (courseData?.preview) {
          setSelectedVideo({ video: courseData.preview });
        }
      } catch (err) {
        console.error("Failed to load path course preview:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [pathId, courseSlug]);

  const handleEnroll = async () => {
    if (roadmap?.isPremium && !user?.isPremium) {
      setShowPaymentDialog(true);
      return;
    }
    setEnrolling(true);
    try {
      const result = await store.enrollInRoadmap(pathId);
      if (!result) {
        toast.error("Failed to enroll. Please try again.");
        return;
      }
      setCelebration(true);
      toast.success("You're enrolled! Starting your learning path…");
      // Navigate to the continue page after brief delay for celebration
      setTimeout(() => {
        onNavigate?.(routes.pathContinue(pathId));
      }, 1500);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Enrollment failed.",
      );
    } finally {
      setEnrolling(false);
    }
  };

  const handlePaymentComplete = async () => {
    setShowPaymentDialog(false);
    setEnrolling(true);
    try {
      const result = await store.enrollInRoadmap(pathId);
      if (!result) {
        toast.error("Failed to enroll. Please try again.");
        return;
      }
      setCelebration(true);
      toast.success("You're enrolled! Starting your learning path…");
      setTimeout(() => {
        onNavigate?.(routes.pathContinue(pathId));
      }, 1500);
    } catch (err: any) {
      toast.error(err?.message || "Enrollment failed.");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-6">
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!roadmap || !course) {
    return (
      <div className="flex-1 p-6 text-center">
        <h1 className="text-2xl font-bold">Content not found</h1>
        <Button
          onClick={() => onNavigate?.(routes.pathContinue(pathId))}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Path
        </Button>
      </div>
    );
  }

  const isEnrolled = Boolean(userRoadmap);
  const topics: any[] = roadmap.topics ?? [];
  const currentTopic = topics.find((t: any) => t.id === topicId);
  const topicIndex = topics.findIndex((t: any) => t.id === topicId);
  const enrollLabel = enrolling
    ? "Enrolling…"
    : isEnrolled
      ? "Continue Learning Path"
      : roadmap.isPremium && !user?.isPremium
        ? `Enroll · $${roadmap.amount}`
        : "Start Learning Path";

  return (
    <div className="flex-1 space-y-6">
      {/* Breadcrumb */}
      <nav
        aria-label="breadcrumb"
        className="flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <button
          onClick={() => onNavigate?.(routes.paths)}
          className="hover:text-foreground transition-colors"
        >
          Learning Paths
        </button>
        <span>/</span>
        <button
          onClick={() => onNavigate?.(routes.pathContinue(pathId))}
          className="hover:text-foreground transition-colors"
        >
          {roadmap.title}
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">Free Preview</span>
      </nav>

      {/* Path header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary">
            <Eye className="mr-1 h-3 w-3" />
            Free Preview
          </Badge>
          <Badge variant="outline">
            {roadmap.level || "Beginner to Advanced"}
          </Badge>
          {roadmap.isPremium ? (
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              Premium
            </Badge>
          ) : (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Free
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{roadmap.title}</h1>
        {roadmap.summary && (
          <p className="text-muted-foreground text-lg">
            {stripHtmlTags(roadmap.summary)}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Previewing course from{" "}
          <span className="font-medium text-foreground">
            Topic {topicIndex + 1}: {currentTopic?.title ?? course.title}
          </span>{" "}
          · {freeVideos.length} free video{freeVideos.length !== 1 ? "s" : ""}{" "}
          available
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video player */}
          <Card className="overflow-hidden">
            <div className="aspect-video bg-black relative">
              {selectedVideo ? (
                <div className="aspect-video bg-black relative">
                  <VimeoPlayer video={selectedVideo} />
                  <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full text-xs text-white font-medium">
                    FREE PREVIEW
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0E1F33] to-[#13AECE]">
                  <div className="text-center text-white space-y-3 px-6">
                    <Lock className="h-12 w-12 mx-auto opacity-60" />
                    <h3 className="text-lg font-semibold">
                      No free videos available for this course
                    </h3>
                    <p className="text-sm text-white/70">
                      Enroll in the path to access all content
                    </p>
                    <Button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="mt-2"
                    >
                      {enrollLabel}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Action bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-green-600 border-green-600"
              >
                <Eye className="mr-1 h-3 w-3" />
                Free Preview
              </Badge>
              <span className="text-sm text-muted-foreground">
                {freeChapters.length} of {course.chapters?.length ?? 0} chapters
                available
              </span>
            </div>
            <Button
              onClick={
                isEnrolled
                  ? () => onNavigate?.(routes.pathContinue(pathId))
                  : handleEnroll
              }
              disabled={enrolling}
            >
              {enrollLabel}
            </Button>
          </div>

          {/* Free videos list */}
          {freeVideos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Free Preview Videos</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {freeVideos.length} video{freeVideos.length !== 1 ? "s" : ""}{" "}
                  free to watch from this course
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {freeVideos?.map((video: any) => (
                    <div
                      key={video.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedVideo?.id === video.id ? "bg-muted/90" : ""
                      }`}
                      onClick={() => setSelectedVideo(video)}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 flex-shrink-0">
                        <Play className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{video.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <Badge
                            variant="outline"
                            className="text-xs border-green-600 text-green-600"
                          >
                            FREE
                          </Badge>
                          {video.duration && (
                            <>
                              <Clock className="h-3 w-3" />
                              <span>{video.duration}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Full curriculum */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Course Curriculum</CardTitle>
              <p className="text-sm text-muted-foreground">
                {course.chapters?.length ?? 0} chapters in this course ·{" "}
                {currentTopic?.title ?? course.title}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(course.chapters ?? []).map((chapter: any) => (
                  <div
                    key={chapter.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      !chapter.isPremium
                        ? "cursor-pointer hover:bg-muted/50"
                        : "opacity-60"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${
                        !chapter.isPremium
                          ? "bg-green-100 text-green-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {!chapter.isPremium ? (
                        <Play className="h-4 w-4" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{chapter.title}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs flex-shrink-0 ${
                        !chapter.isPremium
                          ? "border-green-600 text-green-600"
                          : "border-orange-600 text-orange-600"
                      }`}
                    >
                      {!chapter.isPremium ? "FREE" : "PREMIUM"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card> */}
        </div>

        {/* Sidebar — path info */}
        <div className="space-y-4">
          {/* Enroll CTA */}
          <Card className="border-2 border-primary">
            <CardHeader className="pb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                Learning Path
              </p>
              <CardTitle className="text-xl leading-tight">
                {roadmap.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Price */}
              {/* <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4" />
                  Price
                </span>
                {roadmap.amount > 0 ? (
                  <span className="font-bold text-lg">${roadmap.amount}</span>
                ) : (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Free
                  </Badge>
                )}
              </div> */}

              {/* Stats */}
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Target className="h-4 w-4" />
                    Topics
                  </span>
                  <span className="font-medium">{topics.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" />
                    Content Items
                  </span>
                  <span className="font-medium">
                    {roadmap.totalContent || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    Duration
                  </span>
                  <span className="font-medium">
                    {roadmap.estimatedWeeks > 0
                      ? `~${roadmap.estimatedWeeks} weeks`
                      : roadmap.timeframe || "Self-paced"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Award className="h-4 w-4" />
                    Certificate
                  </span>
                  <span className="font-medium text-green-600">Included</span>
                </div>
              </div>

              {/* Instructor */}

              <div className="flex items-center gap-3 py-3 border-t">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created by</p>
                  <p className="text-sm font-semibold">
                    {roadmap?.instructor ?? "Mastering Backend Team"}
                  </p>
                </div>
              </div>

              {/* CTA */}
              <Button
                className="w-full"
                size="lg"
                disabled={enrolling}
                onClick={
                  isEnrolled
                    ? () => onNavigate?.(routes.pathContinue(pathId))
                    : handleEnroll
                }
              >
                {enrollLabel}
              </Button>

              {roadmap.isPremium && !user?.isPremium && (
                <p className="text-xs text-center text-muted-foreground">
                  Premium membership required
                </p>
              )}
            </CardContent>
          </Card>

          {/* What's included */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">What's included</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>
                  {topics.length} structured topic
                  {topics.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>{roadmap.totalContent || 0} content items</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>Lifetime access · No expiry</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>Certificate of completion</span>
              </div>
              {roadmap.estimatedWeeks > 0 && roadmap.hoursPerWeek > 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>
                    ~{roadmap.estimatedWeeks} weeks at {roadmap.hoursPerWeek}
                    h/week
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Topics list */}
          {topics.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Path Curriculum</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {topics.length} topics in this path
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topics?.map((topic: any, idx: number) => (
                    <div
                      key={topic.id}
                      className={`flex items-start gap-2.5 text-sm p-2 rounded-md ${
                        topic.id === topicId
                          ? "bg-primary/5 dark:bg-primary/10"
                          : ""
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                          topic.id === topicId
                            ? "bg-primary text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium leading-tight ${
                            topic.id === topicId ? "text-primary" : ""
                          }`}
                        >
                          {topic.title}
                        </p>
                        {topic.id === topicId && (
                          <p className="text-xs text-primary mt-0.5">
                            Previewing now
                          </p>
                        )}
                      </div>
                      {!isEnrolled && topic.id !== topicId && (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-1" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfettiCelebration
        onComplete={() => setCelebration(false)}
        isVisible={celebration}
        celebrationType="enrollment"
        courseName={roadmap.title}
      />

      <PaymentDialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        onHandlePreview={() => {}}
        onHandlePurchase={async (_, __, success) => {
          if (success) await handlePaymentComplete();
        }}
        data={{ ...roadmap, type: "roadmap" }}
        disableOnetime={!roadmap?.paddle_price_id}
      />
    </div>
  );
}
