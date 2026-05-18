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
  DollarSign,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import { Loader } from "../ui/loader";
import { stripHtmlTags } from "@/lib/html-utils";
import { useUser } from "@/hooks/use-user";
import { PaymentDialog } from "../payment-dialog";
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

const getPreviewEmbedUrl = (preview?: string | null) => {
  if (!preview) return "";
  if (/^https?:\/\//i.test(preview)) return preview;
  if (/^\d+$/.test(preview)) return `https://player.vimeo.com/video/${preview}`;
  return preview;
};

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
  const progress =
    userRoadmap?.isCompleted === true ? 100 : (roadmap?.progress ?? 0);

  // Free preview course: first non-premium course in first topic (only relevant for premium roadmaps)
  const freePreviewCourseId =
    !isEnrolled && roadmap?.isPremium
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
      map[t.id] = getNonCourseItems(t, isEnrolled);
    });
    return map;
  }, [topics, isEnrolled]);

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

  // Non-enrolled: show sales/preview page
  if (!isEnrolled) {
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

        <div className="grid gap-6 lg:grid-cols-3">
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
            <div className="grid gap-4 md:grid-cols-5">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Topics
                      </div>
                      <div className="text-2xl font-bold">{topics.length}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Clock className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Duration
                      </div>
                      <div className="text-2xl font-bold">
                        {roadmap.estimatedWeeks > 0
                          ? `~${roadmap.estimatedWeeks} weeks at ${roadmap.hoursPerWeek}h/week`
                          : roadmap.timeframe || "Self-paced"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Code2 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Content Items
                      </div>
                      <div className="text-2xl font-bold">
                        {roadmap.totalContent || 0}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                      <Users className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Enrolled
                      </div>
                      <div className="text-2xl font-bold">
                        {(roadmap.students || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                      <DollarSign className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Access
                      </div>
                      <div className="text-2xl font-bold">
                        {roadmap.amount > 0 || roadmap.isPremium ? (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-base font-bold px-2 py-0.5">
                            {roadmap.amount > 0
                              ? `$${roadmap.amount}`
                              : "Premium"}
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-base font-bold px-2 py-0.5">
                            Free
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

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

            {/* Curriculum Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Path Curriculum</CardTitle>
                <CardDescription>
                  {topics.length} topics with{" "}
                  {topics.reduce(
                    (sum: number, t: any) => sum + (t.courses?.length || 0),
                    0,
                  )}{" "}
                  professional courses
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pt-0">
                <Accordion
                  type="single"
                  collapsible
                  defaultValue={topics[0]?.id}
                  className="divide-y"
                >
                  {topics.map((topic: any, topicIndex: number) => (
                    <AccordionItem
                      key={topic.id}
                      value={topic.id}
                      className="border-0"
                    >
                      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/40 [&[data-state=open]]:bg-muted/20">
                        <div className="flex items-start gap-4 text-left w-full pr-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-bold text-blue-600 flex-shrink-0">
                            {topicIndex + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-base">
                                {topic.title}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {topic.level || "Intermediate"}
                              </Badge>
                              {topic.courses && topic.courses.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {topic.courses.length} course
                                  {topic.courses.length !== 1 ? "s" : ""}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {stripHtmlTags(topic.description || "")}
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-0">
                        <div className="px-6 pb-4 space-y-4">
                          {/* Courses in Topic */}
                          {/* {topic.courses && topic.courses.length > 0 ? ( */}
                          <div className="space-y-3 ml-12">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Courses in this topic
                            </p>
                            <div className="space-y-3">
                              {topic?.courses?.map((courseItem: any) => {
                                const course = courseItem.course || courseItem;
                                return (
                                  <div
                                    key={course.id}
                                    className="rounded-lg border border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 p-4 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm transition-all group"
                                  >
                                    <div className="space-y-3">
                                      {/* Header */}
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                          <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                          <div className="flex-1 min-w-0">
                                            <h5 className="font-semibold text-sm leading-tight">
                                              {course.title}
                                            </h5>
                                          </div>
                                        </div>
                                        {course.id === freePreviewCourseId ? (
                                          <Badge className="bg-green-600 text-white text-xs flex-shrink-0">
                                            Free
                                          </Badge>
                                        ) : (
                                          <Badge
                                            variant="outline"
                                            className="text-xs flex items-center gap-1 flex-shrink-0"
                                          >
                                            <Lock className="h-3 w-3" />
                                            Locked
                                          </Badge>
                                        )}
                                      </div>

                                      {/* Course Metadata */}
                                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                        {course.chapters && (
                                          <div className="flex items-center gap-1">
                                            <BookOpen className="h-3 w-3" />
                                            <span>
                                              {course.chapters.length} chapter
                                              {course.chapters.length !== 1
                                                ? "s"
                                                : ""}
                                            </span>
                                          </div>
                                        )}
                                        {course.totalDuration && (
                                          <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            <span>{course.totalDuration}h</span>
                                          </div>
                                        )}
                                        {course.level && (
                                          <div className="flex items-center gap-1">
                                            <Zap className="h-3 w-3" />
                                            <span className="capitalize">
                                              {course.level}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Enrollment CTA */}
                                      {course.id === freePreviewCourseId ? (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="w-full mt-3 h-9 text-sm border-green-600 text-green-700 hover:bg-green-50"
                                          onClick={() =>
                                            onNavigate?.(
                                              routes.pathCoursePreview(
                                                pathId,
                                                topics[0]?.id,
                                                course.slug,
                                              ),
                                            )
                                          }
                                        >
                                          <Play className="h-4 w-4 mr-2" />
                                          Start Free Preview
                                        </Button>
                                      ) : (
                                        <Button
                                          size="sm"
                                          className="w-full mt-3 h-9 text-sm"
                                          disabled={enrolling}
                                          onClick={handleEnroll}
                                        >
                                          <Play className="h-4 w-4 mr-2" />
                                          {enrolling
                                            ? "Enrolling..."
                                            : "Start This Course"}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              {/* Other content items (Projects, Quizzes, Exercises, etc.) */}
                              {(nonCourseItemsByTopicId[topic.id] ?? []).map(
                                (item) => {
                                  const config = getContentTypeConfig(
                                    item.type,
                                  );
                                  const IconComponent = config.icon;

                                  return (
                                    <div
                                      key={item.id}
                                      className="rounded-lg border border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 p-4 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm transition-all group"
                                    >
                                      <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <IconComponent
                                              className={`h-5 w-5 ${config.color} flex-shrink-0 mt-0.5`}
                                            />
                                            <div className="flex-1 min-w-0">
                                              <h5 className="font-semibold text-sm leading-tight">
                                                {item.title}
                                              </h5>
                                              <p className="text-xs text-blue-600 font-medium mt-1">
                                                {config.label}
                                              </p>
                                            </div>
                                          </div>
                                          <Badge
                                            variant="outline"
                                            className="text-xs flex items-center gap-1 flex-shrink-0"
                                          >
                                            <Lock className="h-3 w-3" />
                                            Locked
                                          </Badge>
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                          {item.meta?.chapters && (
                                            <div className="flex items-center gap-1">
                                              <BookOpen className="h-3 w-3" />
                                              <span>
                                                {item.meta.chapters} chapter
                                                {item.meta.chapters !== 1
                                                  ? "s"
                                                  : ""}
                                              </span>
                                            </div>
                                          )}
                                          {item.duration && (
                                            <div className="flex items-center gap-1">
                                              <Clock className="h-3 w-3" />
                                              <span>{item.duration}</span>
                                            </div>
                                          )}
                                          {(item.level ||
                                            item.meta?.difficulty) && (
                                            <div className="flex items-center gap-1">
                                              <Zap className="h-3 w-3" />
                                              <span className="capitalize">
                                                {item.level ||
                                                  item.meta?.difficulty}
                                              </span>
                                            </div>
                                          )}
                                        </div>

                                        {item.description && (
                                          <p className="text-xs text-muted-foreground line-clamp-2">
                                            {item.description}
                                          </p>
                                        )}

                                        <Button
                                          size="sm"
                                          className="w-full mt-3 h-9 text-sm"
                                          disabled={enrolling}
                                          onClick={handleEnroll}
                                        >
                                          <Play className="h-4 w-4 mr-2" />
                                          {enrolling
                                            ? "Enrolling..."
                                            : config.ctaLabel}
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                },
                              )}
                            </div>
                          </div>
                          {/* ) : (
                      <div className="text-xs text-muted-foreground italic">
                        No courses in this topic yet
                      </div>
                    )} */}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar CTA */}
          <div className="space-y-6">
            <Card className="border-2 border-blue-600 sticky top-6">
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
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>{topics.length} Topics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>{roadmap.totalContent || 0} Content Items</span>
                  </div>
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

                {(freePreviewCourseId || roadmap?.preview) && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      if (freePreviewCourseId) {
                        const previewCourse = topics[0]?.courses?.find(
                          (c: any) => c.id === freePreviewCourseId,
                        );
                        if (previewCourse?.slug) {
                          onNavigate?.(
                            routes.pathCoursePreview(
                              pathId,
                              topics[0].id,
                              previewCourse.slug,
                            ),
                          );
                          return;
                        }
                      }
                      // Fallback: open video dialog for roadmap.preview URL
                      setShowPreviewDialog(true);
                    }}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Watch Preview
                  </Button>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  disabled={enrolling}
                  onClick={handleEnroll}
                >
                  {enrolling ? "Enrolling..." : "Start Learning Path"}
                </Button>

                {roadmap?.isPremium && (
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
                <div className="space-y-3">
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
                    <DollarSign className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      {roadmap.amount > 0 ? (
                        <p className="font-medium text-sm">${roadmap.amount}</p>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                          Free
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">
                      Lifetime Access &middot; No expiry
                    </p>
                  </div>
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

        {/* Watch Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Preview: {roadmap?.title}</DialogTitle>
              <DialogDescription>
                Watch a free preview of this learning path
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2">
              {getPreviewEmbedUrl(roadmap?.preview) ? (
                <iframe
                  src={getPreviewEmbedUrl(roadmap?.preview)}
                  className="w-full aspect-video rounded-md"
                  allowFullScreen
                  allow="autoplay; fullscreen"
                />
              ) : (
                <div className="w-full aspect-video rounded-md bg-muted flex items-center justify-center text-sm text-muted-foreground">
                  Preview not available
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
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
            <CardContent className="space-y-6">
              {/* Completed Topics */}
              {completedTopics.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-green-700">
                      Completed ({completedTopics.length})
                    </h4>
                  </div>
                  <div className="space-y-4 pl-7 border-l-2 border-green-200">
                    {completedTopics.map((topic: any) => {
                      const otherItems =
                        nonCourseItemsByTopicId[topic.id] ?? [];
                      return (
                        <div key={topic.id} className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-xs font-bold text-green-600 flex-shrink-0 -ml-10 border-2 border-white dark:border-slate-950">
                              ✓
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h5 className="font-semibold text-sm">
                                  {topic.title}
                                </h5>
                                <Badge variant="outline" className="text-xs">
                                  {topic.level || "Intermediate"}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {stripHtmlTags(topic.description || "")}
                              </p>
                            </div>
                          </div>

                          {(topic.courses?.length > 0 ||
                            otherItems.length > 0) && (
                            <div className="space-y-3 ml-0 mt-3">
                              <div className="flex flex-wrap gap-2">
                                {topic.courses && topic.courses.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {topic.courses.length} Course
                                    {topic.courses.length !== 1 ? "s" : ""}
                                  </Badge>
                                )}
                                {otherItems.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {otherItems.length} other item
                                    {otherItems.length !== 1 ? "s" : ""}
                                  </Badge>
                                )}
                              </div>
                              <div className="space-y-2">
                                {topic.courses?.map((courseItem: any) => {
                                  const course =
                                    courseItem.course || courseItem;
                                  return (
                                    <div
                                      key={course.id}
                                      className="group rounded-lg border border-green-100 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20 p-3 hover:border-green-200 dark:hover:border-green-800 transition-colors"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                          <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm leading-tight">
                                              {course.title}
                                            </p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                              {course.chapters && (
                                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                  <BookOpen className="h-3 w-3" />
                                                  {course.chapters.length}{" "}
                                                  chapters
                                                </span>
                                              )}
                                              {course.totalDuration && (
                                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                  <Clock className="h-3 w-3" />
                                                  {course.totalDuration}h
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                          <Badge className="bg-green-600 text-xs flex-shrink-0">
                                            ✓ Done
                                          </Badge>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 text-xs text-muted-foreground px-2"
                                            disabled={navigating}
                                            onClick={() => {
                                              analytics.track(
                                                "path_completed_content_reviewed",
                                                {
                                                  pathId,
                                                  contentType: "course",
                                                  contentId: course.id,
                                                  contentTitle: course.title,
                                                },
                                              );
                                              navigateToFirstUncompletedVideo(
                                                topic.id,
                                                [course],
                                              );
                                            }}
                                          >
                                            <RotateCcw className="h-3 w-3 mr-1" />
                                            {navigating ? "Loading…" : "Review"}
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                                {otherItems.map((item) =>
                                  renderContentItem(
                                    item,
                                    true,
                                    false,
                                    false,
                                    true,
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Current Topic */}
              {currentTopic && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-700">In Progress</h4>
                  </div>
                  <div className="space-y-4 pl-7 border-l-2 border-blue-300">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 -ml-10 border-2 border-white dark:border-slate-950">
                          {currentTopicIndex + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className="font-semibold text-sm">
                              {currentTopic.title}
                            </h5>
                            <Badge className="bg-blue-600 text-xs">
                              {currentTopic.level || "Intermediate"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {stripHtmlTags(currentTopic.description || "")}
                          </p>
                          <Progress
                            value={currentTopic.progress ?? 0}
                            className="h-1 mt-3"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            {currentTopic.progress ?? 0}% complete
                          </p>
                        </div>
                      </div>

                      {/* Current Topic Courses */}
                      {currentTopic.courses &&
                        currentTopic.courses.length > 0 && (
                          <div className="space-y-3 ml-0 mt-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              {currentTopic.courses.length} Course
                              {currentTopic.courses.length !== 1 ? "s" : ""}
                            </p>
                            <div className="space-y-2">
                              {currentTopic.courses.map((courseItem: any) => {
                                const course = courseItem.course || courseItem;
                                const isCompleted =
                                  courseItem.isCompleted ?? false;
                                const isCurrent = !isCompleted;
                                return (
                                  <div
                                    key={course.id}
                                    className={`rounded-lg border p-3 transition-colors ${
                                      isCompleted
                                        ? "border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20"
                                        : "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30"
                                    }`}
                                  >
                                    <div className="space-y-2">
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                          {isCompleted ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                          ) : (
                                            <Play className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5 animate-pulse" />
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm leading-tight">
                                              {course.title}
                                            </p>
                                            {isCurrent && (
                                              <p className="text-xs text-blue-600 font-medium mt-1">
                                                Currently learning
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        <Badge
                                          className={`text-xs flex-shrink-0 ${
                                            isCompleted
                                              ? "bg-green-600"
                                              : "bg-blue-600"
                                          }`}
                                        >
                                          {isCompleted
                                            ? "✓ Done"
                                            : "In Progress"}
                                        </Badge>
                                      </div>

                                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                        {course.chapters && (
                                          <div className="flex items-center gap-1">
                                            <BookOpen className="h-3 w-3" />
                                            <span>
                                              {course.chapters.length} chapter
                                              {course.chapters.length !== 1
                                                ? "s"
                                                : ""}
                                            </span>
                                          </div>
                                        )}
                                        {course.totalDuration && (
                                          <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            <span>{course.totalDuration}h</span>
                                          </div>
                                        )}
                                        {course.level && (
                                          <div className="flex items-center gap-1">
                                            <Zap className="h-3 w-3" />
                                            <span className="capitalize">
                                              {course.level}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      {isCurrent && (
                                        <div className="space-y-1 pt-1">
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium">
                                              Progress
                                            </span>
                                            <span className="text-xs font-semibold text-blue-600">
                                              {currentTopic.progress ?? 0}%
                                            </span>
                                          </div>
                                          <Progress
                                            value={currentTopic.progress ?? 0}
                                            className="h-1.5"
                                          />
                                          {currentItem &&
                                            currentItem.chapterTitle && (
                                              <p className="text-xs text-muted-foreground">
                                                {currentItem.chapterTitle}
                                              </p>
                                            )}
                                        </div>
                                      )}

                                      {course.summary && (
                                        <p className="text-xs text-muted-foreground line-clamp-2 pt-1">
                                          {stripHtmlTags(course.summary)}
                                        </p>
                                      )}

                                      {isCurrent && (
                                        <Button
                                          size="sm"
                                          className="w-full mt-2 h-8 text-xs"
                                          disabled={navigating}
                                          onClick={() =>
                                            navigateToFirstUncompletedVideo(
                                              currentTopic.id,
                                              currentTopic.courses ?? [],
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
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      {/* Other content items */}
                      {(() => {
                        const currentOtherItems =
                          nonCourseItemsByTopicId[currentTopic.id] ?? [];
                        if (!currentOtherItems.length) return null;
                        return (
                          <div className="space-y-3 ml-0 mt-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              {currentOtherItems.length} other item
                              {currentOtherItems.length !== 1 ? "s" : ""}
                            </p>
                            <div className="space-y-2">
                              {currentOtherItems.map((item) =>
                                renderContentItem(
                                  item,
                                  false,
                                  false,
                                  false,
                                  true,
                                ),
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Upcoming Topics */}
              {upcomingTopics.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-gray-400" />
                    <h4 className="font-semibold text-gray-600">
                      Upcoming ({upcomingTopics.length})
                    </h4>
                  </div>
                  <div className="space-y-4 pl-7 border-l-2 border-gray-200">
                    {upcomingTopics.map((topic: any) => {
                      const otherItems =
                        nonCourseItemsByTopicId[topic.id] ?? [];
                      return (
                        <div key={topic.id} className="space-y-3">
                          <div className="flex items-start gap-3 opacity-60">
                            <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0 -ml-10 border-2 border-white dark:border-slate-950">
                              🔒
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h5 className="font-semibold text-sm text-gray-600">
                                  {topic.title}
                                </h5>
                                <Badge
                                  variant="outline"
                                  className="text-xs text-gray-500"
                                >
                                  {topic.level || "Intermediate"}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {stripHtmlTags(topic.description || "")}
                              </p>
                            </div>
                          </div>

                          {(topic.courses?.length > 0 ||
                            otherItems.length > 0) && (
                            <div className="space-y-3 ml-0 opacity-75">
                              <div className="flex flex-wrap gap-2">
                                {topic.courses && topic.courses.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {topic.courses.length} Course
                                    {topic.courses.length !== 1 ? "s" : ""}
                                  </Badge>
                                )}
                                {otherItems.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {otherItems.length} other item
                                    {otherItems.length !== 1 ? "s" : ""}
                                  </Badge>
                                )}
                              </div>
                              <div className="space-y-2">
                                {topic.courses?.map((courseItem: any) => {
                                  const course =
                                    courseItem.course || courseItem;
                                  return (
                                    <div
                                      key={course.id}
                                      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 p-3 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                                    >
                                      <div className="space-y-2">
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="flex items-start gap-2 flex-1 min-w-0">
                                            <Lock className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                              <p className="font-semibold text-sm text-gray-700 dark:text-gray-300 leading-tight">
                                                {course.title}
                                              </p>
                                            </div>
                                          </div>
                                          <Badge
                                            variant="outline"
                                            className="text-xs flex-shrink-0 text-gray-500"
                                          >
                                            Locked
                                          </Badge>
                                        </div>

                                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                          {course.chapters && (
                                            <div className="flex items-center gap-1">
                                              <BookOpen className="h-3 w-3" />
                                              <span>
                                                {course.chapters.length} chapter
                                                {course.chapters.length !== 1
                                                  ? "s"
                                                  : ""}
                                              </span>
                                            </div>
                                          )}
                                          {course.totalDuration && (
                                            <div className="flex items-center gap-1">
                                              <Clock className="h-3 w-3" />
                                              <span>
                                                {course.totalDuration}h
                                              </span>
                                            </div>
                                          )}
                                          {course.level && (
                                            <div className="flex items-center gap-1">
                                              <Zap className="h-3 w-3" />
                                              <span className="capitalize">
                                                {course.level}
                                              </span>
                                            </div>
                                          )}
                                        </div>

                                        {course.summary && (
                                          <p className="text-xs text-muted-foreground line-clamp-2">
                                            {stripHtmlTags(course.summary)}
                                          </p>
                                        )}

                                        <div className="flex items-center gap-2 pt-1 text-xs text-gray-500">
                                          <Lock className="h-3 w-3" />
                                          <span>
                                            Unlock after completing{" "}
                                            {topic.title}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                                {otherItems.map((item) =>
                                  renderContentItem(
                                    item,
                                    false,
                                    true,
                                    false,
                                    true,
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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

          {/* Current Topic Card */}
          {currentTopic && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Continue Learning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                    Current Topic
                  </p>
                  <h4 className="font-semibold text-sm">
                    {currentTopic.title}
                  </h4>
                </div>
                {currentItem && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-blue-600 font-semibold mb-1">
                        ▶ Next Up
                      </p>
                      <p className="text-sm font-medium line-clamp-2">
                        {currentItem.title}
                      </p>
                      {currentItem.chapterTitle && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {currentItem.chapterTitle}
                        </p>
                      )}
                      {currentItem.totalItems > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {currentItem.itemIndex} of {currentItem.totalItems}{" "}
                          complete
                        </p>
                      )}
                    </div>
                  </>
                )}
                <Button
                  className="w-full"
                  size="sm"
                  disabled={navigating}
                  onClick={() => {
                    analytics.track("path_continue_clicked", {
                      pathId,
                      topicId: currentTopic.id,
                      topicTitle: currentTopic.title,
                      source: "sidebar",
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
              </CardContent>
            </Card>
          )}

          {/* Path Complete */}
          {progress === 100 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Path Complete!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="text-center p-4 border rounded-lg bg-yellow-50">
                    <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                    <h3 className="font-medium">Certificate</h3>
                    {certificate ? (
                      <p className="text-sm text-muted-foreground">
                        ID:{" "}
                        <span className="font-mono font-medium">
                          {certificate.code}
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Your completion certificate is ready
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
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
                    View Certificate
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
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
            {enrolling ? "Enrolling..." : "Start Learning Path"}
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
