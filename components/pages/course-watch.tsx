"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface CaptionCue {
  start: number;
  end: number;
  text: string;
}

function parseVTT(vtt: string): CaptionCue[] {
  const cues: CaptionCue[] = [];
  const blocks = vtt.split(/\n{2,}/);
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    const tsIdx = lines.findIndex((l) => l.includes("-->"));
    if (tsIdx === -1) continue;
    const [startStr, endStr] = lines[tsIdx].split("-->").map((s) => s.trim());
    const text = lines
      .slice(tsIdx + 1)
      .join(" ")
      .trim();
    if (!text) continue;
    cues.push({
      start: vttTimeToSec(startStr),
      end: vttTimeToSec(endStr),
      text,
    });
  }
  return cues;
}

function vttTimeToSec(t: string): number {
  const parts = t.split(":").map(parseFloat);
  return parts.length === 3
    ? parts[0] * 3600 + parts[1] * 60 + parts[2]
    : parts[0] * 60 + parts[1];
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { VimeoPlayer } from "@/components/ui/vimeo-player";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { format } from "timeago.js";
import {
  ArrowLeft,
  Play,
  SkipForward,
  SkipBack,
  CheckCircle2,
  BookOpen,
  Download,
  Clock,
  Brain,
  Code,
  Gamepad2,
  Share2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import {
  Chapter,
  Course,
  Note,
  UserChapter,
  UserCourse,
  UserVideo,
  Video,
} from "@/lib/data";
import { useUser } from "@/hooks/use-user";
import DisqusCommentBlock from "../ui/comment";
import { markVideoComplete, fetchVideoCaption } from "@/lib/courses";
import { toast } from "sonner";
import ConfettiCelebration from "../confetti-celebration";
import { handleShare } from "@/lib/utils";
import { CourseQuizPage } from "./course-quiz";
import { usePathname } from "next/navigation";
import { ExercisePage } from "../exercise";
import { Loader } from "../ui/loader";
import { SimpleEditor } from "./SimpleEditor";
import { Separator } from "../ui/separator";
import { NextContentOverlay } from "../next-content-overlay";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface CourseWatchPageProps {
  slug: string;
  chapterSlug: string;
  videoSlug?: string;
  onNavigate?: (route: string) => void;
}

export function CourseWatchPage({
  slug,
  chapterSlug,
  videoSlug,
  onNavigate,
}: CourseWatchPageProps) {
  const store = useAppStore();
  const [course, setCourse] = useState<Course>();
  const [userCourse, setUserCourse] = useState<UserCourse>();
  const [userVideos, setUserVideos] = useState<any[]>();
  const [userChapters, setUserChapters] = useState<any[]>();
  const [chapter, setChapter] = useState<Chapter>();
  const user = useUser();
  const [currentVideo, setCurrentVideo] = useState<Video>();
  const [loading, setLoading] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [celebration, setCelebration] = useState(false);
  const [chapterComplete, setChapterComplete] = useState(false);
  const [note, setNote] = useState("");
  const path = usePathname();
  const [activeTab, setActiveTab] = useState("overview");
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [captions, setCaptions] = useState<CaptionCue[]>([]);
  const [captionTime, setCaptionTime] = useState(0);
  const [streak, setStreak] = useState(0);
  const captionListRef = useRef<HTMLDivElement>(null);
  const positionSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch captions whenever the Vimeo video ID changes
  useEffect(() => {
    if (!currentVideo?.video) {
      setCaptions([]);
      return;
    }
    fetchVideoCaption(Number(currentVideo.video))
      .then((vtt) => setCaptions(vtt ? parseVTT(vtt) : []))
      .catch(() => setCaptions([]));
  }, [currentVideo?.video]);

  // Auto-scroll active caption into view
  useEffect(() => {
    if (!captionListRef.current) return;
    const active = captionListRef.current.querySelector("[data-active='true']");
    active?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [captionTime]);

  // Fetch streak once on mount
  useEffect(() => {
    store.getStreak().then((s) => setStreak(s.currentStreak)).catch(() => {});
  }, []);

  async function loadNotes(courseId: string, videoId: string) {
    setLoadingNotes(true);
    await store.getVideoNotes(courseId, videoId).then((notes: any) => {
      setNotes(notes);
    });
    setLoadingNotes(false);
  }

  const handleTimeUpdate = useCallback(
    (seconds: number) => {
      setCaptionTime(seconds);
      if (positionSaveTimer.current) clearTimeout(positionSaveTimer.current);
      positionSaveTimer.current = setTimeout(() => {
        if (currentVideo?.id) {
          localStorage.setItem(`mb-video-pos:${currentVideo.id}`, String(Math.floor(seconds)));
        }
      }, 10_000);
    },
    [currentVideo?.id],
  );

  useEffect(() => {
    setLoading(true);
    async function findUserCourse(slug: string) {
      const userCourse = await store.getUserCourse(slug);

      // Redirect if user is not enrolled in the course
      if (!userCourse || !userCourse.id) {
        setLoading(false);
        setTimeout(() => onNavigate?.(routes.courseDetail(slug)), 0);
        return;
      }

      setCourse(userCourse?.course);
      setUserCourse(userCourse);
      setUserChapters(userCourse?.userChapters);
      setUserVideos(userCourse?.userVideos);

      const course = userCourse?.course;
      const chapter: Chapter | any = course?.chapters.find(
        (ch: Chapter) => ch.slug === chapterSlug,
      );
      setChapter(chapter);
      const currentVideo = videoSlug
        ? chapter?.videos.find((v: Video) => v.slug === videoSlug)
        : chapter?.videos[0];
      setCurrentVideo(currentVideo);
      setLoading(false);
    }
    findUserCourse(slug);
  }, [slug]);

  useEffect(() => {
    if (activeTab?.includes("notes")) {
      loadNotes(slug, currentVideo?.slug!);
    }
  }, [activeTab, slug, currentVideo?.slug]);

  const handleMarkComplete = useCallback(async () => {
    if (!currentVideo || !course || !chapter) return;

    try {
      // Combine completed videos + the one being marked now
      const completedVideoIds = new Set(
        userVideos!.filter((v) => v.isCompleted).map((v) => v.videoId),
      );
      completedVideoIds.add(currentVideo.id); // include this one just marked

      // Check if all chapter videos are now complete
      const allVideosComplete = chapter.videos.every((v: Video) =>
        completedVideoIds.has(v.id),
      );

      const hasOtherContent =
        chapter?.quiz || chapter.exercise || chapter.playground;
      const isChapterCompleted = allVideosComplete && !hasOtherContent;

      // Update local state: remove duplicates and add the completed video
      const existingVideoIds = new Set(
        (userVideos ?? []).map((v) => v.videoId),
      );
      const completedVideos = [
        ...(userVideos ?? []).filter((v) => v.videoId !== currentVideo.id),
        {
          videoId: currentVideo.id,
          isCompleted: true,
          chapterId: chapter.id,
        },
      ];
      setUserVideos(completedVideos);

      // Update UserChapter locally
      const userChapter = [
        ...(userChapters ?? []).filter(
          (ch: UserChapter) => ch.chapterId !== chapter.id,
        ),
        {
          chapterId: chapter.id,
          isCompleted: isChapterCompleted,
        },
      ];
      setUserChapters(userChapter);

      // Backend update with proper `isChapterCompleted`
      const result = await markVideoComplete(
        course.id,
        chapter.id,
        currentVideo.id,
        {
          isChapterCompleted,
        },
      );
      // Sync points/level to store without extra API call
      if (result?.data?.user) store.syncUserSnapshot(result.data.user);

      // Refresh course progress so course-detail stays in sync
      store.getUserCourse(slug).catch(() => {});

      toast.success("+10 XP earned!");
      setCelebration(true);
      if (isChapterCompleted) setChapterComplete(true);
      else setShowNextOverlay(true);
    } catch (error) {
      toast.error("An error occurred. Please try again");
    }
  }, [currentVideo, course, chapter, userVideos, userChapters]);

  const next = () => {
    return chapter?.videos?.find((v: Video, index: number) => {
      const currentIndex = chapter.videos.findIndex(
        (video: Video) => video.id === currentVideo?.id,
      );
      return index === currentIndex + 1;
    });
  };

  const prev = () => {
    return chapter?.videos?.find((v: Video, index: number) => {
      const currentIndex = chapter.videos.findIndex(
        (video: Video) => video.id === currentVideo?.id,
      );
      return index === currentIndex - 1;
    });
  };

  const nextVideo = useMemo(() => {
    if (!chapter || !currentVideo) return undefined;
    const idx = chapter.videos.findIndex(
      (v: Video) => v.id === currentVideo.id,
    );
    return chapter.videos[idx + 1] as Video | undefined;
  }, [chapter, currentVideo]);

  const prevVideo = useMemo(() => {
    if (!chapter || !currentVideo) return undefined;
    const idx = chapter.videos.findIndex(
      (v: Video) => v.id === currentVideo.id,
    );
    return idx > 0 ? (chapter.videos[idx - 1] as Video) : undefined;
  }, [chapter, currentVideo]);

  const nextChapter = useMemo(() => {
    if (!course || !chapter) return undefined;
    const idx = course.chapters.findIndex(
      (ch: Chapter) => ch.slug === chapter.slug,
    );
    return idx >= 0 ? course.chapters[idx + 1] : undefined;
  }, [course, chapter]);

  const prevChapter = useMemo(() => {
    if (!course || !chapter) return undefined;
    const idx = course.chapters.findIndex(
      (ch: Chapter) => ch.slug === chapter.slug,
    );
    return idx > 0 ? course.chapters[idx - 1] : undefined;
  }, [course, chapter]);

  const isChapterCompleted = (chapterId: string) => {
    return userChapters?.find((ch: UserChapter) => ch.chapterId === chapterId)
      ?.isCompleted;
  };

  const isVideoCompleted = (videoId: string) => {
    return userVideos?.find((ch: any) => ch.videoId === videoId)?.isCompleted;
  };

  const handleVideoClick = useCallback(
    (video: Video) => {
      setCurrentVideo(video);
      window.history.pushState(
        {},
        "",
        `${routes.courseWatch(slug, chapter?.slug!, video.slug)}?`,
      );
    },
    [slug, chapter?.slug],
  );

  const handleChapterClick = useCallback(
    (ch: Chapter) => {
      setChapter(ch);
      setCurrentVideo(ch.videos[0]);
      window.history.pushState(
        {},
        "",
        `${routes.courseWatch(slug, ch.slug, ch.videos[0]?.slug)}?`,
      );
    },
    [slug],
  );

  const handleContinueNext = useCallback(() => {
    if (nextVideo) {
      handleVideoClick(nextVideo);
      setShowNextOverlay(false);
    } else if (nextChapter) {
      handleChapterClick(nextChapter);
      setShowNextOverlay(false);
    }
  }, [nextVideo, nextChapter, handleVideoClick, handleChapterClick]);

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

  const handleSaveNotes = async () => {
    if (!note) return;
    try {
      const saveNote = await store.saveNote(
        note,
        course?.id!,
        currentVideo?.id!,
      );
      setNotes([...notes, saveNote]);
    } catch (error) {
      toast.error("Error occurred adding note");
    }
  };

  const markCourseAsCompleted = async () => {
    try {
      const completed = await store.markCourseCompleted(
        course?.userCourse?.id!,
      );

      setCelebration(true);
      setCompleted(true);
      toast.success(
        `You've earned ${completed?.totalPoints} MB from the course`,
      );
      // onNavigate?.(routes.courseCertificate(slug));
    } catch (error: any) {
      toast.error("An error occurred updating your points. Try again");
      setCompleted(false);
    }
  };

  const calculateProgress = () => {
    const completed = userVideos?.filter(
      (ch: UserVideo) => ch?.isCompleted,
    ).length;

    return Math.floor(((completed ?? 0) / (course?.totalContent ?? 0)) * 100);
  };
  const progress = calculateProgress();

  if (loading) return <Loader isLoader={false} />;

  if (!course || !chapter) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Chapter not found</h1>
          <Button
            onClick={() => onNavigate?.(routes.courseDetail(slug))}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Video Player */}
        <div className="lg:col-span-3 space-y-4 fle flex-col">
          <Card className="overflow-hidden">
            {/* Video Player */}
            {["VIDEO", "WORKSHOP"]?.includes(currentVideo?.type as string) && (
              <Card className="overflow-hidden group relative">
                <div className="aspect-video bg-black relative">
                  {/* Vimeo Player */}
                  <VimeoPlayer
                    video={currentVideo!}
                    initialTime={
                      typeof window !== "undefined"
                        ? parseInt(
                            localStorage.getItem(
                              `mb-video-pos:${currentVideo?.id}`,
                            ) ?? "0",
                            10,
                          ) || 0
                        : 0
                    }
                    onEnded={() => setShowNextOverlay(true)}
                    onComplete={handleMarkComplete}
                    onTimeUpdate={handleTimeUpdate}
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
                      <div className="flex items-center justify-between pointer-events-auto">
                        <Button
                          variant="link"
                          onClick={() =>
                            onNavigate?.(routes.courseDetail(slug))
                          }
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 pointer-events-auto">
                          <a
                            onClick={() =>
                              onNavigate?.(routes.courseDetail(slug))
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
            {currentVideo?.type === "QUIZ" && (
              <Card className="overflow-hidden">
                <CourseQuizPage
                  courseId={slug}
                  onNavigate={() => {}}
                  quizId={currentVideo?.quizId!}
                  showNav={false}
                  handleQuizSubmit={(passed) => {
                    if (!passed && currentVideo?.quizCourse?.required)
                      toast.info("You need to pass this quiz. Try again");
                    if (passed) handleMarkComplete();
                  }}
                />
              </Card>
            )}

            {currentVideo?.type === "EXERCISE" && (
              <ExercisePage
                courseId={course.id}
                onNavigate={(path) => onNavigate?.(path)}
                exercise={currentVideo?.exercise!}
              />
            )}
          </Card>

          {/* Video Actions */}
          {/* <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentVideo && (
                <>
                  {currentVideo.type === "VIDEO" &&
                    !isVideoCompleted(currentVideo.id) && (
                      <Button onClick={handleMarkComplete}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark Complete
                      </Button>
                    )}

                  {currentVideo.type === "QUIZ" ||
                    (currentVideo?.quizCourse?.quiz &&
                      !currentVideo?.quizCourse?.quiz?.required && (
                        <Button onClick={handleMarkComplete}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Mark Quiz Complete
                        </Button>
                      ))}
                </>
              )}

              {nextVideo && (
                <Button
                  onClick={() => handleVideoClick(nextVideo)}
                  className="capitalize"
                >
                  Next {nextVideo?.type?.toLowerCase()}
                  <SkipForward className="ml-2 h-4 w-4" />
                </Button>
              )}
              {!nextVideo && nextChapter && (
                <Button onClick={() => handleChapterClick(nextChapter)}>
                  Next Chapter
                  <SkipForward className="ml-2 h-4 w-4" />
                </Button>
              )}


              {!nextVideo && !nextChapter && (
                <div>
                  {!completed ? (
                    <Button
                      variant={"destructive"}
                      onClick={() => markCourseAsCompleted()}
                    >
                      Earn Your Rewards
                      <Crown className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant={"outline"}
                      onClick={() =>
                        onNavigate?.(routes.courseCertificate(slug))
                      }
                    >
                      View Your Certificate
                      <SkipForward className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div> */}

          <Separator />

          {/* Content Tabs */}
          <div className="w-full">
            <Tabs
              defaultValue="overview"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList>
                <div className="md:w-full w-[350px] flex overflow-y-auto no-scrollbar">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  {["VIDEO", "WORKSHOP"].includes(
                    currentVideo?.type as string,
                  ) && <TabsTrigger value="code">Code Editor</TabsTrigger>}
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  {captions.length > 0 && (
                    <TabsTrigger value="transcript">Transcript</TabsTrigger>
                  )}
                  <TabsTrigger value="resources">Resources</TabsTrigger>
                  <TabsTrigger value="discussion">Discussion</TabsTrigger>
                </div>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="capitalize">
                      {currentVideo
                        ? currentVideo?.type?.toLowerCase()
                        : "Chapter"}{" "}
                      Overview
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
                    {currentVideo?.description && (
                      <CardContent>
                        <div className="space-y-4  pt-4">
                          <div className="flex w-full justify-center items-center">
                            <span className="border-t flex-1"></span>
                            <div className="px-2 text-xs">description</div>
                            <span className="border-t flex-1"></span>
                          </div>
                          <p
                            className="text-muted-foreground leading-relaxed [&>*>table]:p-3 [&>*>table]:border [&>*>code]:rounded-xl [&>*>code]:bg-zinc-800 [&>*>code]:p-1 [&>*>code]:text-sm [&>*>code]:font-medium [&>*>code]:text-zinc-100 [&>*>code]:overflow-x-auto w-full [&>*>li>pre]:mt-5 [&>*>li>pre]:rounded-xl [&>*>li>pre]:bg-zinc-800 [&>*>li>pre]:p-4 [&>*>li>pre]:text-sm [&>*>li>pre]:font-medium [&>*>li>pre]:text-zinc-100 [&>*>li>pre]:overflow-x-auto [&>*>li>a]:text-amber-300 [&>p>a]:text-amber-300 mx-auto w-full text-zinc-700 dark:text-zinc-300 [&>pre]:overflow-x-auto [&>h2]:text-2xl [&>h2]:font-bold [&>h3]:text-xl [&>h3]:font-bold [&>p]:mt-2 [&>p]:leading-relaxed [&>pre]:mt-5 [&>pre]:rounded-xl [&>pre]:bg-zinc-800 [&>pre]:p-4 [&>pre]:text-sm [&>pre]:font-medium [&>pre]:text-zinc-100 [&>ul]:mt-5 [&>ul]:flex [&>ul]:list-disc [&>ul]:flex-col [&>ul]:gap-2 [&>ul]:pl-6 [&>ol]:mt-5 [&>ol]:flex [&>ol]:list-decimal [&>ol]:flex-col [&>ol]:gap-2 [&>ol]:pl-6 [&>*>span]:!text-black [&>p]:text-black dark:[&>*>span]:!text-muted-foreground dark:[&>p]:text-muted-foreground"
                            dangerouslySetInnerHTML={{
                              __html: currentVideo?.description!,
                            }}
                          ></p>
                        </div>
                      </CardContent>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="code">
                <SimpleEditor playground={currentVideo?.playground!} />
              </TabsContent>

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
                      {loadingNotes ? (
                        <Loader isLoader={true} isFull={false} />
                      ) : (
                        <div className="space-y-3  pt-5">
                          {notes?.map((note: Note) => (
                            <div
                              className="border rounded-lg p-3"
                              key={note.id}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                                  {user?.name
                                    .split(" ")
                                    .map((n: any) => n[0])
                                    .join("")}
                                </div>
                                <span className="font-medium text-sm">
                                  {user?.name}
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
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transcript" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Transcript</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      ref={captionListRef}
                      className="h-[400px] overflow-y-auto space-y-1 pr-2"
                    >
                      {captions.map((cue, i) => {
                        const isActive =
                          captionTime >= cue.start && captionTime < cue.end;
                        return (
                          <div
                            key={i}
                            data-active={isActive ? "true" : undefined}
                            className={`flex gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                              isActive
                                ? "bg-primary/10 text-foreground font-medium"
                                : "text-muted-foreground hover:bg-muted/50"
                            }`}
                          >
                            <span className="shrink-0 text-xs tabular-nums pt-0.5 w-12 text-right">
                              {new Date(cue.start * 1000)
                                .toISOString()
                                .substring(14, 19)}
                            </span>
                            <span className="text-sm leading-relaxed">
                              {cue.text}
                            </span>
                          </div>
                        );
                      })}
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
                                <h4 className="font-medium">
                                  {resource.title}
                                </h4>
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
                        identifier: currentVideo?.slug,
                        title: currentVideo?.title,
                        url: `/courses/${slug}`,
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
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
              {/* Course Progress */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Course Progress</CardTitle>
                    {streak > 0 && (
                      <span className="text-sm font-medium flex items-center gap-1">
                        🔥 {streak}-day streak
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Overall Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress ?? 0} className="h-2" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {
                      userVideos?.filter((ch: UserVideo) => ch?.isCompleted)
                        .length
                    }{" "}
                    of {course.totalContent} videos completed
                  </div>
                </CardContent>
              </Card>

              {/* Chapter Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Chapter Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* Videos */}
                  {chapter.videos.map((video: Video) => (
                    <div
                      key={video.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted ${
                        video.id === currentVideo?.id
                          ? "border border-blue-200"
                          : ""
                      }`}
                      onClick={() => handleVideoClick(video)}
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                        {isVideoCompleted(video.id) ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{video.title}</p>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {(!video?.duration?.includes("0") ||
                            video?.quizCourse?.quiz?.timeLimit! > 0) && (
                            <>
                              <Clock className="h-3 w-3" />
                              <span>
                                {video?.duration ??
                                  video?.quizCourse?.quiz?.timeLimit}{" "}
                                mins
                              </span>
                            </>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {video?.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Chapter Features */}
                  {chapter.quiz && (
                    <div
                      className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted"
                      onClick={() =>
                        handleChapterFeatureClick("quiz", chapter.quiz!.id)
                      }
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                        <Brain className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {chapter.quiz.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{chapter.quiz.timeLimit} min</span>
                          <Badge variant="outline" className="text-xs">
                            QUIZ
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {chapter.exercise && (
                    <div
                      className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted"
                      onClick={() =>
                        handleChapterFeatureClick(
                          "exercise",
                          chapter.exercise!.id,
                        )
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
                  )}

                  {chapter.playground && (
                    <div
                      className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted"
                      onClick={() =>
                        handleChapterFeatureClick(
                          "playground",
                          chapter.playground!.id,
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
                  )}
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

              {/* Navigation */}
              <div className="space-y-2">
                {prevChapter && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleChapterClick(prevChapter)}
                  >
                    <SkipBack className="mr-2 h-4 w-4" />
                    Previous: {prevChapter.title}
                  </Button>
                )}
                {nextChapter && (
                  <Button
                    className="w-full justify-start"
                    onClick={() => handleChapterClick(nextChapter)}
                  >
                    Next: {nextChapter.title}
                    <SkipForward className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
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

      <NextContentOverlay
        isOpen={showNextOverlay}
        onClose={() => setShowNextOverlay(false)}
        nextItem={nextVideo}
        onContinue={handleContinueNext}
      />

      {/* Chapter completion celebration */}
      {/* Chapter completion celebration — navigates directly, no second overlay */}
      <Dialog
        open={chapterComplete}
        onOpenChange={(open) => { if (!open) setChapterComplete(false); }}
      >
        <DialogContent className="sm:max-w-md text-center">
          <DialogTitle className="text-2xl font-bold">
            Chapter Complete! 🎉
          </DialogTitle>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">
              You finished <span className="font-semibold text-foreground">{chapter?.title}</span>
            </p>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Course progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                onClick={() => {
                  setChapterComplete(false);
                  handleContinueNext();
                }}
              >
                Continue to Next Chapter
              </Button>
              <Button
                variant="outline"
                onClick={() => setChapterComplete(false)}
              >
                Stay Here
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
