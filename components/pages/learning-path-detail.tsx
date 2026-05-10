"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Clock,
  BookOpen,
  Code2,
  Target,
  CheckCircle2,
  Play,
  Lock,
  Trophy,
  Users,
  Star,
  Zap,
  Brain,
  FolderOpen,
  Calendar,
  Video,
  RotateCcw,
  Flame,
  Award,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import { Loader } from "../ui/loader";
import { stripHtmlTags } from "@/lib/html-utils";
import { useUser } from "@/hooks/use-user";
import { PaymentDialog } from "../payment-dialog";
import { PathPreviewDialog } from "../path-preview-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { analytics } from "@/lib/analytics";

// Type definitions for multi-content timeline
type ContentItemType =
  | "course"
  | "project"
  | "quiz"
  | "exercise"
  | "mock_interview"
  | "bootcamp"
  | "land";

interface ContentItem {
  id: string;
  type: ContentItemType;
  title: string;
  description?: string;
  duration?: string;
  level?: string;
  meta?: {
    chapters?: number;
    difficulty?: string;
    passingScore?: number;
    language?: string;
    company?: string;
    position?: string;
    cohortName?: string;
    xp?: number;
    students?: number;
    slug?: string;
    isOptional?: boolean;
    topicId?: string;
  };
  progress?: number;
  completed?: boolean;
  locked?: boolean;
}

// Helper function to get config for each content type
function getContentTypeConfig(type: ContentItemType) {
  const configs: Record<
    ContentItemType,
    { icon: any; color: string; label: string; ctaLabel: string }
  > = {
    course: {
      icon: BookOpen,
      color: "text-blue-600",
      label: "Video Course",
      ctaLabel: "Resume Learning",
    },
    project: {
      icon: FolderOpen,
      color: "text-orange-600",
      label: "Project",
      ctaLabel: "Open Project",
    },
    quiz: {
      icon: Brain,
      color: "text-purple-600",
      label: "Quiz",
      ctaLabel: "Take Quiz",
    },
    exercise: {
      icon: Code2,
      color: "text-green-600",
      label: "Coding Exercise",
      ctaLabel: "Solve",
    },
    mock_interview: {
      icon: Video,
      color: "text-red-600",
      label: "Mock Interview",
      ctaLabel: "Start Interview",
    },
    bootcamp: {
      icon: Calendar,
      color: "text-yellow-600",
      label: "Live Bootcamp",
      ctaLabel: "Join Bootcamp",
    },
    land: {
      icon: Trophy,
      color: "text-amber-600",
      label: "MB Land",
      ctaLabel: "Enter Land",
    },
  };
  return configs[type];
}

// Helper function to get non-course items for a topic (exercises, quizzes, projects, bootcamps, mock interviews)
function getNonCourseItems(
  topic: any,
  isEnrolled: boolean = false,
): ContentItem[] {
  const topicId: string = topic.id || "";
  const items: ContentItem[] = [];

  (topic.exercises || []).forEach((exerciseItem: any) => {
    const exercise = exerciseItem.exercise || exerciseItem;
    items.push({
      id: exercise.id,
      type: "exercise",
      title: exercise.title,
      description: exercise.summary || "",
      meta: {
        difficulty: exercise.difficulty,
        language: exercise.language,
        topicId,
      },
      completed: exerciseItem.isCompleted ?? false,
      locked: !isEnrolled,
    });
  });

  (topic.quizzes || []).forEach((quizItem: any) => {
    const quiz = quizItem.quiz || quizItem;
    items.push({
      id: quiz.id,
      type: "quiz",
      title: quiz.title,
      description: quiz.description || "",
      duration: quiz.timeLimit ? `${quiz.timeLimit}m` : undefined,
      meta: { passingScore: quiz.passingScore, topicId },
      completed: quizItem.isCompleted ?? false,
      locked: !isEnrolled,
    });
  });

  (topic.projects || []).forEach((projectItem: any) => {
    const project = projectItem.project || projectItem;
    items.push({
      id: project.id,
      type: "project",
      title: project.title,
      description: project.summary || "",
      duration: project.timeframe,
      meta: { difficulty: project.difficulty, slug: project.slug },
      completed: projectItem.isCompleted ?? false,
      locked: !isEnrolled,
    });
  });

  (topic.bootcamps || []).forEach((bootcampItem: any) => {
    const bootcamp = bootcampItem.bootcamp || bootcampItem;
    items.push({
      id: bootcamp.id,
      type: "bootcamp",
      title: bootcamp.title,
      description: bootcamp.description || "",
      duration: bootcamp.duration,
      level: bootcamp.level,
      meta: {
        isOptional: bootcampItem.isOptional ?? false,
        slug: bootcamp.slug,
      },
      completed: bootcampItem.isCompleted ?? false,
      locked: !isEnrolled,
    });
  });

  (topic.mockInterviews || []).forEach((miItem: any) => {
    const mi = miItem.mockInterview || miItem;
    items.push({
      id: mi.id,
      type: "mock_interview",
      title: mi.title,
      description: mi.description || "",
      duration: mi.duration ? `${mi.duration}m` : undefined,
      meta: { difficulty: mi.difficulty },
      completed: miItem.isCompleted ?? false,
      locked: !isEnrolled,
    });
  });

  return items;
}

interface LearningPathDetailPageProps {
  pathId: string;
  onNavigate?: (route: string) => void;
}

