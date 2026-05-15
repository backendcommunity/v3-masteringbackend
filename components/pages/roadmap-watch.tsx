"use client";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Target,
  BookOpen,
  Code2,
  Play,
  Calendar,
  Trophy,
  Users,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import { useEffect, useState } from "react";
import { Chapter, Course, Milestone, Roadmap, Video } from "@/lib/data";
import { toast } from "sonner";
import { Loader } from "../ui/loader";

interface RoadmapWatchPageProps {
  slug: string;
  topicId: string;
  onNavigate?: (route: string) => void;
}

export function RoadmapWatchPage({
  topicId,
  slug,
  onNavigate,
}: RoadmapWatchPageProps) {
  const store = useAppStore();
  const [roadmap, setRoadmap] = useState<Roadmap>();
  const [milestone, setMilestone] = useState<Milestone | any>();
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [marking, setMarking] = useState(false);
  const [starting, setStarting] = useState(false);
  const [completedItems, setCompletedItems] = useState<any[]>([]);
  const [currentItem, setCurrentItem] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    const l = async () => {
      setLoading(true);
      const milestone = await store.getMilestone(slug, topicId);
      if (!cancelled) {
        setRoadmap(milestone.roadmap);
        setMilestone(milestone);
        setCompletedItems(milestone?.userTopic?.completedItems);
        setLoading(false);
      }
    };
    l();

    return () => {
      cancelled = true;
    };
  }, [slug, topicId, store]);

  if (loading) return <Loader isLoader={false} />;

  if (!roadmap) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Roadmap not found</h1>
          <Button
            onClick={() => onNavigate?.("/roadmaps/" + slug)}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Roadmaps
          </Button>
        </div>
      </div>
    );
  }

  const getAssessments = (milestone: any) => {
    return milestone?.courses?.flatMap((c: Course) => {
      return c?.chapters?.flatMap((ch) => {
        return ch?.videos
          ?.filter((v) => v.type === "QUIZ" || v.type === "EXERCISE")
          ?.map((v) => ({ ...v, courseSlug: c.slug }));
      });
    });
  };

  const getCompletedTasks = (itemId: string, topicId: string) => {
    return completedItems?.find((ci: any) => {
      return ci.itemId === itemId && ci.userTopicId === topicId;
    });
  };

  const handleEnrollNow = async (
    course: Course & { courseSlug: string; quizId: string }
  ) => {
    try {
      if (!course) return;

      setCurrentItem(course.slug);
      setStarting(true);
      await store.handleRoadmapCourseEnrollment(slug, topicId, course.id);
      setCompletedItems((prev) => [
        ...prev,
        {
          itemId: course.id,
          completed: false,
          userTopicId: milestone?.userTopic?.id,
        },
      ]);
      setCurrentItem(course.slug);
      setStarting(false);
      toast.success("Task started successfully");
    } catch (error) {
      toast.error("An error occurred. Please try again");
      setStarting(false);
    }
  };

  const handleStart = async (
    course: Course & { courseSlug: string; quizId: string }
  ) => {
    if (course?.type === "QUIZ")
      onNavigate?.(
        routes.roadmapCourseQuiz(
          slug,
          milestone.id,
          course?.courseSlug,
          course?.quizId
        )
      );

    if (course?.type === "VIDEO") return await handleEnrollNow(course);
  };

  const handleCompleted = async () => {
    setLoading(true);
    if (!milestone?.userTopic) return;

    store
      .startMilestone(slug, milestone?.userTopic?.id, {
        completed: true,
      })
      .then((completed: any) => {
        setMilestone(Object.assign(milestone, { userTopic: completed }));
      });

    // setCelebration(true)
    toast.success("Milestone completed successfully");
    setCompleted(true);
    setLoading(false);
  };

  const hasNext = () => {
    const next = [
      ...(milestone?.courses ?? []),
      ...(getAssessments(milestone) ?? []),
    ]
      ?.filter((c) => {
        const completedTask = getCompletedTasks(
          c?.id,
          milestone?.userTopic?.id
        );
        if (!completedTask?.completed) return c;
      })

      ?.at(0);

    return next;
  };

  const markCourseAsCompleted = async (item: any) => {
    setCurrentItem(item.slug);
    setMarking(true);
    setCompletedItems((prev: any) => [
      ...prev,
      {
        completed: true,
        itemId: item.id,
        userTopicId: milestone?.userTopic?.id,
      },
    ]);
    if (item?.type === "QUIZ")
      store
        .markRoadmapVideoCompleted(slug, topicId, {
          itemId: item.id!,
          type: "QUIZ",
          isChapterCompleted: false,
          courseId: item?.quizId!,
        })
        .then((completed: any) => {
          setCompletedItems((prev: any) => [...prev, completed]);
        })
        .catch((e: Error) => {
          const completed = completedItems.filter(
            (item) =>
              item.itemId !== item.id &&
              item.userTopicId !== milestone?.userTopic?.id
          );
          setCompletedItems(completed);
        });

    if (item?.type === "VIDEO")
      store
        .markRoadmapItemCompleted(slug, topicId, item.slug, {
          type: "COURSE",
          courseId: item.slug,
        })
        .then((completed: any) => {
          setCompletedItems((prev: any) => [...prev, completed]);
        })
        .catch((e: Error) => {
          const completed = completedItems.filter(
            (item) =>
              item.itemId !== item.id &&
              item.userTopicId !== milestone?.userTopic?.id
          );
          setCompletedItems(completed);
        });

    // setCelebration(true);
    setCompleted(true);
    toast.success(`Task completed successfully`);
    setMarking(false);
  };

  const handleContinueLearning = (
    course: Course & { courseSlug: string; quizId: string }
  ) => {
    // Navigate to first incomplete chapter or continue from current

    if (course?.type === "QUIZ")
      onNavigate?.(
        routes.roadmapCourseQuiz(
          slug,
          milestone.id,
          course?.courseSlug,
          course?.quizId
        )
      );

    const videos = course?.chapters?.flatMap((ch: Chapter) =>
      ch.videos.flatMap((v) => ({
        ...v,
      }))
    );

    const videoIds = videos?.map((v) => v.id);

    const completedIds = completedItems?.map(
      (ci: any) => ci.itemId && ci.completed
    );
    const remainingVideoIds = videoIds?.filter(
      (vi) => !completedIds?.includes(vi)
    );

    const video =
      videos?.find((v: Video | any) => {
        return remainingVideoIds?.includes(v.id);
      }) || course?.chapters[0]?.videos[0];

    const nextChapter =
      course?.chapters.find((c) => c.id === video?.chapterId) ||
      course?.chapters[0];

    const watchPath = routes.roadmapVideoWatch(
      roadmap?.slug!,
      milestone.id,
      course?.slug!,
      nextChapter?.slug!,
      video?.slug!
    );
    onNavigate?.(watchPath);
  };

  function nextUp() {
    const next = hasNext();

    const completedTask = getCompletedTasks(next?.id, milestone?.userTopic?.id);
    const completed = completedTask?.completed ?? false;
    const isActive = !!completedTask;
    {
      if (!next)
        return (
          <div>
            <span>You're all caught up. Great work!</span>
            <Button
              disabled={milestone?.userTopic?.completed ?? completed}
              onClick={() => handleCompleted()}
              className="w-full my-5 capitalize"
              size="sm"
            >
              <Play className="mr-2 h-4 w-4" />
              Mark as completed
            </Button>
          </div>
        );

      return (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium text-sm">{next?.title}</h4>
            <article
              className="text-xs text-muted-foreground"
              dangerouslySetInnerHTML={{
                __html: next?.summary!,
              }}
            ></article>
            <div className="flex items-center gap-2 mt-2">
              <Code2 className="h-3 w-3 text-green-600" />
              <span className="text-xs capitalize">
                {next?.type?.toLowerCase()}
              </span>
            </div>
          </div>
          {/* <Button
            onClick={() => handleStart(next)}
            className="w-full capitalize"
            size="sm"
          >
            <Play className="mr-2 h-4 w-4" />
            Start{" "}
            {next?.type?.toLowerCase() === "video"
              ? "Course"
              : next?.type?.toLowerCase()}
          </Button> */}

          <Button
            onClick={() => {
              if (completed || isActive) return handleContinueLearning(next);

              handleStart(next);
            }}
            size="sm"
            variant={completed ? "outline" : isActive ? "secondary" : "default"}
            className="capitalize"
          >
            <Play className="mr-2 h-4 w-4" />
            {completed ? (
              `Review ${
                next?.type?.toLowerCase() === "video"
                  ? "Course"
                  : next?.type?.toLowerCase()
              }`
            ) : isActive ? (
              `Continue Learning`
            ) : starting && next?.slug === currentItem ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Starting...</span>
              </>
            ) : (
              `Start ${
                next?.type?.toLowerCase() === "video"
                  ? "Course"
                  : next?.type?.toLowerCase()
              }`
            )}
          </Button>
        </div>
      );
    }
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => onNavigate?.(`${routes.roadmaps}/${slug}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Watch: {roadmap?.title}
          </h1>
          <p className="text-muted-foreground">
            Milestone{" "}
            {roadmap?.topics!?.findIndex(
              (t: any) => t.roadmapTopicId === topicId
            ) + 1}{" "}
            of {roadmap?.topics?.length} • {roadmap?.progress}% Complete
          </p>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="bg-gradient-to-r from-[#0E1F33] to-[#13AECE] text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Current Milestone: {milestone?.title}
          </CardTitle>
          <CardDescription
            dangerouslySetInnerHTML={{
              __html: milestone?.description!,
            }}
            className="text-blue-100 [&>*>span]:!text-blue-100 [&>p]:text-blue-100 dark:[&>*>span]:!text-blue-100 dark:[&>p]:text-blue-100"
          ></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Milestone Progress</span>
              <span className="text-sm font-medium">
                {milestone?.userTopic?.completed
                  ? 100
                  : milestone?.userTopic?.progress}
                %
              </span>
            </div>
            {milestone?.userTopic?.completed ? (
              <Progress value={100} className="h-3" />
            ) : (
              <Progress
                value={milestone?.userTopic?.progress}
                className="h-3"
              />
            )}

            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{milestone?.title}</div>
                <div className="text-xs text-blue-100">Current Milestone</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {milestone?.userTopic?.totalTasks ?? 0}
                </div>
                <div className="text-xs text-blue-100">Total Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {" "}
                  {milestone?.userTopic?.totalTaskCompleted}
                </div>
                <div className="text-xs text-blue-100">Tasks Done</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {(milestone?.userTopic?.totalTasks ?? 0) -
                    (milestone?.userTopic?.totalTaskCompleted ?? 0)}
                </div>
                <div className="text-xs text-blue-100">Tasks Left</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Milestone Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Milestone Tasks</CardTitle>
              <CardDescription>
                Complete these tasks to advance to the next milestone
              </CardDescription>
            </CardHeader>
            {/* getAssessments(milestone) */}
            <CardContent className="space-y-4">
              {[
                ...(milestone?.courses ?? []),
                ...(getAssessments(milestone) ?? []),
              ]?.length <= 0 && <div>No tasks found...</div>}
              {[
                ...(milestone?.courses ?? []),
                ...(getAssessments(milestone) ?? []),
              ]?.map((course: any) => {
                // const found = course?.userCourses?.find(
                //   (uc: any) => uc.courseId === course.id && uc.isRoadmap
                // );
                // console.log(found, course);
                const completedTask = getCompletedTasks(
                  course?.id,
                  milestone?.userTopic?.id
                );

                const completed = completedTask?.completed ?? false;
                const isActive = !!completedTask;

                return (
                  <div
                    key={course?.id}
                    className={`border rounded-lg p-4 ${
                      completed
                        ? "bg-green-200/20 border-green-200/30"
                        : "bg-blue-50 dark:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center justify-between flex-col md:flex-row gap-3">
                      <div className="flex gap-3 items-center">
                        <Checkbox
                          checked={completed}
                          className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {course?.type === "VIDEO" && (
                              <BookOpen className="h-4 w-4 text-blue-600" />
                            )}
                            {(course?.type === "PROJECT" ||
                              course?.type === "PLAYGROUND") && (
                              <Code2 className="h-4 w-4 text-green-600" />
                            )}
                            {(course?.type === "QUIZ" ||
                              course?.type === "EXERCISE") && (
                              <Target className="h-4 w-4 text-purple-600" />
                            )}
                            <span
                              className={`font-medium ${
                                completed
                                  ? "line-through text-muted-foreground"
                                  : ""
                              }`}
                            >
                              {course?.title}
                            </span>
                          </div>
                        </div>

                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 md:hidden inline-flex"
                        >
                          {course?.type ?? "Course"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 hidden md:inline-flex"
                        >
                          {course?.type ?? "Course"}
                        </Badge>

                        {!completed && (
                          <Button
                            variant={"outline"}
                            onClick={() => markCourseAsCompleted(course)}
                            className="w-full"
                            size="sm"
                          >
                            {marking && course?.slug === currentItem ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Marking...</span>
                              </>
                            ) : (
                              <span> Mark Complete</span>
                            )}
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          </Button>
                        )}

                        {course?.isCompleted ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            Completed
                          </Badge>
                        ) : (
                          <Button
                            onClick={() => {
                              if (completed || isActive)
                                return handleContinueLearning(course);

                              handleStart(course);
                            }}
                            size="sm"
                            variant={
                              completed
                                ? "outline"
                                : isActive
                                ? "secondary"
                                : "default"
                            }
                            className="capitalize"
                          >
                            <Play className="mr-2 h-4 w-4" />
                            {completed ? (
                              `Review ${
                                course?.type?.toLowerCase() === "video"
                                  ? "Course"
                                  : course?.type?.toLowerCase()
                              }`
                            ) : isActive ? (
                              `Continue Learning`
                            ) : starting && course?.slug === currentItem ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Starting...</span>
                              </>
                            ) : (
                              `Start ${
                                course?.type?.toLowerCase() === "video"
                                  ? "Course"
                                  : course?.type?.toLowerCase()
                              }`
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Next Task */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Next Up</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">{nextUp()}</CardContent>
          </Card>

          {/* Milestone Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Milestone Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Tasks Completed</span>
                  <span>
                    {milestone?.userTopic?.totalTaskCompleted ?? 0}/
                    {milestone?.userTopic?.totalTasks ?? 0}
                  </span>
                </div>
                <Progress
                  value={
                    (Number(milestone?.userTopic?.totalTaskCompleted ?? 0) /
                      Number(milestone?.userTopic?.totalTasks ?? 0)) *
                    100
                  }
                  className="h-2"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Time Invested</span>
                  <span>{milestone?.userTopic?.timeInvested}</span>
                </div>
                <Progress
                  value={Number(
                    milestone?.userTopic?.timeInvested?.split("/")[0]
                  )}
                  className="h-2"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{milestone?.userTopic?.progress}%</span>
                </div>
                <Progress
                  value={milestone?.userTopic?.progress}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Milestone Rewards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                className={`p-3  rounded-lg ${
                  milestone?.userTopic?.completed
                    ? "bg-green-900/40"
                    : "bg-green-900"
                }`}
              >
                <h4 className="font-medium text-sm">Complete Milestone</h4>
                <p className="text-xs text-muted-foreground">
                  Watch{" "}
                  {milestone?.userTopic?.totalTasks -
                    milestone?.userTopic?.totalTaskCompleted}{" "}
                  more videos to complete this milestone
                </p>
              </div>
              <Badge
                variant={"secondary"}
                className="w-full py-2 flex items-center justify-center"
              >
                <Trophy className="mr-2 h-4 w-4" />
                Gain a total of {milestone?.totalMB} MB from this milestone
              </Badge>
            </CardContent>
          </Card>

          {/* Community */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Community</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Others on this milestone
                </span>
                <span>{milestone?.userTopic?.totalStudents ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Completed this milestone
                </span>
                <span>{milestone?.userTopic?.totalCompletedStudents ?? 0}</span>
              </div>
              <Button
                onClick={() => onNavigate?.("/community?milestone=" + topicId)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Join Discussion
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                View All Resources
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Target className="mr-2 h-4 w-4" />
                Set Daily Goal
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Study Time
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
