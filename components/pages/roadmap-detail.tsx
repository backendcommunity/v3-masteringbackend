"use client";

import type React from "react";

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
import {
  CheckCircle2,
  Clock,
  Code,
  FileText,
  GraduationCap,
  Layers,
  type LucideIcon,
  PlayCircle,
  Target,
  Users,
  BookOpen,
  Award,
  ArrowRight,
  ChevronRight,
  Calendar,
  CheckCheck,
  BarChart3,
  Loader2,
} from "lucide-react";
import { Course, enrollInRoadmap, Milestone, Roadmap } from "@/lib/data";
import { routes } from "@/lib/routes";
import { useAppStore } from "@/lib/store";
import { analytics } from "@/lib/analytics";
import DisqusCommentBlock from "../ui/comment";
import { PaymentDialog } from "../payment-dialog";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import ConfettiCelebration from "../confetti-celebration";
import { Certificate } from "../certificate";
import { Loader } from "../ui/loader";

interface RoadmapDetailPageProps {
  slug: string;
  onNavigate?: (route: string) => void;
}

export function RoadmapDetailPage({
  slug,
  onNavigate,
}: RoadmapDetailPageProps) {
  const store = useAppStore();
  const user = useUser();
  const [activeTab, setActiveTab] = useState("overview");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [roadmap, setRoadmap] = useState<Roadmap>();
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [starting, setStarting] = useState(false);
  const [celebration, setCelebration] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const roadmap = await store.getRoadmapBySlug(slug);
      setRoadmap(roadmap);
      setMilestones(roadmap?.topics || []);
      setLoading(false);
      if (roadmap) {
        analytics.track("roadmap_viewed", {
          roadmapSlug: slug,
          roadmapTitle: roadmap.title,
          isEnrolled: roadmap.enrolled ?? false,
        });
      }
    }
    loadData();
  }, []);

  const getAssessments = (milestone: any) => {
    return milestone.courses.flatMap((c: Course) => {
      return c.chapters.flatMap((ch) => {
        return ch.videos
          .filter((v) => v.type === "QUIZ" || v.type === "EXERCISE")
          .map((v) => ({ ...v, courseSlug: c.slug }));
      });
    });
  };
  if (loading) return <Loader isLoader={false} />;
  if (!roadmap) return <div className="p-6">Roadmap not found</div>;

  const handleEnroll = async () => {
    analytics.track("roadmap_enroll_clicked", {
      roadmapSlug: slug,
      roadmapTitle: roadmap?.title,
    });
    try {
      const isPremiumUser =
        user?.isPremium && user?.subscription?.name === "Enterprise";

      if (!isPremiumUser) {
        setShowPaymentDialog(!showPaymentDialog);
        return;
      }

      if (isPremiumUser) {
        setEnrolling(true);
        const data = await enrollInRoadmap(slug);
        // Force re-render
        setRoadmap(data);
        setActiveTab(activeTab);
        setEnrolling(false);
      }
    } catch (error: any) {
      toast.error(error.message);
      setEnrolling(false);
    }
  };

  const handleContinue = async () => {
    const milestone =
      roadmap?.topics?.find((m) => !m?.userTopic?.completed) ||
      roadmap?.topics?.[0];

    if (milestone.enrolled)
      return onNavigate?.(routes.roadmapWatch(slug, milestone?.id));
    await startMilestone(milestone.id);
  };

  const startMilestone = async (milestoneId: string) => {
    try {
      setStarting(true);
      await store.startMilestone(slug, milestoneId, {
        completed: false,
      });

      onNavigate?.(routes.roadmapWatch(slug, milestoneId));
      setCelebration(true);
    } catch (error: any) {
      toast.error(error?.message ?? "Error occurred. Please try again");
    } finally {
      setStarting(false);
    }
  };

  function reviewOrComplete(milestone: any, isCompleted: boolean) {
    return (
      <Button
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onNavigate?.(routes.roadmapWatch(slug, milestone?.id));
        }}
      >
        {isCompleted ? "Review Milestone" : "Continue Milestone"}
      </Button>
    );
  }

  const handleDownload = () => {};
  const handleShare = () => {};

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {roadmap?.title}
          </h1>

          <article
            dangerouslySetInnerHTML={{
              __html: roadmap?.summary!,
            }}
            className="text-muted-foreground [&>*>span]:!text-black [&>p]:text-black dark:[&>*>span]:!text-muted-foreground dark:[&>p]:text-muted-foreground"
          ></article>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {!roadmap?.enrolled ? (
            <Button disabled={enrolling} onClick={handleEnroll}>
              {enrolling ? "Enrolling..." : <>Enroll in Roadmap</>}
            </Button>
          ) : (
            <Button onClick={handleContinue}>Continue Roadmap</Button>
          )}
          <Button variant="outline">Download Syllabus</Button>
        </div>
      </div>
      {/* Progress Overview */}
      {roadmap?.enrolled && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Overall Progress
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={roadmap?.progress} className="h-2 flex-1" />
                  <span className="text-sm font-medium">
                    {roadmap?.progress}%
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Current Milestone
                </div>
                <div className="font-medium">
                  {roadmap?.userRoadmap?.currentTopic?.title}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Estimated Time
                </div>
                <div className="font-medium">{roadmap?.timeframe ?? 0}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Milestones Completed
                </div>
                <div className="font-medium">
                  {roadmap?.topics?.filter((t) => t.userTopic?.completed)
                    ?.length ?? 0}{" "}
                  of {milestones?.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Tabs */}
      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          {/* <TabsTrigger value="skills">Skills</TabsTrigger> */}
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="certificate">Certificate</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About This Roadmap</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Card>
                <CardContent>
                  <div
                    className={`space-y-4 ${
                      isDescriptionExpanded ? "" : "line-clamp-3"
                    }`}
                  >
                    {roadmap?.description
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
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Details</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Level:</strong> {roadmap?.level}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Duration:</strong> {roadmap?.timeframe}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Difficulty:</strong> {roadmap?.difficulty}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Instructor:</strong> {roadmap?.instructor}
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Prerequisites</h3>
                  <ul className="space-y-1">
                    {roadmap?.prerequisites?.map(
                      (prerequisite: string, index: number) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{prerequisite}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  What You'll Learn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                    <span className="text-sm">
                      Design and implement scalable backend systems
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                    <span className="text-sm">
                      Master advanced database optimization techniques
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                    <span className="text-sm">
                      Build and deploy microservices architectures
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                    <span className="text-sm">
                      Implement secure authentication and authorization
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                    <span className="text-sm">
                      Develop technical leadership and mentoring skills
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  Skills You'll Gain
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {roadmap?.skills?.map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                  Career Outcomes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-600 mt-1" />
                    <span className="text-sm">Senior Backend Engineer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-600 mt-1" />
                    <span className="text-sm">Technical Lead</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-600 mt-1" />
                    <span className="text-sm">System Architect</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-600 mt-1" />
                    <span className="text-sm">Engineering Manager</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-6">
          {milestones?.map((milestone: Milestone, index) => {
            const isCompleted = milestone?.userTopic?.completed;
            // const isCurrent =
            //   milestone.id === roadmap?.userRoadmap?.currentUserTopic?.topicId;
            const isEnrolled = milestone?.enrolled;
            const isUpcoming = !isCompleted && !isEnrolled;

            return (
              <Card
                key={milestone.id}
                className={`border hover:border-gray-200 cursor-pointer ${
                  isUpcoming
                    ? "opacity-60"
                    : isCompleted
                      ? "border-green-600 bg-green-900/20"
                      : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          isCompleted
                            ? "bg-green-600 text-white"
                            : isEnrolled
                              ? "bg-gray-200 text-white"
                              : "bg-blue-600 text-gray-600"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCheck className="h-4 w-4" />
                        ) : (
                          <span className="text-sm font-medium">
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          {milestone.title}
                        </CardTitle>
                        <CardDescription
                          className="text-muted-foreground [&>*>span]:!text-black [&>p]:text-black dark:[&>*>span]:!text-muted-foreground dark:[&>p]:text-muted-foreground"
                          dangerouslySetInnerHTML={{
                            __html: milestone?.description,
                          }}
                        ></CardDescription>
                      </div>
                    </div>
                    <div className="gap-2 flex">
                      <Badge
                        variant={
                          isCompleted
                            ? "default"
                            : isEnrolled
                              ? "secondary"
                              : "outline"
                        }
                        className={
                          isCompleted
                            ? "bg-green-100 text-green-800 border-green-200"
                            : isEnrolled
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : ""
                        }
                      >
                        {isCompleted
                          ? "Completed"
                          : isEnrolled
                            ? "In Progress"
                            : "Upcoming"}
                      </Badge>

                      <Badge variant={"default"}>{milestone?.level}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEnrolled && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Progress
                        </span>
                        <span className="text-sm font-medium">
                          {milestone?.userTopic?.completed
                            ? 100
                            : milestone?.progress}
                          %
                        </span>
                      </div>
                      {milestone?.userTopic?.completed ? (
                        <Progress value={100} className="h-2" />
                      ) : (
                        <Progress value={milestone?.progress} className="h-2" />
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        Courses
                      </h4>
                      <div className="space-y-1">
                        {milestone?.courses?.map((course: any) => (
                          <div
                            key={course.id}
                            className="text-sm flex items-center justify-between cursor-pointer hover:bg-gray-500 p-1 rounded [&>*>span]:!text-black [&>p]:text-black dark:[&>*>span]:!text-muted-foreground dark:[&>p]:text-muted-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate?.(
                                routes.roadmapCoursePreview(
                                  roadmap?.slug!,
                                  milestone.id,
                                  course?.slug,
                                ),
                              );
                            }}
                          >
                            <span>{course.title}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ))}
                        {milestone?.courses?.length === 0 && (
                          <div className="text-sm text-muted-foreground">
                            No courses in this milestone
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Code className="h-4 w-4 text-green-600" />
                        Projects
                      </h4>
                      <div className="space-y-1">
                        {milestone?.projects?.map((project: any) => (
                          <div
                            key={project.id}
                            className="text-sm flex items-center justify-between cursor-pointer hover:bg-gray-50 p-1 rounded"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate?.(routes.projectDetail(project.id));
                            }}
                          >
                            <span>{project.title}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ))}
                        {!milestone?.projects?.length && (
                          <div className="text-sm text-muted-foreground">
                            No projects in this milestone
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-600" />
                        Assessments
                      </h4>
                      <div className="space-y-1">
                        {getAssessments(milestone)?.map((assessment: any) => (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate?.(
                                assessment.type?.includes("QUIZ")
                                  ? routes.roadmapCourseQuiz(
                                      roadmap?.slug!,
                                      milestone.id,
                                      assessment?.courseSlug,
                                      assessment?.quizId,
                                    )
                                  : routes.roadmapCourseExercise(
                                      roadmap?.slug!,
                                      milestone.id,
                                      assessment?.courseSlug,
                                      assessment?.exerciseId,
                                    ),
                              );
                            }}
                            key={assessment.id}
                            className="text-sm flex items-center justify-between cursor-pointer hover:bg-gray-700 p-1 rounded"
                          >
                            <span>{assessment.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {assessment.type}
                            </Badge>
                          </div>
                        ))}
                        {!getAssessments(milestone)?.length && (
                          <div className="text-sm text-muted-foreground">
                            No assessments in this milestone
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Estimated duration: {milestone.duration}</span>
                    </div>

                    {roadmap?.enrolled ? (
                      isCompleted || isEnrolled ? (
                        reviewOrComplete(milestone, isCompleted || isEnrolled)
                      ) : (
                        <Button
                          disabled={starting}
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            startMilestone(milestone.id);
                          }}
                        >
                          {starting ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Start...</span>
                            </>
                          ) : (
                            <span>Start Milestone</span>
                          )}
                        </Button>
                      )
                    ) : (
                      <Button onClick={handleEnroll}>Enroll Now</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Curriculum Tab */}
        <TabsContent value="curriculum" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Complete Curriculum</CardTitle>
              <CardDescription>
                Detailed breakdown of all courses, projects, and assessments in
                this roadmap
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {milestones?.map((milestone: any, index) => (
                <div key={milestone.id} className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-white ${
                        milestone.completed ? "bg-green-600" : "bg-blue-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                    {milestone.title}
                  </h3>

                  <div className="space-y-4 pl-8">
                    {/* Courses */}
                    {milestone?.courses?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                          Courses
                        </h4>
                        <div className="space-y-2">
                          {milestone?.courses?.map((course: any) => {
                            return (
                              <Card
                                key={course.id}
                                className="overflow-hidden border-b"
                              >
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
                                          className="text-sm text-muted-foreground [&>*>span]:!text-black [&>p]:text-black dark:[&>*>span]:!text-muted-foreground dark:[&>p]:text-muted-foreground"
                                          dangerouslySetInnerHTML={{
                                            __html: course?.summary,
                                          }}
                                        ></article>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline">
                                          {course.type}
                                        </Badge>
                                        <Badge variant="outline">
                                          {course?.totalDuration ?? 0}
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
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onNavigate?.(
                                            routes.roadmapCoursePreview(
                                              roadmap?.slug!,
                                              milestone.id,
                                              course?.slug,
                                            ),
                                          );
                                        }}
                                      >
                                        View Course
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Projects */}
                    {milestone?.projects?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Code className="h-4 w-4 text-green-600" />
                          Projects
                        </h4>
                        <div className="space-y-2">
                          {milestone?.projects?.map((project: any) => (
                            <Card key={project.id} className="overflow-hidden">
                              <div className="flex flex-col md:flex-row">
                                <div className="w-full md:w-1/4 h-40 md:h-auto bg-muted">
                                  <img
                                    src={project.banner || "/placeholder.svg"}
                                    alt={project.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 p-4">
                                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                    <div>
                                      <h5 className="font-medium">
                                        {project.title}
                                      </h5>
                                      <p className="text-sm text-muted-foreground">
                                        {project.description}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">
                                        {project.difficulty}
                                      </Badge>
                                      <Badge variant="outline">
                                        {project.estimatedTime}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="mt-4 flex items-center justify-between">
                                    <div className="flex flex-wrap gap-2">
                                      {(project.technologies ?? [])
                                        .slice(0, 3)
                                        .map((tech: string, i: number) => (
                                          <Badge key={i} variant="secondary">
                                            {tech}
                                          </Badge>
                                        ))}
                                      {(project.technologies?.length ?? 0) >
                                        3 && (
                                        <Badge variant="secondary">
                                          +{project.technologies?.length - 3}{" "}
                                          more
                                        </Badge>
                                      )}
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onNavigate?.(
                                          routes.projectDetail(project.id),
                                        );
                                      }}
                                    >
                                      View Project
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Assessments */}
                    {getAssessments(milestone)?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4 text-purple-600" />
                          Assessments
                        </h4>
                        <div className="space-y-2">
                          {getAssessments(milestone)?.map((assessment: any) => (
                            <Card key={assessment.id}>
                              <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                  <div>
                                    <h5 className="font-medium">
                                      {assessment.title}
                                    </h5>
                                    <p className="text-sm text-muted-foreground">
                                      {assessment.description}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="capitalize"
                                    >
                                      {assessment.type}
                                    </Badge>
                                    <Badge variant="outline">
                                      {assessment?.timeLimit ?? 5} min
                                    </Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Skills You'll Master</CardTitle>
              <CardDescription>
                Comprehensive breakdown of technical and soft skills covered in
                this roadmap
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">
                      Technical Skills
                    </h3>
                    <div className="space-y-4">
                      {[
                        {
                          category: "Backend Development",
                          skills: [
                            "Node.js",
                            "Express",
                            "NestJS",
                            "API Design",
                            "Authentication",
                          ],
                          icon: Code as LucideIcon,
                          color: "text-blue-600",
                        },
                        {
                          category: "Databases",
                          skills: [
                            "SQL",
                            "NoSQL",
                            "Database Design",
                            "Query Optimization",
                            "Data Modeling",
                          ],
                          icon: Layers as LucideIcon,
                          color: "text-green-600",
                        },
                        {
                          category: "Architecture",
                          skills: [
                            "Microservices",
                            "System Design",
                            "Scalability",
                            "Performance",
                            "Security",
                          ],
                          icon: Target as LucideIcon,
                          color: "text-purple-600",
                        },
                      ].map((group) => (
                        <div key={group.category} className="space-y-2">
                          <h4 className="font-medium flex items-center gap-2">
                            <group.icon className={`h-4 w-4 ${group.color}`} />
                            {group.category}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {group.skills.map((skill) => (
                              <Badge key={skill} variant="secondary">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">
                      Soft Skills & Career
                    </h3>
                    <div className="space-y-4">
                      {[
                        {
                          category: "Leadership",
                          skills: [
                            "Technical Leadership",
                            "Mentoring",
                            "Code Reviews",
                            "Decision Making",
                          ],
                          icon: Users as LucideIcon,
                          color: "text-orange-600",
                        },
                        {
                          category: "Communication",
                          skills: [
                            "Technical Writing",
                            "Documentation",
                            "Presentations",
                            "Stakeholder Management",
                          ],
                          icon: FileText as LucideIcon,
                          color: "text-red-600",
                        },
                        {
                          category: "Career Development",
                          skills: [
                            "Interview Preparation",
                            "Resume Building",
                            "Networking",
                            "Negotiation",
                          ],
                          icon: GraduationCap as LucideIcon,
                          color: "text-indigo-600",
                        },
                      ].map((group) => (
                        <div key={group.category} className="space-y-2">
                          <h4 className="font-medium flex items-center gap-2">
                            <group.icon className={`h-4 w-4 ${group.color}`} />
                            {group.category}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {group.skills.map((skill) => (
                              <Badge key={skill} variant="secondary">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skill Progression</CardTitle>
              <CardDescription>
                How your skills will develop throughout the roadmap
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {milestones?.map((milestone: any, index) => (
                  <div key={milestone.id} className="space-y-2">
                    <h3 className="text-md font-medium flex items-center gap-2">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-white ${
                          milestone.completed ? "bg-green-600" : "bg-blue-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                      {milestone.title}
                    </h3>
                    <div className="pl-8">
                      <div className="flex flex-wrap gap-2">
                        {index === 0 && (
                          <>
                            <Badge variant="secondary">
                              Node.js Fundamentals
                            </Badge>
                            <Badge variant="secondary">Express</Badge>
                            <Badge variant="secondary">RESTful APIs</Badge>
                            <Badge variant="secondary">MongoDB</Badge>
                            <Badge variant="secondary">Authentication</Badge>
                          </>
                        )}
                        {index === 1 && (
                          <>
                            <Badge variant="secondary">Microservices</Badge>
                            <Badge variant="secondary">Docker</Badge>
                            <Badge variant="secondary">API Gateway</Badge>
                            <Badge variant="secondary">Message Queues</Badge>
                            <Badge variant="secondary">Service Discovery</Badge>
                          </>
                        )}
                        {index === 2 && (
                          <>
                            <Badge variant="secondary">System Design</Badge>
                            <Badge variant="secondary">Scalability</Badge>
                            <Badge variant="secondary">Load Balancing</Badge>
                            <Badge variant="secondary">
                              Caching Strategies
                            </Badge>
                            <Badge variant="secondary">Database Sharding</Badge>
                          </>
                        )}
                        {index === 3 && (
                          <>
                            <Badge variant="secondary">GraphQL</Badge>
                            <Badge variant="secondary">Kubernetes</Badge>
                            <Badge variant="secondary">Cloud Platforms</Badge>
                            <Badge variant="secondary">Serverless</Badge>
                            <Badge variant="secondary">
                              Performance Optimization
                            </Badge>
                          </>
                        )}
                        {index === 4 && (
                          <>
                            <Badge variant="secondary">
                              Technical Leadership
                            </Badge>
                            <Badge variant="secondary">Mentoring</Badge>
                            <Badge variant="secondary">
                              Architecture Design
                            </Badge>
                            <Badge variant="secondary">Team Management</Badge>
                            <Badge variant="secondary">
                              Technical Decision Making
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Reviews</CardTitle>
              <CardDescription>
                See what others are saying about this roadmap
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <DisqusCommentBlock
                config={{
                  url: "/roadmaps/" + slug,
                  identifier: slug,
                  title: roadmap?.title,
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificate" className="space-y-6">
          <Card>
            <CardHeader></CardHeader>
            <CardContent className="space-y-6">
              {roadmap?.progress != 100 ? (
                <div className="flex-1 space-y-6">
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-bold mb-4">
                      Certificate Not Available
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Complete the roadmap to earn your certificate.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 space-y-6">
                  <Certificate
                    courseName={roadmap.title}
                    type="Roadmap"
                    studentName={user?.name!}
                    instructorName={roadmap?.instructor ?? "Solomon Eseme"}
                    completionDate={"December 8, 2024"}
                    course={roadmap}
                    onDownload={handleDownload}
                    onShare={handleShare}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {showPaymentDialog && (
        <PaymentDialog
          onClose={() => setShowPaymentDialog(false)}
          open={showPaymentDialog}
          data={{ ...roadmap, plan: "Enterprise" }}
          onHandlePreview={() => {}}
          onHandlePurchase={() => {}}
        />
      )}
      {/* Confetti Celebration */}
      <ConfettiCelebration
        onComplete={() => setCelebration(false)}
        isVisible={celebration}
        duration={1500}
        celebrationType="enrollment"
        courseName={roadmap?.title!}
      />
    </div>
  );
}
