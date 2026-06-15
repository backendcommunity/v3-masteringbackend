"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader } from "@/components/ui/loader";
import { EmptyStateCard } from "@/components/empty-state-card";
import { useUser } from "@/hooks/use-user";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { BookOpen, Search, Target } from "lucide-react";

interface MyActivityPageProps {
  onNavigate: (path: string) => void;
}

type ActivityType = "course" | "path";

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  /** Navigation target for the Continue button. */
  href: string;
  progress: number;
  isCompleted: boolean;
}

const clampProgress = (value: number): number => {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
};

export function MyActivityPage({ onNavigate }: MyActivityPageProps) {
  const store = useAppStore();
  const user = useUser();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [items, setItems] = useState<ActivityItem[]>([]);

  const [activeTab, setActiveTab] = useState<"in-progress" | "completed">(
    "in-progress",
  );
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "course" | "path">(
    "all",
  );

  // Stats that we can reliably derive from the API. Anything not reliably
  // available defaults to 0 rather than being fabricated.
  const [stats, setStats] = useState({
    coursesCompleted: 0,
    pathsCompleted: 0,
    projectsCompleted: 0,
    certifications: 0,
  });

  useEffect(() => {
    analytics.track("activity_viewed");
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(false);

        const [userCourses, userRoadmaps] = await Promise.all([
          store.getUserCourses(),
          store.getUserRoadmaps({ filters: "", size: 50, skip: 0 }),
        ]);

        const courseItems: ActivityItem[] = (
          (userCourses as any[]) || []
        )
          .filter((uc) => uc?.course)
          .map((uc) => {
            const slug: string = uc.course?.slug ?? "";
            const progress = clampProgress(
              uc.progress ?? uc.course?.progress ?? 0,
            );
            return {
              id: uc.id ?? slug,
              type: "course" as const,
              title: uc.course?.title ?? "Untitled course",
              href: routes.courseDetail(slug),
              progress,
              isCompleted: Boolean(uc.isCompleted) || progress >= 100,
            };
          });

        const pathItems: ActivityItem[] = ((userRoadmaps as any[]) || [])
          .filter((ur) => ur?.roadmap)
          .map((ur) => {
            const pathId: string = ur.roadmap?.slug ?? ur.roadmapId ?? "";
            const progress = clampProgress(ur.roadmap?.progress ?? 0);
            return {
              id: ur.id ?? pathId,
              type: "path" as const,
              title: ur.roadmap?.title ?? "Untitled path",
              href: routes.pathWorkspace(pathId),
              progress,
              isCompleted: Boolean(ur.isCompleted) || progress >= 100,
            };
          });

        const allItems = [...courseItems, ...pathItems];

        if (cancelled) return;

        setItems(allItems);
        setStats({
          coursesCompleted: courseItems.filter((c) => c.isCompleted).length,
          pathsCompleted: pathItems.filter((p) => p.isCompleted).length,
          // numberOfProjectsBuilt is the closest reliable "projects completed"
          // signal on the User type; falls back to 0 when absent.
          projectsCompleted: user?.numberOfProjectsBuilt ?? 0,
          certifications: user?.numberOfCertificateEarned ?? 0,
        });
      } catch (err) {
        if (cancelled) return;
        setError(true);
        toast.error("Failed to load your activity");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [store, user?.numberOfProjectsBuilt, user?.numberOfCertificateEarned]);

  const inProgressItems = useMemo(
    () => items.filter((i) => !i.isCompleted),
    [items],
  );
  const completedItems = useMemo(
    () => items.filter((i) => i.isCompleted),
    [items],
  );

  const visibleItems = useMemo(() => {
    const base =
      activeTab === "in-progress" ? inProgressItems : completedItems;
    const query = search.trim().toLowerCase();
    return base.filter((item) => {
      const matchesType =
        typeFilter === "all" ? true : item.type === typeFilter;
      const matchesSearch =
        query.length === 0 ? true : item.title.toLowerCase().includes(query);
      return matchesType && matchesSearch;
    });
  }, [activeTab, inProgressItems, completedItems, search, typeFilter]);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <EmptyStateCard
        icon={Target}
        title="We couldn't load your activity"
        description="Something went wrong while fetching your learning progress. Please try again."
        primaryCTA={{
          label: "Browse courses",
          onClick: () => onNavigate(routes.courses),
        }}
      />
    );
  }

  const statItems = [
    { label: "Courses completed", value: stats.coursesCompleted },
    { label: "Paths completed", value: stats.pathsCompleted },
    { label: "Projects completed", value: stats.projectsCompleted },
    { label: "Certifications", value: stats.certifications },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">My Activity</h1>
        <p className="text-muted-foreground">
          Everything you&apos;re working on and have completed
        </p>
      </div>

      {/* Stat strip */}
      <Card className="rounded-2xl">
        <CardContent className="p-0">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y divide-x divide-border md:divide-y-0">
            {statItems.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center justify-center gap-1 px-4 py-6 text-center"
              >
                <span className="text-3xl font-bold tabular-nums text-foreground">
                  {stat.value}
                </span>
                <span className="text-sm text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Controls row */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "in-progress" | "completed")
          }
        >
          <TabsList>
            <TabsTrigger value="in-progress">
              In Progress ({inProgressItems.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedItems.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title"
              aria-label="Search activity by title"
              className="pl-9 sm:w-64"
            />
          </div>

          <Select
            value={typeFilter}
            onValueChange={(value) =>
              setTypeFilter(value as "all" | "course" | "path")
            }
          >
            <SelectTrigger
              className="sm:w-40"
              aria-label="Filter by type"
            >
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="course">Courses</SelectItem>
              <SelectItem value="path">Paths</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {visibleItems.length} result{visibleItems.length === 1 ? "" : "s"}
        </p>

        {visibleItems.length === 0 ? (
          <EmptyStateCard
            icon={activeTab === "in-progress" ? Target : BookOpen}
            title={
              activeTab === "in-progress"
                ? "Nothing in progress yet"
                : "Nothing completed yet"
            }
            description={
              activeTab === "in-progress"
                ? "Enroll in a course or learning path to start making progress."
                : "Finish a course or path to see your completed work here."
            }
            primaryCTA={{
              label: "Browse courses",
              onClick: () => onNavigate(routes.courses),
            }}
            secondaryCTA={{
              label: "Browse paths",
              onClick: () => onNavigate(routes.paths),
            }}
          />
        ) : (
          <ul className="space-y-3">
            {visibleItems.map((item) => (
              <ActivityRow
                key={`${item.type}-${item.id}`}
                item={item}
                onContinue={() => onNavigate(item.href)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ActivityRow({
  item,
  onContinue,
}: {
  item: ActivityItem;
  onContinue: () => void;
}) {
  const isCourse = item.type === "course";
  const Icon = isCourse ? BookOpen : Target;
  const typeLabel = isCourse ? "COURSE" : "PATH";

  return (
    <li>
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          {/* Icon tile */}
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
            aria-hidden="true"
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {typeLabel}
            </span>
            <p className="truncate font-bold text-foreground">{item.title}</p>
            <div className="flex items-center gap-3">
              <Progress
                value={item.progress}
                className="h-1.5 max-w-xs flex-1"
                aria-label={`${item.title} progress: ${item.progress}%`}
                aria-valuenow={item.progress}
              />
              <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                {item.progress}%
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <Button
            onClick={onContinue}
            className={cn("w-full sm:w-auto")}
            aria-label={`Continue ${item.title}`}
          >
            Continue
          </Button>
        </div>
      </div>
    </li>
  );
}
