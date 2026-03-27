"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Play,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader } from "../ui/loader";
import { Roadmap } from "@/lib/data";
import { routes } from "@/lib/routes";
import { useAppStore } from "@/lib/store";
import {
  getCourseRouteParam,
  getCurrentTopic,
  getPathDuration,
  getPathProgress,
  getPathSubtitle,
  getPathTopics,
  getPrimaryCourse,
  stripHtml,
} from "./path-flow-utils";

interface LearningPathDetailPageProps {
  pathId: string;
  onNavigate?: (route: string) => void;
}

export function LearningPathDetailPage({
  pathId,
  onNavigate,
}: LearningPathDetailPageProps) {
  const store = useAppStore();
  const [path, setPath] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPath = async () => {
      setLoading(true);
      try {
        let roadmap = await store.getRoadmapBySlug(pathId);
        if (!roadmap) {
          const allRoadmaps = await store.getRoadmaps({ size: 20, skip: 0 });
          roadmap = Array.isArray(allRoadmaps)
            ? allRoadmaps.find((item: any) => item.slug === pathId || item.id === pathId)
            : null;
        }
        setPath(roadmap || null);
      } catch (error) {
        console.error("Failed to load learning path detail:", error);
        setPath(null);
      } finally {
        setLoading(false);
      }
    };

    loadPath();
  }, [pathId, store]);

  const topics = useMemo(() => getPathTopics(path), [path]);
  const currentTopic = useMemo(() => getCurrentTopic(path, topics), [path, topics]);
  const currentCourse = useMemo(() => getPrimaryCourse(currentTopic), [currentTopic]);

  const courseCount = useMemo(
    () => topics.reduce((count, topic) => count + topic.courses.length, 0),
    [topics],
  );
  const progress = getPathProgress(path);
  const level =
    path?.level ||
    (typeof (path as any)?.difficulty === "string"
      ? (path as any).difficulty
      : "Beginner");

  if (loading) return <Loader isLoader={true} />;

  if (!path) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Learning Path not found</h1>
          <Button onClick={() => onNavigate?.(routes.paths)} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Learning Paths
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 text-slate-100">
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
        {(path as any).banner && (
          <div className="absolute inset-0">
            <img
              src={(path as any).banner}
              alt={path.title}
              className="h-full w-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-900/50" />
          </div>
        )}

        <div className="relative z-10 p-6 md:p-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate?.(routes.paths)}
            className="mb-4 pl-0 text-slate-300 hover:bg-transparent hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Paths
          </Button>

          <h1 className="mb-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            {path.title}
          </h1>
          <p className="max-w-3xl text-slate-200">{getPathSubtitle(path)}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{level}</Badge>
            <Badge variant="outline" className="border-slate-600 text-slate-200">
              <Clock className="mr-1 h-3.5 w-3.5" />
              {getPathDuration(path)}
            </Badge>
            <Badge variant="outline" className="border-slate-600 text-slate-200">
              {topics.length} modules
            </Badge>
            <Badge variant="outline" className="border-slate-600 text-slate-200">
              {courseCount} courses
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {path.enrolled && (
            <Card className="border border-slate-800 bg-slate-900 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-cyan-300" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Overall completion</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2.5" />
                {currentTopic && (
                  <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-300">
                      Current module
                    </p>
                    <p className="font-medium text-white">{currentTopic.title}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
              <TabsTrigger value="skills">Skills & Prerequisites</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card className="border border-slate-800 bg-slate-900 text-white">
                <CardHeader>
                  <CardTitle>Path Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <article
                    className="prose prose-invert max-w-none text-slate-200 prose-headings:text-white prose-p:text-slate-200 prose-li:text-slate-300 [&_*]:break-words"
                    dangerouslySetInnerHTML={{
                      __html:
                        path.description ||
                        path.summary ||
                        "<p>No detailed description available yet.</p>",
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="curriculum" className="space-y-4">
              {!topics.length ? (
                <Card className="border border-slate-800 bg-slate-900 text-white">
                  <CardContent className="py-8 text-center text-slate-300">
                    No curriculum has been published for this path yet.
                  </CardContent>
                </Card>
              ) : (
                topics.map((topic, index) => {
                  const isCurrent = currentTopic?.id === topic.id;
                  const status = topic.completed
                    ? "Completed"
                    : isCurrent || topic.progress > 0
                    ? "In progress"
                    : "Upcoming";

                  return (
                    <Card
                      key={topic.id}
                      className="border border-slate-800 bg-slate-900 text-white"
                    >
                      <CardHeader className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold">
                              {index + 1}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{topic.title}</CardTitle>
                              <p className="text-sm text-slate-300">
                                {stripHtml(topic.description || topic.summary) ||
                                  "No module summary available."}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={topic.completed ? "default" : "outline"}
                            className={
                              topic.completed
                                ? "bg-emerald-600 text-white"
                                : isCurrent || topic.progress > 0
                                ? "border-cyan-400 text-cyan-300"
                                : "border-slate-600 text-slate-300"
                            }
                          >
                            {status}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-slate-300">
                            <span>Module progress</span>
                            <span>{topic.progress}%</span>
                          </div>
                          <Progress value={topic.progress} className="h-1.5" />
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {!topic.courses.length ? (
                          <p className="text-sm text-slate-400">
                            No courses assigned to this module yet.
                          </p>
                        ) : (
                          topic.courses.map((course) => {
                            const courseRouteParam = getCourseRouteParam(course);
                            return (
                              <div
                                key={course.id}
                                className="rounded-lg border border-slate-700 bg-slate-800/70 p-3"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-white">{course.title}</p>
                                    <p className="mt-1 line-clamp-2 text-sm text-slate-300">
                                      {stripHtml(course.summary || course.description) ||
                                        "No course summary available."}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-300">
                                      {course.type && (
                                        <Badge
                                          variant="outline"
                                          className="border-slate-600 text-slate-200"
                                        >
                                          {course.type}
                                        </Badge>
                                      )}
                                      <span>
                                        {Array.isArray(course.chapters)
                                          ? `${course.chapters.length} chapters`
                                          : "Course content"}
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      courseRouteParam &&
                                      onNavigate?.(routes.courseDetail(courseRouteParam))
                                    }
                                  >
                                    <Play className="mr-2 h-4 w-4" />
                                    Watch Content
                                  </Button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="skills" className="space-y-4">
              <Card className="border border-slate-800 bg-slate-900 text-white">
                <CardHeader>
                  <CardTitle>Skills You Will Build</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {(path.skills || []).length ? (
                    (path.skills || []).map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="border-slate-600 text-slate-200"
                      >
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-slate-300">No skills listed yet.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-slate-800 bg-slate-900 text-white">
                <CardHeader>
                  <CardTitle>Prerequisites</CardTitle>
                </CardHeader>
                <CardContent>
                  {(path.prerequisites || []).length ? (
                    <ul className="space-y-2 text-sm text-slate-300">
                      {(path.prerequisites || []).map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-300" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-300">No prerequisites listed.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="border border-slate-800 bg-slate-900 text-white">
            <CardHeader>
              <CardTitle className="text-lg">Path Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {path.enrolled ? (
                <>
                  <Badge className="w-full justify-center bg-emerald-600 text-white">
                    Enrolled - {progress}% complete
                  </Badge>
                  <Button
                    className="w-full"
                    onClick={() =>
                      onNavigate?.(routes.pathContinue(path.slug || path.id))
                    }
                  >
                    Continue Path
                  </Button>
                </>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => {
                    const waitingLink = (path as any).waitingLink;
                    if (typeof waitingLink === "string" && waitingLink) {
                      window.open(waitingLink, "_blank", "noopener,noreferrer");
                    }
                  }}
                >
                  {(path as any).isPremium ? "View Enrollment Options" : "Start Learning"}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-800 bg-slate-900 text-white">
            <CardHeader>
              <CardTitle className="text-lg">At a Glance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Modules</span>
                <span>{topics.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Courses</span>
                <span>{courseCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Duration</span>
                <span>{getPathDuration(path)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Progress</span>
                <span>{progress}%</span>
              </div>
            </CardContent>
          </Card>

          {currentCourse && (
            <Card className="border border-slate-800 bg-slate-900 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Watch Next</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-medium">{currentCourse.title}</p>
                <p className="line-clamp-3 text-sm text-slate-300">
                  {stripHtml(currentCourse.summary || currentCourse.description) ||
                    "Continue this course from your current module."}
                </p>
                <Button
                  className="w-full"
                  onClick={() =>
                    onNavigate?.(routes.courseDetail(getCourseRouteParam(currentCourse)))
                  }
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Watch Content
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
