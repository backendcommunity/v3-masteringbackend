"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Lock,
  Play,
  Target,
  Trophy,
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
  getPathDuration,
  getPathProgress,
  getPathTopics,
  getPrimaryCourse,
  stripHtml,
} from "./path-flow-utils";

interface LearningPathContinuePageProps {
  pathId: string;
  onNavigate?: (route: string) => void;
}

export function LearningPathContinuePage({
  pathId,
  onNavigate,
}: LearningPathContinuePageProps) {
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
        console.error("Failed to load learning path progress:", error);
        setPath(null);
      } finally {
        setLoading(false);
      }
    };

    loadPath();
  }, [pathId, store]);

  const topics = useMemo(() => getPathTopics(path), [path]);
  const currentTopic = useMemo(() => getCurrentTopic(path, topics), [path, topics]);
  const currentTopicIndex = useMemo(() => {
    if (!currentTopic) return -1;
    return topics.findIndex((topic) => topic.id === currentTopic.id);
  }, [currentTopic, topics]);
  const nextTopic =
    currentTopicIndex >= 0 ? topics[currentTopicIndex + 1] || null : topics[0] || null;

  const currentCourse = getPrimaryCourse(currentTopic);
  const nextCourse = getPrimaryCourse(nextTopic);
  const completedTopics = topics.filter((topic) => topic.completed);
  const progress = getPathProgress(path);

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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Continue: {path.title}
          </h1>
          <p className="text-slate-300">
            Module {Math.max(currentTopicIndex + 1, 1)} of {Math.max(topics.length, 1)} -
            {" "}
            {progress}% complete
          </p>
        </div>
        <Button
          variant="secondary"
          className="h-10 px-4"
          onClick={() => onNavigate?.(routes.pathDetail(path.slug || path.id))}
        >
          Back to path details
        </Button>
      </div>

      <Card className="border border-slate-800 bg-slate-900 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="h-5 w-5 text-cyan-300" />
            Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Overall completion</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2.5" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3 text-center">
              <div className="text-2xl font-bold">{completedTopics.length}</div>
              <div className="text-xs text-slate-300">Completed modules</div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3 text-center">
              <div className="text-2xl font-bold">{topics.length}</div>
              <div className="text-xs text-slate-300">Total modules</div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3 text-center">
              <div className="text-2xl font-bold">{getPathDuration(path)}</div>
              <div className="text-xs text-slate-300">Estimated duration</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-white">
                {currentTopic ? `Current Module: ${currentTopic.title}` : "Current Module"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-300">
                {stripHtml(currentTopic?.description || currentTopic?.summary) ||
                  "Continue with your current module to keep moving through this path."}
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Module progress</span>
                  <span>{currentTopic?.progress ?? 0}%</span>
                </div>
                <Progress value={currentTopic?.progress ?? 0} className="h-2" />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  className="flex-1 min-w-[220px]"
                  onClick={() => {
                    const routeParam = getCourseRouteParam(currentCourse);
                    if (routeParam) {
                      onNavigate?.(routes.courseDetail(routeParam));
                    }
                  }}
                  disabled={!currentCourse}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Watch Content
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 min-w-[220px]"
                  onClick={() => onNavigate?.(routes.pathDetail(path.slug || path.id))}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  View Path Details
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-white">Learning Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!topics.length ? (
                <p className="text-sm text-slate-300">No modules available yet.</p>
              ) : (
                topics.map((topic, index) => {
                  const isCurrent = currentTopic?.id === topic.id;
                  const icon = topic.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : isCurrent || topic.progress > 0 ? (
                    <Play className="h-5 w-5 text-cyan-300" />
                  ) : (
                    <Lock className="h-5 w-5 text-slate-400" />
                  );

                  const status = topic.completed
                    ? "Completed"
                    : isCurrent || topic.progress > 0
                    ? "In progress"
                    : "Upcoming";

                  const topicCourse = getPrimaryCourse(topic);
                  const topicCourseRouteParam = getCourseRouteParam(topicCourse);

                  return (
                    <div
                      key={topic.id}
                      className="rounded-lg border border-slate-700 bg-slate-800/60 p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <div className="mt-0.5">{icon}</div>
                          <div className="min-w-0">
                            <p className="font-medium text-white">
                              {index + 1}. {topic.title}
                            </p>
                            <p className="line-clamp-2 text-sm text-slate-300">
                              {stripHtml(topic.summary || topic.description) ||
                                "No summary available."}
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

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{topic.progress}% complete</span>
                        </div>
                        {topicCourseRouteParam && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              onNavigate?.(routes.courseDetail(topicCourseRouteParam))
                            }
                          >
                            Open Course
                          </Button>
                        )}
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
              <CardTitle className="text-lg text-white">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Completion rate</span>
                <span>{progress}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Completed modules</span>
                <span>{completedTopics.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Current module</span>
                <span>{Math.max(currentTopicIndex + 1, 1)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-lg text-white">Next Up</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
                <p className="font-medium text-white">
                  {nextTopic ? nextTopic.title : "Final module in progress"}
                </p>
                <p className="line-clamp-3 text-sm text-slate-300">
                  {stripHtml(nextTopic?.summary || nextTopic?.description) ||
                    "Keep going to complete the full path."}
                </p>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  const routeParam = getCourseRouteParam(nextCourse || currentCourse);
                  if (routeParam) {
                    onNavigate?.(routes.courseDetail(routeParam));
                  }
                }}
                disabled={!nextCourse && !currentCourse}
              >
                <Play className="mr-2 h-4 w-4" />
                Watch Next Content
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Completion Reward
              </CardTitle>
            </CardHeader>
            <CardContent className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-center">
              <Trophy className="mx-auto mb-2 h-8 w-8 text-yellow-400" />
              <p className="font-medium text-white">Path Certificate</p>
              <p className="text-sm text-slate-300">
                Finish all modules to unlock your completion certificate.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
