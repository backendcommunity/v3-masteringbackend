"use client";

import { useMemo, useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  Play,
  CheckCircle2,
  Clock,
  Star,
  BookOpen,
  Award,
  Share,
  Heart,
  Lock,
  ArrowLeft,
  Brain,
  Code,
  Gamepad2,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  BadgeIcon as Certificate,
  Trophy,
  Target,
  PlayCircle,
  FileText,
  Zap,
  CheckCircle,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import DisqusCommentBlock from "../ui/comment";
import { PaymentDialog } from "../payment-dialog";
import { Chapter, Course, Milestone, Roadmap, Video } from "@/lib/data";
import { toast } from "sonner";
import ConfettiCelebration from "@/components/confetti-celebration";
import { Loader } from "../ui/loader";

interface RoadmapCoursePreviewProps {
  roadmapId: string;
  topicId: string;
  onBack: () => void;
  onEnroll: () => void;
  onStartWatching: () => void;
  slug: string;
  onNavigate: (path: string) => void;
}

export function CourseDetailPage({
  slug,
  topicId,
  roadmapId,
  onNavigate,
}: RoadmapCoursePreviewProps) {
  const store = useAppStore();
  const [course, setCourse] = useState<Course>();
  const [roadmap, setRoadmap] = useState<Roadmap>();
  const { updateCourse } = store;
  const [milestone, setMilestone] = useState<Milestone | any>();
  const [currentChapter] = useState(course?.chapters[0]);
  const [loading, setLoading] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [celebration, setCelebration] = useState(false);
  const [completedItems, setCompletedItems] = useState<any>([]);

  const totalVideos = course?.chapters?.reduce(
    (acc, chapter) =>
      acc + chapter.videos.filter((v) => v.type === "VIDEO").length,
    0,
  );

  const quizzes = course?.chapters?.filter(
    (chapter) => chapter?.quizzes,
  ).length;
  const exercises = course?.chapters?.filter(
    (chapter) => chapter?.exercise,
  ).length;
  const playgrounds = course?.chapters?.filter(
    (chapter) => chapter?.playground,
  ).length;

  async function findRoadmap(slug: string) {
    const milestone = await store.getMilestone(slug, topicId);
    setMilestone(milestone);
    setCompletedItems(milestone?.userTopic?.completedItems ?? []);
    setRoadmap(milestone?.roadmap);
  }

  async function findCourse(slug: string) {
    setLoading(true);
    const course = await store.getCourse(slug, { isRoadmap: true });
    setCourse(course);
    setLoading(false);
  }

  useMemo(() => {
    findCourse(slug);
    findRoadmap(roadmapId);
  }, [slug, roadmapId]);

  if (loading) return <Loader isLoader={false} />;
  const completedIds = completedItems?.map(
    (ci: any) => ci.itemId && ci.completed,
  );

  const isChapterCompleted = (chapterId: string) => {
    return course?.userCourse?.userChapters?.find(
      (ch: any) => ch.chapterId === chapterId,
    )?.isCompleted;
  };

  const handleChapterComplete = (chapterId: string) => {
    const updatedChapters = course?.chapters.map((chapter) =>
      chapter.id === chapterId ? { ...chapter, completed: true } : chapter,
    );
    const completedCount = updatedChapters?.filter((c) => c.isCompleted).length;
    const newProgress = Math.round(
      (completedCount! / updatedChapters?.length!) * 100,
    );

    updateCourse(slug, {
      ...course,
      chapters: updatedChapters,
      progress: newProgress,
    });
  };

  const handleEnrollNow = async () => {
    try {
      if (!course) return;

      const { data } = await handleEnrollment(course.id);
      updateCourse(slug, { ...course, enrolled: true, userCourse: data });
      Object.assign(course!, { enrolled: true, userCourse: data });

      // Trigger celebration for first-time enrollment
      setCelebration(true);
      toast.success("You have successfully enrolled");
    } catch (error) {
      toast.error("An error occurred. Please try again");
    }
  };

  const handleEnrollment = async (courseId: string) => {
    return await store.handleRoadmapCourseEnrollment(
      roadmapId,
      topicId,
      courseId,
    );
  };

  const handlePreviewCourse = () => {
    //TODO: Add user to course and set preview true
    const previewPath = routes.coursePreview(slug);
    onNavigate(previewPath);
  };

  const handleContinueLearning = () => {
    // Navigate to first incomplete chapter or continue from current

    const videos = course?.chapters?.flatMap((ch: Chapter) =>
      ch.videos.flatMap((v) => ({
        ...v,
      })),
    );

    const videoIds = videos?.map((v) => v.id);

    const remainingVideoIds = videoIds?.filter(
      (vi) => !completedIds?.includes(vi),
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
      video?.slug!,
    );
    onNavigate(watchPath);
  };

  const handleChapterClick = (chapter: Chapter, index: number) => {
    if (course?.enrolled) {
      // Default to video watch
      const watchPath = routes.roadmapVideoWatch(
        roadmapId,
        topicId,
        course.slug,
        chapter.slug,
        chapter?.videos[0]?.slug,
      );
      onNavigate(watchPath);
    } else {
      handlePreviewCourse();
    }
  };

  const calculateCourseProgress = () => {
    const totalVideos = course?.chapters?.reduce(
      (acc, chapter) => acc + chapter.videos.length,
      0,
    );

    const videoIds = course?.chapters.flatMap((ch) =>
      ch.videos
        .flatMap((v) => ({
          id: v.id,
        }))
        .map((v) => v.id),
    );

    const totalCompleted = videoIds?.filter((vi) =>
      completedIds?.includes(vi),
    )?.length;

    return (Number(totalCompleted ?? 0) / Number(totalVideos! ?? 0)) * 100;
  };

  const courseProgress = calculateCourseProgress();
  const isCompleted = courseProgress! >= 100;
  const canEarnCertificate = course?.enrolled && isCompleted;

  return (
    <div className="flex-1 space-y-6">
      {/* Course Header */}
      <div className="flex justify-between border-b items-center gap-4 mb-6">
        <div className="px-4 flex gap-3 sm:px-6 lg:px-8 py-4">
          <Button
            variant="outline"
            onClick={() => {
              if (roadmap?.enrolled)
                onNavigate(routes.roadmapWatch(roadmapId, milestone?.id));
              else onNavigate(routes.roadmapDetail(roadmapId));
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Roadmap
          </Button>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{roadmap?.title}</span>
            <span>•</span>
            <span>{milestone?.title}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2">
            <Badge
              variant={
                course?.level === "Advanced"
                  ? "destructive"
                  : course?.level === "Intermediate"
                    ? "default"
                    : "secondary"
              }
            >
              {course?.level}
            </Badge>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">{course?.rating ?? 4.5}</span>
            </div>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">{course?.title}</h1>

          {/* Short Description */}

          <article
            className="text-lg text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: course?.summary!,
            }}
          ></article>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {course?.totalDuration} hours
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {course?.chapters.length} chapters
            </div>
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4" />
              Certificate included
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {course?.tags?.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Expandable Long Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Course Overview
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setIsDescriptionExpanded(!isDescriptionExpanded)
                  }
                >
                  {isDescriptionExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`space-y-4 ${
                  isDescriptionExpanded ? "" : "line-clamp-3"
                }`}
              >
                {course?.description
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
            </CardContent>
          </Card>

          <div className="flex gap-5 justify-center">
            {/* Prerequisites */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Prerequisites</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Basic JavaScript knowledge</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Understanding of web technologies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Problem-solving mindset </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Technologies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {course?.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Course Features Section */}
          {/* {course?.enrolled && ( */}
          <Card>
            <CardHeader>
              <CardTitle>Course Features</CardTitle>
              <CardDescription>
                Interactive learning tools and resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {course?.hasQuizzes && (
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() =>
                      onNavigate(
                        routes.roadmapCourseQuizzes(roadmapId, topicId, slug),
                      )
                    }
                  >
                    <Brain className="h-6 w-6" />
                    <span className="text-sm">Quizzes</span>
                  </Button>
                )}
                {course?.hasExercises && (
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => onNavigate(routes.courseExercises(slug))}
                  >
                    <Code className="h-6 w-6" />
                    <span className="text-sm">Exercises</span>
                  </Button>
                )}
                {course?.hasPlaygrounds && (
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => onNavigate(routes.coursePlaygrounds(slug))}
                  >
                    <Gamepad2 className="h-6 w-6" />
                    <span className="text-sm">Playgrounds</span>
                  </Button>
                )}
                {course?.hasProjects && (
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => onNavigate(routes.courseProjects(slug))}
                  >
                    <FolderOpen className="h-6 w-6" />
                    <span className="text-sm">Projects</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          {/* )} */}
        </div>

        <div className="space-y-6">
          {/* Roadmap Context Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Roadmap Context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium  mb-1">Current Roadmap</div>
                <div className="text-sm text-gray-600">{roadmap?.title}</div>
              </div>
              <div>
                <div className="text-sm font-medium  mb-1">
                  Current Milestone
                </div>
                <div className="text-sm text-gray-600">{milestone?.title}</div>
              </div>
              <div>
                <div className="text-sm font-medium  mb-2">
                  Milestone Progress
                </div>
                <Progress
                  value={milestone?.userTopic?.progress}
                  className="h-2"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {milestone?.userTopic?.progress}% complete
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Enrollment Card */}
          <Card>
            <CardHeader>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={course?.banner ?? "/placeholder.svg"}
                  alt={course?.title}
                  className="h-full w-full object-cover"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {roadmap?.enrolled && course?.enrolled ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Your Progress</span>
                    <span>{course.progress ?? 0}%</span>
                  </div>
                  <Progress value={course.progress ?? 0} className="h-2" />
                  <Button className="w-full" onClick={handleContinueLearning}>
                    <Play className="mr-2 h-4 w-4" />
                    Continue Learning
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {roadmap?.enrolled && (
                    <Button className="w-full" onClick={handleEnrollNow}>
                      <Play className="mr-2 h-4 w-4" />
                      Start Learning
                    </Button>
                  )}
                  {/* <Button
                    variant="outline"
                    className="w-full"
                    onClick={handlePreviewCourse}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Preview Course
                  </Button> */}
                </div>
              )}
              {showPaymentDialog && (
                <PaymentDialog
                  onClose={() => setShowPaymentDialog(false)}
                  open={showPaymentDialog}
                  data={course}
                  onHandlePreview={() => {}}
                  onHandlePurchase={() => {}}
                />
              )}
              <Separator />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Heart className="mr-2 h-4 w-4" />
                  Wishlist
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Course Features */}
          <Card>
            <CardHeader>
              <CardTitle>Course Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <PlayCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm">{totalVideos} video lessons</span>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-green-500" />
                <span className="text-sm">{quizzes} interactive quizzes</span>
              </div>
              <div className="flex items-center gap-3">
                <Code className="h-4 w-4 text-purple-500" />
                <span className="text-sm">{exercises} coding exercises</span>
              </div>
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-orange-500" />
                <span className="text-sm">{playgrounds} code playgrounds</span>
              </div>
              <div className="flex items-center gap-3">
                <Award className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Certificate of completion</span>
              </div>
            </CardContent>
          </Card>

          {/* Certification Card */}
          <Card
            className={`${
              canEarnCertificate
                ? "border-green-200 bg-green-50/50"
                : "border-orange-200 bg-orange-50/50"
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    canEarnCertificate ? "bg-green-100" : "bg-orange-100"
                  }`}
                >
                  {canEarnCertificate ? (
                    <Trophy className="h-6 w-6 text-green-600" />
                  ) : (
                    <Certificate className="h-6 w-6 text-orange-600" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg">Course Certificate</CardTitle>
                  <CardDescription className="text-sm">
                    {canEarnCertificate
                      ? "Ready to claim!"
                      : "Complete course to earn"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {canEarnCertificate
                    ? "Congratulations! You've completed the course and earned your certificate."
                    : "Complete all chapters and pass the final assessment to earn your verified certificate."}
                </p>

                {course?.enrolled && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress to Certificate</span>
                      <span>{courseProgress}%</span>
                    </div>
                    <Progress value={courseProgress} className="h-2" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Shareable on LinkedIn</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Verifiable credential</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Industry recognized</span>
                </div>
              </div>

              {canEarnCertificate ? (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => onNavigate(routes.courseCertificate(slug))}
                >
                  <Certificate className="mr-2 h-4 w-4" />
                  View Certificate
                </Button>
              ) : course?.enrolled ? (
                <Button variant="outline" className="w-full" disabled>
                  <Certificate className="mr-2 h-4 w-4" />
                  Complete Course to Earn
                </Button>
              ) : (
                roadmap?.enrolled && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleEnrollNow}
                  >
                    <Certificate className="mr-2 h-4 w-4" />
                    Enroll to Earn Certificate
                  </Button>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Course Content */}
      <Tabs defaultValue="curriculum" className="space-y-4">
        <TabsList>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="instructor">Instructor</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="curriculum" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Curriculum</CardTitle>
              <CardDescription>
                {course?.chapters.length} chapters •{" "}
                {course?.totalDuration ?? 0} total hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {course?.chapters.map((chapter: Chapter, index) => {
                  return (
                    <div
                      key={chapter.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 ${
                        currentChapter?.id === chapter.id ? "bg-muted" : ""
                      }`}
                      onClick={() => handleChapterClick(chapter, index)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          {isChapterCompleted(chapter.id) ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : course?.enrolled || !chapter.isPremium ? (
                            <span className="text-sm font-medium">
                              {index + 1}
                            </span>
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{chapter.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                !chapter.isPremium
                                  ? "border-green-600 text-green-600"
                                  : course?.enrolled
                                    ? "border-blue-600 text-blue-600"
                                    : "border-orange-600 text-orange-600"
                              }`}
                            >
                              {!chapter.isPremium
                                ? "FREE"
                                : course?.enrolled
                                  ? "ENROLLED"
                                  : "PREMIUM"}
                            </Badge>
                            <span>{chapter.duration}</span>
                            <Badge variant="secondary" className="text-xs">
                              {chapter?.type?.toUpperCase()}
                            </Badge>
                            {/* Feature indicators */}
                            {chapter?.quizzes?.length! > 0 && (
                              <Badge
                                variant="outline"
                                className="text-xs border-purple-600 text-purple-600"
                              >
                                QUIZ
                              </Badge>
                            )}
                            {chapter.exercise && (
                              <Badge
                                variant="outline"
                                className="text-xs border-blue-600 text-blue-600"
                              >
                                EXERCISE
                              </Badge>
                            )}
                            {chapter.playground && (
                              <Badge
                                variant="outline"
                                className="text-xs border-green-600 text-green-600"
                              >
                                PLAYGROUND
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            course?.enrolled &&
                            isChapterCompleted(chapter.id)
                          ) {
                            handleChapterComplete(chapter.id);
                          }
                        }}
                      >
                        {isChapterCompleted(chapter.id) ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : course?.enrolled || !chapter.isPremium ? (
                          <Play className="h-4 w-4" />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instructor">
          <Card>
            <CardHeader>
              <CardTitle>About the Instructor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  {course?.instructor
                    ?.split(" ")
                    .map((n: string) => n.charAt(0))
                    .join("") ?? "MB"}
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    {course?.instructor ?? "Mastering Backend"}
                  </h3>
                  <p className="text-muted-foreground">
                    Senior Backend Engineer with 8+ years of experience building
                    scalable systems. Previously worked at Google and Netflix.
                  </p>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>15 courses</span>
                    <span>50k+ students</span>
                    <span>4.9 rating</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Student Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <DisqusCommentBlock
                  config={{
                    url: "/courses/" + slug,
                    identifier: slug,
                    title: course?.title,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confetti Celebration */}
      <ConfettiCelebration
        onComplete={() => setCelebration(false)}
        isVisible={celebration}
        celebrationType="enrollment"
        courseName={course?.title!}
      />
    </div>
  );
}

export { CourseDetailPage as RoadmapCoursePreviewPage };
