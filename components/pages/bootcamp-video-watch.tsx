"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { VimeoPlayer } from "@/components/ui/vimeo-player";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { format } from "timeago.js";
import {
  ArrowLeft,
  Play,
  SkipForward,
  SkipBack,
  CheckCircle2,
  BookOpen,
  Download,
  Share,
  Clock,
  Crown,
  Trophy,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import { Lesson, Note, UserLesson, Week } from "@/lib/data";
import { useUser } from "@/hooks/use-user";
import DisqusCommentBlock from "../ui/comment";
import { toast } from "sonner";
import ConfettiCelebration from "../confetti-celebration";
import { codeSample, handleShare } from "@/lib/utils";
import { CourseQuizPage } from "./course-quiz";
import { usePathname } from "next/navigation";
import { ExercisePage } from "../exercise";
import { Loader } from "../ui/loader";
import Countdown from "../ui/count-down";
import { SimpleEditor } from "./SimpleEditor";
import { WeekCompletionShare } from "../week-completion-share";

interface BootcampWatchPageProps {
  slug: string;
  id: string;
  weekId: string;
  cohort: string;
  onNavigate?: (route: string) => void;
}

export function BootcampVideoWatchPage({
  slug,
  id,
  weekId,
  cohort,
  onNavigate,
}: BootcampWatchPageProps) {
  const store = useAppStore();
  const [lesson, setLesson] = useState<Lesson>();
  const [week, setWeek] = useState<Week>();
  const [userLessons, setUserLessons] = useState<UserLesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson>();
  const user = useUser();
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [notes, setNotes] = useState<Note[]>([]);
  const [celebration, setCelebration] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [note, setNote] = useState("");
  const [showWeekComplete, setShowWeekComplete] = useState(false);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [weekEvents, setWeekEvents] = useState<any[]>([]);
  const [currentLiveSession, setCurrentLiveSession] = useState<any>(null);
  const path = usePathname();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const week = await store.getWeek(id, cohort, weekId);

      const lesson = week.lessons.find((l: Lesson) => l.id === slug);
      if (!cancelled) {
        setUserLessons(week?.userCohort?.userLessons);
        setLesson(lesson);

        const currentLesson = slug
          ? week?.lessons.find((v: Lesson) => v.id === slug)
          : week?.lessons[0];
        setCurrentLesson(currentLesson);
        setWeek(week);
        setLoading(false);
      }
    };

    if (!cancelled) {
      setLoading(true);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [slug, id, weekId, cohort, store]);

  useEffect(() => {
    async function loadNotes(lessonId: string, videoId: string) {
      store.getVideoNotes(lessonId, videoId).then((notes: any) => {
        setNotes(notes);
      });
    }

    loadNotes(lesson?.id!, slug!);
  }, [lesson, slug]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const events = await store.getCurrentWeekEvents(id, weekId);
        console.log("Loaded week events:", events);
        setWeekEvents(events || []);
      } catch (error) {
        console.error("Failed to load week events:", error);
        setWeekEvents([]);
      }
    };

    if (weekId && id) {
      loadEvents();
    }
  }, [weekId, id, store]);

  // Find live session for current lesson when events or lesson change
  useEffect(() => {
    if (!weekEvents?.length || !currentLesson?.id) {
      console.log("No events or lesson available", {
        eventsCount: weekEvents?.length,
        lessonId: currentLesson?.id,
      });
      setCurrentLiveSession(null);
      return;
    }

    const session = weekEvents.find((event: any) => {
      console.log("Checking event:", {
        eventId: event?.id,
        eventLessonId: event?.lessonId,
        currentLessonId: currentLesson?.id,
        meetingUrl: event?.meetingUrl,
        status: event?.status,
      });

      // Must have lessonId matching current lesson
      if (!event?.lessonId || event.lessonId !== currentLesson.id) {
        return false;
      }

      // Must have meeting URL
      if (!event?.meetingUrl) {
        return false;
      }

      // Filter out completed, cancelled, rescheduled events
      if (
        event.status === "COMPLETED" ||
        event.status === "CANCELLED" ||
        event.status === "RESCHEDULED"
      ) {
        return false;
      }

      // Accept SCHEDULED or IN_PROGRESS status
      if (event.status === "SCHEDULED" || event.status === "IN_PROGRESS") {
        console.log(`Found matching event with status: ${event.status}`);
        return true;
      }

      return false;
    });

    if (session) {
      console.log("Setting current live session:", session);
      setCurrentLiveSession(session);
    } else {
      console.log("No matching live session found");
      setCurrentLiveSession(null);
    }
  }, [weekEvents, currentLesson?.id]);

  if (loading) return <Loader isLoader={false} />;

  if (!lesson) {
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

  if (
    !(new Date(week?.cohort!?.startsAt) < new Date()) ||
    week?.cohort?.status === "OPEN"
  )
    return (
      <Card>
        <CardHeader></CardHeader>
        <CardContent className="text-center space-y-5">
          <Countdown startDate={week?.cohort!?.startsAt.toString()}></Countdown>

          <Button
            onClick={() =>
              onNavigate?.("/bootcamps/" + week?.cohort?.bootcampId)
            }
            variant={"secondary"}
          >
            Back to Bootcamp
          </Button>
        </CardContent>
      </Card>
    );

  const isVideoCompleted = (lessonId: string) => {
    return userLessons?.find((ch: UserLesson) => ch.lessonId === lessonId)
      ?.completed;
  };

  const next = () => {
    return week?.lessons?.find((v: Lesson, index: number) => {
      const currentIndex = week.lessons.findIndex(
        (video: Lesson) => video.id === currentLesson?.id,
      );
      return index === currentIndex + 1;
    });
  };

  const prev = () => {
    return week?.lessons?.find((v: Lesson, index: number) => {
      const currentIndex = week.lessons.findIndex(
        (video: Lesson) => video.id === currentLesson?.id,
      );
      return index === currentIndex - 1;
    });
  };

  const nextVideo = next();

  const handleVideoClick = (lesson: Lesson) => {
    if (currentLesson?.type == "QUIZ") {
      if (!quizPassed || currentLesson?.quiz?.required) {
        toast.warning("This quiz is required and you have to meet the mark");
        return;
      }
    }

    const _lesson = lesson?.id
      ? week?.lessons.find((v: Lesson) => v.id === lesson.id)
      : week?.lessons[0];
    setCurrentLesson(_lesson);
  };

  const handleWeekClick = (week: {
    id: string;
    title: string;
    lessons?: Lesson[];
  }) => {
    onNavigate?.(
      `/bootcamps/${id}/${cohort}/weeks/${week.id}/${week.lessons?.[0].id}`,
    );
  };

  const handleSaveNotes = async () => {
    if (!note) return;
    try {
      const saveNote = await store.saveNote(
        note,
        lesson.id,
        currentLesson?.id!,
      );
      setNotes([...notes, saveNote]);
    } catch (error) {
      toast.error("Error occurred adding note");
    }
  };

  const isWeekCompleted = (lessons?: UserLesson[]) => {
    if (!lessons?.length && !userLessons?.length) return false;

    const _lessons = lessons || userLessons;

    const completed = _lessons.filter(
      (ul) => ul.completed && ul.weekId === week?.id,
    );

    return week?.lessons?.length === completed?.length;
  };

  const markCourseAsCompleted = async () => {
    try {
      setCelebration(true);
      setCompleted(true);

      const points = week?.lessons.reduce((p, c) => (p += c.mb), 0);

      toast.success(`You've earned ${points} MB from the lesson`);

      setShowWeekComplete(true);
    } catch (error: any) {
      toast.error("An error occurred updating your points. Try again");
      setCompleted(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!currentLesson || !lesson || !week) return;

    if (currentLesson?.type == "QUIZ") {
      if (!quizPassed || currentLesson?.quiz?.required) {
        toast.warning("This quiz is required and you have to meet the mark");
        return;
      }
    }

    if (currentLesson?.type === "ASSIGNMENT" && !submissionUrl.trim()) {
      toast.warning("Please provide a submission URL for this assignment");
      return;
    }

    try {
      const completedLessons = [
        ...(userLessons?.filter(
          (lesson) => lesson.lessonId !== currentLesson.id,
        ) ?? []),
        {
          ...currentLesson,
          completed: true,
          weekId: week.id,
          lessonId: currentLesson.id,
        },
      ];

      setUserLessons(completedLessons);

      const payload: any = {
        isWeekCompleted: isWeekCompleted(completedLessons),
        nextWeekId: week?.nextWeek?.id,
        nextLessonId: nextVideo?.id,
      };

      if (currentLesson?.type === "ASSIGNMENT") {
        payload.submissionUrl = submissionUrl;
      }

      store.markLessonCompleted(id, cohort, weekId, currentLesson.id, payload);

      toast.success("You just earned some points!");
      setCelebration(true);
      if (nextVideo) handleVideoClick(nextVideo!);
    } catch (error) {
      toast.error("An error occurred. Please try again");
    }
  };

  const progress = () => {
    const completed = userLessons?.filter((ul) => weekId === ul.weekId);
    return ((completed?.length ?? 0) / (week?.lessons!?.length ?? 0)) * 100;
  };

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => onNavigate?.(`/bootcamps/${id}/dashboard`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {currentLesson ? currentLesson.title : week?.title}
          </h1>
          <p className="text-muted-foreground">
            {currentLesson?.title} • {week?.title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{currentLesson?.type}</Badge>
          {(currentLesson?.type === "VIDEO" ||
            currentLesson?.type === "QUIZ") && (
            <Badge variant="outline" className="flex gap-1">
              <Clock className="h-3 w-3" />
              <span className="">
                {currentLesson?.video?.duration ??
                  currentLesson?.quiz?.timeLimit}{" "}
                mins
              </span>
            </Badge>
          )}
        </div>
      </div>

      {currentLiveSession && currentLiveSession.meetingUrl && (
        <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  🔴 Live Session in Progress
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                  {currentLiveSession.title || "Join your instructor and classmates now"}
                </p>
                {currentLiveSession.startTime && (
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                    Started:{" "}
                    {new Date(currentLiveSession.startTime).toLocaleTimeString()}
                  </p>
                )}
              </div>
              <Button
                onClick={() => {
                  if (currentLiveSession.meetingUrl) {
                    window.open(currentLiveSession.meetingUrl, "_blank");
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
              >
                Join Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Video Player */}
        <div className="lg:col-span-2 space-y-4 flex flex-col">
          <Card className="overflow-hidden">
            {/* Video Player */}
            {currentLesson?.type === "VIDEO" && (
              <Card className="overflow-hidden">
                <div className="aspect-video bg-black relative">
                  <VimeoPlayer video={currentLesson?.video} />
                </div>
              </Card>
            )}
            {currentLesson?.type === "QUIZ" && (
              <Card className="overflow-hidden">
                <CourseQuizPage
                  courseId={slug}
                  onNavigate={() => {}}
                  quizId={currentLesson?.quizId!}
                  showNav={false}
                  handleQuizSubmit={(passed) => {
                    setQuizPassed(passed);
                    if (!passed) {
                    }

                    handleMarkComplete();
                  }}
                />
              </Card>
            )}

            {currentLesson?.type === "EXERCISE" && (
              <ExercisePage
                courseId={lesson.id}
                onNavigate={(path) => onNavigate?.(path)}
                exercise={currentLesson?.exercise!}
              />
            )}

            {currentLesson?.type === "ASSIGNMENT" && (
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">
                    {currentLesson
                      ? currentLesson?.type?.toLowerCase()
                      : "Chapter"}{" "}
                    Overview
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                  {currentLesson?.description && (
                    <div>
                      <div className="space-y-4">
                        <article
                          className="text-muted-foreground leading-relaxed [&>*>table]:p-3 [&>*>table]:border [&>*>code]:rounded-xl [&>*>code]:bg-zinc-800 [&>*>code]:p-1 [&>*>code]:text-sm [&>*>code]:font-medium [&>*>code]:text-zinc-100 [&>*>code]:overflow-x-auto w-full [&>*>li>pre]:mt-5 [&>*>li>pre]:rounded-xl [&>*>li>pre]:bg-zinc-800 [&>*>li>pre]:p-4 [&>*>li>pre]:text-sm [&>*>li>pre]:font-medium [&>*>li>pre]:text-zinc-100 [&>*>li>pre]:overflow-x-auto [&>*>li>a]:text-amber-300 [&>p>a]:text-amber-300 mx-auto w-full text-zinc-700 dark:text-zinc-300 [&>pre]:overflow-x-auto [&>h2]:text-2xl [&>h2]:font-bold [&>h3]:text-xl [&>h3]:font-bold [&>p]:mt-2 [&>p]:leading-relaxed [&>pre]:mt-5 [&>pre]:rounded-xl [&>pre]:bg-zinc-800 [&>pre]:p-4 [&>pre]:text-sm [&>pre]:font-medium [&>pre]:text-zinc-100 [&>ul]:mt-5 [&>ul]:flex [&>ul]:list-disc [&>ul]:flex-col [&>ul]:gap-2 [&>ul]:pl-6 [&>ol]:mt-5 [&>ol]:flex [&>ol]:list-decimal [&>ol]:flex-col [&>ol]:gap-2 [&>ol]:pl-6 [&>*>span]:!text-black [&>p]:text-black dark:[&>*>span]:!text-muted-foreground dark:[&>p]:text-muted-foreground"
                          dangerouslySetInnerHTML={{
                            __html: currentLesson?.description,
                          }}
                        ></article>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Submission URL
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://github.com/username/project"
                        type="url"
                        value={submissionUrl}
                        onChange={(e) => setSubmissionUrl(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleMarkComplete}
                        disabled={!submissionUrl.trim()}
                        size="sm"
                        className="flex-shrink-0"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Submit
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Paste the link to your GitHub repository or project URL
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentLesson?.type === "ARTICLE" && (
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">
                    {currentLesson
                      ? currentLesson?.type?.toLowerCase()
                      : "Chapter"}{" "}
                    Overview
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {currentLesson?.description && (
                    <CardContent>
                      <div className="space-y-4  pt-4">
                        <article
                          className="text-muted-foreground leading-relaxed [&>*>table]:p-3 [&>*>table]:border [&>*>code]:rounded-xl [&>*>code]:bg-zinc-800 [&>*>code]:p-1 [&>*>code]:text-sm [&>*>code]:font-medium [&>*>code]:text-zinc-100 [&>*>code]:overflow-x-auto w-full [&>*>li>pre]:mt-5 [&>*>li>pre]:rounded-xl [&>*>li>pre]:bg-zinc-800 [&>*>li>pre]:p-4 [&>*>li>pre]:text-sm [&>*>li>pre]:font-medium [&>*>li>pre]:text-zinc-100 [&>*>li>pre]:overflow-x-auto [&>*>li>a]:text-amber-300 [&>p>a]:text-amber-300 mx-auto w-full text-zinc-700 dark:text-zinc-300 [&>pre]:overflow-x-auto [&>h2]:text-2xl [&>h2]:font-bold [&>h3]:text-xl [&>h3]:font-bold [&>p]:mt-2 [&>p]:leading-relaxed [&>pre]:mt-5 [&>pre]:rounded-xl [&>pre]:bg-zinc-800 [&>pre]:p-4 [&>pre]:text-sm [&>pre]:font-medium [&>pre]:text-zinc-100 [&>ul]:mt-5 [&>ul]:flex [&>ul]:list-disc [&>ul]:flex-col [&>ul]:gap-2 [&>ul]:pl-6 [&>ol]:mt-5 [&>ol]:flex [&>ol]:list-decimal [&>ol]:flex-col [&>ol]:gap-2 [&>ol]:pl-6 [&>*>span]:!text-black [&>p]:text-black dark:[&>*>span]:!text-muted-foreground dark:[&>p]:text-muted-foreground"
                          dangerouslySetInnerHTML={{
                            __html: currentLesson?.description,
                          }}
                        ></article>
                      </div>
                    </CardContent>
                  )}
                </CardContent>
              </Card>
            )}
          </Card>
          {/* Video Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleShare(currentLesson?.title!, path!)}
                variant="outline"
                size="sm"
              >
                <Share className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button disabled={true} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {currentLesson && (
                <>
                  {currentLesson.type === "VIDEO" &&
                    nextVideo &&
                    (isVideoCompleted(currentLesson.id) ? (
                      <Button variant="outline" disabled>
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                        Completed
                      </Button>
                    ) : (
                      <Button onClick={handleMarkComplete}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark Complete
                      </Button>
                    ))}

                  {currentLesson.type === "QUIZ" &&
                    nextVideo &&
                    (isVideoCompleted(currentLesson.id) ? (
                      <Button variant="outline" disabled>
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                        Completed
                      </Button>
                    ) : (
                      (quizPassed || !currentLesson?.quiz?.required) && (
                        <Button onClick={handleMarkComplete}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Mark Quiz Complete
                        </Button>
                      )
                    ))}

                  {(currentLesson.type === "EXERCISE" ||
                    currentLesson.type === "ARTICLE") &&
                    nextVideo &&
                    (isVideoCompleted(currentLesson.id) ? (
                      <Button variant="outline" disabled>
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                        Completed
                      </Button>
                    ) : (
                      <Button onClick={handleMarkComplete}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark Complete
                      </Button>
                    ))}
                </>
              )}

              {/* Show Claim Reward button when it's the last lesson of a week */}
              {!nextVideo && (
                <>
                  {week?.nextWeek ? (
                    <Button
                      className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
                      onClick={async () => {
                        await handleMarkComplete();
                        markCourseAsCompleted();
                      }}
                    >
                      Claim Rewards
                      <Crown className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
                      onClick={async () => {
                        await handleMarkComplete();
                        setTimeout(() => {
                          onNavigate?.(routes.bootcampCertificate(id));
                        }, 500);
                      }}
                    >
                      View Certificate
                      <Trophy className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          <Card></Card>

          {/* Content Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              {/* Only show transcript for VIDEO type, not for text-based content */}
              {currentLesson?.type === "VIDEO" && (
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
              )}
              <TabsTrigger value="code">Code Editor</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="discussion">Discussion</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">
                    {currentLesson
                      ? currentLesson?.type?.toLowerCase()
                      : "Chapter"}{" "}
                    Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <article
                      className="text-muted-foreground [&>*>span]:!text-black [&>p]:text-black dark:[&>*>span]:!text-muted-foreground dark:[&>p]:text-muted-foreground"
                      dangerouslySetInnerHTML={{
                        __html: currentLesson?.summary!,
                      }}
                    ></article>
                  </div>
                </CardContent>
                <CardContent>
                  {currentLesson?.video?.description && (
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
                            __html: currentLesson?.video?.description,
                          }}
                        ></p>
                      </div>
                    </CardContent>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="code">
              <SimpleEditor />
              {/* <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code2 className="h-5 w-5" />
                    Code Editor
                  </CardTitle>
                  <CardDescription>
                    Follow along with the video and write your code here
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="border rounded-md bg-black text-white p-4 font-mono text-sm h-[600px]">
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full h-full resize-none border-none outline-none bg-transparent font-mono text-sm"
                      placeholder="Start coding your project here..."
                    />
                  </div>
                </CardContent>
                <div className="flex justify-between p-4">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                  <Button className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Run
                  </Button>
                </div>
              </Card> */}
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
                    {currentLesson?.video?.resources?.map(
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
                      identifier: currentLesson?.id,
                      title: currentLesson?.title,
                      url: `/lessons/${slug}/watch/${weekId}/${slug}`,
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transcript" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Video Transcript</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Auto-generated transcript with timestamps
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {[
                      {
                        time: "00:00",
                        text: `Welcome to ${
                          currentLesson?.title || week?.title
                        }.`,
                      },
                      {
                        time: "00:15",
                        text: "In this section, we'll explore the key concepts and practical applications.",
                      },
                      {
                        time: "00:30",
                        text: "Let's start by understanding the fundamental principles.",
                      },
                      {
                        time: "01:00",
                        text: "Now let's look at a practical example of implementing this concept.",
                      },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                        onClick={() =>
                          setCurrentTime(
                            Number.parseInt(item.time.split(":")[0]) * 60 +
                              Number.parseInt(item.time.split(":")[1]),
                          )
                        }
                      >
                        <span className="text-sm font-mono text-blue-600 min-w-[50px]">
                          {item.time}
                        </span>
                        <span className="text-sm">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Course Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Week Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{Math.floor(progress() ?? 0)}%</span>
                </div>
                <Progress value={progress() ?? 0} className="h-2" />
              </div>
              <div className="text-sm text-muted-foreground">
                {
                  userLessons?.filter(
                    (ul: UserLesson) => ul?.completed && ul.weekId === weekId,
                  ).length
                }{" "}
                of {week?.lessons?.length} lessons completed
              </div>
            </CardContent>
          </Card>

          {/* Chapter Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Week Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Videos */}
              {week?.lessons?.map((lesson: Lesson) => (
                <div
                  key={lesson.id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted ${
                    lesson.id === currentLesson?.id
                      ? "border border-blue-200"
                      : ""
                  }`}
                  onClick={() => handleVideoClick(lesson)}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                    {isVideoCompleted(lesson.id) ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{lesson.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {/* TODO: Remove this */}
                      {/* {(lesson.type === "VIDEO" || lesson.type === "QUIZ") && (
                        <>
                          <Clock className="h-3 w-3" />
                          <span>
                            {lesson?.video?.duration ?? lesson.quiz?.timeLimit}{" "}
                            mins
                          </span>
                        </>
                      )} */}
                      <Badge variant="outline" className="text-xs">
                        {lesson?.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Week Navigation */}
          <div className="space-y-2">
            {week?.prevWeek && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleWeekClick(week.prevWeek!)}
              >
                <SkipBack className="mr-2 h-4 w-4" />
                Previous Week: {week.prevWeek.title}
              </Button>
            )}
            {week?.nextWeek && (
              <Button
                className="w-full justify-start"
                onClick={() => handleWeekClick(week.nextWeek!)}
              >
                Next Week: {week.nextWeek.title}
                <SkipForward className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      {week && (
        <WeekCompletionShare
          open={showWeekComplete}
          onClose={() => setShowWeekComplete(false)}
          week={week}
          userName={user.name}
          points={week?.lessons?.reduce((p, c) => (p += c.mb), 0) ?? 0}
          onStartNextWeek={
            week?.nextWeek
              ? () => {
                  setShowWeekComplete(false);
                  onNavigate?.(
                    `/bootcamps/${id}/${cohort}/weeks/${week.nextWeek!.id}/${week.nextWeek!.lessons?.[0]?.id ?? ""}`,
                  );
                }
              : undefined
          }
          nextWeekTitle={week?.nextWeek?.title}
        />
      )}
      <ConfettiCelebration
        onComplete={() => setCelebration(false)}
        isVisible={celebration}
        celebrationType="enrollment"
        courseName={lesson?.title!}
        duration={2000}
      />
    </div>
  );
}
