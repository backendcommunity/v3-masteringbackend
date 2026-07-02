"use client";

import { useRouter } from "next/navigation";
import { sanitizeHtml } from "@/lib/sanitize";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart2 } from "lucide-react";
import { StarterKitItem } from "@/lib/data";
import { ProjectCard } from "@/components/pages/projects/project-card";
import { CourseCard } from "@/components/pages/courses/course-card";
import { useUser } from "@/hooks/use-user";
import { useAppStore } from "@/lib/store";
import { startItem, StartItemType } from "@/lib/start-flow";

type ContentType = "course" | "project" | "roadmap";

const DETAIL_PATH: Record<ContentType, (slug: string) => string> = {
  course: (slug) => `/courses/${slug}`,
  project: (slug) => `/projects/${slug}`,
  roadmap: (slug) => `/paths/${slug}`,
};

const START_TYPE: Record<ContentType, StartItemType> = {
  course: "course",
  project: "project",
  roadmap: "path",
};

const canonLevel = (raw?: string): string => {
  const l = (raw || "").toLowerCase();
  if (l.startsWith("beg")) return "Beginner";
  if (l.startsWith("adv")) return "Advanced";
  if (l.startsWith("inter")) return "Intermediate";
  return raw || "Beginner";
};

interface FreeStarterSectionProps {
  items: StarterKitItem[];
  type: ContentType;
}

export function FreeStarterSection({ items, type }: FreeStarterSectionProps) {
  const router = useRouter();
  const user = useUser();
  const store = useAppStore();

  // free → detail; pro/enterprise → enroll + first value point.
  const start = (item: StarterKitItem) =>
    startItem({
      type: START_TYPE[type],
      slug: item.slug,
      id: item.id,
      enrolled: false,
      isPremiumUser: !!user?.isPremium,
      store,
      onNavigate: (p) => router.push(p),
    });

  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-base">Start for Free</h3>
        <p className="text-sm text-muted-foreground">
          No subscription needed to start.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {type === "course"
          ? items?.map((item) => (
              <CourseCard
                key={item.id}
                course={{
                  slug: item.slug,
                  title: item.title,
                  summary: item.summary,
                  level: canonLevel(item.level),
                  category: (item.tags?.[0] ?? item.skills?.[0])
                    ? { name: item.tags?.[0] ?? item.skills?.[0] }
                    : null,
                  totalDuration: null,
                  enrolled: false,
                }}
                onViewDetails={(slug) => router.push(DETAIL_PATH.course(slug))}
                onContinue={(slug) => router.push(DETAIL_PATH.course(slug))}
                onStart={() => start(item)}
              />
            ))
          : type === "project"
          ? items?.map((item) => (
              <ProjectCard
                key={item.id}
                project={{
                  id: item.id,
                  slug: item.slug,
                  title: item.title,
                  description: item.summary,
                  level: canonLevel(item.level),
                  category: item.tags?.[0] ?? item.skills?.[0] ?? null,
                  tasks: 0,
                  duration: "Self-paced",
                  enrolled: false,
                  completed: false,
                  progress: 0,
                }}
                onSelect={() => start(item)}
                onOpenDetail={() => router.push(DETAIL_PATH.project(item.slug))}
              />
            ))
          : items?.map((item) => (
          <Card
            key={item.id}
            className="overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(DETAIL_PATH[type](item.slug))}
          >
            <CardHeader className="p-4 pb-3 flex-1 space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {"Learning Path"}
              </p>
              <CardTitle className="text-sm font-bold line-clamp-2 leading-snug">
                {item.title}
              </CardTitle>
              {item.level && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <BarChart2 className="h-3 w-3" />
                  <span>{item.level}</span>
                </div>
              )}
              <p
                className="text-xs text-muted-foreground line-clamp-3 [&>*>span]:!text-muted-foreground [&>p]:text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.summary) }}
              ></p>
              {((item as any).tags ?? (item as any).skills)?.length > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase tracking-wide w-fit"
                >
                  {((item as any).tags ?? (item as any).skills)?.[0]}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-4 pt-3 border-t">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs text-primary border-primary/40"
                  >
                    Free
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    start(item);
                  }}
                >
                  Start
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
