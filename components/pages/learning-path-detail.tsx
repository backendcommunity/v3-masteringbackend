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
  Brain,
  FolderOpen,
  Calendar,
  Video,
  RotateCcw,
  Award,
  Wrench,
  Link2,
  Flag,
  Layers,
  Link,
  Share2,
  Sparkles,
  ChevronRight,
} from "lucide-react";
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
import ConfettiCelebration from "../confetti-celebration";

// Type definitions for multi-content timeline
type ContentItemType =
  | "course"
  | "workshop"
  | "project"
  | "quiz"
  | "exercise"
  | "mock_interview"
  | "bootcamp"
  | "resource"
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
    workshop: {
      icon: Wrench,
      color: "text-teal-600",
      label: "Workshop",
      ctaLabel: "Start Workshop",
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
    resource: {
      icon: Link2,
      color: "text-slate-600",
      label: "Resource",
      ctaLabel: "Open Resource",
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

  (topic.resources || []).forEach((r: any) => {
    items.push({
      id: r.id,
      type: "resource",
      title: r.title,
      description: r.description || "",
      meta: { topicId },
      completed: false,
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
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [celebration, setCelebration] = useState(false);
  const [currentItem, setCurrentItem] = useState<{
    type: string;
    title: string;
    chapterTitle?: string;
    itemIndex: number;
    totalItems: number;
  } | null>(null);
  // Cache milestone per topicId to avoid re-fetching when user clicks Continue
  const milestoneCache = useRef<Record<string, any>>({});
  const typeConfig: Record<
    string,
    { label: string; badgeCls: string; dotCls: string }
  > = {
    course: {
      label: "Course",
      badgeCls: "bg-muted-foreground/20",
      dotCls: "bg-foreground/20",
    },
    workshop: {
      label: "Workshop",
      badgeCls: "bg-muted-foreground/20",
      dotCls: "bg-muted-foreground/20",
    },
    quiz: {
      label: "Skill Assessment",
      badgeCls: "bg-muted-foreground/20",
      dotCls: "bg-muted-foreground/20",
    },
    project: {
      label: "Project",
      badgeCls: "bg-muted-foreground/20",
      dotCls: "bg-muted-foreground/20",
    },
    exercise: {
      label: "Coding Exercise",
      badgeCls: "bg-muted-foreground/20",
      dotCls: "bg-muted-foreground/20",
    },
    mock_interview: {
      label: "Mock Interview",
      badgeCls: "bg-muted-foreground/20",
      dotCls: "bg-muted-foreground/20",
    },
    bootcamp: {
      label: "Live Workshop",
      badgeCls: "bg-muted-foreground/20",
      dotCls: "bg-muted-foreground/20",
    },
    resource: {
      label: "Resource",
      badgeCls: "bg-muted-foreground/20",
      dotCls: "bg-muted-foreground/20",
    },
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const roadmapData = await store.getRoadmapBySlug(pathId);

      setRoadmap(roadmapData);
      const ur = roadmapData?.userRoadmap ?? null;
      setUserRoadmap(ur);

      // Fetch session-derived meters in the background (non-blocking, graceful)
      store.getPathSession(pathId).then(setSession).catch(() => {});

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

        // Just to make first start access faster
        const userRoadmap = enrollResult?.userRoadmap;
        milestoneCache.current[userRoadmap?.currentTopicId] =
          userRoadmap?.currentTopic;

        const updated = await store.getRoadmapBySlug(pathId);
        setRoadmap(updated);
        setUserRoadmap(updated?.userRoadmap ?? null);

        setCelebration(true);
        setShowWelcomeDialog(true);

        analytics.track("path_enrolled", {
          pathId,
          pathTitle: roadmap?.title,
          method: "direct",
        });
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

  // Preview enrollment — optimistically proceed immediately, enroll in background.
  // The enrollment API is fire-and-forget for preview: user shouldn't wait for a
  // DB write before seeing content they're already allowed to access.
  const handlePreviewEnroll = (afterEnroll: () => void) => {
    if (isEnrolled) {
      afterEnroll();
      return;
    }

    // Optimistically mark as preview-enrolled so derived state updates instantly
    setUserRoadmap({ isPreview: true });
    afterEnroll();

    // Background enrollment — silent on success, subtle toast on failure
    store
      .enrollInRoadmap(pathId, true)
      .then(() => {
        store.getRoadmapBySlug(pathId).then((updated: any) => {
          if (updated) {
            setRoadmap(updated);
            setUserRoadmap(updated?.userRoadmap ?? { isPreview: true });
          }
        });
      })
      .catch((error: any) => {
        const msg =
          error?.response?.data?.message === "You're already enrolled."
            ? null // Not an error — concurrent click or page reload race
            : "Failed to enroll in preview mode. Please refresh the page and try again.";
        if (msg) toast.error(msg);
      });
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Header skeleton — mirrors breadcrumb → title → meta */}
        <div className="border-b border-border pb-5 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-28" />
            <span className="text-muted-foreground">/</span>
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
          <Skeleton className="h-4 w-96" />
        </div>
        {/* Description skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Up-next card skeleton */}
            <div className="rounded-2xl border border-border p-5 flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
              <Skeleton className="h-9 w-28 rounded-lg flex-shrink-0" />
            </div>
            {/* Curriculum skeleton */}
            <div className="space-y-4 rounded-2xl border border-border p-6">
              <Skeleton className="h-6 w-48" />
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
          {/* Rail skeleton */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border p-5 space-y-4">
              <Skeleton className="h-5 w-32" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            <Skeleton className="h-8 w-48" />
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
            <div className="p-5 rounded-full bg-primary/10">
              <Clock className="h-14 w-14 text-primary" />
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

  // ── Share helpers ──
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `Check out the ${roadmap.title} learning path on MasteringBackend`;
  const openShare = (network: string, url: string) => {
    analytics.track("path_share_clicked", { pathId, network });
    window.open(url, "_blank", "noopener,noreferrer");
  };
  const shareLinkedIn = () =>
    openShare(
      "linkedin",
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    );
  const shareFacebook = () =>
    openShare(
      "facebook",
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    );
  const shareX = () =>
    openShare(
      "x",
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    );
  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  // ── Session-derived meters (fallback to roadmap progress if session not loaded) ──
  const sessionPath = session?.path;
  const displayProgress = sessionPath?.progressPct ?? progress;
  const masteryPct = sessionPath?.masteryPct ?? null;
  const earnedPoints = sessionPath?.earnedPoints ?? null;
  const certThreshold = sessionPath?.certThreshold ?? null;

  // ── Header meta values ──
  const headerLevel = topics[0]?.level || roadmap.difficulty || "Intermediate";
  const totalCourses = topics.reduce(
    (s: number, t: any) => s + (t.courses?.length || 0),
    0,
  );
  const milestonesCount = topics.length;
  const studentsCount = roadmap.students ?? roadmap.enrolledCount ?? 0;
  const totalQuizzes = topics.reduce(
    (s: number, t: any) => s + (t.quizzes?.length || 0),
    0,
  );
  const totalProjects = topics.reduce(
    (s: number, t: any) => s + (t.projects?.length || 0),
    0,
  );
  const totalExercises = topics.reduce(
    (s: number, t: any) => s + (t.exercises?.length || 0),
    0,
  );

  // ── Flat header block ──
  const pageHeader = (
    <div>
      <nav
        aria-label="breadcrumb"
        className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3"
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

      {/* Blueprint hero — navy anchor; the grid lives here only */}
      <div className="rounded-2xl overflow-hidden">
        <div className="bg-[#0E1F33] text-white relative">
          <div className="hero-grid absolute inset-0" aria-hidden="true" />
          <div className="relative px-8 py-7">
            <div className="eyebrow-mono text-white/[.55]">
              {"// learning path"}
            </div>
            <h1 className="text-3xl font-bold mt-1.5">{roadmap.title}</h1>

            <div className="mt-4">
              {isFullAccess ? (
                <button
                  disabled={navigating}
                  onClick={() => {
                    analytics.track("path_continue_clicked", {
                      pathId,
                      topicId: currentTopic?.id,
                      source: "hero",
                    });
                    onNavigate?.(routes.pathWorkspace(pathId));
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold px-5 py-2.5 text-sm hover:bg-primary/90 transition disabled:opacity-60"
                >
                  <Play className="w-4 h-4" /> Continue Path
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    disabled={enrolling}
                    onClick={handleEnroll}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold px-5 py-2.5 text-sm hover:bg-primary/90 transition disabled:opacity-60"
                  >
                    <Sparkles className="w-4 h-4" />
                    {enrolling ? "Enrolling…" : "Enroll in path"}
                  </button>
                  <span className="text-sm text-white/[.65]">
                    {!roadmap.isPremium || user?.isPremium ? (
                      <>
                        Free with{" "}
                        <span className="font-semibold text-white">Pro</span>
                      </>
                    ) : (
                      <span className="font-semibold text-white">
                        {roadmap.amount
                          ? `$${roadmap.amount}`
                          : "Premium membership required"}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-5 text-sm text-white/[.78]">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-400/90 text-amber-950">
                {headerLevel}
              </span>
              {roadmap.estimatedWeeks > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4 opacity-70" />~
                  {roadmap.estimatedWeeks} weeks · {roadmap.hoursPerWeek}h/wk
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Flag className="w-4 h-4 opacity-70" />
                {milestonesCount} milestones
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Layers className="w-4 h-4 opacity-70" />
                {totalCourses} courses
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-4 h-4 opacity-70" />
                {studentsCount} learners
              </span>
            </div>
          </div>
        </div>

        {/* Completion strip — the hero earns its keep (enrolled only) */}
        {isFullAccess && (
          <div className="text-white px-8 py-4 flex flex-col sm:flex-row gap-6 sm:items-center bg-[#0A1726]">
            <div className="flex-1 min-w-0">
              <div className="eyebrow-mono text-white/[.5] mb-2">
                path completion
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 rounded-full overflow-hidden bg-white/[.12]">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${displayProgress}%` }}
                  />
                </div>
                <span className="text-sm font-semibold">
                  {displayProgress}%
                </span>
              </div>
            </div>
            {session && masteryPct != null && (
              <div className="sm:w-72">
                <div className="eyebrow-mono text-white/[.5] mb-2">
                  mastery · certificate
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 rounded-full overflow-hidden bg-white/[.12]">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{ width: `${masteryPct}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-emerald-400">
                    {earnedPoints}
                    <span className="opacity-60 font-normal">
                      /{certThreshold}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ── Path description (plain block below hero) ──
  const pathDescription = roadmap.summary ? (
    <div>
      <h3 className="font-semibold text-[15px] mb-1.5">Path description</h3>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
        {stripHtmlTags(roadmap.summary)}
      </p>
    </div>
  ) : null;

  // ── Share (monochrome icon row — brand color on hover only) ──
  const shareBtnCls =
    "h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors";
  const shareRow = (
    <div className="flex items-center gap-1.5">
      <span className="flex items-center gap-1.5 mr-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        <Share2 className="w-3.5 h-3.5" />
        Share
      </span>
      <button
        onClick={shareLinkedIn}
        className={shareBtnCls}
        aria-label="Share on LinkedIn"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.3c0-1.27-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.8V21h-4z" />
        </svg>
      </button>
      <button
        onClick={shareX}
        className={shareBtnCls}
        aria-label="Share on X"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </button>
      <button
        onClick={shareFacebook}
        className={shareBtnCls}
        aria-label="Share on Facebook"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.86.24-1.45 1.48-1.45H17V4.1c-.27-.04-1.2-.12-2.28-.12-2.26 0-3.8 1.38-3.8 3.9V10H8.2v3h2.72v8z" />
        </svg>
      </button>
      <button
        onClick={copyShareLink}
        className={shareBtnCls}
        aria-label="Copy link"
      >
        <Link className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  // ── Enroll card (preview rail — the one place counts earn their spot) ──
  const enrollCard = (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="font-semibold text-[15px] mb-3">What&apos;s inside</h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            Courses
          </span>
          <span className="font-medium">{totalCourses}</span>
        </div>
        {totalQuizzes > 0 && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Brain className="w-4 h-4" />
              Quizzes
            </span>
            <span className="font-medium">{totalQuizzes}</span>
          </div>
        )}
        {totalProjects > 0 && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              <FolderOpen className="w-4 h-4" />
              Projects
            </span>
            <span className="font-medium">{totalProjects}</span>
          </div>
        )}
        {totalExercises > 0 && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Code2 className="w-4 h-4" />
              Exercises
            </span>
            <span className="font-medium">{totalExercises}</span>
          </div>
        )}
        {roadmap.estimatedWeeks > 0 && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              Est. time
            </span>
            <span className="font-medium">~{roadmap.estimatedWeeks} weeks</span>
          </div>
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="text-sm text-muted-foreground mb-3">
          {!roadmap.isPremium || user?.isPremium ? (
            <>
              Free with{" "}
              <span className="font-semibold text-foreground">Pro</span>
            </>
          ) : (
            <span className="font-semibold text-foreground">
              {roadmap.amount
                ? `$${roadmap.amount}`
                : "Premium membership required"}
            </span>
          )}
        </div>
        <button
          disabled={enrolling}
          onClick={handleEnroll}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-medium px-5 py-2.5 text-sm hover:bg-primary/90 transition disabled:opacity-60"
        >
          <Sparkles className="w-4 h-4" />
          {enrolling ? "Enrolling…" : "Enroll in path"}
        </button>
      </div>
    </div>
  );

  // Non-enrolled OR preview-enrolled: show sales/preview page
  if (!isFullAccess) {
    return (
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {pageHeader}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {pathDescription}

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

            {/* Curriculum Preview */}
            <Card>
              {/* <CardHeader>
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
              </CardHeader> */}
              <CardContent className="px-0 pt-0">
                {(() => {
                  // const typeConfig: Record<
                  //   string,
                  //   { label: string; badgeCls: string; dotCls: string }
                  // > = {
                  //   course: {
                  //     label: "Course",
                  //     badgeCls:
                  //       "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
                  //     dotCls: "bg-foreground",
                  //   },
                  //   workshop: {
                  //     label: "Workshop",
                  //     badgeCls:
                  //       "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300",
                  //     dotCls: "bg-teal-500",
                  //   },
                  //   quiz: {
                  //     label: "Skill Assessment",
                  //     badgeCls:
                  //       "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300",
                  //     dotCls: "bg-indigo-500",
                  //   },
                  //   project: {
                  //     label: "Project",
                  //     badgeCls:
                  //       "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
                  //     dotCls: "bg-green-500",
                  //   },
                  //   exercise: {
                  //     label: "Coding Exercise",
                  //     badgeCls:
                  //       "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
                  //     dotCls: "bg-emerald-500",
                  //   },
                  //   mock_interview: {
                  //     label: "Mock Interview",
                  //     badgeCls:
                  //       "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
                  //     dotCls: "bg-red-500",
                  //   },
                  //   bootcamp: {
                  //     label: "Live Workshop",
                  //     badgeCls:
                  //       "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
                  //     dotCls: "bg-amber-500",
                  //   },
                  //   resource: {
                  //     label: "Resource",
                  //     badgeCls:
                  //       "bg-slate-100 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300",
                  //     dotCls: "bg-slate-400",
                  //   },
                  // };
                  return (
                    <div>
                      {topics.map((topic: any) => {
                        // Use pre-sorted flat contents from backend (same order as build-roadmap-response.ts)
                        const rawContents: any[] = topic.sortedContents || [];
                        let courseNum = 0;
                        const topicItems = rawContents.map((item: any) => {
                          const isCourseOrWorkshop =
                            item.type === "course" || item.type === "workshop";
                          if (isCourseOrWorkshop) courseNum++;
                          return {
                            id: item.id,
                            type: item.type,
                            title: item.title,
                            description: item.summary || item.description || "",
                            num: isCourseOrWorkshop ? courseNum : undefined,
                          };
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
                                        {/* Card */}
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

          {/* Sidebar */}
          <div className="space-y-4 lg:sticky lg:top-6 self-start">
            {enrollCard}
            {shareRow}
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
          onEnroll={() => {
            handleEnroll();
            setShowPreviewDialog(false);
          }}
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
    <div className="max-w-7xl mx-auto w-full space-y-6">
      {pageHeader}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {pathDescription}

          {/* Current Step — single focused "Up next" row */}
          {currentTopic && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-4">
                {/* Brand icon tile */}
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                  <Play className="w-5 h-5" />
                </div>

                {/* Focus: the next step */}
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Up next · Milestone {currentTopicIndex + 1}
                  </div>
                  <h3 className="font-bold text-foreground text-[15px] leading-snug truncate mt-0.5">
                    {currentItem?.title ?? currentTopic.title}
                  </h3>
                  <p className="text-[13px] text-muted-foreground truncate">
                    {currentTopic.title}
                    {currentItem?.chapterTitle
                      ? ` · ${currentItem.chapterTitle}`
                      : ""}
                  </p>
                  <div className="flex items-center gap-3 mt-2.5">
                    <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${currentTopic.progress ?? 0}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-foreground shrink-0">
                      {currentTopic.progress ?? 0}%
                      {currentItem && currentItem.totalItems > 0 && (
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          · {currentItem.itemIndex}/{currentItem.totalItems}
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* CTA — right-aligned on desktop */}
                <Button
                  className="shrink-0 self-center hidden sm:inline-flex"
                  onClick={() => {
                    analytics.track("path_continue_clicked", {
                      pathId,
                      topicId: currentTopic.id,
                      topicTitle: currentTopic.title,
                      source: "current_card",
                    });
                    onNavigate?.(routes.pathWorkspace(pathId));
                  }}
                >
                  Continue
                  <ChevronRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>

              {/* Mobile CTA — full width below */}
              <Button
                className="w-full mt-4 sm:hidden"
                onClick={() => {
                  analytics.track("path_continue_clicked", {
                    pathId,
                    topicId: currentTopic.id,
                    topicTitle: currentTopic.title,
                    source: "current_card",
                  });
                  onNavigate?.(routes.pathWorkspace(pathId));
                }}
              >
                <Play className="mr-2 h-4 w-4" />
                Continue Learning
              </Button>
            </div>
          )}

          {/* Learning Path Timeline */}
          <Card>
            {/* <CardHeader>
              <CardTitle>Learning Timeline</CardTitle>
              <CardDescription>
                Your progress through topics and courses
              </CardDescription>
            </CardHeader> */}
            <CardContent className="px-0 pt-0">
              {/* Unified topic-grouped learning timeline */}
              {(() => {
                return (
                  <div>
                    {topics.map((topic: any) => {
                      const isTopicCompleted = topic.completed === true;
                      const isTopicCurrent = topic.id === currentTopic?.id;

                      // Use pre-sorted flat contents from backend (mirrors build-roadmap-response.ts order)
                      let courseNum = 0;
                      const topicItems = [
                        ...(topic.sortedContents || []),

                        // FOr testing other content types without modifying backend data structure
                        // {
                        //   id: "asa",
                        //   type: "resource",
                        //   title: "Test",
                        //   description: "Test description",
                        //   num: undefined,
                        //   isCompleted: false,
                        //   raw: {},
                        // },
                      ].map((item: any) => {
                        const isCourseOrWorkshop =
                          item.type === "course" || item.type === "workshop";

                        if (isCourseOrWorkshop) courseNum++;

                        return {
                          id: item.id,
                          type: item.type,
                          title: item.title,
                          description: item.summary || item.description || "",
                          num: isCourseOrWorkshop ? courseNum : undefined,
                          isCompleted: item.isCompleted ?? false,
                          raw: item,
                        };
                      });
                      if (topicItems.length === 0) return null;

                      return (
                        <div
                          key={topic.id}
                          className="border-t first:border-t-0"
                        >
                          {/* Topic header */}
                          <div
                            className={`px-6 py-3 border-b flex items-center gap-3 ${isTopicCompleted ? "bg-emerald-50/50 dark:bg-emerald-950/20" : "bg-muted/30"}`}
                          >
                            {isTopicCompleted ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                            ) : isTopicCurrent ? (
                              <Play className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <div className="h-4 w-4 rounded-full bg-muted-foreground/20 flex-shrink-0" />
                            )}
                            <p
                              className={`text-xs font-semibold uppercase tracking-wider flex-1 ${isTopicCompleted ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}
                            >
                              {topic.title}
                            </p>
                            {isTopicCompleted && (
                              <Badge className="bg-emerald-600 text-[10px]">
                                Complete
                              </Badge>
                            )}
                            {/* {isTopicCurrent && (
                              <Badge className="bg-blue-600 text-[10px]">
                                In Progress · {topic.progress ?? 0}%
                              </Badge>
                            )} */}
                          </div>

                          {/* Timeline items */}
                          <div className="relative px-4 py-3">
                            <div className="absolute left-[1.625rem] top-5 bottom-5 w-px bg-border" />
                            <Accordion
                              type="single"
                              collapsible
                              className="space-y-3"
                            >
                              {topicItems.map((item: any) => {
                                const cfg =
                                  typeConfig[item.type] ?? typeConfig.course;
                                const dotCls = cfg.dotCls;
                                const numBgCls = item.isCompleted
                                  ? "bg-emerald-600"
                                  : "bg-foreground";
                                const isCourseType =
                                  item.type === "course" ||
                                  item.type === "workshop";
                                const isResourceType = item.type === "resource";
                                const hasAction = true;
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
                                      <div className="flex-1 rounded-xl border bg-card shadow-sm overflow-hidden">
                                        <AccordionTrigger className="w-full px-4 py-4 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/10">
                                          <div className="space-y-1.5 text-left flex-1 pr-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span
                                                className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.badgeCls}`}
                                              >
                                                {cfg.label}
                                              </span>
                                              {item.isCompleted && (
                                                <Badge className="bg-emerald-600 text-[10px] py-0 px-1.5 h-auto text-white hover:bg-emerald-700">
                                                  ✓ Done
                                                </Badge>
                                              )}
                                              {isTopicCurrent &&
                                                !item.isCompleted &&
                                                isCourseType && (
                                                  <Badge className="bg-primary text-[10px] py-0 px-1.5 h-auto text-primary-foreground hover:bg-primary/90">
                                                    In Progress
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
                                              {isResourceType &&
                                                !item.isLocked && (
                                                  <Link2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                                )}
                                            </div>
                                            {isTopicCurrent &&
                                              !item.isCompleted &&
                                              isCourseType && (
                                                <div className="space-y-1">
                                                  <Progress
                                                    value={topic.progress ?? 0}
                                                    className="h-1.5"
                                                  />
                                                  <p className="text-xs text-primary font-medium">
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
                                              {/* CTA button per type */}
                                              {hasAction &&
                                                (() => {
                                                  const handleClick = () => {
                                                    analytics.track(
                                                      item.isCompleted
                                                        ? "path_completed_content_reviewed"
                                                        : "path_content_clicked",
                                                      {
                                                        pathId,
                                                        topicId: topic.id,
                                                        contentType: item.type,
                                                        contentId: item.id,
                                                        contentTitle:
                                                          item.title,
                                                      },
                                                    );
                                                    // All content opens in the unified workspace.
                                                    // Step ids use the compiled "topicId:TYPE:itemId" format.
                                                    const stepFor = (
                                                      type: string,
                                                      itemId: string,
                                                    ) =>
                                                      `${topic.id}:${type}:${itemId}`;
                                                    switch (item.type) {
                                                      case "course":
                                                      case "workshop": {
                                                        // Courses are groups in the workspace — deep-link
                                                        // their first video, else let the cursor resume.
                                                        const firstVideo =
                                                          item.raw?.chapters?.[0]
                                                            ?.videos?.[0];
                                                        onNavigate?.(
                                                          routes.pathWorkspace(
                                                            pathId,
                                                            firstVideo
                                                              ? stepFor(
                                                                  "VIDEO",
                                                                  firstVideo.id,
                                                                )
                                                              : undefined,
                                                          ),
                                                        );
                                                        break;
                                                      }
                                                      case "quiz":
                                                        onNavigate?.(
                                                          routes.pathWorkspace(
                                                            pathId,
                                                            stepFor(
                                                              "QUIZ",
                                                              item.id,
                                                            ),
                                                          ),
                                                        );
                                                        break;
                                                      case "exercise":
                                                        onNavigate?.(
                                                          routes.pathWorkspace(
                                                            pathId,
                                                            stepFor(
                                                              "EXERCISE",
                                                              item.id,
                                                            ),
                                                          ),
                                                        );
                                                        break;
                                                      case "project":
                                                        onNavigate?.(
                                                          routes.pathWorkspace(
                                                            pathId,
                                                            stepFor(
                                                              "PROJECT",
                                                              item.id,
                                                            ),
                                                          ),
                                                        );
                                                        break;
                                                      case "bootcamp":
                                                        onNavigate?.(
                                                          routes.pathWorkspace(
                                                            pathId,
                                                            stepFor(
                                                              "BOOTCAMP",
                                                              item.id,
                                                            ),
                                                          ),
                                                        );
                                                        break;
                                                      case "mock_interview":
                                                        onNavigate?.(
                                                          routes.pathWorkspace(
                                                            pathId,
                                                            stepFor(
                                                              "MOCK_INTERVIEW",
                                                              item.id,
                                                            ),
                                                          ),
                                                        );
                                                        break;
                                                      case "resource":
                                                        onNavigate?.(
                                                          routes.pathWorkspace(
                                                            pathId,
                                                            stepFor(
                                                              "RESOURCE",
                                                              item.id,
                                                            ),
                                                          ),
                                                        );
                                                        break;
                                                    }
                                                  };
                                                  const isCourseCompleted =
                                                    item.isCompleted &&
                                                    isCourseType;
                                                  const isCourseInProgress =
                                                    isTopicCurrent &&
                                                    !item.isCompleted &&
                                                    isCourseType;
                                                  if (isCourseCompleted) {
                                                    return (
                                                      <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 text-xs w-full"
                                                        disabled={navigating}
                                                        onClick={handleClick}
                                                      >
                                                        <RotateCcw className="h-3 w-3 mr-1" />
                                                        {navigating
                                                          ? "Loading…"
                                                          : "Review Course"}
                                                      </Button>
                                                    );
                                                  }
                                                  if (isCourseInProgress) {
                                                    return (
                                                      <Button
                                                        size="sm"
                                                        className="w-full h-8 text-xs"
                                                        disabled={navigating}
                                                        onClick={handleClick}
                                                      >
                                                        <Play className="h-3 w-3 mr-1" />
                                                        {navigating
                                                          ? "Loading…"
                                                          : "Resume Learning"}
                                                      </Button>
                                                    );
                                                  }
                                                  if (isCourseType) {
                                                    return (
                                                      <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 text-xs w-full"
                                                        disabled={navigating}
                                                        onClick={handleClick}
                                                      >
                                                        <Play className="h-3 w-3 mr-1" />
                                                        {navigating
                                                          ? "Loading…"
                                                          : "Start Course"}
                                                      </Button>
                                                    );
                                                  }
                                                  const typeCtaLabel: Record<
                                                    string,
                                                    string
                                                  > = {
                                                    quiz: item.isCompleted
                                                      ? "Retake Quiz"
                                                      : "Take Quiz",
                                                    exercise: item.isCompleted
                                                      ? "Redo Exercise"
                                                      : "Solve Exercise",
                                                    project: item.isCompleted
                                                      ? "View Project"
                                                      : "Open Project",
                                                    bootcamp: "Join Bootcamp",
                                                    mock_interview:
                                                      item.isCompleted
                                                        ? "View Results"
                                                        : "Start Interview",
                                                    resource: "Open Resource",
                                                  };
                                                  const typeCtaIcon: Record<
                                                    string,
                                                    any
                                                  > = {
                                                    quiz: item.isCompleted
                                                      ? RotateCcw
                                                      : Brain,
                                                    exercise: item.isCompleted
                                                      ? RotateCcw
                                                      : Code2,
                                                    project: FolderOpen,
                                                    bootcamp: Calendar,
                                                    mock_interview:
                                                      item.isCompleted
                                                        ? RotateCcw
                                                        : Video,
                                                    resource: Link2,
                                                  };
                                                  const CtaIcon =
                                                    typeCtaIcon[item.type] ??
                                                    Play;
                                                  const ctaLabel =
                                                    typeCtaLabel[item.type] ??
                                                    "Open";
                                                  return (
                                                    <Button
                                                      size="sm"
                                                      variant={
                                                        item.isCompleted
                                                          ? "outline"
                                                          : "default"
                                                      }
                                                      className="h-8 text-xs w-full"
                                                      onClick={handleClick}
                                                    >
                                                      <CtaIcon className="h-3 w-3 mr-1" />
                                                      {ctaLabel}
                                                    </Button>
                                                  );
                                                })()}
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
        <div className="space-y-4 lg:sticky lg:top-6 self-start">
          {shareRow}
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
              <span className="text-xs font-medium text-primary">
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
            {enrolling ? "Enrolling…" : "Enroll Now"}
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

      <ConfettiCelebration
        onComplete={() => setCelebration(false)}
        isVisible={celebration}
        celebrationType="enrollment"
        courseName={roadmap?.title!}
      />

      {/* Post-enrollment welcome dialog */}
      <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-8 w-8 text-primary" />
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
              <div className="text-left p-3 bg-primary/5 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <p className="text-sm font-medium">{topics[0].title}</p>
                </div>
                {topics[0].courses?.[0] && (
                  <div className="flex items-center gap-2 ml-8">
                    <BookOpen className="h-4 w-4 text-primary shrink-0" />
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

                analytics.track("path_continue_clicked", {
                  pathId,
                  topicId: topics[0].id,
                  topicTitle: topics[0].title,
                  source: "welcome_dialog",
                });
                onNavigate?.(routes.pathWorkspace(pathId));
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
