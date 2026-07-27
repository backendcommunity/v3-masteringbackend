"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Code2,
  X,
  DownloadCloud,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { useUser } from "@/hooks/use-user";
import { startItem } from "@/lib/start-flow";
import { analytics } from "@/lib/analytics";
import { PROJECT_EVENTS } from "@/lib/analytics-events";
import { cn } from "@/lib/utils";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Pager } from "@/components/ui/pager";
import { Project, StarterKitItem } from "@/lib/data";
import { FreeStarterSection } from "@/components/free-starter-section";
import { JourneyGlyph } from "@/components/journey-glyph";
import { ProjectCard, ProjectCardData } from "@/components/pages/projects/project-card";
import { TryPlaygroundButton } from "@/components/projects/try-playground-button";

interface ProjectsPageProps {
  onNavigate: (path: string) => void;
}

type ProjectTab = "all" | "in_progress" | "completed" | "saved";

interface ProjectItem extends ProjectCardData {
  /** raw project for any downstream needs */
  raw: Project;
}

const TABS: { value: ProjectTab; label: string }[] = [
  { value: "all", label: "All projects" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "saved", label: "Saved" },
];

const PAGE_SIZE = 12;

const canonLevel = (raw?: string): string => {
  const l = (raw || "").toLowerCase();
  if (l.startsWith("beg")) return "Beginner";
  if (l.startsWith("adv")) return "Advanced";
  if (l.startsWith("inter")) return "Intermediate";
  return raw || "Intermediate";
};

