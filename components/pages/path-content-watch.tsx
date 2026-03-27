"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Play,
  SkipBack,
  SkipForward,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader } from "../ui/loader";
import { Roadmap } from "@/lib/data";
import { routes } from "@/lib/routes";
import { useAppStore } from "@/lib/store";
import {
  getCourseRouteParam,
  getCurrentTopic,
  getPathProgress,
  getPathTopics,
  getRoadmapKey,
  getPrimaryCourse,
  stripHtml,
} from "./path-flow-utils";

interface PathContentWatchPageProps {
  pathId: string;
  stepId: string;
  onNavigate?: (route: string) => void;
}

export function PathContentWatchPage({
  pathId,
  stepId,
  onNavigate,
}: PathContentWatchPageProps) {
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
        console.error("Failed to load path watch content:", error);
        setPath(null);
      } finally {
        setLoading(false);
      }
    };

    loadPath();
  }, [pathId, store]);

  const topics = useMemo(() => getPathTopics(path), [path]);
  const fallbackTopic = useMemo(() => getCurrentTopic(path, topics), [path, topics]);
  const selectedTopic = useMemo(() => {
    const topicById = topics.find(
      (topic) =>
        topic.id === stepId ||
        (typeof topic.raw?.slug === "string" && topic.raw.slug === stepId),
    );
    return topicById || fallbackTopic;
  }, [fallbackTopic, stepId, topics]);

  const selectedIndex = useMemo(() => {
    if (!selectedTopic) return -1;
    return topics.findIndex((topic) => topic.id === selectedTopic.id);
  }, [selectedTopic, topics]);

  const previousTopic = selectedIndex > 0 ? topics[selectedIndex - 1] : null;
  const nextTopic =
    selectedIndex >= 0 && selectedIndex < topics.length - 1
      ? topics[selectedIndex + 1]
      : null;
  const selectedCourses = selectedTopic?.courses || [];
  const primaryCourse = getPrimaryCourse(selectedTopic);
  const pathKey = getRoadmapKey(path || {});
  const progress = getPathProgress(path);

  if (loading) return <Loader isLoader={true} />;

  if (!path) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Learning path not found</h1>
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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => onNavigate?.(routes.pathContinue(pathKey || path.id))}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {selectedTopic?.title || "Module content"}
            </h1>
            <p className="text-slate-300">{path.title}</p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit border-slate-600 text-slate-200">
          Module {Math.max(selectedIndex + 1, 1)} of {Math.max(topics.length, 1)}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="border border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-white">Module Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-300">
                {stripHtml(selectedTopic?.description || selectedTopic?.summary) ||
                  "No module description is available."}
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Module progress</span>
                  <span>{selectedTopic?.progress ?? 0}%</span>
                </div>
                <Progress value={selectedTopic?.progress ?? 0} className="h-2" />
              </div>
              <Button
                onClick={() => {
                  const routeParam = getCourseRouteParam(primaryCourse);
                  if (routeParam) {
                    onNavigate?.(routes.courseDetail(routeParam));
                  }
                }}
                disabled={!primaryCourse}
              >
                <Play className="mr-2 h-4 w-4" />
                Watch Content in Courses
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-white">
                Course Content ({selectedCourses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!selectedCourses.length ? (
                <p className="text-sm text-slate-300">
                  No courses have been assigned to this module yet.
                </p>
              ) : (
                selectedCourses.map((course, index) => {
                  const routeParam = getCourseRouteParam(course);
                  return (
                    <div
                      key={course.id}
                      className="rounded-lg border border-slate-700 bg-slate-800/60 p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white">
                            {index + 1}. {course.title}
                          </p>
                          <p className="line-clamp-2 text-sm text-slate-300">
                            {stripHtml(course.summary || course.description) ||
                              "No course summary available."}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {course.type && (
                            <Badge
                              variant="outline"
                              className="border-slate-600 text-slate-200"
                            >
                              {course.type}
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            onClick={() =>
                              routeParam && onNavigate?.(routes.courseDetail(routeParam))
                            }
                            disabled={!routeParam}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Watch
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-lg text-white">Path Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Overall completion</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="text-xs text-slate-300">
                {topics.filter((topic) => topic.completed).length} of {topics.length} modules
                completed
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-lg text-white">Modules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topics.map((topic, index) => {
                const isSelected = selectedTopic?.id === topic.id;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    className={`w-full rounded-lg border p-2 text-left transition-colors ${
                      isSelected
                        ? "border-cyan-500 bg-slate-800"
                        : "border-slate-700 bg-slate-900 hover:bg-slate-800/60"
                    }`}
                    onClick={() =>
                      pathKey && onNavigate?.(routes.pathContentWatch(pathKey, topic.id))
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-xs text-slate-200">
                        {topic.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-sm font-medium text-white">
                          {topic.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <Clock className="h-3 w-3" />
                          <span>{topic.progress}%</span>
                          <BookOpen className="h-3 w-3" />
                          <span>{topic.courses.length}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() =>
                previousTopic &&
                pathKey &&
                onNavigate?.(routes.pathContentWatch(pathKey, previousTopic.id))
              }
              disabled={!previousTopic}
            >
              <SkipBack className="mr-2 h-4 w-4" />
              Previous Module
            </Button>
            <Button
              className="w-full justify-start"
              onClick={() =>
                nextTopic &&
                pathKey &&
                onNavigate?.(routes.pathContentWatch(pathKey, nextTopic.id))
              }
              disabled={!nextTopic}
            >
              Next Module
              <SkipForward className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => {
                const routeParam = getCourseRouteParam(primaryCourse);
                if (routeParam) {
                  onNavigate?.(routes.courseDetail(routeParam));
                }
              }}
              disabled={!primaryCourse}
            >
              <Target className="mr-2 h-4 w-4" />
              Open Current Course
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
