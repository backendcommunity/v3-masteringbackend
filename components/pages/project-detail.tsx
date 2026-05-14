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
import { Separator } from "@/components/ui/separator";
import {
  Play,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  Share,
  Lock,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  BadgeIcon as Certificate,
  Trophy,
  Crown,
  Download,
  Database,
  ChevronRight,
  Users,
  Settings,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { analytics } from "@/lib/analytics";
import { routes } from "@/lib/routes";
import DisqusCommentBlock from "../ui/comment";
import { PaymentDialog } from "../payment-dialog";
import { Chapter, Project } from "@/lib/data";
import { toast } from "sonner";
import ConfettiCelebration from "@/components/confetti-celebration";
import { useUser } from "@/hooks/use-user";
import { Loader } from "../ui/loader";
import { languages } from "@/lib/languages";
import { ScheduleWidget } from "@/components/schedule/ScheduleWidget";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import socket from "@/lib/socketIo";

interface ProjectDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export function ProjectDetailPage({
  slug,
  onNavigate,
}: ProjectDetailPageProps) {
  const store = useAppStore();
  const user = useUser();
  const [project, setProject] = useState<Project>();
  const [userProject, setUserProject] = useState<any>();
  const { updateProject } = store;
  const [loading, setLoading] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [celebration, setCelebration] = useState(false);
  const [language, setLanguage] = useState("");
  const [showProgress, setShowProgress] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [progressValue, setProgressValue] = useState(0);
  let count = 1;

  useEffect(() => {
    setLoading(true);
    async function findProject(slug: string) {
      const project = await store.getProject(slug);
      setProject(project);
      setUserProject(project?.userProject);
      setLoading(false);
      if (project) {
        analytics.track("project_viewed", {
          projectId: project.id,
          projectTitle: project.title,
          isStarted: !!project.userProject,
        });
      }
    }
    findProject(slug);
  }, [slug]);

  const isChapterCompleted = (chapterId: string) => {
    return userProject?.userChapters?.find(
      (ch: any) => ch.chapterId === chapterId,
    )?.isCompleted;
  };

  const handleChapterComplete = (chapterId: string) => {
    const projectTasks = project?.projectTasks.map((projectTask: any) =>
      projectTask.id === chapterId
        ? { ...projectTask, completed: true }
        : projectTask,
    );
    const completedCount = projectTasks?.filter(
      (c: any) => c.isCompleted,
    ).length;
    const newProgress = Math.round(
      (completedCount! / projectTasks?.length!) * 100,
    );

    updateProject(project?.id!, {
      projectTasks: projectTasks,
      progress: newProgress,
    });
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

  const handlePurchase = (
    projectId: string,
    method: "subscription" | "individual" | "mb",
    success: boolean,
  ) => {
    if (!project || !success) return;

    switch (method) {
      case "subscription":
        onNavigate(routes.subscriptionPlans);
        break;
      case "individual":
        // onNavigate(routes.checkout("project", projectId));
        break;
      case "mb":
        Object.assign(project!, { enrolled: true });
        // onNavigate(routes.xpRedeem("project", projectId));
        break;
    }

    setCelebration(true);
    toast.success("You have successfully enrolled");
  };

  const handleBackToProjects = () => {
    onNavigate(routes.projects);
  };

  const handleEnrollNow = async () => {
    try {
      analytics.track("project_start_clicked", {
        projectId: project?.id,
        projectTitle: project?.title,
        isPremium: !user?.isPremium,
      });
      if (!user?.isPremium) {
        setShowPaymentDialog(!showPaymentDialog);
        return;
      }
      console.log(slug);
      // add from here inside dialog
      const userProject = await handleEnrollment(slug);
      if (!userProject) {
        toast.error("An error occurred. Please try again");
        return;
      }
      updateProject(project?.id!, { enrolled: true });
      Object.assign(project!, { enrolled: true });

      // await handleProjectSetup(userProject); //TODO: Activate this to handle clone
    } catch (error: any) {
      const e = error?.response?.message ?? error?.message;
      toast.error(e ?? "An error occurred");
    }
  };

  const handleProjectSetup = async (userproject: any = null) => {
    // socket.emit("project:start", {
    //   userId: user.id,
    //   template: language,
    //   projectName: slug,
    //   installationId: user?.githubInstallationId,
    //   github: user?.github,
    // });

    // socket.on("clone:progress", (data) => {
    //   setShowProgress(true);
    //   setProgressText(data.message);
    //   setProgressValue(Math.min(Math.max(data.percent, 0), 100));
    // });

    // socket.on("project:error", (data) => {
    //   console.log(data);
    // });

    // socket.on("clone:done", (data) => {
    // Update userproject if cloned successfully
    await store.updateUserProject(userproject?.id! ?? userProject?.id, {
      cloned: true,
    });
    // setShowProgress(true);
    // setProgressText(data.message);
    // setProgressValue(100);

    setProject((prev) => ({
      ...prev!,
      userProject: {
        ...(prev?.userProject || {}),
        cloned: true,
      },
    }));

    setCelebration(true);
    toast.success("You have successfully enrolled");
    // });
  };

  const handleEnrollment = async (slug: string) => {
    return await store.handleProjectEnrollment(slug);
  };

  const handleContinueLearning = (slug: string) => {
    // const watchPath = routes.projectPlayground(slug);
    const watchPath = `/projects/${slug}/tasks`;
    onNavigate(watchPath);
  };

  const handleWatchPage = (video: string) => {
    return onNavigate(`/project30/${slug}/day/${video}`);
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

  const isCompleted = (id: string) =>
    []?.find((c: any) => c?.videoId === id && c?.completed);

  const completed = project?.progress! >= 100;
  const canEarnCertificate = project?.enrolled && completed;

  if (loading) return <Loader isLoader={false} />;
  return (
    <div className="flex-1 space-y-6">
      {/* Project Header */}
      <div className="flex justify-between items-center gap-4 mb-6">
        <Button variant="outline" onClick={handleBackToProjects}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => onNavigate(`/projects/${slug}/leaderboard`)}
            className="w-full sm:w-auto"
          >
            <Trophy className="mr-2 h-4 w-4" />
            Leaderboard
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2">
            <Badge
              className="capitalize"
              variant={
                project?.level === "Advanced"
                  ? "destructive"
                  : project?.level === "Intermediate"
                    ? "default"
                    : "secondary"
              }
            >
              {project?.level}
            </Badge>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 " />
              <span className="text-sm text-muted-foreground">
                {project?.students?.toLocaleString()} students
              </span>
            </div>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            {project?.title}
          </h1>

          {/* Short Description */}

          <article
            className="text-lg text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: project?.summary!,
            }}
          ></article>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {project?.duration} hours
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {project?.projectTasks?.length} Project Tasks
            </div>
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4" />
              Certificate included
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {project?.technologies?.map((tech) => (
              <Badge key={tech} variant="outline">
                {tech}
              </Badge>
            ))}
          </div>

          {/* Project Features Section */}
          <Card>
            <CardHeader></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
                <div className="space-y-2 col-span-2 w-full">
                  <CardTitle>Prerequisites</CardTitle>
                  {project?.prerequisites?.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 w-full">
                  <CardTitle>Skills</CardTitle>
                  {project?.skills?.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expandable Long Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Project Overview
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
                {project?.description
                  ?.split("\n\n")
                  .map((paragraph: string, index: number) => (
                    <article
                      dangerouslySetInnerHTML={{ __html: paragraph }}
                      key={index}
                      className="text-muted-foreground leading-relaxed [&>*>span]:!text-muted-foreground [&>*>table]:p-3 [&>*>table]:border [&>*>code]:rounded-xl [&>*>code]:bg-zinc-800 [&>*>code]:p-1 [&>*>code]:text-sm [&>*>code]:font-medium [&>*>code]:text-zinc-100 [&>*>code]:overflow-x-auto w-full [&>*>li>pre]:mt-5 [&>*>li>pre]:rounded-xl [&>*>li>pre]:bg-zinc-800 [&>*>li>pre]:p-4 [&>*>li>pre]:text-sm [&>*>li>pre]:font-medium [&>*>li>pre]:text-zinc-100 [&>*>li>pre]:overflow-x-auto [&>*>li>a]:text-amber-300 [&>p>a]:text-amber-300 mx-auto w-full text-zinc-700 dark:text-zinc-300 [&>pre]:overflow-x-auto [&>h2]:text-2xl [&>h2]:font-bold [&>h3]:text-xl [&>h3]:font-bold [&>p]:mt-2 [&>p]:leading-relaxed [&>pre]:mt-5 [&>pre]:rounded-xl [&>pre]:bg-zinc-800 [&>pre]:p-4 [&>pre]:text-sm [&>pre]:font-medium [&>pre]:text-zinc-100 [&>ul]:mt-5 [&>ul]:flex [&>ul]:list-disc [&>ul]:flex-col [&>ul]:gap-2 [&>ul]:pl-6 [&>ol]:mt-5 [&>ol]:flex [&>ol]:list-decimal [&>ol]:flex-col [&>ol]:gap-2 [&>ol]:pl-6"
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
        </div>

        <div className="space-y-6">
          {/* Project Enrollment Card */}
          <Card>
            <CardHeader>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={project?.banner ?? "/placeholder.svg"}
                  alt={project?.title}
                  className="h-full w-full object-cover"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {project?.enrolled ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Your Progress</span>
                    <span>{Math.floor(project?.progress ?? 0)}%</span>
                  </div>
                  <Progress value={project?.progress ?? 0} className="h-2" />

                  {/* {!userProject?.cloned && (
                    <div className="pt-3">
                      <Label>Choose your preferred language</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          {languages
                            .filter((l) => l.supported)
                            .map((l) => (
                              <SelectItem key={l.code} value={l.code}>
                                {l.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {!language && (
                        <p className="text-red-700 italic text-xs">
                          This field is required
                        </p>
                      )}
                    </div>
                  )} */}
                  <Button
                    // disabled={!language && !userProject?.cloned}
                    className="w-full"
                    onClick={() => {
                      if (project?.enrolled)
                        // userProject.cloned
                        return handleContinueLearning(project.slug);
                      return handleProjectSetup();
                    }}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Continue Building
                  </Button>
                </div>
              ) : user?.isPremium ? (
                <div className="space-y-3">
                  {/* <div className="pt-3">
                    <Label>Choose your preferred language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages
                          .filter((l) => l.supported)
                          .map((l) => (
                            <SelectItem key={l.code} value={l.code}>
                              {l.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {!language && (
                      <p className="text-red-700 italic text-xs">
                        This field is required
                      </p>
                    )}
                  </div> */}
                  <Button
                    // disabled={!language}
                    className="w-full"
                    onClick={handleEnrollNow}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Building
                  </Button>
                  {/* <Button
                    variant="outline"
                    className="w-full"
                    onClick={handlePreviewProject}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Preview Project
                  </Button> */}
                </div>
              ) : (
                <div className="space-y-3">
                  {project?.isPremium && (
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-800 border-green-200 text-xs"
                    >
                      <Crown className="mr-1 h-3 w-3" />
                      Included in Pro
                    </Badge>
                  )}
                  <Button className="w-full" onClick={handleEnrollNow}>
                    Start Building
                  </Button>
                  {/*  */}
                </div>
              )}
              {showPaymentDialog && (
                <PaymentDialog
                  disableMB={true}
                  disableOnetime={true}
                  onClose={() => setShowPaymentDialog(false)}
                  open={showPaymentDialog}
                  data={{ ...project, type: "project" }}
                  onHandlePreview={() => {}}
                  onHandlePurchase={(id: string, type: any, success: boolean) =>
                    handlePurchase(id, type, success)
                  }
                />
              )}

              <Separator />

              <div className="flex gap-2">
                {project?.PRDLink && (
                  <a href={project?.PRDLink} target="_blank">
                    <Button variant="link" size="sm" className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      Download PRD
                    </Button>
                  </a>
                )}
                {project?.frontendURL && (
                  <a href={project?.frontendURL} target="_blank">
                    <Button variant="link" size="sm" className="flex-1">
                      <Share className="mr-2 h-4 w-4" />
                      Preview Frontend
                    </Button>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          {project?.enrolled && userProject?.id && (
            <ScheduleWidget projectId={userProject.id} />
          )}

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
                  <CardTitle className="text-lg">Project Certificate</CardTitle>
                  <CardDescription className="text-sm">
                    {canEarnCertificate
                      ? "Ready to claim!"
                      : "Complete project to earn"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {canEarnCertificate
                    ? "Congratulations! You've completed the project and earned your certificate."
                    : "Complete all chapters and pass the final assessment to earn your verified certificate."}
                </p>

                {project?.enrolled && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress to Certificate</span>
                      <span>{Math.floor(project?.progress)}%</span>
                    </div>
                    <Progress value={project?.progress} className="h-2" />
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
                  onClick={() => onNavigate("/projects")}
                >
                  <Certificate className="mr-2 h-4 w-4" />
                  View Certificate
                </Button>
              ) : project?.enrolled ? (
                <Button variant="outline" className="w-full" disabled>
                  <Certificate className="mr-2 h-4 w-4" />
                  Complete Project to Earn
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleEnrollNow}
                >
                  <Certificate className="mr-2 h-4 w-4" />
                  Enroll to Earn Certificate
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Project Content */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Project Tasks</TabsTrigger>
          <TabsTrigger value="instructor">Instructor</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="">Project Tasks</CardTitle>
              <CardDescription className="text-sm">
                Here's the complete project and task break down for this
                project.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {project?.projectTasks?.map((projectTask: any, i: number) => (
                  <AccordionItem key={projectTask.id} value={`week-${i + 1}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full mr-4">
                        <div className="text-left">
                          <h3 className="font-semibold">
                            {projectTask?.title}
                          </h3>

                          <article
                            dangerouslySetInnerHTML={{
                              __html: projectTask?.summary,
                            }}
                            className="text-xs text-muted-foreground [&>*>span]:!text-muted-foreground"
                          ></article>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={"outline"}
                            className={`text-xs ${
                              !projectTask.isPremium
                                ? "border-green-600 text-green-600"
                                : "border-orange-600 text-orange-600"
                            }`}
                          >
                            {projectTask?.isPremium ? "Premium" : "Free"}
                          </Badge>

                          <Badge variant="outline" className="text-xs">
                            {projectTask.tasks?.length} Task{""}
                            {projectTask.tasks?.length > 1 ? "s" : ""}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {projectTask.tasks.reduce(
                              (a: number, c: any) => (c?.mb ?? 0) + a,
                              0,
                            )}{" "}
                            MB
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent>
                      <div className="space-y-3 pt-4">
                        {projectTask?.tasks?.map((task: any) => {
                          const current = count++;
                          return (
                            <div
                              key={task.id}
                              className={`flex items-center space-x-4 rounded-lg border p-4 transition-colors ${
                                project?.enrolled
                                  ? isCompleted(task.id)
                                    ? "hover:bg-muted/50"
                                    : "hover:bg-muted/50" //border-primary/40
                                  : "opacity-60"
                              }`}
                              onClick={() => {
                                if (!user?.isPremium && !project?.enrolled) {
                                  setShowPaymentDialog(true);
                                }
                              }}
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                {getStatusIcon(
                                  isCompleted(task.id)
                                    ? "completed"
                                    : task.id
                                      ? "in-progress"
                                      : "locked",
                                )}
                              </div>
                              <div className="flex-1 space-y-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs md:text-sm font-medium text-muted-foreground">
                                    Task {current}
                                  </span>

                                  <Badge variant="outline" className="text-xs">
                                    {task?.mb ?? 0} MB
                                  </Badge>
                                </div>
                                <h4 className="font-medium text-sm md:text-base">
                                  {task.title}
                                </h4>
                                <article
                                  dangerouslySetInnerHTML={{
                                    __html: task?.summary,
                                  }}
                                  className="text-xs text-muted-foreground"
                                ></article>
                                <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-muted-foreground">
                                  {task?.technologies?.length && (
                                    <div className="flex items-center gap-1">
                                      <Database className="h-4 w-4" />
                                      <span>
                                        {task?.technologies?.join(", ")}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {project?.enrolled && isCompleted(task.id) ? (
                                <ChevronRight className="h-4 w-4 flex-shrink-0" />
                              ) : project.enrolled ? (
                                <Play className="h-4 w-4 flex-shrink-0 text-primary" />
                              ) : (
                                <Lock className="h-4 w-4 text-gray-400" />
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

        <TabsContent value="instructor">
          <Card>
            <CardHeader>
              <CardTitle>About the Instructor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  {project?.instructor
                    ?.split(" ")
                    .map((n: string) => n.charAt(0))
                    .join("") ?? "MB"}
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    {project?.instructor ?? "Mastering Backend"}
                  </h3>
                  {/* <p className="text-muted-foreground">
                    Senior Backend Engineer with 8+ years of experience building
                    scalable systems. Previously worked at Google and Netflix.
                  </p> */}
                  {/* <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>15 projects</span>
                    <span>50k+ students</span>
                    <span>4.9 rating</span>
                  </div> */}
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
                    url: "/projects/" + slug,
                    identifier: slug,
                    title: project?.title,
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
        courseName={project?.title!}
      />

      <Dialog open={showProgress} onOpenChange={setShowProgress}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#F2C94C]" />
              Setting up Project...
            </DialogTitle>
            <DialogDescription>
              Relax while Kap set up your project playground
            </DialogDescription>
          </DialogHeader>
          <div className="pt-6">
            <p className="capitalize pb-1 italic text-sm">{progressText}...</p>
            <Progress value={progressValue} />
          </div>

          {progressValue >= 100 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleContinueLearning(slug)}
            >
              <Play className="mr-2 h-4 w-4" />
              Goto Playground
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
