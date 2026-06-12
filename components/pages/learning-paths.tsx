"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Route, X, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ui/loader";
import { PathCard, PathCardData } from "@/components/pages/paths/path-card";
import { JourneyGlyph } from "@/components/journey-glyph";

interface LearningPathsPageProps {
  onNavigate?: (url: string) => void;
}

type PathTab = "all" | "in_progress" | "completed" | "saved";

interface PathItem extends PathCardData {
  /** real Roadmap.id (uuid) — used for bookmarking */
  roadmapId: string;
}

interface OverviewStats {
  totalPaths: number;
  totalLearners: number;
  totalContentHours: number;
  certificatesIssued: number;
}

const TABS: { value: PathTab; label: string }[] = [
  { value: "all", label: "All paths" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "saved", label: "Saved" },
];

const PAGE_SIZE = 12;

function compactNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `${n}`;
}

export function LearningPathsPage({ onNavigate }: LearningPathsPageProps) {
  const store = useAppStore();
  const [paths, setPaths] = useState<PathItem[]>([]);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [savedSlugs, setSavedSlugs] = useState<Set<string>>(new Set());
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [tab, setTab] = useState<PathTab>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [result, overview, bookmarksRes] = await Promise.all([
          store.getRoadmaps({ skip: 0, size: 50 }),
          store.getPathsOverview().catch(() => null),
          store.getBookmarks(50, 0).catch(() => ({ bookmarks: [] })),
        ]);

        const roadmaps = result?.roadmaps ?? result ?? [];
        const merged: PathItem[] = (roadmaps || []).map((r: any) => {
          const topics = r.topics || [];
          const totalDuration = topics.reduce(
            (s: number, t: any) => s + (t.duration || 0),
            0,
          );
          return {
            roadmapId: r.id,
            slug: r.slug,
            title: r.title,
            description: r.summary,
            level: topics[0]?.level || "Intermediate",
            category: r.category ?? null,
            courses: topics.flatMap(
              (t: any) => t.courses?.map((c: any) => c.id) || [],
            ).length,
            milestones: topics.length,
            estimatedWeeks: r.estimatedWeeks ?? 0,
            hoursPerWeek: r.hoursPerWeek ?? 0,
            estimatedTime:
              totalDuration > 0
                ? `${Math.ceil(totalDuration / 4)} months`
                : "Self-paced",
            progress: r.userRoadmap?.isCompleted
              ? 100
              : (r.stepProgress ?? r.progress ?? 0),
            enrolled: r.enrolled ?? false,
          };
        });

        setPaths(merged);
        if (overview?.stats) setStats(overview.stats);

        const saved = new Set<string>(
          (bookmarksRes?.bookmarks ?? [])
            .filter((b: any) => b?.roadmap?.slug)
            .map((b: any) => b.roadmap.slug as string),
        );
        setSavedSlugs(saved);

        analytics.page("Learning Paths", { paths: merged.length });
      } catch (error) {
        console.error("Failed to load learning paths:", error);
        setPaths([]);
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search analytics
  useEffect(() => {
    if (!search) return;
    const t = setTimeout(() => {
      analytics.track("path_filter_applied", {
        filter_type: "search",
        value: search.length,
      });
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to first page whenever filters change
  useEffect(() => {
    setPage(1);
  }, [search, levelFilter, categoryFilter, tab]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    paths.forEach((p) => p.category && set.add(p.category));
    return Array.from(set).sort();
  }, [paths]);

  const counts = useMemo(
    () => ({
      all: paths.length,
      in_progress: paths.filter((p) => p.enrolled && p.progress < 100).length,
      completed: paths.filter((p) => p.progress >= 100).length,
      saved: paths.filter((p) => savedSlugs.has(p.slug)).length,
    }),
    [paths, savedSlugs],
  );

  const filteredPaths = useMemo(() => {
    const q = search.trim().toLowerCase();
    return paths.filter((p) => {
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
        (tab === "in_progress" && p.enrolled && p.progress < 100) ||
        (tab === "completed" && p.progress >= 100) ||
        (tab === "saved" && savedSlugs.has(p.slug));
      return matchesSearch && matchesLevel && matchesCategory && matchesTab;
    });
  }, [paths, search, levelFilter, categoryFilter, tab, savedSlugs]);

  const totalPages = Math.max(1, Math.ceil(filteredPaths.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedPaths = filteredPaths.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const hasActiveFilters =
    !!search || levelFilter !== "all" || !!categoryFilter || tab !== "all";

  const goToPath = (p: PathItem) => {
    analytics.track("path_card_clicked", {
      slug: p.slug,
      enrolled: p.enrolled,
      level: p.level,
    });
    // In-progress learners land straight in the workspace; everyone else
    // (not enrolled / completed) goes to the detail page.
    onNavigate?.(
      p.enrolled && p.progress < 100
        ? routes.pathWorkspace(p.slug)
        : routes.pathDetail(p.slug),
    );
  };

  const toggleSave = async (p: PathItem) => {
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
        await store.deleteBookmark({ roadmapId: p.roadmapId });
      } else {
        await store.createBookmark({
          type: "ROADMAP",
          bookmarkType: "BOOKMARK",
          roadmapId: p.roadmapId,
        });
      }
      analytics.track("path_bookmark_toggled", {
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

  if (loading) return <Loader isLoader={false} />;

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      {/* ── Blueprint hero (navy anchor · grid lives here only) ── */}
      <div className="bg-[#0E1F33] text-white relative overflow-hidden dark:ring-1 dark:ring-white/10">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="relative px-5 py-6 sm:px-8 sm:py-7">
          <JourneyGlyph
            stage="learn"
            className="absolute right-10 top-1/2 -translate-y-1/2 hidden md:block"
          />
          <div className="max-w-2xl">
            <div className="eyebrow-mono text-[#4AC5E8]">learn</div>
            <div className="flex items-center gap-3 flex-wrap mt-1.5">
              <h1 className="text-2xl font-bold">Learning Paths</h1>
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-full bg-[#13AECE]/[.18] text-[#4AC5E8]">
                <Flag className="w-3.5 h-3.5" /> Mastery-gated
              </span>
            </div>
            <p className="mt-2.5 text-[15px] leading-relaxed text-white/[.78]">
              Structured, mentor-designed journeys — go from fundamentals to
              job-ready, one mastered milestone at a time.
            </p>
            {stats && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3.5 text-sm text-white/[.65]">
                <span>
                  <span className="font-semibold text-white">
                    {stats.totalPaths}
                  </span>{" "}
                  paths
                </span>
                <span className="opacity-40 text-xs">·</span>
                <span>
                  <span className="font-semibold text-white">
                    {compactNumber(stats.totalLearners)}
                  </span>{" "}
                  learners
                </span>
                <span className="opacity-40 text-xs">·</span>
                <span>
                  <span className="font-semibold text-white">
                    {stats.totalContentHours}h
                  </span>{" "}
                  of content
                </span>
                {stats.certificatesIssued > 0 && (
                  <>
                    <span className="opacity-40 text-xs">·</span>
                    <span>
                      <span className="font-semibold text-emerald-400">
                        {compactNumber(stats.certificatesIssued)}
                      </span>{" "}
                      certificates earned
                    </span>
                  </>
                )}
                {counts.in_progress > 0 && (
                  <>
                    <span className="opacity-40 text-xs">·</span>
                    <span>
                      <span className="font-semibold text-white">
                        {counts.in_progress}
                      </span>{" "}
                      active
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div>
        {/* Filter row */}
        <div className="flex gap-3 items-center flex-wrap mb-6">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search paths…"
              className="pl-9 pr-4 py-2 w-72 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                if (t.value !== tab) {
                  analytics.track("path_tab_changed", {
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

          <div className="ml-auto">
            <Select
              value={levelFilter}
              onValueChange={(v) => {
                setLevelFilter(v);
                analytics.track("path_filter_applied", {
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

        {/* Category pills — only when paths carry categories (mirrors mock-interviews) */}
        {(tab === "all" || tab === "saved") && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 py-2 mb-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  const next = categoryFilter === cat ? "" : cat;
                  setCategoryFilter(next);
                  analytics.track("path_filter_applied", {
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

        {/* Grid / empty states */}
        {paths.length === 0 ? (
          <EmptyState
            icon={<Route className="h-12 w-12 text-muted-foreground mb-4" />}
            title="No Learning Paths Available"
            subtitle="Check back soon! We're constantly adding new learning paths to help you grow your skills."
          />
        ) : filteredPaths.length === 0 ? (
          <EmptyState
            icon={<Search className="h-12 w-12 text-muted-foreground mb-4" />}
            title="No paths match your filters"
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
              {paginatedPaths.map((p) => (
                <PathCard
                  key={p.slug}
                  path={p}
                  isSaved={savedSlugs.has(p.slug)}
                  isSaving={savingSlug === p.slug}
                  onToggleSave={() => toggleSave(p)}
                  onSelect={() => goToPath(p)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page <span className="font-semibold text-foreground">{currentPage}</span> of{" "}
                  {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
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


