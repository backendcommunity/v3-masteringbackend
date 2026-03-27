"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Clock, Code, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader } from "../ui/loader";
import { Roadmap } from "@/lib/data";
import { routes } from "@/lib/routes";
import { useAppStore } from "@/lib/store";
import {
  getPathDuration,
  getPathProgress,
  getPathSubtitle,
  getPathTopics,
  getRoadmapKey,
} from "./path-flow-utils";

interface LearningPathsPageProps {
  onNavigate?: (url: string) => void;
}

export function LearningPathsPage({ onNavigate }: LearningPathsPageProps) {
  const store = useAppStore();
  const [paths, setPaths] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPaths = async () => {
      setLoading(true);
      try {
        const roadmaps = await store.getRoadmaps({ size: 20, skip: 0 });
        setPaths(Array.isArray(roadmaps) ? roadmaps : []);
      } catch (error) {
        console.error("Failed to load learning paths:", error);
        setPaths([]);
      } finally {
        setLoading(false);
      }
    };

    loadPaths();
  }, [store]);

  const stats = useMemo(() => {
    const active = paths.filter((path) => Boolean(path.enrolled)).length;
    const inProgress = paths.filter((path) => {
      const progress = getPathProgress(path);
      return progress > 0 && progress < 100;
    }).length;
    const completed = paths.filter((path) => getPathProgress(path) >= 100).length;

    return { active, inProgress, completed };
  }, [paths]);

  if (loading) return <Loader isLoader={true} />;

  return (
    <div className="relative flex-1 space-y-6 text-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Paths</h1>
          <p className="max-w-2xl text-slate-300">
            Follow a clear roadmap from beginner to advanced, then jump into each
            course directly when you are ready.
          </p>
        </div>
        <Button className="h-10 bg-slate-700 text-white hover:bg-slate-600">
          <Target className="mr-2 h-4 w-4" />
          Create Custom Path
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-xl border border-slate-800 bg-slate-900 text-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Paths</CardTitle>
            <Target className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-slate-300">Currently enrolled</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-slate-800 bg-slate-900 text-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-violet-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-slate-300">Actively learning</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-slate-800 bg-slate-900 text-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-slate-300">Paths completed</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-slate-800 bg-slate-900 text-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paths</CardTitle>
            <Target className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paths.length}</div>
            <p className="text-xs text-slate-300">Available</p>
          </CardContent>
        </Card>
      </div>

      {!paths.length ? (
        <Card className="border border-slate-800 bg-slate-900">
          <CardContent className="py-10 text-center text-slate-300">
            No paths available right now. Please check back in a bit.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paths.map((path) => {
            const roadmapKey = getRoadmapKey(path);
            const topics = getPathTopics(path);
            const courseCount = topics.reduce(
              (count, topic) => count + topic.courses.length,
              0,
            );
            const projectCount = topics.reduce((count, topic) => {
              const projects = Array.isArray(topic.raw?.projects)
                ? topic.raw.projects.length
                : 0;
              return count + projects;
            }, 0);
            const progress = getPathProgress(path);
            const level =
              path.level ||
              (typeof (path as any).difficulty === "string"
                ? (path as any).difficulty
                : "Beginner");

            return (
              <Card
                key={roadmapKey || path.id}
                onClick={() => roadmapKey && onNavigate?.(routes.pathDetail(roadmapKey))}
                className="flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 text-white shadow-lg transition-all hover:-translate-y-0.5 hover:border-cyan-500/30 hover:shadow-2xl"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-800">
                  {(path as any).banner ? (
                    <img
                      src={(path as any).banner}
                      alt={path.title}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <div className="text-center">
                        <Target className="mx-auto mb-2 h-12 w-12" />
                        <p className="text-sm font-semibold">Learning Path</p>
                      </div>
                    </div>
                  )}
                  {(path as any).isPremium && (
                    <Badge className="absolute right-3 top-3 border-none bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                      Premium
                    </Badge>
                  )}
                </div>

                <CardHeader className="flex-none space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant={
                        level === "Advanced"
                          ? "destructive"
                          : level.toLowerCase().includes("intermediate")
                          ? "default"
                          : "secondary"
                      }
                    >
                      {level}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-slate-300">
                      <Clock className="h-4 w-4 text-slate-400" />
                      {getPathDuration(path)}
                    </div>
                  </div>

                  <CardTitle className="line-clamp-2 text-xl">{path.title}</CardTitle>
                  <p className="line-clamp-3 text-sm text-slate-400">
                    {getPathSubtitle(path)}
                  </p>
                </CardHeader>

                <CardContent className="mt-auto space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {courseCount} courses
                    </div>
                    <div className="flex items-center gap-1">
                      <Code className="h-4 w-4" />
                      {projectCount} projects
                    </div>
                  </div>

                  {path.enrolled ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      <Button
                        className="w-full"
                        onClick={(event) => {
                          event.stopPropagation();
                          roadmapKey && onNavigate?.(routes.pathContinue(roadmapKey));
                        }}
                      >
                        Continue Learning
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={(event) => {
                        event.stopPropagation();
                        roadmapKey && onNavigate?.(routes.pathDetail(roadmapKey));
                      }}
                    >
                      Start Learning Path
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
