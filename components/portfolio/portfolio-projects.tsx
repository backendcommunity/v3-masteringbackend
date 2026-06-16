"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { stripHtmlTags } from "@/lib/html-utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Github,
  Star,
  ChevronDown,
  FileText,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import type { PortfolioProject } from "@/lib/portfolio-types";
import { EmptyStateCard } from "@/components/empty-state-card";

interface PortfolioProjectsProps {
  projects: PortfolioProject[];
}

type SortOption = "featured" | "score" | "recent" | "level";

const LEVEL_ORDER: Record<string, number> = {
  Advanced: 3,
  Intermediate: 2,
  Beginner: 1,
};

function getScoreColor(score: number) {
  if (score >= 80)
    return {
      text: "text-[#27AE60]",
      bg: "bg-[#27AE60]",
      border: "border-[#27AE60]/30",
    };
  if (score >= 60)
    return {
      text: "text-[#F2C94C]",
      bg: "bg-[#F2C94C]",
      border: "border-[#F2C94C]/30",
    };
  return {
    text: "text-[#ef4444]",
    bg: "bg-[#ef4444]",
    border: "border-[#ef4444]/30",
  };
}

function getLevelColor(level: string) {
  switch (level) {
    case "Advanced":
      return "border-[#9B59B6]/40 text-[#9B59B6] bg-[#9B59B6]/10";
    case "Intermediate":
      return "border-primary/40 text-primary bg-primary/10";
    default:
      return "border-[#27AE60]/40 text-[#27AE60] bg-[#27AE60]/10";
  }
}

function sortProjects(projects: PortfolioProject[], sort: SortOption) {
  const sorted = [...projects];
  switch (sort) {
    case "featured":
      sorted.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (b.score || 0) - (a.score || 0);
      });
      break;
    case "score":
      sorted.sort((a, b) => (b.score || 0) - (a.score || 0));
      break;
    case "recent":
      sorted.sort((a, b) => {
        const da = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const db = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return db - da;
      });
      break;
    case "level":
      sorted.sort(
        (a, b) => (LEVEL_ORDER[b.level] || 0) - (LEVEL_ORDER[a.level] || 0),
      );
      break;
  }
  return sorted;
}

