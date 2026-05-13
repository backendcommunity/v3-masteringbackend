"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Code2,
  Clock,
  Search,
  Play,
  CheckCircle2,
  Trophy,
  DownloadCloud,
  BarChart2,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { Meta, Project, StarterKitItem } from "@/lib/data";
import { useDebounce } from "@/hooks/use-debounce";
import { Loader } from "../ui/loader";
import { FreeStarterSection } from "@/components/free-starter-section";
import { getTagIcon } from "@/lib/tag-icons";

interface ProjectsPageProps {
  onNavigate: (path: string) => void;
}

export function ProjectsPage({ onNavigate }: ProjectsPageProps) {
  const store = useAppStore();
  const [projects, setProjects] = useState<Project[]>();
  const [meta, setMeta] = useState<Meta>();
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [loading, setLoading] = useState(false);
  const [freeStarters, setFreeStarters] = useState<StarterKitItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (
        selectedStatus.includes("all") &&
        selectedLevel.includes("all")
        //&& !debouncedSearch.trim()
      )
        return;

      setLoading(true);
      const projects = await store.getProjects({
        page: 20,
        size: 0,
        filters: {
          terms: debouncedSearch,
          level: selectedLevel,
          category: selectedStatus,
        },
      });

      if (!cancelled) {
        setProjects(projects.projects);
        setMeta(projects.meta);
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, selectedLevel, selectedStatus, store]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const projects = await store.getProjects({
        page: 20,
        size: 0,
        filters: {},
      });
      if (!cancelled) {
        setProjects(projects.projects);
        setMeta(projects.meta);
        setFreeStarters((projects as any).freeStarters ?? []);
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [store]);

  if (loading) return <Loader isLoader={false} />;

  return (
    <div className="flex-1 space-y-4 md:space-y-6 relative">
      {/* <WIP /> */}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            MB Projects
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Build real-world projects to strengthen your backend development
            skills
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            className="w-full md:w-auto"
            variant={"outline"}
            onClick={() => onNavigate("/projects/leaderboard")}
          >
            <Trophy className="mr-2 h-4 w-4" />
            Global Leaderboard
          </Button>

          <Button
            className="w-full md:w-auto"
            onClick={() => onNavigate("/projects/submissions")}
          >
            <DownloadCloud className="mr-2 h-4 w-4" />
            My Submissions
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">
              Total Projects
            </CardTitle>
            <Code2 className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">{meta?.total}</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">
              Completed
            </CardTitle>
            <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">
              {projects?.filter((p) => p?.userProject?.completed)?.length}
            </div>
            <p className="text-xs text-muted-foreground">67% completion rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">
              In Progress
            </CardTitle>
            <Play className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">
              {
                projects?.filter(
                  (p) => p?.userProject && !p?.userProject?.completed,
                )?.length
              }
            </div>
            <p className="text-xs text-muted-foreground">Active projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">
              Avg. Time
            </CardTitle>
            <Clock className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">2.5w</div>
            <p className="text-xs text-muted-foreground">Per project</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="pl-8"
          />
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-full sm:w-[120px] md:w-[180px]">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginners">Beginners</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advance">Advance</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-[120px] md:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="not-started">Not Started</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Free Starter Section */}
      {freeStarters.length > 0 && (
        <>
          <FreeStarterSection items={freeStarters} type="project" />
          <div className="relative flex items-center gap-4">
            <div className="flex-1 border-t" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              All Projects
            </span>
            <div className="flex-1 border-t" />
          </div>
        </>
      )}

      {/* Projects Grid */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project) => (
          <Card
            key={project.slug}
            className="overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onNavigate(`/projects/${project.slug}`)}
          >
            <CardHeader className="p-4 pb-3 flex-1 space-y-3">
              {/* Type label */}
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Project
              </p>

              {/* Title */}
              <CardTitle className="text-base font-bold line-clamp-2 leading-snug">
                {project.title}
              </CardTitle>

              {/* Level */}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <BarChart2 className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="capitalize">
                  {project.level ?? "All levels"}
                </span>
              </div>

              {/* Description */}
              <p
                className="text-sm text-muted-foreground line-clamp-3"
                dangerouslySetInnerHTML={{
                  __html: project.summary ?? project.description,
                }}
              />

              {/* Progress if enrolled */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {(project as any).industries?.[0] ?? "Backend"}
                </span>
                {project.userProject && (
                  <span className="text-xs text-muted-foreground">
                    {project.userProject.completed
                      ? "Completed"
                      : "In Progress"}
                  </span>
                )}
              </div>

              {/* First technology tag */}
              {project.technologies?.length > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase tracking-wide w-fit"
                >
                  {project.technologies[0]}
                </Badge>
              )}
            </CardHeader>

            {/* Footer */}
            <CardContent className="p-4 pt-3 border-t">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground flex-shrink-0">
                    {(() => {
                      const Icon = getTagIcon(project.technologies);
                      return <Icon className="h-4 w-4 text-background" />;
                    })()}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {project.timeframe ?? project.duration}
                  </span>
                </div>
                {project.userProject ? (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(`/projects/${project.slug}/tasks`);
                    }}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(`/projects/${project.slug}`);
                    }}
                  >
                    Start
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
