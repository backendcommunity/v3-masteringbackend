"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Circle, Target, Clock, Award, BarChart2 } from "lucide-react";
import { routes } from "@/lib/routes";
import { useAppStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { Roadmap, StarterKitItem } from "@/lib/data";
import { Loader } from "../ui/loader";
import { FreeStarterSection } from "@/components/free-starter-section";
import { getTagIcon } from "@/lib/tag-icons";

interface RoadmapsPageProps {
  onNavigate?: (route: string) => void;
}

export function RoadmapsPage({ onNavigate }: RoadmapsPageProps) {
  const store = useAppStore();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [currentRoadmap, setCurrentRoadmap] = useState<Roadmap>();
  const [freeStarters, setFreeStarters] = useState<StarterKitItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadRoadmaps = async () => {
      setLoading(true);
      const result = await store.getRoadmaps({
        size: 10,
        skip: 0,
      });
      const list: Roadmap[] = result?.roadmaps ?? result ?? [];
      setRoadmaps(list);
      setFreeStarters(result?.freeStarters ?? []);

      const current = list.find((r: Roadmap) => r.enrolled);
      setCurrentRoadmap(current);
      setLoading(false);
    };
    loadRoadmaps();
  }, []);
  if (loading) return <Loader isLoader={false} />;

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roadmaps</h1>
          <p className="text-muted-foreground">
            Strategic career progression guides to help you reach your
            professional goals
          </p>
        </div>
        {/* <Button>
          <TrendingUp className="mr-2 h-4 w-4" />
          Get Career Assessment
        </Button> */}
      </div>

      {/* Free Starter Section */}
      <FreeStarterSection items={freeStarters} type="roadmap" />

      {/* Current Roadmap Progress */}
      {roadmaps.some((r: any) => r.enrolled) && (
        <Card className="bg-gradient-to-r from-[#0E1F33] to-[#13AECE] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Your Career Roadmap:{" "}
              {roadmaps.find((r: any) => r.enrolled)?.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Overall Progress</span>
                <span>{roadmaps.find((r: any) => r.enrolled)?.progress}%</span>
              </div>
              <Progress
                value={roadmaps.find((r: any) => r.enrolled)?.progress}
                className="h-3"
              />
              <div className="flex items-center justify-between text-sm text-blue-100">
                <span>
                  Milestone{" "}
                  {
                    roadmaps
                      ?.find((t: any) => t.enrolled)
                      ?.topics?.filter((t) => t.userTopic?.completed)?.length
                  }{" "}
                  of {roadmaps.find((r: any) => r.enrolled)?.topics?.length}{" "}
                  completed
                </span>
                <span>
                  {roadmaps.find((r: any) => r.enrolled)?.estimatedTime}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roadmap Details */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {roadmaps.map((roadmap: any) => (
        <Card
          key={roadmap.id}
          className="overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate?.(routes.roadmapDetail(roadmap.slug))}
        >
          <CardHeader className="p-4 pb-3 flex-1 space-y-3">
            {/* Type label */}
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Learning Path
            </p>

            {/* Title */}
            <CardTitle className="text-base font-bold line-clamp-2 leading-snug">
              {roadmap.title}
            </CardTitle>

            {/* Level */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <BarChart2 className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{roadmap.level ?? "All levels"}</span>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-3">
              {roadmap.summary ?? roadmap.description}
            </p>

            {/* Enrolled progress */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{roadmap.topics?.length ?? 0} topics</span>
              {roadmap.enrolled && (
                <span className="text-xs text-muted-foreground">{roadmap.progress ?? 0}%</span>
              )}
            </div>

            {/* First skill tag */}
            {roadmap.skills?.length > 0 && (
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide w-fit">
                {roadmap.skills[0]}
              </Badge>
            )}
          </CardHeader>

          {/* Footer */}
          <CardContent className="p-4 pt-3 border-t">
            {roadmap.enrolled && <Progress value={roadmap.progress ?? 0} className="h-1 mb-2" />}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground flex-shrink-0">
                  {(() => { const Icon = getTagIcon(roadmap.skills); return <Icon className="h-4 w-4 text-background" />; })()}
                </div>
                <span className="text-sm text-muted-foreground">
                  {roadmap.estimatedWeeks ? `${roadmap.estimatedWeeks}w` : "Self-paced"}
                </span>
              </div>
              {roadmap.enrolled ? (
                <Button size="sm" onClick={(e) => { e.stopPropagation(); onNavigate?.(routes.roadmapDetail(roadmap.slug)); }}>
                  Continue
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onNavigate?.(routes.roadmapDetail(roadmap.slug)); }}>
                  Start
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      </div>

      {/* Career Insights */}
      {/* <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Market Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Backend Engineer Demand</span>
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  High
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Average Salary Range</span>
                <span className="text-sm font-medium">$85k - $150k</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Job Growth Rate</span>
                <span className="text-sm font-medium text-green-600">+22%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600" />
              Skills in Demand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { skill: "Node.js", demand: 95 },
                { skill: "System Design", demand: 88 },
                { skill: "Cloud Platforms", demand: 82 },
                { skill: "Microservices", demand: 78 },
                { skill: "Database Design", demand: 85 },
              ].map((item) => (
                <div key={item.skill} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.skill}</span>
                    <span>{item.demand}%</span>
                  </div>
                  <Progress value={item.demand} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <Circle className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Start a new Project</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Practice your coding skills by building a real world backend
                project.
              </p>
              <Button
                size="sm"
                className="w-full"
                onClick={(e) => {
                  onNavigate?.(routes.projects);
                }}
              >
                Start Building
              </Button>
            </div>
            <div className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="font-medium">Schedule Mock Interview</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Practice your interview skills to prepare for senior-level
                positions
              </p>
              <Button
                onClick={() => onNavigate?.(routes.mockInterviews)}
                size="sm"
                variant="outline"
                className="w-full"
              >
                Schedule Now
              </Button>
            </div>
            <div className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-green-600" />
                <span className="font-medium">Join Study Group</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Connect with peers working toward similar career goals
              </p>
              <Button size="sm" variant="outline" className="w-full">
                Find Groups
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
