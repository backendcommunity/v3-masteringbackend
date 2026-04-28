"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  BookOpen,
  Download,
  Clock,
  Target,
  Brain,
  ChevronLeft,
  Share2,
  ChevronRight,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import {
  Chapter,
  Course,
  Milestone,
  Note,
  Roadmap,
  UserCourse,
  Video,
} from "@/lib/data";
import { handleShare } from "@/lib/utils";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { format } from "timeago.js";
import DisqusCommentBlock from "../ui/comment";
import { routes } from "@/lib/routes";
import { usePathname } from "next/navigation";
import ConfettiCelebration from "../confetti-celebration";
import { VimeoPlayer } from "../ui/vimeo-player";
import { CourseQuizPage } from "./course-quiz";
import { ExercisePage } from "../exercise";
import { Loader } from "../ui/loader";
import { SimpleEditor } from "./SimpleEditor";
import { Separator } from "../ui/separator";

interface RoadmapVideoWatchPageProps {
  slug: string;
  videoId: string;
  topicId: string;
  courseId: string;
  chapterId: string;
  onNavigate?: (route: string) => void;
  // Override the URL bar (pushState) route builder; defaults to roadmapVideoWatch
  routeBuilder?: (
    courseSlug: string,
    chapterId: string,
    videoSlug: string,
  ) => string;
  // Override the "back" URL shown in the video overlay and error states
  backUrl?: string;
}

