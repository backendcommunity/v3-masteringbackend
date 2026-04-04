"use client";
import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import { Loader } from "../ui/loader";
import { stripHtmlTags } from "@/lib/html-utils";
import { toast } from "sonner";

// Type definitions for multi-content timeline
type ContentItemType = "course" | "project" | "quiz" | "exercise" | "mock_interview" | "bootcamp" | "land";

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
  const configs: Record<ContentItemType, { icon: any; color: string; label: string; ctaLabel: string }> = {
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
  isEnrolled: boolean = false
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
      meta: { difficulty: exercise.difficulty, language: exercise.language, topicId },
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
      meta: { isOptional: bootcampItem.isOptional ?? false },
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

interface LearningPathContinuePageProps {
  pathId: string;
  onNavigate?: (route: string) => void;
}

export function LearningPathContinuePage({
  pathId,
  onNavigate,
}: LearningPathContinuePageProps) {
  const store = useAppStore();
  const [roadmap, setRoadmap] = useState<any>(null);
  const [userRoadmap, setUserRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);

  // Deep-link to the exact video where the user left off
  const navigateToFirstUncompletedVideo = async (topicId: string, courses: any[]) => {
    if (!onNavigate) return;
    setNavigating(true);
    try {
      const milestone = await store.getMilestone(pathId, topicId);
      const completedVideoIds = new Set(
        (milestone?.userTopic?.completedItems ?? [])
          .filter((ci: any) => ci.itemType === "VIDEO")
          .map((ci: any) => ci.itemId)
      );

      for (const course of courses) {
        const chapters: any[] = course.chapters ?? [];
        for (const chapter of chapters) {
          const videos: any[] = chapter.videos ?? [];
          for (const video of videos) {
            if (!completedVideoIds.has(video.id)) {
              onNavigate(
                routes.pathVideoWatch(pathId, topicId, course.slug, chapter.slug, video.slug)
              );
              return;
            }
          }
        }
      }

      // All videos complete — land on the last video
      const lastCourse = courses[courses.length - 1];
      const lastChapter = lastCourse?.chapters?.[lastCourse.chapters.length - 1];
      const lastVideo = lastChapter?.videos?.[lastChapter.videos.length - 1];
      if (lastVideo) {
        onNavigate(
          routes.pathVideoWatch(pathId, topicId, lastCourse.slug, lastChapter.slug, lastVideo.slug)
        );
      } else {
        onNavigate(routes.pathContinue(pathId));
      }
    } catch {
      onNavigate(routes.pathContinue(pathId));
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
    isEnrolled: boolean = false
  ) => {
    const config = getContentTypeConfig(item.type);
    const IconComponent = config.icon;

    // Determine status
    const isAvailable = !isLocked && isEnrolled;
    const status = isCompleted
      ? "completed"
      : isCurrent
        ? "current"
        : isLocked
          ? "locked"
          : "available";

    // Determine styles based on status
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
            <IconComponent className={`h-4 w-4 ${config.color} flex-shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">{item.title}</p>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {item.description}
                </p>
              )}
              {(item.duration || item.meta?.chapters || item.meta?.difficulty) && (
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
              <span className="font-semibold text-blue-600">{item.progress}%</span>
            </div>
            <Progress value={item.progress} className="h-1.5" aria-label={`${item.title} progress: ${item.progress ?? 0}%`} aria-valuenow={item.progress} />
          </div>
        )}
        {isAvailable && (
          <Button
            size="sm"
            className="w-full mt-3 h-8 text-xs"
            onClick={() => {
              const topicId = item.meta?.topicId || "";
              switch (item.type) {
                case "course":
                  onNavigate?.(routes.roadmapCoursePreview(pathId, topicId, item.id));
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
            <Play className="h-3 w-3 mr-1" />
            {config.ctaLabel}
          </Button>
        )}
      </div>
    );
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [roadmapData, userRoadmapsData] = await Promise.all([
          store.getRoadmapBySlug(pathId),
          store.getUserRoadmaps({ skip: 0, size: 50, filters: "" }),
        ]);

        setRoadmap(roadmapData);
        const ur = (userRoadmapsData || []).find(
          (ur: any) =>
            ur.roadmap?.slug === pathId || ur.roadmapId === roadmapData?.id,
        );
        setUserRoadmap(ur || null);

        // Fetch certificate if path is completed
        if (ur?.isCompleted) {
          store.getRoadmapCertificate(pathId).then(setCertificate).catch(() => {});
        }
      } catch (error) {
        console.error("Failed to load learning path continue data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [pathId, store]);

  if (loading) return <Loader isLoader={false} />;

  if (!roadmap) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Learning Path not found</h1>
          <Button onClick={() => onNavigate?.("/paths")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Learning Paths
          </Button>
        </div>
      </div>
    );
  }

  // For non-enrolled users, create a preview with first topic as current
  const displayUserRoadmap = userRoadmap || {
    currentTopicId: roadmap.topics?.[0]?.id,
    isCompleted: false,
  };

  const topics = roadmap.topics || [];
  const currentTopicIndex = topics.findIndex(
    (t: any) => t.id === displayUserRoadmap.currentTopicId,
  );
  const completedTopics = topics.slice(0, Math.max(0, currentTopicIndex));
  const currentTopic =
    currentTopicIndex >= 0 ? topics[currentTopicIndex] : null;
  const upcomingTopics = topics.slice(currentTopicIndex + 1);
  const progress =
    displayUserRoadmap?.isCompleted || displayUserRoadmap?.isCompleted === true
      ? 100
      : currentTopicIndex >= 0
        ? Math.round((currentTopicIndex / Math.max(1, topics.length)) * 100)
        : 0;
  const isEnrolled = Boolean(userRoadmap);

  // For non-enrolled users, show details/sales page
  if (!isEnrolled) {
    return (
      <div className="flex-1 space-y-6">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <button onClick={() => onNavigate?.(routes.paths)} className="hover:text-foreground transition-colors">
            Learning Paths
          </button>
          <span>/</span>
          <button onClick={() => onNavigate?.(`/paths/${pathId}`)} className="hover:text-foreground transition-colors">
            {roadmap.title}
          </button>
          <span>/</span>
          <span className="text-foreground font-medium">Preview</span>
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
            <div className="grid gap-4 md:grid-cols-4">
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
                        {roadmap.timeframe || "Self-paced"}
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
                    0
                  )}{" "}
                  professional courses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {topics.map((topic: any, topicIndex: number) => (
                  <div key={topic.id} className="space-y-4">
                    {/* Topic Header */}
                    <div className="pb-3 border-b">
                      <div className="flex items-start gap-4">
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
                          <p className="text-sm text-muted-foreground mt-2">
                            {stripHtmlTags(topic.description || "")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Courses in Topic */}
                    {topic.courses && topic.courses.length > 0 ? (
                      <div className="space-y-3 ml-12">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Courses in this topic
                        </p>
                        <div className="space-y-3">
                          {topic.courses.map((courseItem: any) => {
                            const course =
                              courseItem.course || courseItem;
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
                                        <p className="text-xs text-blue-600 font-medium mt-1">
                                          Master this course
                                        </p>
                                      </div>
                                    </div>
                                    <Badge className="bg-blue-600 text-xs flex-shrink-0">
                                      Available
                                    </Badge>
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

                                  {/* Course Description */}
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {stripHtmlTags(
                                      course.summary ||
                                        course.description ||
                                        ""
                                    )}
                                  </p>

                                  {/* Course Structure Preview */}
                                  {course.chapters &&
                                    course.chapters.length > 0 && (
                                      <div className="space-y-2 pt-2">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                          What you'll learn
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                          {course.chapters
                                            .slice(0, 4)
                                            .map(
                                              (chapter: any, idx: number) => (
                                                <div
                                                  key={idx}
                                                  className="flex items-start gap-2 text-xs"
                                                >
                                                  <CheckCircle2 className="h-3 w-3 text-blue-600 flex-shrink-0 mt-0.5" />
                                                  <span className="text-muted-foreground line-clamp-1">
                                                    {chapter.title}
                                                  </span>
                                                </div>
                                              )
                                            )}
                                          {course.chapters.length > 4 && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground col-span-2">
                                              <span>
                                                +{course.chapters.length - 4}{" "}
                                                more chapter
                                                {course.chapters.length - 4 !==
                                                1
                                                  ? "s"
                                                  : ""}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  {/* Enrollment CTA */}
                                  <Button
                                    size="sm"
                                    className="w-full mt-3 h-9 text-sm"
                                    onClick={() =>
                                      onNavigate?.(`/paths/${pathId}`)
                                    }
                                  >
                                    <Play className="h-4 w-4 mr-2" />
                                    Start This Course
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                          {/* Other content items (Projects, Quizzes, Exercises, etc.) */}
                          {getNonCourseItems(topic, false).map((item) => {
                            // For non-enrolled, make dummy items look like courses initially
                            const config = getContentTypeConfig(item.type);
                            const IconComponent = config.icon;

                            return (
                              <div
                                key={item.id}
                                className="rounded-lg border border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 p-4 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm transition-all group"
                              >
                                <div className="space-y-3">
                                  {/* Header */}
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                      <IconComponent className={`h-5 w-5 ${config.color} flex-shrink-0 mt-0.5`} />
                                      <div className="flex-1 min-w-0">
                                        <h5 className="font-semibold text-sm leading-tight">
                                          {item.title}
                                        </h5>
                                        <p className="text-xs text-blue-600 font-medium mt-1">
                                          {config.label}
                                        </p>
                                      </div>
                                    </div>
                                    <Badge className="bg-blue-600 text-xs flex-shrink-0">
                                      Available
                                    </Badge>
                                  </div>

                                  {/* Item metadata */}
                                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                    {item.meta?.chapters && (
                                      <div className="flex items-center gap-1">
                                        <BookOpen className="h-3 w-3" />
                                        <span>
                                          {item.meta.chapters} chapter
                                          {item.meta.chapters !== 1 ? "s" : ""}
                                        </span>
                                      </div>
                                    )}
                                    {item.duration && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{item.duration}</span>
                                      </div>
                                    )}
                                    {(item.level || item.meta?.difficulty) && (
                                      <div className="flex items-center gap-1">
                                        <Zap className="h-3 w-3" />
                                        <span className="capitalize">
                                          {item.level || item.meta?.difficulty}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Item description */}
                                  {item.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {item.description}
                                    </p>
                                  )}

                                  {/* Enrollment CTA */}
                                  <Button
                                    size="sm"
                                    className="w-full mt-3 h-9 text-sm"
                                    onClick={() =>
                                      onNavigate?.(`/paths/${pathId}`)
                                    }
                                  >
                                    <Play className="h-4 w-4 mr-2" />
                                    {config.ctaLabel}
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="ml-12 text-xs text-muted-foreground italic">
                        No courses in this topic yet
                      </div>
                    )}
                  </div>
                ))}
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
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>{roadmap.timeframe}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Lifetime Access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Certificate Included</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => onNavigate?.(`/paths/${pathId}`)}
                >
                  Enroll Now
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Premium membership required
                </p>
              </CardContent>
            </Card>

            {/* Social Proof */}
            {roadmap?.students?.length && (
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

            {/* Why Enroll */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Why Choose This?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Zap className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Structured Learning</p>
                      <p className="text-xs text-muted-foreground">
                        Proven curriculum from industry experts
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Target className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Career Growth</p>
                      <p className="text-xs text-muted-foreground">
                        Build skills employers want
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Trophy className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">
                        Recognized Credential
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Shareable certificate of completion
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // For enrolled users, show progress timeline
  return (
    <div className="flex-1 space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <button onClick={() => onNavigate?.(routes.paths)} className="hover:text-foreground transition-colors">
          Learning Paths
        </button>
        <span>/</span>
        <button onClick={() => onNavigate?.(`/paths/${pathId}`)} className="hover:text-foreground transition-colors">
          {roadmap.title}
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">Continue</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Continue: {roadmap.title}
          </h1>
          <p className="text-muted-foreground">
            {currentTopicIndex + 1} of {topics.length} • {progress}% Complete
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onNavigate?.(`/paths/${pathId}`)}
          >
            Back to Path
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Overall Progress
              </div>
              <div className="flex items-center gap-2">
                <Progress value={progress} className="h-2 flex-1" aria-label={`Overall learning path progress: ${progress}%`} aria-valuenow={progress} />
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
            <Card className="border-2 border-blue-200 ">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
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
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Topic Progress</span>
                    <span className="text-sm">
                      {currentTopic.progress ?? 0}%
                    </span>
                  </div>
                  <Progress value={currentTopic.progress ?? 0} className="h-2" aria-label={`${currentTopic.title} topic progress: ${currentTopic.progress ?? 0}%`} aria-valuenow={currentTopic.progress ?? 0} />

                  <div className="flex gap-3">
                    <Button
                      className="flex-1"
                      disabled={navigating}
                      onClick={() => {
                        if (isEnrolled) {
                          navigateToFirstUncompletedVideo(currentTopic.id, currentTopic.courses ?? []);
                        } else {
                          onNavigate?.(`/paths/${pathId}`);
                        }
                      }}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {navigating ? "Loading…" : isEnrolled ? "Continue Topic" : "Enroll to Start"}
                    </Button>
                    {isEnrolled && (
                      <Button variant="outline">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Resources
                      </Button>
                    )}
                  </div>
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
              {/* Completed Topics Section */}
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
                      const otherItems = getNonCourseItems(topic, isEnrolled);
                      return (<div key={topic.id} className="space-y-3">
                        {/* Topic */}
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

                        {/* Learning Content (Courses, Projects, Quizzes, Exercises, etc.) */}
                        {(topic.courses?.length > 0 || otherItems.length > 0) && (
                          <div className="space-y-3 ml-0 mt-3">
                            <div className="flex flex-wrap gap-2">
                              {topic.courses && topic.courses.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {topic.courses.length} Course{topic.courses.length !== 1 ? "s" : ""}
                                </Badge>
                              )}
                              {otherItems.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {otherItems.length} other item{otherItems.length !== 1 ? "s" : ""}
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-2">
                              {/* Real courses */}
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
                                                {course.chapters.length} chapters
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
                                      <Badge className="bg-green-600 text-xs flex-shrink-0">
                                        ✓ Done
                                      </Badge>
                                    </div>
                                  </div>
                                );
                              })}
                              {otherItems.map((item) =>
                                renderContentItem(item, true, false, false, true)
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );})}
                  </div>
                </div>
              )}

              {/* Current Topic Section */}
              {currentTopic && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-700">
                      In Progress
                    </h4>
                  </div>
                  <div className="space-y-4 pl-7 border-l-2 border-blue-300">
                    {/* Current Topic */}
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
                          <Progress value={currentTopic.progress ?? 0} className="h-1 mt-3" aria-label={`${currentTopic.title} progress: ${currentTopic.progress ?? 0}%`} aria-valuenow={currentTopic.progress ?? 0} />
                          <p className="text-xs text-muted-foreground mt-2">
                            {currentTopic.progress ?? 0}% complete
                          </p>
                        </div>
                      </div>

                      {/* Current Topic Courses */}
                      {currentTopic.courses && currentTopic.courses.length > 0 && (
                        <div className="space-y-3 ml-0 mt-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {currentTopic.courses.length} Course{currentTopic.courses.length !== 1 ? "s" : ""}
                          </p>
                          <div className="space-y-2">
                            {currentTopic.courses.map(
                              (courseItem: any, idx: number) => {
                                const course =
                                  courseItem.course || courseItem;
                                const isCurrent = idx === 0;
                                return (
                                  <div
                                    key={course.id}
                                    className={`rounded-lg border p-3 transition-colors ${
                                      isCurrent
                                        ? "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30"
                                        : "border-muted bg-muted/30 hover:border-muted-foreground/30"
                                    }`}
                                  >
                                    <div className="space-y-2">
                                      {/* Header */}
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                          {isCurrent ? (
                                            <Play className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5 animate-pulse" />
                                          ) : (
                                            <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
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
                                            isCurrent
                                              ? "bg-blue-600"
                                              : "bg-muted-foreground/20"
                                          }`}
                                        >
                                          {isCurrent ? "In Progress" : "Upcoming"}
                                        </Badge>
                                      </div>

                                      {/* Course metadata */}
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

                                      {/* Progress bar for current course */}
                                      {isCurrent && (
                                        <div className="space-y-1 pt-1">
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium">
                                              Progress
                                            </span>
                                            <span className="text-xs font-semibold text-blue-600">
                                              35%
                                            </span>
                                          </div>
                                          <Progress
                                            value={35}
                                            className="h-1.5"
                                          />
                                          <p className="text-xs text-muted-foreground">
                                            Chapter 3 of 8
                                          </p>
                                        </div>
                                      )}

                                      {/* Course description */}
                                      {course.summary && (
                                        <p className="text-xs text-muted-foreground line-clamp-2 pt-1">
                                          {stripHtmlTags(course.summary)}
                                        </p>
                                      )}

                                      {/* Quick action */}
                                      {isCurrent && (
                                        <Button
                                          size="sm"
                                          className="w-full mt-2 h-8 text-xs"
                                          disabled={navigating}
                                          onClick={() =>
                                            navigateToFirstUncompletedVideo(currentTopic.id, currentTopic.courses ?? [])
                                          }
                                        >
                                          <Play className="h-3 w-3 mr-1" />
                                          {navigating ? "Loading…" : "Resume Learning"}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}

                      {/* Other content items (Projects, Quizzes, Exercises, etc.) */}
                      {(() => {
                        const currentOtherItems = getNonCourseItems(currentTopic, isEnrolled);
                        if (!currentOtherItems.length) return null;
                        return (
                        <div className="space-y-3 ml-0 mt-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {currentOtherItems.length} other item{currentOtherItems.length !== 1 ? "s" : ""}
                          </p>
                          <div className="space-y-2">
                            {currentOtherItems.map((item) =>
                              renderContentItem(item, false, false, false, true)
                            )}
                          </div>
                        </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Upcoming Topics Section */}
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
                      const otherItems = getNonCourseItems(topic, isEnrolled);
                      return (<div key={topic.id} className="space-y-3">
                        {/* Topic */}
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

                        {/* Locked courses and other content in topic */}
                        {(topic.courses?.length > 0 || otherItems.length > 0) && (
                          <div className="space-y-3 ml-0 opacity-75">
                            <div className="flex flex-wrap gap-2">
                              {topic.courses && topic.courses.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {topic.courses.length} Course{topic.courses.length !== 1 ? "s" : ""}
                                </Badge>
                              )}
                              {otherItems.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {otherItems.length} other item{otherItems.length !== 1 ? "s" : ""}
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-2">
                              {/* Real courses */}
                              {topic.courses?.map((courseItem: any) => {
                                const course =
                                  courseItem.course || courseItem;
                                return (
                                  <div
                                    key={course.id}
                                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 p-3 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                                  >
                                    <div className="space-y-2">
                                      {/* Header */}
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

                                      {/* Course metadata */}
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

                                      {/* Course description */}
                                      {course.summary && (
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                          {stripHtmlTags(course.summary)}
                                        </p>
                                      )}

                                      {/* Unlock info */}
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
                                renderContentItem(item, false, true, false, true)
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );})}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Topics Completed</span>
                  <span className="font-medium">{completedTopics.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Topics Total</span>
                  <span className="font-medium">{topics.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Completion Rate</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Current Topic</span>
                  <span className="font-medium">
                    {currentTopicIndex + 1} of {topics.length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Up */}
          {currentTopic && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Topic</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3  rounded-lg">
                  <h4 className="font-medium text-sm">{currentTopic.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {stripHtmlTags(currentTopic.description || "")}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs">
                      {currentTopic.duration || 4} week
                      {currentTopic.duration !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <Button
                  className="w-full"
                  size="sm"
                  disabled={navigating}
                  onClick={() => {
                    if (isEnrolled) {
                      navigateToFirstUncompletedVideo(currentTopic.id, currentTopic.courses ?? []);
                    } else {
                      onNavigate?.(`/paths/${pathId}`);
                    }
                  }}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {navigating ? "Loading…" : isEnrolled ? "Continue Learning" : "Enroll Now"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Rewards Preview */}
          {isEnrolled && progress === 100 && (
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
                        ID: <span className="font-mono font-medium">{certificate.code}</span>
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
                        toast.info("Certificate is being generated. Check your email shortly.");
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
    </div>
  );
}
