"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { routes } from "@/lib/routes";
import type { PortfolioSkill, SkillDomain } from "@/lib/portfolio-types";
import { Code2, Database, Cloud, Layers, Brain, FolderGit2, GraduationCap } from "lucide-react";

interface PortfolioTechStackProps {
  skills: PortfolioSkill[];
}

const DOMAIN_ICONS: Record<SkillDomain, React.ReactNode> = {
  Languages: <Code2 className="h-3.5 w-3.5" />,
  Databases: <Database className="h-3.5 w-3.5" />,
  Infrastructure: <Cloud className="h-3.5 w-3.5" />,
  Patterns: <Layers className="h-3.5 w-3.5" />,
  "AI/ML": <Brain className="h-3.5 w-3.5" />,
};

const DOMAIN_ORDER: SkillDomain[] = [
  "Languages",
  "Databases",
  "Infrastructure",
  "Patterns",
  "AI/ML",
];

const INITIAL_VISIBLE = 8;

export function PortfolioTechStack({ skills }: PortfolioTechStackProps) {
  const [expanded, setExpanded] = useState(false);

  // Flatten in domain order, cap when collapsed, then re-group only the visible
  // subset so the load-more toggle works across domains.
  const ordered = useMemo(() => {
    const map: Partial<Record<SkillDomain, PortfolioSkill[]>> = {};
    for (const skill of skills) {
      if (!map[skill.domain]) map[skill.domain] = [];
      map[skill.domain]!.push(skill);
    }
    return DOMAIN_ORDER.flatMap((d) => map[d] ?? []);
  }, [skills]);

  const hasMore = ordered.length > INITIAL_VISIBLE;
  const visible = expanded ? ordered : ordered.slice(0, INITIAL_VISIBLE);

  const grouped = useMemo(() => {
    const map: Partial<Record<SkillDomain, PortfolioSkill[]>> = {};
    for (const skill of visible) {
      if (!map[skill.domain]) map[skill.domain] = [];
      map[skill.domain]!.push(skill);
    }
    return map;
  }, [visible]);

  const totalProjects = useMemo(
    () => Math.max(...skills.map((s) => s.maxProjectCount), 1),
    [skills],
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Tech Stack</CardTitle>
          <span className="text-xs text-muted-foreground">
            Across {totalProjects} projects
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {DOMAIN_ORDER.map((domain) => {
          const domainSkills = grouped[domain];
          if (!domainSkills?.length) return null;

          return (
            <div key={domain} className="space-y-2.5">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                {DOMAIN_ICONS[domain]}
                {domain}
              </h3>
              <div className="space-y-3">
                {domainSkills.map((skill) => {
                  const pct =
                    skill.maxProjectCount > 0
                      ? (skill.projectCount / skill.maxProjectCount) * 100
                      : 0;
                  const courseCount =
                    skill.courseCount ?? skill.coursesCompleted ?? 0;
                  const evidenceProjects = skill.projects ?? [];
                  const evidenceCourses = skill.courses ?? [];
                  const hasEvidence =
                    evidenceProjects.length > 0 || evidenceCourses.length > 0;

                  return (
                    <div key={skill.name} className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium w-28 truncate">
                          {skill.name}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground text-right tabular-nums whitespace-nowrap">
                          {[
                            `${skill.projectCount} proj`,
                            courseCount
                              ? `${courseCount} course${courseCount > 1 ? "s" : ""}`
                              : null,
                            skill.quizAvgScore ? `${skill.quizAvgScore}%` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </div>

                      {/* Evidence — linked projects & courses backing this skill */}
                      {hasEvidence && (
                        <div className="flex flex-wrap items-center gap-1.5 pl-[7.75rem]">
                          {evidenceProjects.map((p) => (
                            <Tooltip key={`p-${p.slug}`}>
                              <TooltipTrigger asChild>
                                <Link
                                  href={routes.projectDetail(p.slug)}
                                  className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 max-w-[10rem]"
                                >
                                  <FolderGit2 className="h-2.5 w-2.5 shrink-0" />
                                  <span className="truncate">{p.title}</span>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>Project: {p.title}</TooltipContent>
                            </Tooltip>
                          ))}
                          {evidenceCourses.map((c) => (
                            <Tooltip key={`c-${c.slug}`}>
                              <TooltipTrigger asChild>
                                <Link
                                  href={routes.courseDetail(c.slug)}
                                  className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 max-w-[10rem]"
                                >
                                  <GraduationCap className="h-2.5 w-2.5 shrink-0" />
                                  <span className="truncate">{c.title}</span>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>Course: {c.title}</TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <>
                <ChevronUp className="mr-1 h-4 w-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="mr-1 h-4 w-4" />
                Show {ordered.length - INITIAL_VISIBLE} more
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