export function LearningPathDetailPage({
  pathId,
  onNavigate,
}: LearningPathDetailPageProps) {
  const store = useAppStore();
  const user = useUser();
  const [roadmap, setRoadmap] = useState<any>(null);
  const [userRoadmap, setUserRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState<{
    type: string;
    title: string;
    chapterTitle?: string;
    itemIndex: number;
    totalItems: number;
  } | null>(null);
  // Cache milestone per topicId to avoid re-fetching when user clicks Continue
  const milestoneCache = useRef<Record<string, any>>({});

  const loadData = async () => {
    try {
      setLoading(true);
      const roadmapData = await store.getRoadmapBySlug(pathId);

      setRoadmap(roadmapData);
      const ur = roadmapData?.userRoadmap ?? null;
      setUserRoadmap(ur);

      // Fetch certificate if path is completed
      if (ur?.isCompleted) {
        store
          .getRoadmapCertificate(pathId)
          .then(setCertificate)
          .catch(() => {});
      }

      analytics.track("path_viewed", {
        pathId,
        pathTitle: roadmapData?.title,
        isEnrolled: Boolean(ur),
        progress: roadmapData?.progress ?? 0,
      });

      if (ur?.currentTopicId && roadmapData?.topics) {
        const foundTopic = roadmapData.topics.find(
          (t: any) => t.id === ur.currentTopicId,
        );
        if (foundTopic) {
          try {
            const milestone = await store.getMilestone(
              pathId,
              ur.currentTopicId,
            );
            milestoneCache.current[ur.currentTopicId] = milestone;
            const completedIds = new Set(
              (milestone?.userTopic?.completedItems ?? [])
                .filter((ci: any) => ci.completed)
                .map((ci: any) => ci.itemId),
            );
            const completedCount = (
              milestone?.userTopic?.completedItems ?? []
            ).filter((ci: any) => ci.completed).length;
            const totalTasks = milestone?.userTopic?.totalTasks ?? 0;

            let found = false;
            for (const course of foundTopic.courses ?? []) {
              for (const chapter of course.chapters ?? []) {
                for (const video of chapter.videos ?? []) {
                  if (!completedIds.has(video.id)) {
                    setCurrentItem({
                      type: "video",
                      title: video.title,
                      chapterTitle: chapter.title,
                      itemIndex: completedCount,
                      totalItems: totalTasks,
                    });
                    found = true;
                    break;
                  }
                }
                if (found) break;
              }
              if (found) break;
            }
          } catch {
            // Non-critical — page still works without resume point
          }
        }
      }
    } catch (error) {
      console.error("Failed to load learning path:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    analytics.track("path_enrollment_started", {
      pathId,
      pathTitle: roadmap?.title,
      source: "enroll_button",
    });

    // Free roadmap or premium user → enroll directly without payment
    if (!roadmap?.isPremium || user?.isPremium) {
      setEnrolling(true);
      try {
        const enrollResult = await store.enrollInRoadmap(pathId);

        if (!enrollResult) {
          toast.error("Failed to enroll in path. Please try again.");
          return;
        }

        analytics.track("path_enrolled", {
          pathId,
          pathTitle: roadmap?.title,
          method: "direct",
        });
        setShowWelcomeDialog(true);

        const updated = await store.getRoadmapBySlug(pathId);
        setRoadmap(updated);
        setUserRoadmap(updated?.userRoadmap ?? null);
      } catch (error: any) {
        const errorMsg =
          error?.response?.data?.message ||
          error?.message ||
          error?.toString?.() ||
          "Failed to enroll in path";
        toast.error(errorMsg);
      } finally {
        setEnrolling(false);
      }
      return;
    }

    // Premium roadmap, non-premium user → show payment dialog
    analytics.track("path_payment_dialog_opened", {
      pathId,
      roadmapAmount: roadmap?.amount,
    });
    setShowPaymentDialog(true);
  };

  const handlePaymentComplete = async () => {
    setShowPaymentDialog(false);
    setEnrolling(true);
    try {
      const enrollResult = await store.enrollInRoadmap(pathId);

      if (!enrollResult) {
        toast.error("Failed to enroll in path. Please try again.");
        return;
      }

      analytics.track("path_enrolled", {
        pathId,
        pathTitle: roadmap?.title,
        method: "payment",
      });
      toast.success("Successfully enrolled in path!");

      const updated = await store.getRoadmapBySlug(pathId);
      setRoadmap(updated);
      setUserRoadmap(updated?.userRoadmap ?? null);
    } catch (error: any) {
      toast.error(error?.message || "Failed to enroll in path");
    } finally {
      setEnrolling(false);
    }
  };

  // Preview enrollment — enroll with isPreview:true then proceed (open dialog or navigate to free course)
  const handlePreviewEnroll = async (afterEnroll: () => void) => {
    if (isEnrolled) {
      // Already enrolled (preview or full) — just proceed
      afterEnroll();
      return;
    }
    setEnrolling(true);
    try {
      await store.enrollInRoadmap(pathId, true);
      const updated = await store.getRoadmapBySlug(pathId);
      setRoadmap(updated);
      setUserRoadmap(updated?.userRoadmap ?? null);
      afterEnroll();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to start preview";
      toast.error(msg);
    } finally {
      setEnrolling(false);
    }
  };

  // Deep-link to the exact video where the user left off
  const navigateToFirstUncompletedVideo = async (
    topicId: string,
    courses: any[],
  ) => {
    if (!onNavigate) return;
    setNavigating(true);
    try {
      const milestone =
        milestoneCache.current[topicId] ??
        (await store.getMilestone(pathId, topicId));
      milestoneCache.current[topicId] = milestone;
      const completedVideoIds = new Set(
        (milestone?.userTopic?.completedItems ?? [])
          .filter((ci: any) => ci.itemType === "VIDEO")
          .map((ci: any) => ci.itemId),
      );

      for (const course of courses) {
        const chapters: any[] = course.chapters ?? [];
        for (const chapter of chapters) {
          const videos: any[] = chapter.videos ?? [];
          for (const video of videos) {
            if (!completedVideoIds.has(video.id)) {
              onNavigate(
                routes.pathVideoWatch(
                  pathId,
                  topicId,
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

      // All videos complete — land on the last video
      const lastCourse = courses[courses.length - 1];
      const lastChapter =
        lastCourse?.chapters?.[lastCourse.chapters.length - 1];
      const lastVideo = lastChapter?.videos?.[lastChapter.videos.length - 1];
      if (lastVideo) {
        onNavigate(
          routes.pathVideoWatch(
            pathId,
            topicId,
            lastCourse.slug,
            lastChapter.slug,
            lastVideo.slug,
          ),
        );
      } else {
        onNavigate(routes.pathDetail(pathId));
      }
    } catch {
      onNavigate(routes.pathDetail(pathId));
    } finally {
      setNavigating(false);
    }
  };

  // Renderer for content items (courses, projects, quizzes, etc.)
  const renderContentItem = (
    item: ContentItem,
    isCompleted: boolean = false,
    isLocked: boolean = false,
    isCurrent: boolean = false,
    isEnrolled: boolean = false,
  ) => {
    const config = getContentTypeConfig(item.type);
    const IconComponent = config.icon;

    const isAvailable = !isLocked && isEnrolled;
    const status = isCompleted
      ? "completed"
      : isCurrent
        ? "current"
        : isLocked
          ? "locked"
          : "available";

    const borderColor =
      status === "completed"
        ? "border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20"
        : status === "current"
          ? "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30"
          : "border-muted bg-muted/30";

    const statusColor =
      status === "completed"
        ? "bg-green-600"
        : status === "current"
          ? "bg-blue-600"
          : "bg-gray-400";

    return (
      <div
        key={item.id}
        className={`rounded-lg border ${borderColor} p-3 hover:shadow-sm transition-all`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <IconComponent
              className={`h-4 w-4 ${config.color} flex-shrink-0 mt-0.5`}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">
                {item.title}
              </p>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {item.description}
                </p>
              )}
              {(item.duration ||
                item.meta?.chapters ||
                item.meta?.difficulty) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {item.meta?.chapters && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <BookOpen className="h-3 w-3" />
                      {item.meta.chapters} chapters
                    </span>
                  )}
                  {item.duration && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {item.duration}
                    </span>
                  )}
                  {item.meta?.difficulty && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Zap className="h-3 w-3" />
                      {item.meta.difficulty}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <Badge className={`${statusColor} text-xs flex-shrink-0 text-white`}>
            {status === "completed"
              ? "✓ Done"
              : status === "current"
                ? "In Progress"
                : status === "locked"
                  ? "Locked"
                  : "Available"}
          </Badge>
        </div>
        {status === "current" && item.progress !== undefined && (
          <div className="space-y-1 pt-2 mt-2 border-t border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between text-xs">
              <span>Progress</span>
              <span className="font-semibold text-blue-600">
                {item.progress}%
              </span>
            </div>
            <Progress
              value={item.progress}
              className="h-1.5"
              aria-label={`${item.title} progress: ${item.progress ?? 0}%`}
              aria-valuenow={item.progress}
            />
          </div>
        )}
        {(isAvailable || isCompleted) && (
          <Button
            size="sm"
            variant={isCompleted ? "ghost" : "default"}
            className={`w-full mt-3 h-8 text-xs ${isCompleted ? "text-muted-foreground hover:text-foreground" : ""}`}
            onClick={() => {
              const topicId = item.meta?.topicId || "";
              analytics.track(
                isCompleted
                  ? "path_completed_content_reviewed"
                  : "path_content_clicked",
                {
                  pathId,
                  topicId,
                  contentType: item.type,
                  contentId: item.id,
                  contentTitle: item.title,
                },
              );
              switch (item.type) {
                case "course":
                  navigateToFirstUncompletedVideo(topicId, [item]);
                  break;
                case "exercise":
                  onNavigate?.(routes.pathExercise(pathId, topicId, item.id));
                  break;
                case "quiz":
                  onNavigate?.(routes.pathQuiz(pathId, topicId, item.id));
                  break;
                case "project":
                  if (item.meta?.slug) {
                    onNavigate?.(routes.projectDetail(item.meta.slug));
                  }
                  break;
                case "bootcamp":
                  onNavigate?.(routes.bootcampDetail(item.id));
                  break;
                case "mock_interview":
                  onNavigate?.(routes.mockInterviewDetail(item.id));
                  break;
                case "land":
                  onNavigate?.(routes.landDetail(item.id));
                  break;
                default:
                  toast.info(`Opening ${config.label}...`);
              }
            }}
          >
            {isCompleted ? (
              <>
                <RotateCcw className="h-3 w-3 mr-1" />
                Review
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1" />
                {config.ctaLabel}
              </>
            )}
          </Button>
        )}
      </div>
    );
  };

  useEffect(() => {
    loadData();
  }, [pathId]);

  // ALL derived state must be computed before any conditional returns (Rules of Hooks)
  const topics: any[] = roadmap?.topics ?? [];
  const isEnrolled = Boolean(userRoadmap);
  const isPreviewMode = isEnrolled && userRoadmap?.isPreview === true;
  const isFullAccess = isEnrolled && !isPreviewMode;
  const progress =
    userRoadmap?.isCompleted === true ? 100 : (roadmap?.progress ?? 0);

  // Free preview course: first non-premium course in first topic
  // Exposed for non-enrolled AND preview-enrolled users on premium roadmaps
  const freePreviewCourseId =
    !isFullAccess && roadmap?.isPremium
      ? (topics[0]?.courses?.find((c: any) => !c.isPremium)?.id ?? null)
      : null;

  const completedTopics = useMemo(
    () => topics.filter((t) => t.completed === true),
    [topics],
  );

  const currentTopicId =
    userRoadmap?.currentTopicId ?? roadmap?.topics?.[0]?.id;
  const currentTopic = useMemo(
    () => topics.find((t) => t.id === currentTopicId && !t.completed) ?? null,
    [topics, currentTopicId],
  );
  const currentTopicIndex = currentTopic ? topics.indexOf(currentTopic) : -1;

  const upcomingTopics = useMemo(
    () => topics.filter((t) => !t.completed && t.id !== currentTopicId),
    [topics, currentTopicId],
  );

  // Pre-compute non-course items for every topic once; avoids repeated iteration in render
  const nonCourseItemsByTopicId = useMemo(() => {
    const map: Record<string, ContentItem[]> = {};
    topics.forEach((t) => {
      map[t.id] = getNonCourseItems(t, isFullAccess);
    });
    return map;
  }, [topics, isFullAccess]);

  if (loading) {
    return (
      <div className="flex-1 space-y-6">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-28" />
          <span className="text-muted-foreground">/</span>
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className="space-y-3">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/3" />
            </div>
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
            {/* Curriculum card */}
            <div className="space-y-4 border rounded-lg p-6">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 py-3 border-b last:border-0"
                >
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Sidebar */}
          <div className="space-y-4">
            <div className="border-2 rounded-lg p-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (roadmap?.isWaiting) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[60vh]">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-5 rounded-full bg-blue-50 dark:bg-blue-950">
              <Clock className="h-14 w-14 text-blue-600" />
            </div>
          </div>
          <div className="space-y-2">
            <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
              Coming Soon
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">
              {roadmap.title}
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {stripHtmlTags(roadmap.summary || "")}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            This learning path is not yet available for enrollment. We're
            working hard to bring it to you. Join the waitlist to be notified
            when it launches.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {roadmap.waitingLink ? (
              <Button
                size="lg"
                onClick={() => {
                  analytics.track("path_waitlist_clicked", {
                    pathId,
                    waitingLink: roadmap.waitingLink,
                  });
                  window.open(
                    roadmap.waitingLink,
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
              >
                <Star className="mr-2 h-4 w-4" />
                Join the Waitlist
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Contact us to join the waitlist
              </p>
            )}
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate?.(routes.paths)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Browse Other Paths
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Learning Path not found</h1>
          <Button onClick={() => onNavigate?.(routes.paths)} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Learning Paths
          </Button>
        </div>
      </div>
    );
  }

  // Non-enrolled OR preview-enrolled: show sales/preview page
  if (!isFullAccess) {
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
          <span className="text-foreground font-medium line-clamp-1 max-w-xs">
            {roadmap.title}
          </span>
        </nav>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Description */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">
                {roadmap.title}
              </h1>
              <p className="text-lg text-muted-foreground">
                {stripHtmlTags(roadmap.summary || "")}
              </p>
            </div>

            {/* Key Stats */}
            {/* {(() => {
              const totalCourses = topics.reduce((s: number, t: any) => s + (t.courses?.length || 0), 0);
              const totalProjects = topics.reduce((s: number, t: any) => s + (t.projects?.length || 0), 0);
              const totalQuizzes = topics.reduce((s: number, t: any) => s + (t.quizzes?.length || 0), 0);
              const totalMockInterviews = topics.reduce((s: number, t: any) => s + (t.mockInterviews?.length || 0), 0);
              const totalWorkshops = topics.reduce((s: number, t: any) => s + (t.bootcamps?.length || 0), 0);
              const stats = [
                { label: "Courses", value: totalCourses, icon: BookOpen, iconBg: "bg-blue-100 dark:bg-blue-900", iconColor: "text-blue-600" },
                { label: "Projects", value: totalProjects, icon: FolderOpen, iconBg: "bg-orange-100 dark:bg-orange-900", iconColor: "text-orange-600" },
                { label: "Quizzes", value: totalQuizzes, icon: Brain, iconBg: "bg-purple-100 dark:bg-purple-900", iconColor: "text-purple-600" },
                { label: "Mock Interviews", value: totalMockInterviews, icon: Video, iconBg: "bg-red-100 dark:bg-red-900", iconColor: "text-red-600" },
                { label: "Live Workshops", value: totalWorkshops, icon: Calendar, iconBg: "bg-green-100 dark:bg-green-900", iconColor: "text-green-600" },
              ].filter((s) => s.value > 0);
              return (
                <div className="grid gap-4 md:grid-cols-5">
                  {stats.map(({ label, value, icon: Icon, iconBg, iconColor }) => (
                    <Card key={label}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 ${iconBg} rounded-lg`}>
                            <Icon className={`h-5 w-5 ${iconColor}`} />
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">{label}</div>
                            <div className="text-2xl font-bold">{value}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            })()} */}
            {/* Commented out: Topics, Content Items, Enrolled stat cards */}

            {/* Skills You'll Learn */}
            {roadmap.skills && roadmap.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Skills You'll Learn</CardTitle>
                  <CardDescription>
                    Master these essential technologies and concepts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {roadmap.skills.map((skill: string) => (
                      <Badge key={skill} className="justify-center py-2">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prerequisites */}
            {roadmap.prerequisites && roadmap.prerequisites.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Prerequisites</CardTitle>
                  <CardDescription>
                    What you should know before starting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {roadmap.prerequisites.map(
                      (prerequisite: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{prerequisite}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Curriculum Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Path Curriculum</CardTitle>
                <CardDescription>
                  {topics.reduce(
                    (s: number, t: any) => s + (t.courses?.length || 0),
                    0,
                  )}{" "}
                  courses
                  {topics.reduce(
                    (s: number, t: any) => s + (t.quizzes?.length || 0),
                    0,
                  ) > 0 &&
                    ` · ${topics.reduce((s: number, t: any) => s + (t.quizzes?.length || 0), 0)} quizzes`}
                  {topics.reduce(
                    (s: number, t: any) => s + (t.projects?.length || 0),
                    0,
                  ) > 0 &&
                    ` · ${topics.reduce((s: number, t: any) => s + (t.projects?.length || 0), 0)} projects`}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pt-0">
                {(() => {
                  const typeConfig: Record<
                    string,
                    { label: string; badgeCls: string; dotCls: string }
                  > = {
                    course: {
                      label: "Course",
                      badgeCls:
                        "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
                      dotCls: "bg-foreground",
                    },
                    quiz: {
                      label: "Skill Assessment",
                      badgeCls:
                        "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300",
                      dotCls: "bg-indigo-500",
                    },
                    project: {
                      label: "Project",
                      badgeCls:
                        "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
                      dotCls: "bg-green-500",
                    },
                    exercise: {
                      label: "Coding Exercise",
                      badgeCls:
                        "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
                      dotCls: "bg-emerald-500",
                    },
                    mock_interview: {
                      label: "Mock Interview",
                      badgeCls:
                        "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
                      dotCls: "bg-red-500",
                    },
                    bootcamp: {
                      label: "Live Workshop",
                      badgeCls:
                        "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
                      dotCls: "bg-amber-500",
                    },
                  };
                  return (
                    <div>
                      {topics.map((topic: any) => {
                        const topicItems: {
                          id: string;
                          type: string;
                          title: string;
                          description?: string;
                          num?: number;
                        }[] = [];
                        let courseNum = 0;
                        (topic.courses || []).forEach((ci: any) => {
                          const c = ci.course || ci;
                          courseNum++;
                          topicItems.push({
                            id: c.id,
                            type: "course",
                            title: c.title,
                            description: c.summary || c.description,
                            num: courseNum,
                          });
                        });
                        (topic.quizzes || []).forEach((qi: any) => {
                          const q = qi.quiz || qi;
                          topicItems.push({
                            id: q.id,
                            type: "quiz",
                            title: q.title,
                            description: q.description,
                          });
                        });
                        (topic.projects || []).forEach((pi: any) => {
                          const p = pi.project || pi;
                          topicItems.push({
                            id: p.id,
                            type: "project",
                            title: p.title,
                            description: p.summary || p.description,
                          });
                        });
                        (topic.exercises || []).forEach((ei: any) => {
                          const e = ei.exercise || ei;
                          topicItems.push({
                            id: e.id,
                            type: "exercise",
                            title: e.title,
                            description: e.summary,
                          });
                        });
                        (topic.bootcamps || []).forEach((bi: any) => {
                          const b = bi.bootcamp || bi;
                          topicItems.push({
                            id: b.id,
                            type: "bootcamp",
                            title: b.title,
                            description: b.description,
                          });
                        });
                        (topic.mockInterviews || []).forEach((mi: any) => {
                          const m = mi.mockInterview || mi;
                          topicItems.push({
                            id: m.id,
                            type: "mock_interview",
                            title: m.title,
                            description: m.description,
                          });
                        });
                        if (topicItems.length === 0) return null;
                        return (
                          <div
                            key={topic.id}
                            className="border-t first:border-t-0"
                          >
                            {topics.length > 1 && (
                              <div className="px-6 py-2.5 bg-muted/40 border-b">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                  {topic.title}
                                </p>
                              </div>
                            )}
                            {/* Timeline wrapper */}
                            <div className="relative px-4 py-3">
                              {/* Vertical line */}
                              <div className="absolute left-[1.625rem] top-5 bottom-5 w-px bg-border" />
                              <Accordion
                                type="single"
                                collapsible
                                className="space-y-3"
                              >
                                {topicItems.map((item) => {
                                  const cfg =
                                    typeConfig[item.type] ?? typeConfig.course;
                                  return (
                                    <AccordionItem
                                      key={item.id}
                                      value={item.id}
                                      className="border-0"
                                    >
                                      <div className="flex items-start gap-3">
                                        {/* Timeline dot */}
                                        <div
                                          className={`relative z-10 mt-4 w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-background ${cfg.dotCls}`}
                                        />
                                        {/* Card contains both trigger and content */}
                                        <div className="flex-1 rounded-xl border bg-card shadow-sm overflow-hidden">
                                          <AccordionTrigger className="w-full px-4 py-4 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/10">
                                            <div className="space-y-1.5 text-left flex-1 pr-2">
                                              <span
                                                className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.badgeCls}`}
                                              >
                                                {cfg.label}
                                              </span>
                                              <div className="flex items-center gap-2">
                                                {item.num !== undefined && (
                                                  <span className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                    {String(item.num).padStart(
                                                      2,
                                                      "0",
                                                    )}
                                                  </span>
                                                )}
                                                <span className="font-bold text-sm leading-snug">
                                                  {item.title}
                                                </span>
                                              </div>
                                            </div>
                                          </AccordionTrigger>
                                          {item.description && (
                                            <AccordionContent className="px-4 pb-4 pt-0">
                                              <p className="text-sm text-muted-foreground leading-relaxed border-t pt-3">
                                                {stripHtmlTags(
                                                  item.description,
                                                )}
                                              </p>
                                            </AccordionContent>
                                          )}
                                        </div>
                                      </div>
                                    </AccordionItem>
                                  );
                                })}
                              </Accordion>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar CTA */}
          <div className="space-y-6">
            <Card className="border-2 border-primary sticky top-6">
              <CardHeader>
                <CardTitle className="text-2xl">{roadmap.title}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">
                    {roadmap.level || "Beginner to Advanced"}
                  </Badge>
                  <Badge variant="secondary">
                    {roadmap.difficulty || "Progressive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  {roadmap.timeframe && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span>{roadmap.timeframe}</span>
                    </div>
                  )}
                </div>

                {roadmap.instructor && (
                  <div className="flex items-center gap-3 py-3 border-t">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Created by
                      </p>
                      <p className="text-sm font-semibold">
                        {roadmap.instructor}
                      </p>
                    </div>
                  </div>
                )}

                {isPreviewMode ? (
                  <>
                    <div className="rounded-lg border border-[#13AECE]/30 bg-[#13AECE]/5 px-4 py-3">
                      <p className="text-xs font-semibold text-[#13AECE] mb-0.5">
                        Preview mode active
                      </p>
                      <p className="text-xs text-muted-foreground">
                        You have access to free content. Upgrade for the full
                        curriculum.
                      </p>
                    </div>
                    <Button
                      className="w-full text-white bg-[#13AECE] hover:bg-[#0FA3C4]"
                      size="lg"
                      disabled={enrolling}
                      onClick={handleEnroll}
                    >
                      {enrolling ? "Enrolling..." : "Upgrade to Full Access"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      className="w-full"
                      size="lg"
                      disabled={enrolling}
                      onClick={handleEnroll}
                    >
                      {enrolling ? "Enrolling..." : "Enrol Now"}
                    </Button>
                  </>
                )}

                {(freePreviewCourseId || roadmap?.preview) && (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={enrolling}
                    onClick={() => {
                      if (roadmap?.preview) {
                        handlePreviewEnroll(() => setShowPreviewDialog(true));
                        return;
                      }
                      // No preview video — navigate directly to free course preview
                      const previewCourse = topics[0]?.courses?.find(
                        (c: any) => c.id === freePreviewCourseId,
                      );
                      if (previewCourse?.slug) {
                        handlePreviewEnroll(() =>
                          onNavigate?.(
                            routes.pathCoursePreview(
                              pathId,
                              topics[0].id,
                              previewCourse.slug,
                            ),
                          ),
                        );
                      }
                    }}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {enrolling ? "Starting..." : "Watch Preview"}
                  </Button>
                )}
                {roadmap?.isPremium && !user?.isPremium && (
                  <p className="text-xs text-center text-muted-foreground">
                    Premium membership required
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Social Proof */}
            {roadmap?.students > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-sm">
                          Popular Path
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(roadmap?.students || 0).toLocaleString()} students
                        enrolled
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Path Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Path Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2.5">
                  {[
                    {
                      value: topics.reduce(
                        (s: number, t: any) => s + (t.courses?.length || 0),
                        0,
                      ),
                      label: "Courses",
                      icon: BookOpen,
                      color: "text-blue-600",
                    },
                    {
                      value: topics.reduce(
                        (s: number, t: any) => s + (t.projects?.length || 0),
                        0,
                      ),
                      label: "Portfolio Projects",
                      icon: FolderOpen,
                      color: "text-orange-600",
                    },
                    {
                      value: topics.reduce(
                        (s: number, t: any) =>
                          s + (t.mockInterviews?.length || 0),
                        0,
                      ),
                      label: "Mock Interviews",
                      icon: Video,
                      color: "text-red-600",
                    },
                    {
                      value: topics.reduce(
                        (s: number, t: any) => s + (t.quizzes?.length || 0),
                        0,
                      ),
                      label: "Quizzes",
                      icon: Brain,
                      color: "text-purple-600",
                    },
                    {
                      value: topics.reduce(
                        (s: number, t: any) => s + (t.bootcamps?.length || 0),
                        0,
                      ),
                      label: "Live Workshops",
                      icon: Calendar,
                      color: "text-amber-600",
                    },
                    {
                      value: topics.reduce(
                        (s: number, t: any) => s + (t.exercises?.length || 0),
                        0,
                      ),
                      label: "Coding Exercises",
                      icon: Code2,
                      color: "text-green-600",
                    },
                  ].map(({ value, label, icon: Icon, color }) => (
                    <div key={label} className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${color} flex-shrink-0`} />
                      <p className="text-sm">
                        <span className="font-semibold">{value}</span> {label}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2.5 pt-2 border-t">
                  {roadmap.instructor && (
                    <div className="flex gap-2">
                      <BookOpen className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Created by
                        </p>
                        <p className="font-medium text-sm">
                          {roadmap.instructor}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Award className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">
                      Certificate of completion included
                    </p>
                  </div>
                  {(freePreviewCourseId || roadmap?.preview) && (
                    <div className="flex gap-2">
                      <Play className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">Free preview available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Certificate Preview */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Certificate of Completion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative rounded-lg border-2 border-dashed border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/20 p-5 text-center">
                  <div className="absolute inset-0 backdrop-blur-[1px] rounded-lg flex items-center justify-center">
                    <div className="bg-background/80 rounded-full p-2">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                  <Trophy className="h-12 w-12 mx-auto mb-2 text-yellow-500 opacity-60" />
                  <p className="font-semibold text-sm text-muted-foreground">
                    {roadmap.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Certificate of Completion
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <Award className="h-3 w-3" />
                    <span>Verified · Shareable</span>
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Enroll and complete all topics to earn your certificate
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <PaymentDialog
          open={showPaymentDialog}
          onClose={() => setShowPaymentDialog(false)}
          onHandlePreview={() => {}}
          onHandlePurchase={async (_, __, success) => {
            if (success) {
              await handlePaymentComplete();
            }
          }}
          data={{ ...roadmap, type: "roadmap" }}
          disableOnetime={!roadmap?.paddle_price_id}
        />

        <PathPreviewDialog
          open={showPreviewDialog}
          onClose={() => setShowPreviewDialog(false)}
          roadmap={roadmap}
          topics={topics}
          pathId={pathId}
          freePreviewCourseId={freePreviewCourseId}
          onNavigate={onNavigate}
        />
      </div>
    );
  }

  // Enrolled: show progress timeline
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
        <span className="text-foreground font-medium line-clamp-1 max-w-xs">
          {roadmap.title}
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{roadmap.title}</h1>
          <p className="text-muted-foreground">
            {currentTopicIndex + 1} of {topics.length} • {progress}% Complete
          </p>
        </div>
      </div>

      {/* Motivational Banner */}
      {isEnrolled && currentTopic && (
        <div className="rounded-lg bg-gradient-to-r from-[#0E1F33] to-[#13AECE] text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-base">
                {progress >= 75
                  ? "🔥 Almost there! You're in the final stretch."
                  : progress >= 50
                    ? "💪 Past the halfway point — keep the momentum!"
                    : progress >= 25
                      ? "✅ Great start! You're building real momentum."
                      : "🚀 Your journey begins. The best backend engineers started here."}
              </p>
              <p className="text-sm text-blue-100 mt-1">
                {completedTopics.length} of {topics.length} topics complete
              </p>
            </div>
            {(user?.currentStreak ?? 0) > 1 && (
              <div className="text-center ml-4 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <Flame className="h-5 w-5 text-orange-300" />
                  <div className="text-2xl font-bold">
                    {user?.currentStreak}
                  </div>
                </div>
                <div className="text-xs text-blue-100">day streak</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Overall Progress
              </div>
              <div className="flex items-center gap-2">
                <Progress
                  value={progress}
                  className="h-2 flex-1"
                  aria-label={`Overall learning path progress: ${progress}%`}
                  aria-valuenow={progress}
                />
                <span className="text-sm font-medium">{progress}%</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Topics Completed
              </div>
              <div className="text-2xl font-bold">{completedTopics.length}</div>
              <div className="text-xs text-muted-foreground">
                of {topics.length}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Current Topic</div>
              <div className="text-2xl font-bold">
                {currentTopic ? currentTopicIndex + 1 : 0}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Upcoming Topics
              </div>
              <div className="text-2xl font-bold">{upcomingTopics.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Step */}
          {currentTopic && (
            <Card className="border-2 border-blue-200">
              <CardHeader className="">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 hidden md:flex rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    {currentTopicIndex + 1}
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      Current: {currentTopic.title}
                    </CardTitle>
                    <CardDescription>
                      {stripHtmlTags(currentTopic.description || "")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentItem && (
                    <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-3">
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
                        ▶ Next Up
                      </p>
                      <div className="flex items-center gap-2">
                        <Play className="h-4 w-4 text-blue-600 flex-shrink-0 animate-pulse" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-tight line-clamp-1">
                            {currentItem.title}
                          </p>
                          {currentItem.chapterTitle && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {currentItem.chapterTitle}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>Topic Progress</span>
                      <span className="font-semibold text-blue-600">
                        {currentTopic.progress ?? 0}%
                        {currentItem && currentItem.totalItems > 0 && (
                          <span className="text-muted-foreground font-normal ml-1">
                            ({currentItem.itemIndex}/{currentItem.totalItems})
                          </span>
                        )}
                      </span>
                    </div>
                    <Progress
                      value={currentTopic.progress ?? 0}
                      className="h-2"
                    />
                  </div>

                  <Button
                    className="w-full"
                    disabled={navigating}
                    onClick={() => {
                      analytics.track("path_continue_clicked", {
                        pathId,
                        topicId: currentTopic.id,
                        topicTitle: currentTopic.title,
                        source: "current_card",
                      });
                      navigateToFirstUncompletedVideo(
                        currentTopic.id,
                        currentTopic.courses ?? [],
                      );
                    }}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {navigating ? "Loading…" : "Continue Learning"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Learning Path Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Learning Timeline</CardTitle>
              <CardDescription>
                Your progress through topics and courses
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-0">
              {/* Unified topic-grouped learning timeline */}
              {(() => {
                const typeConfig: Record<
                  string,
                  { label: string; badgeCls: string; dotCls: string }
                > = {
                  course: {
                    label: "Course",
                    badgeCls:
                      "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
                    dotCls: "bg-foreground",
                  },
                  quiz: {
                    label: "Skill Assessment",
                    badgeCls:
                      "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300",
                    dotCls: "bg-indigo-500",
                  },
                  project: {
                    label: "Project",
                    badgeCls:
                      "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
                    dotCls: "bg-green-500",
                  },
                  exercise: {
                    label: "Coding Exercise",
                    badgeCls:
                      "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
                    dotCls: "bg-emerald-500",
                  },
                  mock_interview: {
                    label: "Mock Interview",
                    badgeCls:
                      "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
                    dotCls: "bg-red-500",
                  },
                  bootcamp: {
                    label: "Live Workshop",
                    badgeCls:
                      "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
                    dotCls: "bg-amber-500",
                  },
                };
                return (
                  <div>
                    {topics.map((topic: any, topicIndex: number) => {
                      const isTopicCompleted = topic.completed === true;
                      const isTopicCurrent = topic.id === currentTopic?.id;
                      const isTopicLocked =
                        !isTopicCompleted && !isTopicCurrent;
                      // && topicIndex > currentTopicIndex;

                      const topicItems: {
                        id: string;
                        type: string;
                        title: string;
                        description?: string;
                        num?: number;
                        isCompleted: boolean;
                        isLocked: boolean;
                        raw: any;
                      }[] = [];
                      let courseNum = 0;
                      (topic.courses || []).forEach((c: any) => {
                        courseNum++;
                        topicItems.push({
                          id: c.id,
                          type: "course",
                          title: c.title,
                          description: c.summary || c.description,
                          num: courseNum,
                          isCompleted: c.isCompleted ?? false,
                          isLocked: isTopicLocked,
                          raw: c,
                        });
                      });
                      (topic.quizzes || []).forEach((q: any) => {
                        topicItems.push({
                          id: q.id,
                          type: "quiz",
                          title: q.title,
                          description: q.description,
                          isCompleted: q.isCompleted ?? false,
                          isLocked: isTopicLocked,
                          raw: q,
                        });
                      });
                      (topic.projects || []).forEach((p: any) => {
                        topicItems.push({
                          id: p.id,
                          type: "project",
                          title: p.title,
                          description: p.summary || p.description,
                          isCompleted: p.isCompleted ?? false,
                          isLocked: isTopicLocked,
                          raw: p,
                        });
                      });
                      (topic.exercises || []).forEach((e: any) => {
                        topicItems.push({
                          id: e.id,
                          type: "exercise",
                          title: e.title,
                          description: e.summary,
                          isCompleted: e.isCompleted ?? false,
                          isLocked: isTopicLocked,
                          raw: e,
                        });
                      });
                      (topic.bootcamps || []).forEach((b: any) => {
                        topicItems.push({
                          id: b.id,
                          type: "bootcamp",
                          title: b.title,
                          description: b.description,
                          isCompleted: b.isCompleted ?? false,
                          isLocked: isTopicLocked,
                          raw: b,
                        });
                      });
                      (topic.mockInterviews || []).forEach((mi: any) => {
                        topicItems.push({
                          id: mi.id,
                          type: "mock_interview",
                          title: mi.title,
                          description: mi.description,
                          isCompleted: mi.isCompleted ?? false,
                          isLocked: isTopicLocked,
                          raw: mi,
                        });
                      });
                      if (topicItems.length === 0) return null;

                      return (
                        <div
                          key={topic.id}
                          className="border-t first:border-t-0"
                        >
                          {/* Topic header */}
                          <div
                            className={`px-6 py-3 border-b flex items-center gap-3 ${isTopicCompleted ? "bg-green-50/50 dark:bg-green-950/20" : isTopicCurrent ? "bg-blue-50/50 dark:bg-blue-950/20" : "bg-muted/30"}`}
                          >
                            {isTopicCompleted ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                            ) : isTopicCurrent ? (
                              <Play className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            ) : (
                              <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <p
                              className={`text-xs font-semibold uppercase tracking-wider flex-1 ${isTopicCompleted ? "text-green-700 dark:text-green-400" : isTopicCurrent ? "text-blue-700 dark:text-blue-400" : "text-muted-foreground"}`}
                            >
                              {topic.title}
                            </p>
                            {isTopicCompleted && (
                              <Badge className="bg-green-600 text-[10px]">
                                Complete
                              </Badge>
                            )}
                            {isTopicCurrent && (
                              <Badge className="bg-blue-600 text-[10px]">
                                In Progress · {topic.progress ?? 0}%
                              </Badge>
                            )}
                            {isTopicLocked && (
                              <Badge
                                variant="outline"
                                className="text-[10px] text-muted-foreground"
                              >
                                Locked
                              </Badge>
                            )}
                          </div>

                          {/* Timeline items */}
                          <div className="relative px-4 py-3">
                            <div className="absolute left-[1.625rem] top-5 bottom-5 w-px bg-border" />
                            <Accordion
                              type="single"
                              collapsible
                              className="space-y-3"
                            >
                              {topicItems.map((item) => {
                                const cfg =
                                  typeConfig[item.type] ?? typeConfig.course;
                                // Dot uses type color always; locked items get gray
                                const dotCls = item.isLocked
                                  ? "bg-muted-foreground/30"
                                  : cfg.dotCls;
                                const numBgCls = item.isCompleted
                                  ? "bg-green-600"
                                  : "bg-foreground";
                                const hasAction =
                                  !item.isLocked &&
                                  (item.type === "course" || item.isCompleted);
                                return (
                                  <AccordionItem
                                    key={item.id}
                                    value={item.id}
                                    className="border-0"
                                  >
                                    <div className="flex items-start gap-3">
                                      <div
                                        className={`relative z-10 mt-4 w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-background ${dotCls}`}
                                      />
                                      <div
                                        className={`flex-1 rounded-xl border bg-card shadow-sm overflow-hidden ${item.isLocked ? "border-dashed opacity-70" : ""}`}
                                      >
                                        <AccordionTrigger className="w-full px-4 py-4 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/10">
                                          <div className="space-y-1.5 text-left flex-1 pr-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span
                                                className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.badgeCls}`}
                                              >
                                                {cfg.label}
                                              </span>
                                              {item.isCompleted && (
                                                <Badge className="bg-green-600 text-[10px] py-0 px-1.5 h-auto text-white hover:bg-green-700">
                                                  ✓ Done
                                                </Badge>
                                              )}
                                              {isTopicCurrent &&
                                                !item.isCompleted &&
                                                item.type === "course" && (
                                                  <Badge className="bg-blue-600 text-[10px] py-0 px-1.5 h-auto text-white hover:bg-blue-700">
                                                    In Progress
                                                  </Badge>
                                                )}
                                              {item.isLocked && (
                                                <Badge className="bg-slate-600 text-[10px] py-0 px-1.5 h-auto text-white hover:bg-slate-700">
                                                  🔒 Locked
                                                </Badge>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {item.num !== undefined && (
                                                <span
                                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white ${numBgCls}`}
                                                >
                                                  {String(item.num).padStart(
                                                    2,
                                                    "0",
                                                  )}
                                                </span>
                                              )}
                                              <span className="font-bold text-sm leading-snug">
                                                {item.title}
                                              </span>
                                            </div>
                                            {isTopicCurrent &&
                                              !item.isCompleted &&
                                              item.type === "course" && (
                                                <div className="space-y-1">
                                                  <Progress
                                                    value={topic.progress ?? 0}
                                                    className="h-1.5"
                                                  />
                                                  <p className="text-xs text-blue-600 font-medium">
                                                    {topic.progress ?? 0}%
                                                    complete
                                                  </p>
                                                </div>
                                              )}
                                          </div>
                                        </AccordionTrigger>
                                        {(item.description || hasAction) && (
                                          <AccordionContent className="px-4 pb-4 pt-0">
                                            <div className="border-t pt-3 space-y-3">
                                              {item.description && (
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                  {stripHtmlTags(
                                                    item.description,
                                                  )}
                                                </p>
                                              )}
                                              {item.isCompleted &&
                                                item.type === "course" && (
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-xs w-full"
                                                    disabled={navigating}
                                                    onClick={() => {
                                                      analytics.track(
                                                        "path_completed_content_reviewed",
                                                        {
                                                          pathId,
                                                          contentType: "course",
                                                          contentId: item.id,
                                                          contentTitle:
                                                            item.title,
                                                        },
                                                      );
                                                      navigateToFirstUncompletedVideo(
                                                        topic.id,
                                                        [item.raw],
                                                      );
                                                    }}
                                                  >
                                                    <RotateCcw className="h-3 w-3 mr-1" />
                                                    {navigating
                                                      ? "Loading…"
                                                      : "Review Course"}
                                                  </Button>
                                                )}
                                              {isTopicCurrent &&
                                                !item.isCompleted &&
                                                item.type === "course" && (
                                                  <Button
                                                    size="sm"
                                                    className="w-full h-8 text-xs"
                                                    disabled={navigating}
                                                    onClick={() =>
                                                      navigateToFirstUncompletedVideo(
                                                        topic.id,
                                                        topic.courses ?? [],
                                                      )
                                                    }
                                                  >
                                                    <Play className="h-3 w-3 mr-1" />
                                                    {navigating
                                                      ? "Loading…"
                                                      : "Resume Learning"}
                                                  </Button>
                                                )}
                                            </div>
                                          </AccordionContent>
                                        )}
                                      </div>
                                    </div>
                                  </AccordionItem>
                                );
                              })}
                            </Accordion>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress Card */}
          <Card className="bg-gradient-to-br from-[#0E1F33] to-[#13AECE] text-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-white">
                <Target className="h-5 w-5" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-100">Overall Completion</span>
                  <span className="font-bold text-lg">{progress}%</span>
                </div>
                <Progress
                  value={progress}
                  className="h-3 bg-white/20 [&>div]:bg-white"
                />
                <div className="flex justify-between text-xs text-blue-100 pt-1">
                  <span>
                    {completedTopics.length} of {topics.length} topics done
                  </span>
                  {progress > 0 && progress < 100 && (
                    <span>{100 - progress}% remaining</span>
                  )}
                  {progress === 100 && (
                    <span className="text-yellow-300 font-semibold">
                      🎉 Complete!
                    </span>
                  )}
                </div>
              </div>
              {completedTopics.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm border-t border-white/20 pt-3">
                  <Zap className="h-4 w-4 text-yellow-300" />
                  <span className="text-blue-100">XP earned:</span>
                  <span className="font-semibold text-yellow-300">
                    {completedTopics.length * 50} MB
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Certificate Card */}
          <Card
            className={
              progress === 100
                ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20"
                : ""
            }
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy
                  className={`h-5 w-5 ${progress === 100 ? "text-yellow-600" : "text-muted-foreground"}`}
                />
                Certificate
              </CardTitle>
            </CardHeader>
            <CardContent>
              {progress === 100 ? (
                <div className="space-y-3">
                  <div className="text-center p-4 border border-yellow-300 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                    <Trophy className="h-10 w-10 mx-auto mb-2 text-yellow-600" />
                    <p className="font-semibold text-sm">Path Complete!</p>
                    {certificate ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        ID:{" "}
                        <span className="font-mono font-medium">
                          {certificate.code}
                        </span>
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">
                        Your certificate is ready
                      </p>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => {
                      if (certificate?.verifyUrl) {
                        window.open(certificate.verifyUrl, "_blank");
                      } else {
                        toast.info(
                          "Certificate is being generated. Check your email shortly.",
                        );
                      }
                    }}
                  >
                    <Award className="mr-2 h-4 w-4" />
                    View Certificate
                  </Button>
                </div>
              ) : (
                <div className="text-center p-4 border border-dashed rounded-lg bg-muted/30">
                  <div className="relative inline-block mb-2">
                    <Trophy className="h-10 w-10 text-muted-foreground/40" />
                    <Lock className="h-4 w-4 text-muted-foreground absolute -bottom-1 -right-1" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Certificate of Completion
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Complete all {topics.length} topics to unlock
                  </p>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Your Investment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Your Investment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Topics completed
                  </span>
                  <span className="font-semibold">
                    {completedTopics.length}/{topics.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Overall progress
                  </span>
                  <span className="font-semibold text-blue-600">
                    {progress}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current topic</span>
                  <span className="font-semibold">
                    {currentTopicIndex + 1} of {topics.length}
                  </span>
                </div>
              </div>
              {completedTopics.length > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Zap className="h-3 w-3" /> XP earned
                    </span>
                    <span className="font-semibold text-yellow-600">
                      {completedTopics.length * 50} MB
                    </span>
                  </div>
                </>
              )}
              {roadmap.students > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Learning Together
                      </span>
                    </div>
                    <p className="text-xl font-bold">
                      {roadmap.students.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      learners enrolled
                    </p>
                    {progress > 0 && (
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        You're ahead of {Math.round(progress * 0.6)}% of
                        learners
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile sticky CTA — only visible on small screens when not enrolled */}
      {!isEnrolled && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t p-4 flex flex-col gap-2 shadow-lg">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="font-semibold text-sm line-clamp-1">
                {roadmap?.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {roadmap?.topics?.length ?? 0} topics ·{" "}
                {roadmap?.isPremium ? "Premium" : "Free"}
              </p>
            </div>
            {roadmap?.progress !== undefined && (
              <span className="text-xs font-medium text-blue-600">
                {roadmap.progress}% complete
              </span>
            )}
          </div>
          <Button
            className="w-full"
            size="lg"
            disabled={enrolling}
            onClick={handleEnroll}
          >
            {enrolling ? "Enrolling..." : "Enrol Now"}
          </Button>
        </div>
      )}

      <PaymentDialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        onHandlePreview={() => {}}
        onHandlePurchase={async (_, __, success) => {
          if (success) {
            await handlePaymentComplete();
          }
        }}
        data={{ ...roadmap, type: "roadmap" }}
      />

      {/* Post-enrollment welcome dialog */}
      <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <DialogTitle className="text-xl">You&apos;re in!</DialogTitle>
            <DialogDescription className="text-base mt-2">
              Welcome to <strong>{roadmap?.title}</strong>. Your learning
              journey starts now.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <h3 className="text-base font-semibold text-left">
              Your first lesson is ready
            </h3>
            {topics?.[0] && (
              <div className="text-left p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <p className="text-sm font-medium">{topics[0].title}</p>
                </div>
                {topics[0].courses?.[0] && (
                  <div className="flex items-center gap-2 ml-8">
                    <BookOpen className="h-4 w-4 text-blue-600 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      {topics[0].courses[0].course?.title ||
                        topics[0].courses[0].title}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <Button
              className="w-full"
              onClick={() => {
                setShowWelcomeDialog(false);
                if (onNavigate) onNavigate(routes.pathContinue(pathId));
              }}
            >
              Start Now &rarr;
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowWelcomeDialog(false)}
            >
              Explore Curriculum
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
