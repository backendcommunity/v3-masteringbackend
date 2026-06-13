"use client";

import { useEffect, useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  SkipForward,
  CheckCircle2,
  Download,
  Share,
  FileText,
  Crown,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Project } from "@/lib/data";
import ConfettiCelebration from "../confetti-celebration";
import { handleShare } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Loader } from "../ui/loader";
import { toast } from "sonner";

interface ProjectTaskDetail {
  slug: string;
  id: string;
  onNavigate?: (route: string) => void;
}

export function ProjectTaskDetail({ slug, id, onNavigate }: ProjectTaskDetail) {
  const store = useAppStore();
  const [project, setProject] = useState<Project>();
  const [task, setTask] = useState<any>(null);
  const [userTasks, setUserTasks] = useState<any>([]);
  const [currentProjectTask, setCurrentProjectTask] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [celebration, setCelebration] = useState(false);
  const path = usePathname();
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const project = await store.getProject(slug);
      if (!cancelled) {
        setProject(project);
        setCurrentProjectTask(project.projectTasks[0]);
        setTask(project.projectTasks?.[0]?.tasks?.[0]);
        setUserTasks(project?.userProject?.userTasks);
        setLoading(false);
      }
    };
    load();

    return () => {
      cancelled = true;
    };
  }, [slug, id, store]);

  if (loading) return <Loader isLoader={false} />;
  if (!project?.enrolled)
    return (
      <div className="container max-w-4xl py-12">
        <Card>
          <CardHeader>
            <CardTitle>Not enrolled</CardTitle>
            <CardDescription>
              You need to enroll to access the playground.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => onNavigate?.(`/projects/${slug}`)}>
              View Project
            </Button>
          </CardFooter>
        </Card>
      </div>
    );

  const isTaskCompleted = (task: string) => {
    return userTasks?.find((userTask: any) => userTask?.taskId === task)
      ?.isCompleted;
  };

  const isProjectTaskCompleted = (tasks: any[]) => {
    return tasks?.every((task) => {
      const userTask = userTasks.find((u: any) => u?.taskId === task.id);
      return userTask?.isCompleted === true;
    });
  };

  const handleMarkAsCompleted = async (id: string) => {
    try {
      setMarking(true);

      setUserTasks((prev: any) => {
        if (!prev) return prev;

        const exists = prev.some((u: any) => u.taskId === id);

        // If it exists, update it
        if (exists) {
          return prev.map((userTask: any) =>
            userTask.taskId === id
              ? {
                  ...userTask,
                  isCompleted: true,
                }
              : userTask,
          );
        }

        return [
          ...prev,
          {
            taskId: id,
            isCompleted: true,
          },
        ];
      });

      const completed = await store.markProjectTaskAsCompleted(slug, id);
      setProject((prev) => {
        if (!prev) return prev;

        const updatedProjectTasks = prev.projectTasks.map(
          (projectTask: any) => {
            const updatedTasks = projectTask.tasks.map((task: any) => {
              if (task?.id === completed.taskId) {
                return {
                  ...task,
                  userTask: {
                    ...task.userTask,
                    isCompleted: completed.isCompleted,
                  },
                };
              }
              return task;
            });

            return {
              ...projectTask,
              tasks: updatedTasks,
            };
          },
        );

        return {
          ...prev,
          projectTasks: updatedProjectTasks,
        };
      });

      setCelebration(true);
      toast.success("Task completed successfully");
    } catch (error) {
      toast.error("An error occurred. Please try again");
    } finally {
      setMarking(false);
    }
  };

  const markProjectAsCompleted = async () => {
    try {
      setMarking(true);
      await store.updateUserProject(slug, { completed: true });
      setCelebration(true);
      toast.success("Project completed successfully");

      // TODO: Show a nice pop up that encourages sharing on socials
    } catch (error: any) {
      toast.error(error?.message);
    } finally {
      setMarking(false);
    }
  };

  const next = () => {
    return currentProjectTask?.tasks?.find((t: any, index: number) => {
      const currentIndex = currentProjectTask?.tasks?.findIndex(
        (_task: any) => _task.id === task?.id,
      );
      return index === currentIndex + 1;
    });
  };

  const progress = () => {
    return Math.floor((userTasks.length / project?.totalTasks) * 100);
  };

  const nextTask = next();

  const nextProjectTask =
    project?.projectTasks[
      project?.projectTasks?.findIndex(
        (ch: any) => ch.id === currentProjectTask?.id,
      ) + 1
    ];

  const projectTasks = project?.projectTasks;
  const tasks = currentProjectTask
    ? currentProjectTask?.tasks
    : project?.projectTasks[0]?.tasks;

  return (
    <div className="flex-1 space-y-6">
      {/* Back link */}
      <button
        onClick={() => onNavigate?.(`/projects/${slug}`)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to project
      </button>

      {/* Blueprint detail hero — navy anchor; the grid lives here only */}
      <div className="overflow-hidden rounded-2xl dark:ring-1 dark:ring-white/10">
        <div className="bg-[#0E1F33] dark:bg-[#080F1A] text-white relative">
          <div className="hero-grid absolute inset-0" aria-hidden="true" />
          <div className="relative px-5 py-6 sm:px-8 sm:py-7">
            <div className="eyebrow-mono text-white/[.55]">project task</div>
            <h1 className="text-3xl font-bold mt-1.5">{task?.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 mt-4 text-sm text-white/[.78]">
              {currentProjectTask?.title && (
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="w-4 h-4 opacity-70" />
                  {currentProjectTask?.title}
                </span>
              )}
              {task && isTaskCompleted(task.id) && (
                <span className="inline-flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" /> Completed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Completion strip — project task progress */}
        {(project?.totalTasks ?? 0) > 0 && (
          <div className="text-white px-5 sm:px-8 py-4 bg-[#0A1726] dark:bg-[#05080F]">
            <div className="eyebrow-mono text-white/[.5] mb-2">
              project progress
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full overflow-hidden bg-white/[.12]">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.floor(
                      ((userTasks?.length ?? 0) / (project?.totalTasks || 1)) *
                        100,
                    )}%`,
                  }}
                />
              </div>
              <span className="text-sm font-semibold">
                {Math.floor(
                  ((userTasks?.length ?? 0) / (project?.totalTasks || 1)) * 100,
                )}
                %
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 flex flex-col">
          <Card className="rounded-2xl border-border">
            <CardContent className="pt-6">
              <div className="eyebrow-mono text-muted-foreground mb-3">
                task brief
              </div>
              <article
                className="text-muted-foreground leading-relaxed [&>*>table]:p-3 [&>*>table]:border [&>*>code]:rounded-xl [&>*>code]:bg-zinc-800 [&>*>code]:p-1 [&>*>code]:text-sm [&>*>code]:font-medium [&>*>code]:text-zinc-100 [&>*>code]:overflow-x-auto w-full [&>*>li>pre]:mt-5 [&>*>li>pre]:rounded-xl [&>*>li>pre]:bg-zinc-800 [&>*>li>pre]:p-4 [&>*>li>pre]:text-sm [&>*>li>pre]:font-medium [&>*>li>pre]:text-zinc-100 [&>*>li>pre]:overflow-x-auto [&>*>li>a]:text-amber-300 [&>p>a]:text-amber-300 mx-auto w-full text-zinc-700 dark:text-zinc-300 [&>pre]:overflow-x-auto [&>h2]:text-2xl [&>h2]:font-bold [&>h3]:text-xl [&>h3]:font-bold [&>p]:mt-2 [&>p]:leading-relaxed [&>pre]:mt-5 [&>pre]:rounded-xl [&>pre]:bg-zinc-800 [&>pre]:p-4 [&>pre]:text-sm [&>pre]:font-medium [&>pre]:text-zinc-100 [&>ul]:mt-5 [&>ul]:flex [&>ul]:list-disc [&>ul]:flex-col [&>ul]:gap-2 [&>ul]:pl-6 [&>ol]:mt-5 [&>ol]:flex [&>ol]:list-decimal [&>ol]:flex-col [&>ol]:gap-2 [&>ol]:pl-6 [&>*>span]:!text-black [&>p]:text-black dark:[&>*>span]:!text-muted-foreground dark:[&>p]:text-muted-foreground"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(task?.description),
                }}
              ></article>
            </CardContent>
          </Card>
          {/* Video Actions */}
          <div className="flex items-center md:flex-row flex-col gap-3 md:gap-1 justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleShare(task?.title!, path!)}
                variant="outline"
                size="sm"
              >
                <Share className="mr-2 h-4 w-4" />
                Share
              </Button>
              {project?.PRDLink && (
                <Button
                  onClick={() =>
                    window.open(
                      project?.PRDLink,
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                  variant="outline"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PRD
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {task && (
                <>
                  {!isTaskCompleted(task.id) && (
                    <Button
                      disabled={marking}
                      onClick={() => handleMarkAsCompleted(task.id)}
                    >
                      {marking ? (
                        "Marking..."
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Mark Complete
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}

              {nextTask && (
                <Button
                  onClick={() => setTask(nextTask)}
                  className="capitalize"
                >
                  Next
                  <SkipForward className="ml-2 h-4 w-4" />
                </Button>
              )}

              {!nextTask && nextProjectTask && (
                <Button
                  onClick={() => {
                    setCurrentProjectTask(nextProjectTask);
                    setTask(nextProjectTask.tasks[0]);
                  }}
                >
                  Next Project Task
                  <SkipForward className="ml-2 h-4 w-4" />
                </Button>
              )}

              {!nextTask && !nextProjectTask && (
                <Button
                  disabled={marking}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => markProjectAsCompleted()}
                >
                  {marking ? (
                    "Rewarding..."
                  ) : (
                    <>
                      <Crown className="mr-2 h-4 w-4" />
                      Earn Your Rewards
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Progress */}
          <Card className="rounded-2xl border-border">
            <CardHeader>
              <div className="eyebrow-mono text-muted-foreground mb-1">
                progress
              </div>
              <CardTitle className="text-base">Project progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall</span>
                  <span className="font-semibold">
                    {Math.floor(progress() ?? 0)}%
                  </span>
                </div>
                <Progress value={progress() ?? 0} className="h-2" />
              </div>
              <div className="text-sm text-muted-foreground">
                {userTasks.length} of {project?.totalTasks} tasks completed
              </div>
            </CardContent>
          </Card>

          {/* Tasks in this section */}
          <Card className="rounded-2xl border-border">
            <CardHeader>
              <div className="eyebrow-mono text-muted-foreground mb-1">
                this section
              </div>
              <CardTitle className="text-base">Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {tasks?.map((_task: any) => (
                <div
                  key={_task.id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                    _task.id === task?.id
                      ? "bg-primary/[.06] border border-primary/30"
                      : "border border-transparent hover:bg-muted"
                  }`}
                  onClick={() => setTask(_task)}
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                      isTaskCompleted(_task.id)
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isTaskCompleted(_task.id) ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <FileText className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {_task.title}
                    </p>
                    {_task?.type && (
                      <span className="inline-block mt-0.5 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground capitalize">
                        {_task?.type}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border">
            <CardHeader>
              <div className="eyebrow-mono text-muted-foreground mb-1">
                all sections
              </div>
              <CardTitle className="text-base">Project tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {projectTasks?.map((pTask: any) => (
                <div
                  key={pTask.id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                    pTask.id === currentProjectTask?.id
                      ? "bg-primary/[.06] border border-primary/30"
                      : "border border-transparent hover:bg-muted"
                  }`}
                  onClick={() => setCurrentProjectTask(pTask)}
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                      isProjectTaskCompleted(pTask.tasks)
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isProjectTaskCompleted(pTask.tasks) ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <FileText className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{pTask.title}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
      <ConfettiCelebration
        onComplete={() => setCelebration(false)}
        isVisible={celebration}
        celebrationType="enrollment"
        courseName={task?.title!}
        duration={2000}
      />
    </div>
  );
}