export function RoadmapVideoWatchPage({
  slug,
  videoId,
  topicId,
  chapterId,
  courseId,
  onNavigate,
  routeBuilder,
  backUrl,
}: RoadmapVideoWatchPageProps) {
  const store = useAppStore();
  const user = useUser();
  const path = usePathname();

  const buildWatchUrl =
    routeBuilder ??
    ((cs: string, ch: string, vs: string) =>
      routes.roadmapVideoWatch(slug, topicId, cs, ch, vs));

  const [roadmap, setRoadmap] = useState<Roadmap>();
  const [userCourse, setUserCourse] = useState<UserCourse>();
  const [course, setCourse] = useState<Course>();
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [quizPassed, setQuizPassed] = useState(false);
  const [celebration, setCelebration] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [milestone, setMilestone] = useState<Milestone | any>();
  const [completedItems, setCompletedItems] = useState<any>([]);
  const [userChapters, setUserChapters] = useState<any[]>([]);
  const [showRequiredQuiz, setShowRequiredQuiz] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [userVideos, setUserVideos] = useState<any[]>();
  const [currentVideo, setCurrentVideo] = useState<Video>();
  const [chapter, setChapter] = useState<Chapter>();

  async function loadMilestone() {
    try {
      const milestone = await store.getMilestone(slug, topicId);
      setMilestone(milestone);
      setRoadmap(milestone.roadmap);
      setCompletedItems(milestone?.userTopic?.completedItems ?? []);
    } catch (error) {
      setLoading(false);

      return (
        <div className="flex-1 p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Milestone not found</h1>
            <Button onClick={() => onNavigate?.("/roadmaps")} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Roadmaps
            </Button>
          </div>
        </div>
      );
    }
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await loadMilestone();

      const course = await store.getCourse(courseId, { isRoadmap: true });
      setCourse(course);
      setUserCourse(course?.userCourse);
      setUserChapters(course?.userCourse?.userChapters);
      setUserVideos(userCourse?.userVideos);

      const completed =
        completedItems.find((c: any) => c.itemId === course.id)?.completed ??
        false;
      setCompleted(completed);

      const chapter: Chapter | any = course?.chapters.find(
        (ch: Chapter) => ch.slug === chapterId,
      );
      setChapter(chapter);

      const currentVideo = videoId
        ? chapter?.videos.find((v: Video) => v.slug === videoId)
        : chapter?.videos[0];
      setCurrentVideo(currentVideo);
      setLoading(false);
    }

    loadData();
  }, []);

  useEffect(() => {
    if (
      currentVideo?.type === "QUIZ" &&
      currentVideo?.quiz?.required &&
      !quizPassed
    ) {
      setShowRequiredQuiz(true);
    } else setShowRequiredQuiz(false);
  }, [currentVideo, quizPassed]);
  if (loading) return <Loader isLoader={false} />;

  if (!roadmap || !course) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Roadmap not found</h1>
          <Button onClick={() => onNavigate?.("/roadmaps")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Roadmaps
          </Button>
        </div>
      </div>
    );
  }

  const nextChapter =
    course.chapters[
      course.chapters.findIndex((ch: Chapter) => ch.slug === chapter?.slug) + 1
    ];

  const prevChapter =
    course.chapters[
      course.chapters.findIndex((ch: Chapter) => ch.slug === chapter?.slug) - 1
    ];

  const next = (chapter: Chapter) => {
    return chapter?.videos?.find((v: Video, index: number) => {
      const currentIndex = chapter.videos.findIndex(
        (vid: Video) => vid.id === currentVideo?.id,
      );
      return index === currentIndex + 1;
    });
  };

  const prev = (chapter: Chapter) => {
    return chapter?.videos?.find((v: Video, index: number) => {
      const currentIndex = chapter.videos.findIndex(
        (vid: Video) => vid.id === currentVideo?.id,
      );
      return index === currentIndex - 1;
    });
  };

  const nextVideo = next(chapter!);
  const prevVideo = prev(chapter!);

  const handleSaveNotes = async () => {
    if (!note) return;
    try {
      const saveNote = await store.saveNote(note, course.id, currentVideo?.id!);
      setNotes([...notes, saveNote]);
    } catch (error) {
      toast.error("Error occurred adding note");
    }
  };

  const isChapterCompleted = (chapterId: string) => {
    return completedItems?.find((ch: any) => ch.itemId === chapterId)
      ?.completed;
  };

  const isVideoCompleted = (videoId: string) => {
    return completedItems?.find((ci: any) => {
      return ci.itemId === videoId;
    })?.completed;
  };

  const handleVideoClick = (vid: Video) => {
    if (!vid) return;
    if (currentVideo?.type == "QUIZ") {
      if (!quizPassed || currentVideo?.quiz?.required) {
        toast.warning("This quiz is required and you have to meet the mark");
        return;
      }
    }

    setCurrentVideo(vid);
    window.history.pushState(
      {},
      "",
      `${buildWatchUrl(course.slug, chapter?.slug!, vid.slug)}?`,
    );
  };

  const handleChapterClick = (chapter: Chapter) => {
    if (currentVideo?.type == "QUIZ") {
      if (!quizPassed && currentVideo?.quiz?.required) {
        toast.warning("This quiz is required and you have to meet the mark");
        return;
      }
    }
    const nextVideo = next(chapter) ?? chapter.videos[0];
    setChapter(chapter);
    setCurrentVideo(nextVideo);
    window.history.pushState(
      {},
      "",
      `${buildWatchUrl(course.slug, chapter.slug, nextVideo?.slug!)}?`,
    );
  };

  const handleChapterFeatureClick = (type: string, id?: string) => {
    if (!onNavigate) return;
    let url = "";
    switch (type?.toLowerCase()) {
      case "quiz":
        url = routes.courseQuizzes(slug);
        break;
      case "exercise":
        url = routes.courseExercises(slug);
        break;
      case "playground":
        url = routes.coursePlaygrounds(slug);
        break;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleMarkComplete = async () => {
    console.log("Completed Triggered");
    if (!currentVideo || !course || !chapter) return;

    setIsMarking(true);
    // Combine completed videos + the one being marked now
    const completedVideoIds = new Set(
      completedItems!
        ?.filter((v: any) => v.completed)
        .map((v: any) => v.itemId),
    );
    completedVideoIds.add(currentVideo.id); // include this one just marked
    // Check if all chapter videos are now complete
    const allVideosComplete = chapter.videos.every((v: Video) =>
      completedVideoIds.has(v.id),
    );

    // const hasOtherContent = chapter?.quizzes|| chapter?.exercises || chapter?.playgrounds;
    const isChapterCompleted = !!allVideosComplete; //&& hasOtherContent?.length! < 1;

    // Update milestone items locally without duplicating previously completed entries.
    const completedItemMap = new Map(
      (completedItems ?? []).map((item: any) => [item.itemId, item]),
    );
    completedItemMap.set(currentVideo.id, {
      ...(completedItemMap.get(currentVideo.id) ?? {}),
      completed: true,
      itemId: currentVideo.id,
      itemType: currentVideo.type ?? "VIDEO",
    });
    if (isChapterCompleted) {
      completedItemMap.set(chapter.id, {
        ...(completedItemMap.get(chapter.id) ?? {}),
        completed: true,
        itemId: chapter.id,
        itemType: "CHAPTER",
      });
    }
    setCompletedItems(Array.from(completedItemMap.values()));

    // Update UserChapter locally
    const userChapter = [
      ...(userChapters ?? []),
      {
        chapterId: chapter.id,
        isCompleted: isChapterCompleted,
      },
    ];

    setUserChapters(userChapter);

    if (currentVideo?.type === "QUIZ")
      return markQuizAsCompleted(isChapterCompleted);

    // Backend update with proper `isChapterCompleted`

    try {
      await store.markRoadmapVideoCompleted(slug, topicId, {
        itemId: currentVideo.id,
        type: "VIDEO",
        isChapterCompleted,
        chapter: {
          itemId: chapter.id,
        },
        courseId: course.slug,
      });

      toast.success("You just earned some points!");
      setCelebration(true);
    } catch (error) {
      toast.error("Unable to update video progress. Please try again.");
    } finally {
      setIsMarking(false);
    }
  };

  const markQuizAsCompleted = async (isChapterCompleted?: boolean) => {
    await store.markRoadmapVideoCompleted(slug, topicId, {
      itemId: currentVideo?.id!,
      type: "QUIZ",
      isChapterCompleted,
      courseId: currentVideo?.quizId!,
    });

    handleVideoClick(nextVideo!);

    return;
  };

  const totalCompletedTasks =
    completedItems?.filter((ci: any) => {
      const itemType = ci.itemType ?? ci.type;
      return itemType !== "COURSE" && itemType !== "CHAPTER" && ci.completed;
    })?.length ?? 0;

  const totalMilestoneTasksRaw = Number(
    milestone?.userTopic?.totalTasks ?? milestone?.totalTasks ?? 0,
  );
  const totalMilestoneTasks =
    Number.isFinite(totalMilestoneTasksRaw) && totalMilestoneTasksRaw > 0
      ? totalMilestoneTasksRaw
      : 0;

  const progress =
    totalMilestoneTasks > 0
      ? Math.round((totalCompletedTasks / totalMilestoneTasks) * 100)
      : 0;
  return (
    <div className="flex-1 space-y-6">
      {/* Header */}

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Video Player */}
        <div className="lg:col-span-3 space-y-4">
          {/* Video Player */}
          <Card className="overflow-hidden">
            {currentVideo?.type === "VIDEO" && (
              <Card className="overflow-hidden group relative">
                <div className="aspect-video bg-black relative">
                  {/* Vimeo Player */}
                  <VimeoPlayer
                    video={currentVideo}
                    onEnded={async () => {
                      if (nextVideo) return handleVideoClick(nextVideo);
                      if (!nextVideo && nextChapter)
                        handleChapterClick(nextChapter);
                    }}
                    onComplete={handleMarkComplete}
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    {/* Top Bar: Download + Share */}
                    <div className="flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
                      <div className="flex items-center justify-between pointer-events-auto">
                        <Button
                          variant="ghost"
                          onClick={() =>
                            onNavigate?.(
                              backUrl ??
                                `/roadmaps/${slug}/topics/${milestone.id}/courses/${course.slug}`,
                            )
                          }
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 pointer-events-auto">
                          <a
                            onClick={() =>
                              onNavigate?.(
                                backUrl ??
                                  `/roadmaps/${slug}/topics/${milestone.id}/courses/${course.slug}`,
                              )
                            }
                            href={"#"}
                            className="text-muted-foreground"
                          >
                            {course.title}
                          </a>
                        </div>
                      </div>

                      <div className="flex justify-end p-3 space-x-2 bg-gradient-to-b from-black/60 to-transparent">
                        <Button
                          disabled={true}
                          className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition pointer-events-auto"
                        >
                          <Download className="w-5 h-5 text-white" />
                        </Button>
                        <Button
                          onClick={() =>
                            handleShare(currentVideo?.title!, path!)
                          }
                          className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition pointer-events-auto"
                        >
                          <Share2 className="w-5 h-5 text-white" />
                        </Button>
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    {(prevVideo || prevChapter) && (
                      <Button
                        onClick={() => {
                          if (prevVideo) handleVideoClick(prevVideo);
                          if (!prevVideo && prevChapter)
                            handleChapterClick(prevChapter);
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition pointer-events-auto"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </Button>
                    )}

                    {(nextVideo || nextChapter) && (
                      <Button
                        onClick={() => {
                          if (nextVideo) handleVideoClick(nextVideo);
                          if (!nextVideo && nextChapter)
                            handleChapterClick(nextChapter);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition pointer-events-auto"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )}
            {currentVideo?.type === "QUIZ" &&
              (showRequiredQuiz ? (
                <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-lg flex items-center justify-center p-4">
                  <Card className="w-full max-w-4xl  overflow-y-auto relative">
                    <div className="absolute top-4 right-4">
                      <Badge variant={"destructive"}>Required</Badge>
                    </div>
                    <CourseQuizPage
                      courseId={courseId}
                      onNavigate={(path) => onNavigate?.(path)}
                      quizId={currentVideo?.quizId!}
                      showNav={false}
                      handleQuizSubmit={(passed) => {
                        setQuizPassed(passed);
                        handleMarkComplete();
                      }}
                    />
                  </Card>
                </div>
              ) : (
                <Card className="overflow-hidden">
                  <CourseQuizPage
                    courseId={courseId}
                    onNavigate={(path) => onNavigate?.(path)}
                    quizId={currentVideo?.quizId!}
                    showNav={false}
                    handleQuizSubmit={(passed) => {
                      setQuizPassed(passed);
                      handleMarkComplete();
                    }}
                  />
                </Card>
              ))}

            {currentVideo?.type === "EXERCISE" && (
              <ExercisePage
                courseId={courseId}
                onNavigate={(path) => onNavigate?.(path)}
                exercise={currentVideo?.exercise!}
              />
            )}
          </Card>

          <Separator />
          {/* Content Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="block">
              <div className="md:w-full w-[350px] flex overflow-y-auto no-scrollbar">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                {currentVideo?.type === "VIDEO" && (
                  <>
                    <TabsTrigger value="code">Code Editor</TabsTrigger>
                    {/* <TabsTrigger value="transcript">Transcript</TabsTrigger> */}
                  </>
                )}
                <TabsTrigger value="notes">Notes</TabsTrigger>

                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="discussion">Discussion</TabsTrigger>
              </div>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">
                    {currentVideo?.type?.toLowerCase()} Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <article
                      className="text-muted-foreground [&>*>span]:!text-black [&>p]:text-black dark:[&>*>span]:!text-muted-foreground dark:[&>p]:text-muted-foreground"
                      dangerouslySetInnerHTML={{
                        __html: currentVideo?.summary!,
                      }}
                    ></article>
                  </div>
                </CardContent>
                <CardContent>
                  {currentVideo?.description ??
                    (nextChapter?.description && (
                      <CardContent>
                        <div className="space-y-4  pt-4">
                          <div className="flex w-full justify-center items-center">
                            <span className="border-t flex-1"></span>
                            <div className="px-2 text-xs">description</div>
                            <span className="border-t flex-1"></span>
                          </div>
                          <article
                            className="text-muted-foreground leading-relaxed [&>*>table]:p-3 [&>*>table]:border [&>*>code]:rounded-xl [&>*>code]:bg-zinc-800 [&>*>code]:p-1 [&>*>code]:text-sm [&>*>code]:font-medium [&>*>code]:text-zinc-100 [&>*>code]:overflow-x-auto w-full [&>*>li>pre]:mt-5 [&>*>li>pre]:rounded-xl [&>*>li>pre]:bg-zinc-800 [&>*>li>pre]:p-4 [&>*>li>pre]:text-sm [&>*>li>pre]:font-medium [&>*>li>pre]:text-zinc-100 [&>*>li>pre]:overflow-x-auto [&>*>li>a]:text-amber-300 [&>p>a]:text-amber-300 mx-auto w-full text-zinc-700 dark:text-zinc-300 [&>pre]:overflow-x-auto [&>h2]:text-2xl [&>h2]:font-bold [&>h3]:text-xl [&>h3]:font-bold [&>p]:mt-2 [&>p]:leading-relaxed [&>pre]:mt-5 [&>pre]:rounded-xl [&>pre]:bg-zinc-800 [&>pre]:p-4 [&>pre]:text-sm [&>pre]:font-medium [&>pre]:text-zinc-100 [&>ul]:mt-5 [&>ul]:flex [&>ul]:list-disc [&>ul]:flex-col [&>ul]:gap-2 [&>ul]:pl-6 [&>ol]:mt-5 [&>ol]:flex [&>ol]:list-decimal [&>ol]:flex-col [&>ol]:gap-2 [&>ol]:pl-6 [&>*>span]:!text-black [&>p]:text-black dark:[&>*>span]:!text-muted-foreground dark:[&>p]:text-muted-foreground"
                            dangerouslySetInnerHTML={{
                              __html:
                                currentVideo?.description ??
                                nextChapter?.description,
                            }}
                          ></article>
                        </div>
                      </CardContent>
                    ))}
                </CardContent>
              </Card>
            </TabsContent>

            {currentVideo?.type === "VIDEO" && (
              <>
                <TabsContent value="transcript" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Video Transcript</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <div className="flex gap-3">
                          <span className="text-muted-foreground min-w-[60px]">
                            00:00
                          </span>
                          <p>
                            Welcome to this comprehensive guide on system design
                            fundamentals...
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-muted-foreground min-w-[60px]">
                            00:30
                          </span>
                          <p>
                            Today we'll cover the core principles that every
                            backend engineer needs to know...
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-muted-foreground min-w-[60px]">
                            01:15
                          </span>
                          <p>
                            Let's start with scalability. When we talk about
                            scalable systems...
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="code">
                  <SimpleEditor playground={currentVideo.playground} />
                </TabsContent>
              </>
            )}
            <TabsContent value="notes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Take notes while watching the video..."
                    className="min-h-[200px]"
                  />
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleSaveNotes()}
                      className="mt-2"
                      disabled={!note}
                    >
                      Save Notes
                    </Button>
                  </div>
                  <div className="border-t mt-5">
                    <div className="space-y-3  pt-5">
                      {notes?.map((note: Note) => (
                        <div className="border rounded-lg p-3" key={note.id}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                              {user.name
                                .split(" ")
                                .map((n: any) => n[0])
                                .join("")}
                            </div>
                            <span className="font-medium text-sm">
                              {user.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(note?.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm">{note.content}</p>
                        </div>
                      ))}
                      {!notes.length && <div>No notes added yet</div>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resources" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Additional Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentVideo?.resources?.map(
                      (resource: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                            <div>
                              <h4 className="font-medium">{resource.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {resource.type}
                              </p>
                            </div>
                          </div>
                          <Button asChild={true} variant="link">
                            <a target="_blank" href={resource?.link}>
                              View
                            </a>
                          </Button>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="discussion" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Discussion</CardTitle>
                </CardHeader>
                <CardContent>
                  <DisqusCommentBlock
                    config={{
                      identifier: `roadmap-${currentVideo?.slug}`,
                      title: currentVideo?.title,
                      url: `/roadmaps/${slug}/courses/${course.slug}/watch/${chapterId}/${videoId}`,
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Tabs defaultValue="course-content" className="w-full">
            <TabsList className="w-full flex justify-between">
              <TabsTrigger value="course-content">Course Content</TabsTrigger>
              <TabsTrigger value="code-editor">Code Editor</TabsTrigger>
              <TabsTrigger value="ask-kap">Talk to Kap</TabsTrigger>
            </TabsList>

            <TabsContent value="course-content" className="space-y-4">
              {/* Milestone Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Milestone Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{milestone.title}</span>
                      <span>{progress ?? 0}%</span>
                    </div>
                    <Progress value={progress ?? 0} className="h-2" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {totalCompletedTasks} of {totalMilestoneTasks} tasks
                    completed in this milestone
                  </div>
                </CardContent>
              </Card>

              {/* Milestone Videos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Milestone Videos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {chapter?.videos.map((vid: Video) => (
                    <div
                      key={vid.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted ${
                        vid.slug === currentVideo?.slug
                          ? "border border-blue-200"
                          : ""
                      }`}
                      onClick={() => handleVideoClick(vid)}
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                        {isVideoCompleted(vid.id) ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{vid.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{vid.duration} mins</span>

                          <Badge variant="outline" className="text-xs">
                            {vid?.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Chapter Features */}
                  {chapter?.quiz && (
                    <div
                      className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted"
                      onClick={() =>
                        handleChapterFeatureClick("quiz", chapter?.quiz!.id)
                      }
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                        <Brain className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {chapter?.quiz?.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{chapter?.quiz?.timeLimit} min</span>
                          <Badge variant="outline" className="text-xs">
                            QUIZ
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* {chapter.exercise && (
                <div
                  className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted"
                  onClick={() =>
                    handleChapterFeatureClick("exercise", chapter.exercise!.id)
                  }
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                    <Code className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {chapter?.exercise?.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {chapter?.exercise?.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        EXERCISE
                      </Badge>
                    </div>
                  </div>
                </div>
              )} */}

                  {/* {chapter.playground && (
                <div
                  className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted"
                  onClick={() =>
                    handleChapterFeatureClick(
                      "playground",
                      chapter.playground!.id
                    )
                  }
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                    <Gamepad2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {chapter.playground.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {chapter.playground.language.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        PLAYGROUND
                      </Badge>
                    </div>
                  </div>
                </div>
              )} */}
                </CardContent>
              </Card>

              {/* Chapter Navigation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">All Chapters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {course.chapters.map((ch: Chapter, index: number) => (
                    <div
                      key={ch.slug}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted ${
                        ch.slug === chapter?.slug
                          ? "border border-blue-200"
                          : ""
                      }`}
                      onClick={() => handleChapterClick(ch)}
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                        {isChapterCompleted(ch?.id!) ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{ch.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {ch.videos.filter((v) => v.type === "VIDEO").length}{" "}
                            videos
                          </Badge>

                          {ch.videos.filter((v) => v.type === "QUIZ").length >
                            0 && (
                            <Badge variant="outline" className="text-xs">
                              {
                                ch.videos.filter((v) => v.type === "QUIZ")
                                  .length
                              }{" "}
                              quizzes
                            </Badge>
                          )}
                          {ch.videos.filter((v) => v.type === "EXERCISE")
                            .length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {
                                ch.videos.filter((v) => v.type === "EXERCISE")
                                  .length
                              }{" "}
                              exercises
                            </Badge>
                          )}

                          {ch.videos.filter((v) => v.type === "PLAYGROUND")
                            .length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {
                                ch.videos.filter((v) => v.type === "PLAYGROUND")
                                  .length
                              }{" "}
                              playgrounds
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="code-editor">
              <SimpleEditor
                full={false}
                playground={currentVideo?.playground!}
              />
            </TabsContent>

            <TabsContent value="ask-kap">
              <Card>
                <CardHeader></CardHeader>

                <CardContent> Coming soon!</CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <ConfettiCelebration
        onComplete={() => setCelebration(false)}
        isVisible={celebration}
        celebrationType="enrollment"
        courseName={course?.title!}
        duration={2000}
      />
    </div>
  );
}
