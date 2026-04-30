"use client";

import { useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  PlayCircle,
  CalendarIcon,
  Trophy,
  Target,
  Clock,
  Users,
  Video as VideoIcon,
  CheckCircle2,
  Play,
  Lock,
  BookOpen,
  Star,
  ChevronRight,
  Crown,
  Gift,
  CreditCard,
  Code2,
  Database,
  Globe,
  Shield,
  Zap,
  FileText,
  Settings,
  Smartphone,
  Cloud,
  Share2,
  Download,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Chapter, Project30, Video } from "@/lib/data";
import { toast } from "sonner";
import { PaymentDialog } from "../payment-dialog";
import { useUser } from "@/hooks/use-user";
import ConfettiCelebration from "../confetti-celebration";
import { routes } from "@/lib/routes";
import { Certificate } from "../certificate";
import { formatDate } from "@/lib/utils";
import { Loader } from "../ui/loader";

interface Project30PageProps {
  slug?: string;
  onNavigate: (path: string) => void;
}

export function Project30Page({
  slug = "backend-fundamentals",
  onNavigate,
}: Project30PageProps) {
  const store = useAppStore();
  const user = useUser();
  const [activeTab, setActiveTab] = useState("overview");
  const [project30, setProject30] = useState<Project30>();
  const [achievements, setAchievements] = useState<any[]>();
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [celebration, setCelebration] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  let dayCount = 1;
  const userProject30 = project30?.userProject30;
  const currentDay = userProject30?.currentDay ?? 0;
  const nextDay = userProject30?.isCompleted ? currentDay : currentDay + 1;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const data = await store.getProject30(slug);
      if (!cancelled) {
        setProject30(data);
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [slug, store]);

  useEffect(() => {
    let cancelled = false;

    if (activeTab === "achievements") {
      const load = async () => {
        const data = await store.getUserAchievement("DAY_COMPLETED");
        if (!cancelled) {
          setAchievements(data);
        }
      };

      load();
    }

    return () => {
      cancelled = true;
    };
  }, [activeTab, store]);

  if (loading) return <Loader isLoader={false} />;

  if (!project30) return <div>Project30 not found</div>;

  // Mock subscription data
  const subscription = user?.subscription ?? {
    name: "Free",
    status: "active",
  };

  const handleDownload = () => {};
  const handleShare = () => {};

  const courses = project30.courses.filter(
    (course: any) => !["Optional", "Bonus"].includes(course.topic.trim())
  );
  const bonusCourses = project30.courses.filter((course: any) =>
    ["Optional", "Bonus"].includes(course.topic.trim())
  );
  const chapters = courses.flatMap(({ course }: any) => {
    return course.chapters.map((ch: Chapter) => ch);
  });

  const handleWatchPage = (video: string) => {
    return onNavigate(`/project30/${slug}/day/${video}`);
  };

  const getXPCost = (price: number) => {
    return Math.round(price * 100);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800 border-green-200";
      case "Intermediate":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Advanced":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Expert":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "in-progress":
        return <Play className="h-4 w-4 text-primary" />;
      default:
        return <Lock className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleStartChallenge = async (slug: string) => {
    try {
      setStarting(true);
      const startProject30 = await store.startProject30(slug);
      setProject30({
        ...project30,
        userProject30: startProject30,
        isEnrolled: true,
      });
      setCelebration(true);
    } catch (error) {
      toast.error("Error occurred starting project30");
    } finally {
      setStarting(false);
    }
  };
  const isCompleted = (id: string) =>
    completedItems.find((c) => c.videoId === id && c.completed);

  const firstLesson = chapters?.[0]?.videos?.[0];
  const completedItems = userProject30?.userOfferItems ?? [];
  const completedLessions = userProject30?.totalLessonsCompleted ?? 0;
  const nextLessonId = userProject30?.nextLesson ?? firstLesson?.id;
  const nextWeek = userProject30?.nextWeek ?? chapters?.[0]?.id;
  const nextLessonWeek = chapters.find((ch) => ch.id === nextWeek);
  const nextLesson =
    nextLessonWeek?.videos?.find((v: Video) => v.id === nextLessonId) ??
    firstLesson;

  return (
    <div className="flex-1 space-y-4 md:space-y-6 ">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 md:h-6 md:w-6 text-[#F2C94C]" />
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {project30.title}
              </h1>
              {project30?.isEnrolled && (
                <Badge
                  variant="outline"
                  className="bg-[#F2C94C]/10 text-[#F2C94C] border-[#F2C94C]/20 text-xs"
                >
                  Day {nextDay}
                </Badge>
              )}
              {subscription?.name === "Free" && !user?.isPremium && (
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800 border-green-200 text-xs"
                >
                  <Crown className="mr-1 h-3 w-3" />
                  Included in Pro
                </Badge>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => onNavigate(`/project30/${slug}/leaderboard`)}
                className="w-full sm:w-auto"
              >
                <Trophy className="mr-2 h-4 w-4" />
                Leaderboard
              </Button>
              {project30?.isEnrolled ? (
                !userProject30?.isCompleted && (
                  <Button
                    onClick={() => handleWatchPage(nextLesson?.id)}
                    className="w-full sm:w-auto"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Today's Lesson
                  </Button>
                )
              ) : (
                <div>
                  {user?.isPremium ? (
                    <Button onClick={() => handleStartChallenge(slug)}>
                      {starting ? (
                        <>Starting...</>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Start Challenge
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button onClick={() => setShowPaymentDialog(true)}>
                      <Lock className="mr-2 h-4 w-4" />
                      Get Access
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* <Card> */}
          <div>
            <div
              className={`space-y-4 ${
                isDescriptionExpanded ? "" : "line-clamp-3"
              }`}
            >
              {project30?.description
                ?.split("\n\n")
                .map((paragraph: string, index: number) => (
                  <article
                    dangerouslySetInnerHTML={{ __html: paragraph }}
                    key={index}
                    className="text-muted-foreground leading-relaxed [&>*>table]:p-3 [&>*>table]:border [&>*>code]:rounded-xl [&>*>code]:bg-zinc-800 [&>*>code]:p-1 [&>*>code]:text-sm [&>*>code]:font-medium [&>*>code]:text-zinc-100 [&>*>code]:overflow-x-auto w-full [&>*>li>pre]:mt-5 [&>*>li>pre]:rounded-xl [&>*>li>pre]:bg-zinc-800 [&>*>li>pre]:p-4 [&>*>li>pre]:text-sm [&>*>li>pre]:font-medium [&>*>li>pre]:text-zinc-100 [&>*>li>pre]:overflow-x-auto [&>*>li>a]:text-amber-300 [&>p>a]:text-amber-300 mx-auto w-full text-zinc-700 dark:text-zinc-300 [&>pre]:overflow-x-auto [&>h2]:text-2xl [&>h2]:font-bold [&>h3]:text-xl [&>h3]:font-bold [&>p]:mt-2 [&>p]:leading-relaxed [&>pre]:mt-5 [&>pre]:rounded-xl [&>pre]:bg-zinc-800 [&>pre]:p-4 [&>pre]:text-sm [&>pre]:font-medium [&>pre]:text-zinc-100 [&>ul]:mt-5 [&>ul]:flex [&>ul]:list-disc [&>ul]:flex-col [&>ul]:gap-2 [&>ul]:pl-6 [&>ol]:mt-5 [&>ol]:flex [&>ol]:list-decimal [&>ol]:flex-col [&>ol]:gap-2 [&>ol]:pl-6"
                  >
                    {/* {paragraph} */}
                  </article>
                ))}
            </div>
            {!isDescriptionExpanded && (
              <Button
                variant="link"
                className="p-0 h-auto mt-2"
                onClick={() => setIsDescriptionExpanded(true)}
              >
                Read more
              </Button>
            )}

            {isDescriptionExpanded && (
              <Button
                variant="link"
                className="p-0 h-auto mt-2"
                onClick={() => setIsDescriptionExpanded(false)}
              >
                Show less
              </Button>
            )}
          </div>
          {/* </Card> */}
        </div>
      </div>

      {/* Access Banner for Free Users */}
      {!project30?.isEnrolled ||
        (!user?.isPremium && (
          <Card className="bg-gradient-to-r from-[#F2C94C]/10 to-[#F2C94C]/5 border-[#F2C94C]/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="h-8 w-8 text-[#F2C94C]" />
                  <div>
                    <h3 className="font-semibold text-sm md:text-base">
                      Unlock Project30 Challenge
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Get access to 30 days of hands-on project building with
                      expert guidance
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowPaymentDialog(true)}
                  className="w-full md:w-auto"
                >
                  Get Access
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

      {/* Progress Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-[#F2C94C]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">
              Current Day
            </CardTitle>
            <CalendarIcon className="h-3 w-3 md:h-4 md:w-4 text-[#F2C94C]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project30?.isEnrolled ? nextDay : "—"}/{project30?.totalDays}
            </div>
            <p className="text-xs text-muted-foreground">
              {project30?.isEnrolled
                ? `${project30?.totalDays! - nextDay} days remaining`
                : "Enroll to start"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#13AECE]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">
              Instructor
            </CardTitle>
            <BookOpen className="h-3 w-3 md:h-4 md:w-4 text-[#13AECE]" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl w-full font-bold">
              {project30?.instructor ?? "Mastering backend"}
            </div>
            <p className="text-xs text-muted-foreground">
              Senior Backend Engineer
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#EB5757]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">
              Lessons Completed
            </CardTitle>
            <VideoIcon className="h-3 w-3 md:h-4 md:w-4 text-[#EB5757]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project30?.isEnrolled ? completedLessions : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {project30?.isEnrolled
                ? `${project30?.completionRate}% completion rate`
                : "Start learning"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#347474]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">
              Leaderboard Rank
            </CardTitle>
            <Trophy className="h-3 w-3 md:h-4 md:w-4 text-[#347474]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project30?.isEnrolled
                ? `#${project30?.userProject30?.rank}`
                : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {project30?.isEnrolled
                ? `of ${project30?.totalParticipants} participants`
                : "Join to compete"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        defaultValue="overview"
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="bonus">Bonuses</TabsTrigger>
          {/* <TabsTrigger value="calendar">Calendar</TabsTrigger> */}
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Current Lesson */}
          {project30?.isEnrolled ? (
            userProject30?.isCompleted ? (
              <Card className="bg-gradient-to-r from-green-600/10 to-green-600/5 border-green-600/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    Course Completed
                  </CardTitle>
                  <CardDescription>
                    You've earned a certificate. Click on the download or share
                    button to save or share with your employer.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col justify-between items-baseline md:flex-row gap-4">
                      <div className="relative rounded-md overflow-hidden w-full md:w-1/3">
                        <img
                          src={"/placeholder.svg"}
                          alt="Video thumbnail"
                          className="w-full h-auto object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <PlayCircle className="h-12 w-12 text-white opacity-80" />
                        </div>
                      </div>
                      <div className="w-full">
                        <div className="flex justify-end gap-3">
                          {/* <Button onClick={handleShare} variant="outline">
                            <Share2 className="mr-2 h-4 w-4" />
                            Share Certificate
                          </Button> */}
                          <Button
                            onClick={() =>
                              onNavigate(`/project30/${slug}/certificate`)
                            }
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            View Certificate
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gradient-to-r from-[#F2C94C]/10 to-[#F2C94C]/5 border-[#F2C94C]/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-[#F2C94C]" />
                    Today's Lesson - Day {nextDay}
                  </CardTitle>
                  <CardDescription>
                    Watch today's video to learn how to build a new project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="relative rounded-md overflow-hidden w-full md:w-1/3">
                        <img
                          src={nextLesson?.banner || "/placeholder.svg"}
                          alt="Video thumbnail"
                          className="w-full h-auto object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <PlayCircle className="h-12 w-12 text-white opacity-80" />
                        </div>
                      </div>
                      <div className="w-full md:w-2/3">
                        <h3 className="font-semibold text-base md:text-lg">
                          {nextLesson?.title}
                        </h3>

                        <article
                          dangerouslySetInnerHTML={{
                            __html: nextLesson?.summary,
                          }}
                          className="text-xs md:text-sm text-muted-foreground mt-1 [&>*>span]:!text-black [&>p]:text-black dark:[&>*>span]:!text-muted-foreground dark:[&>p]:text-muted-foreground"
                        ></article>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {nextLesson?.duration}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 md:h-4 md:w-4" />
                            {nextLesson?.mb} MB
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                          {nextLesson?.technologies?.map((tech: string) => (
                            <Badge
                              key={tech}
                              variant="outline"
                              className="text-xs"
                            >
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() =>
                        onNavigate(`/project30/${slug}/day/${nextLesson.id}`)
                      }
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Watch Today's Lesson
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          ) : (
            <Card className="bg-gradient-to-r from-[#F2C94C]/10 to-[#F2C94C]/5 border-[#F2C94C]/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-gray-500" />
                  Project30 Challenge Preview
                </CardTitle>
                <CardDescription>
                  Get access to unlock 30 days of project-based learning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 opacity-60">
                    <div className="relative rounded-md overflow-hidden w-full md:w-1/3">
                      <img
                        src={firstLesson?.banner || "/placeholder.svg"}
                        alt="Video thumbnail"
                        className="w-full h-auto object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Lock className="h-12 w-12 text-white" />
                      </div>
                    </div>
                    <div className="w-full md:w-2/3">
                      <h3 className="font-semibold text-base md:text-lg">
                        {firstLesson?.title}
                      </h3>

                      <article
                        dangerouslySetInnerHTML={{
                          __html: firstLesson?.summary,
                        }}
                        className="text-xs md:text-sm text-muted-foreground mt-1"
                      ></article>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {firstLesson?.duration} mins
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 md:h-4 md:w-4" />
                          {firstLesson?.mb} MB
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {firstLesson?.technologies?.map((tech: string) => (
                          <Badge
                            key={tech}
                            variant="outline"
                            className="text-xs"
                          >
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {user?.isPremium ? (
                    <Button
                      className="w-full"
                      onClick={() => handleStartChallenge(slug)}
                    >
                      {starting ? (
                        <>Starting...</>
                      ) : (
                        <>
                          <Crown className="mr-2 h-4 w-4" />
                          Start Challenge
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => setShowPaymentDialog(true)}
                    >
                      <Crown className="mr-2 h-4 w-4" />
                      Get Access to Start Learning
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Lessons */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">
                Recent Lessons
              </CardTitle>
              <CardDescription className="text-sm">
                Your latest Project30 lessons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedItems
                  ?.slice(0, userProject30?.isCompleted ? 3 : 2)
                  ?.map((lesson) => (
                    <div
                      key={lesson.day}
                      className="flex items-center space-x-4 rounded-lg border p-3"
                    >
                      <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                        {lesson.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : !lesson.completed ? (
                          <Play className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Lock className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            Day {lesson.day}: {lesson?.video?.title}
                          </p>
                          <Badge
                            variant={
                              lesson.completed
                                ? "default"
                                : !lesson.completed
                                ? "secondary"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {lesson.completed
                              ? "Completed"
                              : !lesson.completed
                              ? "In Progress"
                              : project30?.isEnrolled
                              ? "Locked"
                              : "Premium"}
                          </Badge>
                        </div>
                        <article
                          dangerouslySetInnerHTML={{
                            __html: lesson?.video?.summary,
                          }}
                          className="text-xs text-muted-foreground [&>*>span]:!text-black [&>p]:text-black dark:[&>*>span]:!text-muted-foreground dark:[&>p]:!text-muted-foreground"
                        ></article>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          project30?.isEnrolled
                            ? handleWatchPage(lesson?.video?.id)
                            : setShowPaymentDialog(true)
                        }
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                {!userProject30?.isCompleted && (
                  <div
                    key={nextDay}
                    className="flex items-center space-x-4 rounded-lg border p-3"
                  >
                    <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                      <Play className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          Day {currentDay! + 1}: {nextLesson?.title}
                        </p>
                        <Badge variant={"secondary"} className="text-xs">
                          {nextLesson?.completed
                            ? "Completed"
                            : !nextLesson?.completed
                            ? "In Progress"
                            : project30?.isEnrolled
                            ? "Locked"
                            : "Premium"}
                        </Badge>
                      </div>
                      <article
                        dangerouslySetInnerHTML={{
                          __html: nextLesson?.summary,
                        }}
                        className="text-xs text-muted-foreground [&>*>span]:!text-black [&>p]:text-black dark:[&>*>span]:!text-muted-foreground dark:[&>p]:text-muted-foreground"
                      ></article>
                    </div>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() =>
                        project30?.isEnrolled
                          ? onNavigate(`/project30/${slug}/day/${currentDay}`)
                          : setShowPaymentDialog(true)
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">
                  Progress Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project30?.isEnrolled ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Overall Progress</span>
                        <span>
                          {Math.round(
                            (currentDay / project30?.totalDays!) * 100
                          )}
                          %
                        </span>
                      </div>
                      <Progress
                        value={(currentDay / project30?.totalDays!) * 100}
                        className="h-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Completion Rate</span>

                        <span>{Math.round(project30.completionRate)}%</span>
                      </div>
                      {currentDay < 1 ? (
                        <Progress
                          value={project30.completionRate}
                          className="h-2"
                        />
                      ) : (
                        <Progress
                          value={project30.completionRate}
                          className="h-2"
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Lock className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2 text-sm md:text-base">
                      Unlock Your Progress
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground mb-4">
                      Get access to track your daily progress and compete with
                      others
                    </p>
                    {user.isPremium ? (
                      <Button
                        onClick={() => handleStartChallenge(slug)}
                        className="w-full md:w-auto"
                      >
                        {starting ? <>Starting...</> : <>Start Challenge</>}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setShowPaymentDialog(true)}
                        className="w-full md:w-auto"
                      >
                        Get Access
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">
                  Course Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {project30?.isEnrolled ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">
                        Total MB Earned
                      </span>
                      <span className="font-semibold text-sm md:text-base">
                        {project30?.totalMB} MB
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">
                        Average MB/Day
                      </span>
                      <span className="font-semibold text-sm md:text-base">
                        {completedLessions >= 1
                          ? Math.round(project30?.totalMB! / completedLessions)
                          : 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">
                        Best Streak
                      </span>
                      <span className="font-semibold text-sm md:text-base">
                        {project30?.userProject30?.streak} days
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">
                        Days Remaining
                      </span>
                      <span className="font-semibold text-sm md:text-base">
                        {project30?.totalDays! - nextDay}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">
                        Course Price
                      </span>
                      <span className="font-semibold text-sm md:text-base">
                        ${project30?.amount!}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">
                        MB Cost
                      </span>
                      <span className="font-semibold text-sm md:text-base">
                        {getXPCost(project30?.amount!)?.toLocaleString()} MB
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">
                        Your MB Balance
                      </span>
                      <span className="font-semibold text-sm md:text-base">
                        {user?.points?.toLocaleString() ?? 0} MB
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">
                        Total Participants
                      </span>
                      <span className="font-semibold text-sm md:text-base">
                        {project30?.totalParticipants?.toLocaleString() ?? 0}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="curriculum" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">
                30-Day Curriculum
              </CardTitle>
              <CardDescription className="text-sm">
                Complete curriculum breakdown with weekly themes and daily
                projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {chapters.map((chapter, i) => (
                  <AccordionItem key={chapter.id} value={`week-${i + 1}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full mr-4">
                        <div className="text-left">
                          <h3 className="font-semibold">
                            Week {i + 1}: {chapter?.title + ""}
                          </h3>

                          <article
                            dangerouslySetInnerHTML={{
                              __html: chapter?.summary,
                            }}
                            className="text-xs text-muted-foreground"
                          ></article>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {chapter.videos?.length}+ days
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {chapter.videos?.length} videos
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {chapter?.videos?.reduce(
                              (total: number, video: Video) => total + video.mb,
                              0
                            )}{" "}
                            MB
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent>
                      <div className="space-y-3 pt-4">
                        {chapter?.videos?.map((video: Video) => {
                          const currentDay = dayCount++;
                          return (
                            <div
                              key={video.id}
                              className={`flex items-center space-x-4 rounded-lg border p-4 transition-colors ${
                                project30?.isEnrolled
                                  ? isCompleted(video.id)
                                    ? "hover:bg-muted/50 cursor-pointer"
                                    : nextLessonId === video.id
                                    ? "border-primary/40 hover:bg-muted/50 cursor-pointer"
                                    : "opacity-60"
                                  : "opacity-60"
                              }`}
                              onClick={() => {
                                if (project30?.isEnrolled) {
                                  handleWatchPage(video.id);
                                } else if (!user.isPremium) {
                                  setShowPaymentDialog(true);
                                }
                              }}
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                {getStatusIcon(
                                  isCompleted(video.id)
                                    ? "completed"
                                    : nextLessonId === video.id
                                    ? "in-progress"
                                    : "locked"
                                )}
                              </div>
                              <div className="flex-1 space-y-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs md:text-sm font-medium text-muted-foreground">
                                    Day {currentDay}
                                  </span>
                                  <Badge
                                    className={`${getDifficultyColor(
                                      video?.difficulty!
                                    )} text-xs`}
                                    variant="outline"
                                  >
                                    {video.difficulty}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {video.mb} MB
                                  </Badge>
                                </div>
                                <h4 className="font-medium text-sm md:text-base">
                                  {video.title}
                                </h4>
                                <article
                                  dangerouslySetInnerHTML={{
                                    __html: video?.description,
                                  }}
                                  className="text-xs text-muted-foreground"
                                ></article>
                                <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {video?.duration ?? 0} mins
                                  </div>
                                  {video?.technologies?.length && (
                                    <div className="flex items-center gap-1">
                                      <Database className="h-4 w-4" />
                                      <span>
                                        {video?.technologies?.join(", ")}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {project30?.isEnrolled &&
                              isCompleted(video.id) ? (
                                <ChevronRight className="h-4 w-4 flex-shrink-0" />
                              ) : !project30?.isEnrolled ? (
                                <Lock className="h-4 w-4 text-gray-400" />
                              ) : nextLessonId === video.id ? (
                                <Play className="h-4 w-4 flex-shrink-0 text-primary" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bonus" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">
                Bonus Courses & Resources
              </CardTitle>
              <CardDescription className="text-sm">
                Find all the bonus courses, resources and more information here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {bonusCourses.map(({ id, course, video, resource }) => {
                  if (course)
                    return (
                      <div key={id} className="space-y-4  pb-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                            Course
                            {/* TODO: show videos and resources */}
                          </h4>
                          <Card key={course.id} className="overflow-hidden">
                            <div className="flex flex-col md:flex-row">
                              <div className="w-full md:w-1/4 h-40 md:h-auto bg-muted">
                                <img
                                  src={course?.banner || "/placeholder.svg"}
                                  alt={course?.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 p-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                  <div>
                                    <h5 className="font-medium">
                                      {course?.title}
                                    </h5>
                                    <article
                                      dangerouslySetInnerHTML={{
                                        __html: course?.summary,
                                      }}
                                      className="text-sm text-muted-foreground [&>*>span]:!text-black [&>p]:text-black dark:[&>*>span]:!text-muted-foreground dark:[&>p]:text-muted-foreground"
                                    ></article>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">
                                      {course.type}
                                    </Badge>
                                    <Badge variant="outline">
                                      {course?.totalDuration ?? 0} mins
                                    </Badge>
                                  </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <PlayCircle className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm">
                                      {course.chapters?.length} chapters
                                    </span>
                                  </div>
                                  <a
                                    target="_blank"
                                    href={routes.courseDetail(course?.slug)}
                                  >
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                    >
                                      View Course
                                    </Button>
                                  </a>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </div>
                      </div>
                    );
                  if (video)
                    return (
                      <div key={id} className="space-y-4  pb-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                            Video
                          </h4>
                          <Card key={video.id} className="overflow-hidden">
                            <div className="flex flex-col md:flex-row">
                              <div className="w-full md:w-1/4 h-40 md:h-auto bg-muted">
                                <img
                                  src={video?.banner || "/placeholder.svg"}
                                  alt={video?.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 p-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                  <div>
                                    <h5 className="font-medium">
                                      {video?.title}
                                    </h5>

                                    <article
                                      dangerouslySetInnerHTML={{
                                        __html: video?.summary,
                                      }}
                                      className="text-xs text-muted-foreground"
                                    ></article>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">
                                      {video.type}
                                    </Badge>
                                    <Badge variant="outline">
                                      {video?.duration ?? 0}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                  {/* <div className="flex items-center gap-2">
                                    <PlayCircle className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm">
                                      {course.chapters?.length} chapters
                                    </span>
                                  </div> */}
                                  <a
                                    target="_blank"
                                    href={routes.project30Day(
                                      course.slug,
                                      video?.id
                                    )}
                                  >
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                    >
                                      Watch Video
                                    </Button>
                                  </a>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </div>
                      </div>
                    );
                  if (resource)
                    return (
                      <div key={id} className="space-y-4  pb-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                            Resource
                          </h4>
                          <Card key={resource.id} className="overflow-hidden">
                            <div className="flex flex-col md:flex-row">
                              <div className="w-full md:w-1/4 h-40 md:h-auto bg-muted">
                                <img
                                  src={resource.banner || "/placeholder.svg"}
                                  alt={resource.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 p-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                  <div>
                                    <h5 className="font-medium">
                                      {resource.title}
                                    </h5>

                                    <article
                                      dangerouslySetInnerHTML={{
                                        __html: resource?.summary,
                                      }}
                                      className="text-xs text-muted-foreground"
                                    ></article>
                                  </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                  <a target="_blank" href={resource.link}>
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                    >
                                      View Resource
                                    </Button>
                                  </a>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </div>
                      </div>
                    );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* <TabsContent value="calendar" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">
                  Course Calendar
                </CardTitle>
                <CardDescription className="text-sm">
                  Track your daily progress
                </CardDescription>
              </CardHeader>
              <CardContent className="w-full">
                {project30?.isEnrolled ? (
                  <Calendar
                    completedDates={[]}
                    currentDate={[]}
                    missedDates={[]}
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                ) : (
                  <div className="text-center py-8">
                    <Lock className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2 text-sm md:text-base">
                      Calendar Locked
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground mb-4">
                      Start challenge to track your daily progress
                    </p>

                    <Button
                      disabled={user.isPremium}
                      variant={"outline"}
                      onClick={() => setShowPaymentDialog(true)}
                      className="w-full md:w-auto"
                    >
                      Unlock Calendar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">
                  Calendar Legend
                </CardTitle>
                <CardDescription className="text-sm">
                  Understanding your progress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-green-500"></div>
                  <span className="text-sm">Completed Lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-blue-500"></div>
                  <span className="text-sm">Current Day</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-gray-300"></div>
                  <span className="text-sm">Upcoming Lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-red-500"></div>
                  <span className="text-sm">Missed Lessons</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent> */}

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">
                Achievements
              </CardTitle>
              <CardDescription className="text-sm">
                Unlock badges as you progress through Project30
              </CardDescription>
            </CardHeader>
            <CardContent>
              {project30?.isEnrolled ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {achievements?.map(({ achievement, ...ach }) => (
                    <div
                      key={ach.id}
                      className={`flex items-center space-x-4 rounded-lg border p-3 md:p-4 ${
                        ach.completed
                          ? "bg-green-500/10 border-green-200"
                          : "bg-gray-200/10 border-gray-200"
                      }`}
                    >
                      <div className="text-xl md:text-2xl">
                        {achievement.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm md:text-base">
                          {achievement.name}
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {achievement.description}
                        </p>
                        {!ach.completed && (
                          <div className="mt-2">
                            <Progress value={ach.progress} className="h-2" />
                          </div>
                        )}
                      </div>
                      {ach.completed && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2 text-sm md:text-base">
                    Achievements Locked
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground mb-4">
                    Start challenge to unlock achievements and track your
                    progress
                  </p>
                  <Button
                    disabled={user.isPremium}
                    variant={"outline"}
                    onClick={() => setShowPaymentDialog(true)}
                    className="w-full md:w-auto"
                  >
                    Unlock Achievements
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="community" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-[#F2C94C]" />
                  Top Performers
                </CardTitle>
                <CardDescription className="text-sm">
                  See how you rank against other participants
                </CardDescription>
              </CardHeader>
              <CardContent>
                {project30?.isEnrolled ? (
                  <div className="space-y-3">
                    {project30?.userProject30?.performers?.map((entry, i) => (
                      <div
                        key={i + 1}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          entry.isCurrentUser
                            ? "bg-[#F2C94C]/10 border border-[#F2C94C]/20"
                            : "bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                            #{i + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm md:text-base">
                              {entry.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {entry.itemCount} lessons • {entry.streak} day
                              streak
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm md:text-base">
                            {entry.totalMB} MB
                          </p>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() =>
                        onNavigate(`/project30/${slug}/leaderboard`)
                      }
                    >
                      View Full Leaderboard
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2 text-sm md:text-base">
                      Leaderboard Locked
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground mb-4">
                      Start challenge to compete with other learners
                    </p>

                    <Button
                      disabled={user.isPremium}
                      variant={"outline"}
                      onClick={() => setShowPaymentDialog(true)}
                      className="w-full md:w-auto"
                    >
                      Join Competition
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#13AECE]" />
                  Community Stats
                </CardTitle>
                <CardDescription className="text-sm">
                  Project30 community insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm text-muted-foreground">
                    Total Participants
                  </span>
                  <span className="font-semibold text-sm md:text-base">
                    {project30?.totalParticipants ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm text-muted-foreground">
                    Active Today
                  </span>
                  <span className="font-semibold text-sm md:text-base">
                    {project30?.totalParticipantsToday ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm text-muted-foreground">
                    Projects Built
                  </span>
                  <span className="font-semibold text-sm md:text-base">
                    {project30?.totalProjectSubmitted ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm text-muted-foreground">
                    Completion Rate
                  </span>
                  <span className="font-semibold text-sm md:text-base">
                    {project30?.completionRate ?? 0}%
                  </span>
                </div>
                {project30?.isEnrolled ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => onNavigate(`/project30/${slug}/community`)}
                  >
                    Join Community Discussion
                  </Button>
                ) : (
                  <Button
                    disabled={user.isPremium}
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowPaymentDialog(true)}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Unlock Community Access
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <PaymentDialog
        onClose={() => setShowPaymentDialog(false)}
        open={showPaymentDialog}
        data={project30}
        onHandlePreview={() => {}}
        onHandlePurchase={() => {}}
      />
      <ConfettiCelebration
        onComplete={() => setCelebration(false)}
        isVisible={celebration}
        celebrationType="enrollment"
        courseName={project30?.title!}
        duration={2000}
      />
    </div>
  );
}
