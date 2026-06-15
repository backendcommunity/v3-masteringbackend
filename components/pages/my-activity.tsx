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
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Code2,
  Calendar,
  CalendarDays,
  Search,
  Target,
  Video,
} from "lucide-react";

interface MyActivityPageProps {
  onNavigate: (path: string) => void;
}

type ActivityType =
  | "course"
  | "path"
  | "project"
  | "project30"
  | "bootcamp"
  | "mock_interview";

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  subtitle?: string | null;
  slug?: string | null;
  progress: number;
  isCompleted: boolean;
  meta?: Record<string, any>;
}

interface ActivityStats {
  coursesCompleted: number;
  pathsCompleted: number;
  projectsCompleted: number;
  mockInterviewsCompleted: number;
  bootcampsCompleted: number;
  project30Completed: number;
  certifications: number;
}

const TYPE_CONFIG: Record<
  ActivityType,
  { label: string; icon: any; filterLabel: string }
> = {
  course: { label: "COURSE", icon: BookOpen, filterLabel: "Courses" },
  path: { label: "PATH", icon: Target, filterLabel: "Paths" },
  project: { label: "PROJECT", icon: Code2, filterLabel: "Projects" },
  project30: {
    label: "PROJECT30",
    icon: CalendarDays,
    filterLabel: "Project30",
  },
  bootcamp: { label: "BOOTCAMP", icon: Calendar, filterLabel: "Bootcamps" },
  mock_interview: {
    label: "MOCK INTERVIEW",
    icon: Video,
    filterLabel: "Mock Interviews",
  },
};

const clampProgress = (value: number): number => {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
};

// Build the Continue target per type from the slug + routing meta the backend
// returns. Falls back to the type's listing page when an id is missing.
const hrefFor = (item: ActivityItem): string => {
  const m = item.meta || {};
  switch (item.type) {
    case "course":
      return item.slug ? routes.courseDetail(item.slug) : routes.courses;
    case "path":
      return item.slug ? routes.pathWorkspace(item.slug) : routes.paths;
    case "project":
      return item.slug ? routes.projectDetail(item.slug) : routes.projects;
    case "project30": {
      const id = item.slug || m.offerId;
      return id && m.dayNumber
        ? routes.project30Day(id, String(m.dayNumber))
        : routes.project30;
    }
    case "bootcamp": {
      const id = m.bootcampId || item.slug;
      return id ? routes.bootcampDetail(id) : routes.bootcamps;
    }
    case "mock_interview":
      if (item.isCompleted && m.userInterviewId)
        return routes.mockInterviewResults(m.userInterviewId);
      return m.templateId
        ? routes.mockInterviewDetail(m.templateId)
        : routes.mockInterviews;
    default:
      return routes.dashboard;
  }
};

export function MyActivityPage({ onNavigate }: MyActivityPageProps) {
  const store = useAppStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<ActivityStats>({
    coursesCompleted: 0,
    pathsCompleted: 0,
    projectsCompleted: 0,
    mockInterviewsCompleted: 0,
    bootcampsCompleted: 0,
    project30Completed: 0,
    certifications: 0,
  });

  const [activeTab, setActiveTab] = useState<"in-progress" | "completed">(
    "in-progress",
  );
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ActivityType>("all");

  useEffect(() => {
    analytics.track("activity_viewed");
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(false);

        const res = await store.getMyActivity();

        if (cancelled) return;

        const rawItems: any[] = res?.items ?? [];
        const normalized: ActivityItem[] = rawItems.map((it) => ({
          id: String(it.id),
          type: it.type as ActivityType,
          title: it.title ?? "Untitled",
          subtitle: it.subtitle ?? null,
          slug: it.slug ?? null,
          progress: clampProgress(it.progress ?? 0),
          isCompleted: Boolean(it.isCompleted),
          meta: it.meta ?? {},
        }));

        setItems(normalized);
        if (res?.stats) setStats((prev) => ({ ...prev, ...res.stats }));
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
  }, [store]);

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
          Everything you&apos;ve joined, activated, and completed
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
              setTypeFilter(value as "all" | ActivityType)
            }
          >
            <SelectTrigger className="sm:w-44" aria-label="Filter by type">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {(Object.keys(TYPE_CONFIG) as ActivityType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {TYPE_CONFIG[t].filterLabel}
                </SelectItem>
              ))}
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
                ? "Join a course, path, project, bootcamp, or interview to start making progress."
                : "Finish something to see your completed work here."
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
                onContinue={() => onNavigate(hrefFor(item))}
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
  const cfg = TYPE_CONFIG[item.type];
  const Icon = cfg?.icon ?? BookOpen;

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
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {cfg?.label ?? "ITEM"}
              </span>
              {item.subtitle && (
                <span className="truncate text-xs text-muted-foreground/80">
                  · {item.subtitle}
                </span>
              )}
            </div>
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
            aria-label={`${item.isCompleted ? "Review" : "Continue"} ${item.title}`}
          >
            {item.isCompleted ? "Review" : "Continue"}
          </Button>
        </div>
      </div>
    </li>
  );
}