export function ProjectsPage({ onNavigate }: ProjectsPageProps) {
  const store = useAppStore();
  const user = useUser();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [freeStarters, setFreeStarters] = useState<StarterKitItem[]>([]);
  const [savedSlugs, setSavedSlugs] = useState<Set<string>>(new Set());
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [tab, setTab] = useState<ProjectTab>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [result, bookmarksRes] = await Promise.all([
          store.getProjects({ page: 200, size: 0, filters: {} }),
          store.getBookmarks(200, 0).catch(() => ({ bookmarks: [] })),
        ]);

        const rawProjects: Project[] = result?.projects ?? [];
        const merged: ProjectItem[] = rawProjects.map((p) => {
          const completed = !!p.userProject?.completed;
          return {
            raw: p,
            id: p.id,
            slug: p.slug,
            title: p.title,
            description: p.summary ?? p.description,
            level: canonLevel(p.level),
            category: p.technologies?.[0] ?? null,
            tasks: p.totalTasks ?? 0,
            duration: p.timeframe ?? p.duration ?? "Self-paced",
            enrolled: !!p.userProject,
            completed,
            progress: completed ? 100 : (p.progress ?? 0),
          };
        });

        setProjects(merged);
        setFreeStarters((result as any)?.freeStarters ?? []);

        const saved = new Set<string>(
          (bookmarksRes?.bookmarks ?? [])
            .filter((b: any) => b?.project?.slug)
            .map((b: any) => b.project.slug as string),
        );
        setSavedSlugs(saved);

        analytics.page("Projects", { projects: merged.length });
      } catch (error) {
        console.error("Failed to load projects:", error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset to first page whenever filters change
  useEffect(() => {
    setPage(1);
  }, [search, levelFilter, categoryFilter, tab]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => p.category && set.add(p.category));
    return Array.from(set).sort();
  }, [projects]);

  const counts = useMemo(
    () => ({
      all: projects.length,
      in_progress: projects.filter((p) => p.enrolled && !p.completed).length,
      completed: projects.filter((p) => p.completed).length,
      saved: projects.filter((p) => savedSlugs.has(p.slug)).length,
    }),
    [projects, savedSlugs],
  );

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesSearch =
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q);
      const matchesLevel =
        levelFilter === "all" ||
        p.level.toLowerCase() === levelFilter.toLowerCase();
      const matchesCategory = !categoryFilter || p.category === categoryFilter;
      const matchesTab =
        tab === "all" ||
        (tab === "in_progress" && p.enrolled && !p.completed) ||
        (tab === "completed" && p.completed) ||
        (tab === "saved" && savedSlugs.has(p.slug));
      return matchesSearch && matchesLevel && matchesCategory && matchesTab;
    });
  }, [projects, search, levelFilter, categoryFilter, tab, savedSlugs]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const hasActiveFilters =
    !!search || levelFilter !== "all" || !!categoryFilter || tab !== "all";

  const showFreeStarters =
    freeStarters.length > 0 &&
    tab === "all" &&
    !search &&
    !categoryFilter &&
    levelFilter === "all";

  const goToProject = (p: ProjectItem) => {
    analytics.track(PROJECT_EVENTS.cardClicked, {
      slug: p.slug,
      enrolled: p.enrolled,
      level: p.level,
    });
    // free → detail; pro/enterprise → enroll + first task; enrolled → resume.
    startItem({
      type: "project",
      slug: p.slug,
      id: p.id,
      enrolled: p.enrolled,
      completed: p.completed,
      isPremiumUser: !!user?.isPremium,
      store,
      onNavigate,
    });
  };

  const toggleSave = async (p: ProjectItem) => {
    if (savingSlug) return;
    const isSaved = savedSlugs.has(p.slug);
    setSavingSlug(p.slug);
    // optimistic
    setSavedSlugs((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(p.slug);
      else next.add(p.slug);
      return next;
    });
    try {
      if (isSaved) {
        await store.deleteBookmark({ projectId: p.id });
      } else {
        await store.createBookmark({
          type: "PROJECT",
          bookmarkType: "BOOKMARK",
          projectId: p.id,
        });
      }
      analytics.track(PROJECT_EVENTS.bookmarkToggled, {
        slug: p.slug,
        saved: !isSaved,
      });
    } catch (e) {
      // revert on failure
      setSavedSlugs((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(p.slug);
        else next.delete(p.slug);
        return next;
      });
    } finally {
      setSavingSlug(null);
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* ── Blueprint hero (navy anchor · build pillar) ── */}
      <div className="bg-[#0E1F33] dark:bg-[#080F1A] text-white relative overflow-hidden dark:ring-1 dark:ring-white/10">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="relative px-5 py-6 sm:px-8 sm:py-7">
          <JourneyGlyph
            stage="build"
            className="absolute right-4 top-4 w-20 opacity-40 md:right-10 md:top-1/2 md:w-60 md:-translate-y-1/2 md:opacity-100"
          />
          <div className="max-w-2xl">
            <div className="eyebrow-mono text-[#4AC5E8]">build</div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-1.5">Projects</h1>
            <p className="mt-2.5 text-[15px] leading-relaxed text-white/[.78]">
              Build real-world backend projects. Ship working code against a
              live sandbox and grow a portfolio that proves you can do the job.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => onNavigate("/projects/submissions")}
                className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold px-5 py-2.5 text-sm hover:bg-primary/90 transition"
              >
                <DownloadCloud className="w-4 h-4" />
                My Submissions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div>
        {/* Playground banner — quick on-ramp for new learners */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-foreground">
            New here?{" "}
            <span className="text-muted-foreground">
              Try the playground in 60 seconds.
            </span>
          </p>
          <TryPlaygroundButton source="listing" className="shrink-0" />
        </div>

        {/* Filter row */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center flex-wrap mb-6">
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="pl-9 pr-4 py-2 w-full sm:w-72 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                if (t.value !== tab) {
                  analytics.track("project_tab_changed", {
                    tab: t.value,
                    from: tab,
                  });
                }
                setTab(t.value);
              }}
              className={cn(
                "rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
                tab === t.value
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              {t.label} <span className="opacity-70">{counts[t.value]}</span>
            </button>
          ))}

          <div className="w-full sm:w-auto sm:ml-auto">
            <Select
              value={levelFilter}
              onValueChange={(v) => {
                setLevelFilter(v);
                analytics.track(PROJECT_EVENTS.filterApplied, {
                  filter_type: "level",
                  value: v,
                });
              }}
            >
              <SelectTrigger className="w-[140px] rounded-xl">
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category pills */}
        {(tab === "all" || tab === "saved") && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 py-2 mb-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  const next = categoryFilter === cat ? "" : cat;
                  setCategoryFilter(next);
                  analytics.track(PROJECT_EVENTS.filterApplied, {
                    filter_type: "category",
                    value: next || "all",
                  });
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-full border text-sm transition-all whitespace-nowrap",
                  categoryFilter === cat
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Free starter kits — only on the unfiltered "all" view */}
        {showFreeStarters && (
          <div className="mb-6 space-y-6">
            <FreeStarterSection items={freeStarters} type="project" />
            <div className="relative flex items-center gap-4">
              <div className="flex-1 border-t" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                All Projects
              </span>
              <div className="flex-1 border-t" />
            </div>
          </div>
        )}

        {/* Grid / empty states */}
        {projects.length === 0 ? (
          <EmptyState
            icon={<Code2 className="h-12 w-12 text-muted-foreground mb-4" />}
            title="No Projects Available"
            subtitle="More projects are on the way. Check back soon."
          />
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            icon={<Search className="h-12 w-12 text-muted-foreground mb-4" />}
            title="No projects match your filters"
            subtitle="Try adjusting your search or filters to find what you're looking for."
            action={
              hasActiveFilters ? (
                <button
                  onClick={() => {
                    setSearch("");
                    setLevelFilter("all");
                    setCategoryFilter("");
                    setTab("all");
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:border-primary/30 hover:text-primary transition-colors"
                >
                  <X className="h-4 w-4" /> Clear filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedProjects.map((p) => (
                <ProjectCard
                  key={p.slug}
                  project={p}
                  isSaved={savedSlugs.has(p.slug)}
                  isSaving={savingSlug === p.slug}
                  onToggleSave={() => toggleSave(p)}
                  onSelect={() => goToProject(p)}
                  onOpenDetail={() => onNavigate(`/projects/${p.slug}`)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <Pager
                hasPrev={currentPage > 1}
                hasNext={currentPage < totalPages}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex flex-col items-center justify-center py-12 px-6">
        {icon}
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-center max-w-md mb-4">
          {subtitle}
        </p>
        {action}
      </div>
    </div>
  );
}