function ScoreSparkline({ projects }: { projects: PortfolioProject[] }) {
  const data = useMemo(() => {
    return projects
      .filter((p) => p.status !== "in_progress" && p.score > 0)
      .slice(-8)
      .map((p, i) => ({ idx: i, score: p.score }));
  }, [projects]);

  if (data.length < 2) return null;

  return (
    <div className="w-20 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#13AECE" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#13AECE" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="score"
            stroke="#13AECE"
            strokeWidth={1.5}
            fill="url(#sparkFill)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ProjectCard({ project }: { project: PortfolioProject }) {
  const [expanded, setExpanded] = useState(false);
  const isInProgress = project.status === "in_progress";
  const colors = getScoreColor(project.score);
  const hasWriteUp =
    (project.challenges && project.challenges.length > 0) ||
    (project.tools && project.tools.length > 0) ||
    project.docsUrl;

  return (
    <Card
      className={cn(
        "min-w-0",
        isInProgress
          ? "border-dashed border-muted-foreground/30"
          : "hover:border-primary/20 transition-colors",
        project.featured && !isInProgress && "ring-1 ring-[#F2C94C]/30",
      )}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <a
                href={`/projects/${project.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 max-w-full"
              >
                <h4 className="font-semibold text-sm truncate">
                  {project.title}
                </h4>
              </a>
              {project.isVerified && (
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
              )}
              {project.featured && (
                <Badge className="bg-[#F2C94C]/15 text-[#F2C94C] border-[#F2C94C]/30 hover:bg-[#F2C94C]/20 text-[9px] px-1.5 py-0 gap-0.5">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  Featured
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {stripHtmlTags(project.summary || "")}
            </p>
          </div>

          {/* Score badge */}
          {isInProgress ? (
            <div className="shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          ) : (
            <div
              className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border ${colors.border} ${colors.bg}/10`}
            >
              <span className={`text-xs font-bold ${colors.text}`}>
                {project.score}
              </span>
            </div>
          )}
        </div>

        {/* Level + Status + Date */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${getLevelColor(project.level)}`}
          >
            {project.level}
          </Badge>
          {project.status === "approved" && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-[#27AE60]/30 text-[#27AE60] bg-[#27AE60]/10"
            >
              Approved
            </Badge>
          )}
          {isInProgress && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-[#F2C94C]/30 text-[#F2C94C] bg-[#F2C94C]/10"
            >
              In Progress
            </Badge>
          )}
          {project.completedAt && (
            <span className="text-[10px] text-muted-foreground ml-auto">
              {new Date(project.completedAt).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
        </div>

        {/* Technologies */}
        <div className="flex flex-wrap gap-1">
          {project.technologies.map((tech, idx) => (
            <Badge
              key={`${tech}-${idx}`}
              variant="secondary"
              className="text-[10px] px-2 py-0 font-normal"
            >
              {tech}
            </Badge>
          ))}
        </div>

        {/* Links */}
        {!isInProgress && (project.repositoryUrl || project.liveUrl) && (
          <div className="flex gap-2 pt-1">
            {project.repositoryUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5"
                asChild
              >
                <a
                  href={project.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-3 w-3" />
                  Repo
                </a>
              </Button>
            )}
            {project.liveUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5"
                asChild
              >
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3 w-3" />
                  Live
                </a>
              </Button>
            )}
            {hasWriteUp && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5 ml-auto"
                onClick={() => setExpanded(!expanded)}
              >
                <FileText className="h-3 w-3" />
                Write-up
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform",
                    expanded && "rotate-180",
                  )}
                />
              </Button>
            )}
          </div>
        )}

        {/* Expandable write-up */}
        {expanded && hasWriteUp && (
          <div className="border-t pt-3 space-y-3 text-xs">
            {project.challenges && project.challenges.length > 0 && (
              <div>
                <p className="font-medium text-muted-foreground mb-1">
                  Challenges Solved
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                  {project.challenges.map((c, idx) => (
                    <li key={`${c}-${idx}`}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
            {project.tools && project.tools.length > 0 && (
              <div>
                <p className="font-medium text-muted-foreground mb-1">
                  Tools & Infrastructure
                </p>
                <div className="flex flex-wrap gap-1">
                  {project.tools.map((tool, idx) => (
                    <Badge
                      key={`${tool}-${idx}`}
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {project.docsUrl && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                asChild
              >
                <a
                  href={project.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText className="h-3 w-3" />
                  Read Full Write-up
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PortfolioProjects({ projects }: PortfolioProjectsProps) {
  // Filter out rejected projects — they shouldn't appear on a public portfolio
  const visibleProjects = useMemo(
    () => projects.filter((p) => p.status !== "rejected"),
    [projects],
  );

  const counts = useMemo(() => {
    const approved = visibleProjects.filter(
      (p) => p.status === "approved",
    ).length;
    const inProgress = visibleProjects.filter(
      (p) => p.status === "in_progress",
    ).length;
    return { approved, inProgress };
  }, [visibleProjects]);

  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState<SortOption>("featured");
  const [visibleCount, setVisibleCount] = useState(6);

  const filtered = useMemo(() => {
    let base = visibleProjects;
    if (tab === "approved")
      base = visibleProjects.filter((p) => p.status === "approved");
    if (tab === "in_progress")
      base = visibleProjects.filter((p) => p.status === "in_progress");
    return sortProjects(base, sort);
  }, [visibleProjects, tab, sort]);

  // Reset visible count when tab or sort changes
  const displayedProjects = useMemo(() => {
    return filtered.slice(0, visibleCount);
  }, [filtered, visibleCount]);

  useEffect(() => {
    setVisibleCount(6);
  }, [tab, sort]);

  const hasMore = filtered.length > visibleCount;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">Projects</CardTitle>
            <ScoreSparkline projects={visibleProjects} />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="score">Score</SelectItem>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="level">Level</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              All ({visibleProjects.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({counts.approved})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              In Progress ({counts.inProgress})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab} forceMount className="mt-0">
            {filtered.length > 0 ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {displayedProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
                {hasMore && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setVisibleCount((v) => v + 6)}
                  >
                    Show More ({filtered.length - visibleCount} remaining)
                  </Button>
                )}
              </div>
            ) : (
              <EmptyStateCard
                icon={FileText}
                title="No Projects Yet"
                description={
                  tab === "approved"
                    ? "Your completed and verified projects will appear here."
                    : tab === "in_progress"
                    ? "Your ongoing projects will appear here."
                    : "Build and submit projects to showcase your skills."
                }
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
