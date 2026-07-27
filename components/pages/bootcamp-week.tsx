"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  Clock,
  BookOpen,
  Code2,
  VideoIcon,
  AudioWaveform,
  Calendar,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Bootcamp, Lesson, UserCohort, Week } from "@/lib/data";
import { formatRelativeDate } from "@/lib/utils";

interface BootcampWeekPageProps {
  bootcampId: string;
  weekId: string;
  onNavigate?: (route: string) => void;
}

export function BootcampWeekPage({
  bootcampId,
  weekId,
  onNavigate,
}: BootcampWeekPageProps) {
  const store = useAppStore();
  const [bootcamp, setBootcamp] = useState<Bootcamp>();
  const [userCohort, setUserCohort] = useState<UserCohort>();
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState<Week & { index: number }>();
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [events, setEvents] = useState<Array<any>>();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const bootcamp = await store.getBootcamp(bootcampId);

        const weeks = bootcamp?.cohort?.weeks;
        if (!cancelled) setWeeks(weeks);
        const week = weeks?.find((w: any) => w.id === weekId);
        const index = weeks?.findIndex((w: any) => w.id === weekId) + 1;
        if (!cancelled) {
          setCurrentWeek({
            ...week,
            index,
          });

          setUserCohort(bootcamp?.userCohort);
          setBootcamp(bootcamp);
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [bootcampId, weekId]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!currentWeek) return;
      try {
        const events = await store.getCurrentWeekEvents(
          bootcampId,
          currentWeek?.id!,
        );
        if (!cancelled) {
          setEvents(events);
        }
      } catch (error) {}
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [bootcampId, currentWeek]);

  if (loading) return <PageSkeleton />;

  if (!bootcamp) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Week not found</h1>
          <Button
            onClick={() => onNavigate?.(`/bootcamps/${bootcampId}/dashboard`)}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bootcamp
          </Button>
        </div>
      </div>
    );
  }

  const handleStart = (lesson: Lesson) => {
    if (lesson.type?.toLowerCase() === "quiz") return onNavigate?.("");
    if (lesson.type?.toLowerCase() === "project")
      return onNavigate?.(`/projects/${lesson?.project?.slug}`);

    return onNavigate?.(
      `/bootcamps/${bootcampId}/${userCohort?.cohortId}/weeks/${currentWeek?.id}/${lesson?.id}`,
    );
  };

  const isWeekCompleted = (week: Week) => {
    if (!userCohort?.userLessons?.length) return 0;
    const userLessons = userCohort.userLessons;

    const completed = userLessons.filter(
      (ul) => ul.completed && ul.weekId === week?.id,
    );
    return week?.lessons?.length === completed?.length;
  };

  // const isCurrentWeekCompleted = () => {
  //   const activeWeek = userCohort?.currentWeekId;
  //   const week = weeks?.find((w: any) => w.id === activeWeek);
  //   const totalLessons = week?.lessons.length;

  //   if (!userCohort?.userLessons?.length) return false;
  //   const userLessons = userCohort.userLessons;

  //   const completed = userLessons.filter(
  //     (ul) => ul.completed && ul.weekId === currentWeek?.id
  //   );

  //   return totalLessons === completed?.length;
  // };

  const isLessonCompleted = (lesson: Lesson) => {
    if (!userCohort?.userLessons?.length) return 0;
    const userLessons = userCohort.userLessons;

    const completed = userLessons.find(
      (ul) => ul.lessonId === lesson.id && ul.completed,
    );
    return !!completed;
  };

  const lessonsCompletedByWeek = () => {
    if (!userCohort?.userLessons?.length) return 0;

    const userLessons = userCohort.userLessons;
    const completed = userLessons.filter(
      (ul) => ul.completed && ul.weekId === currentWeek?.id,
    )?.length;
    return completed;
  };

  const lessonsCompleted = lessonsCompletedByWeek() ?? 0;

  const progress =
    (lessonsCompletedByWeek() / currentWeek?.lessons!?.length) * 100;

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => onNavigate?.(`/bootcamps/${bootcampId}/dashboard`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Week {currentWeek?.index}: {currentWeek?.title}
          </h1>
          <p className="text-muted-foreground">{bootcamp.title}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Week Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Week Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {currentWeek?.summary}
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {currentWeek?.lessons?.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Lessons
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {lessonsCompleted}
                  </div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(progress)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lessons */}
          <Card>
            <CardHeader>
              <CardTitle>Week {currentWeek?.index} Lessons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentWeek?.lessons?.map((lesson: Lesson, index: number) => (
                <div
                  key={lesson.id}
                  className={`border rounded-lg p-4 ${
                    isLessonCompleted(lesson) ? "border-green-500/10" : "" //bg-green-500/10
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        {isLessonCompleted(lesson) ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="text-sm font-medium">
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{lesson.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            {lesson.type === "VIDEO" ? (
                              <Play className="h-4 w-4" />
                            ) : lesson.type === "PROJECT" ? (
                              <Code2 className="h-4 w-4" />
                            ) : (
                              <BookOpen className="h-4 w-4" />
                            )}
                            <span>{lesson.type}</span>
                          </div>
                          {/* TODO: Remove this */}
                          {/* <div className="flex items-center gap-1">
                            
                            {(lesson.type === "VIDEO" ||
                              lesson.type === "QUIZ") && (
                              <Badge variant="outline" className="flex gap-1">
                                <Clock className="h-3 w-3" />
                                <span className="">
                                  {lesson?.video?.duration ??
                                    lesson.quiz?.timeLimit}{" "}
                                  mins
                                </span>
                              </Badge>
                            )}
                          </div> */}
                        </div>
                      </div>
                    </div>
                    <div>
                      {isWeekCompleted(currentWeek) ? (
                        <div className="space-x-2">
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            Completed
                          </Badge>

                          <Button
                            variant={"secondary"}
                            onClick={() => handleStart(lesson)}
                            size="sm"
                          >
                            Review
                          </Button>
                        </div>
                      ) : userCohort?.currentWeekId === currentWeek.id ? (
                        <div className="flex items-center gap-2">
                          {isLessonCompleted(lesson) ? (
                            <>
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200"
                              >
                                Completed
                              </Badge>

                              <Button
                                variant={"secondary"}
                                onClick={() => handleStart(lesson)}
                                size="sm"
                              >
                                Review
                              </Button>
                            </>
                          ) : (
                            <Button
                              onClick={() => handleStart(lesson)}
                              size="sm"
                            >
                              <Play className="mr-2 h-4 w-4" />
                              {lesson.type === "VIDEO"
                                ? "Watch"
                                : lesson.type === "QUIZ"
                                  ? "Solve"
                                  : lesson.type === "PROJECT"
                                    ? "Build"
                                    : "Complete"}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Button variant={"secondary"} size="sm">
                          Locked
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {events?.map((event, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-primary" />
                    <div>
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatRelativeDate(event.startTime, event.timezone)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-5">
                    <Button
                      title="Click here to join meeting"
                      disabled={!event.meetingUrl}
                      variant="outline"
                      onClick={() => window.open(event.meetingUrl)}
                    >
                      <VideoIcon className="h-4 w-4" />
                    </Button>

                    <Button
                      title="Click here for previous recording"
                      disabled={!event.recordingUrl}
                      variant={"outline"}
                      onClick={() => window.open(event.recordingUrl)}
                    >
                      <AudioWaveform className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex">
                    <Badge variant="outline" className="capitalize">
                      {event?.eventType?.split("_")?.join(" ")?.toLowerCase()}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {event?.status?.split("_")?.join(" ")?.toLowerCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Week Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Week Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Lessons Completed</span>
                  <span>
                    {lessonsCompleted}/{currentWeek?.lessons?.length}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Bootcamp Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bootcamp Weeks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {weeks.map((week: Week, i: number) => (
                <div
                  key={i + 1}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted ${
                    week?.id === currentWeek?.id ? "border border-primary/30" : ""
                  }`}
                  onClick={() => {
                    setCurrentWeek({
                      ...week,
                      index: i + 1,
                    });
                  }}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                    {isWeekCompleted(week) ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Week {i + 1}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
