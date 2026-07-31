"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Search,
  Crown,
  Play,
  Bookmark,
} from "lucide-react";
import { routes } from "@/lib/routes";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Pager } from "@/components/ui/pager";
import {
  Course,
  CourseFilterOptions,
  CourseFiltersData,
  Meta,
  StarterKitItem,
  UserCourse,
} from "@/lib/data";
import { useUser } from "@/hooks/use-user";
import { useAppStore } from "@/lib/store";
import { CoursesSkeleton } from "./courses-skeleton";
import { FreeStarterSection } from "@/components/free-starter-section";
import { JourneyGlyph } from "@/components/journey-glyph";
import { CourseCard } from "@/components/pages/courses/course-card";
import { startItem } from "@/lib/start-flow";

interface CoursesPageProps {
  onNavigate: (path: string) => void;
  onFilter: (filters: CourseFilterOptions) => void;
}

const PAGE_SIZE = 9;

function toEnrolledCourse(uc: UserCourse): Course {
  return {
    ...(uc.course as Course),
    enrolled: true,
    progress: uc.progress ?? 0,
  };
}

// ─── Professional Pagination ─────────────────────────────────────────────────

function Pagination({
  page,
  meta,
  onPage,
}: {
  page: number;
  meta?: Meta;
  onPage: (p: number) => void;
  itemLabel?: string;
}) {
  if (!meta || !meta.netTotal) return null;

  const totalPages = Math.ceil(meta.netTotal / PAGE_SIZE);
  if (totalPages <= 1) return null;

  return (
    <Pager
      hasPrev={page > 0}
      hasNext={page < totalPages - 1}
      onPrev={() => onPage(page - 1)}
      onNext={() => onPage(page + 1)}
    />
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

// ─── Page ────────────────────────────────────────────────────────────────────

export function CoursesPage({ onNavigate }: CoursesPageProps) {
  const user = useUser();

  // Search input value (live) vs debounced value (used in API calls)
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [level, setLevel] = useState("");
  const [category, setCategory] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [filterOptions, setFilterOptions] = useState<CourseFiltersData>({
    categories: [],
    tags: [],
  });
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [tab, setTab] = useState("all-courses");
  const store = useAppStore();

  // All courses
  const [courses, setCourses] = useState<Course[]>([]);
  const [meta, setMeta] = useState<Meta>();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [freeStarters, setFreeStarters] = useState<StarterKitItem[]>([]);

  // My courses
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
  const [userCourseMeta, setUserCourseMeta] = useState<Meta>();
  const [userLoading, setUserLoading] = useState(false);
  const [userPage, setUserPage] = useState(0);

  // Popular
  const [popularCourses, setPopularCourses] = useState<Course[]>([]);
  const [popularMeta, setPopularMeta] = useState<Meta>();
  const [popularLoading, setPopularLoading] = useState(false);
  const [popularPage, setPopularPage] = useState(0);

  // New releases
  const [newCourses, setNewCourses] = useState<Course[]>([]);
  const [newMeta, setNewMeta] = useState<Meta>();
  const [newLoading, setNewLoading] = useState(false);
  const [newPage, setNewPage] = useState(0);

  // Saved (bookmarked) courses
  const [savedCourses, setSavedCourses] = useState<Course[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedLoading, setSavedLoading] = useState(false);

  // Read tab from URL on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const tabParam = new URLSearchParams(window.location.search).get("tab");
      if (tabParam) setTab(tabParam);
    }
  }, []);

  // Debounce search — reset all filterable tabs to page 0
  const handleSearchInput = (value: string) => {
    setSearchInput(value);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setSearchQuery(value);
      setPage(0);
      setUserPage(0);
    }, 350);
  };

  const handleLevelChange = (v: string) => {
    setLevel(v);
    setPage(0);
    setUserPage(0);
  };
  const handleCategoryChange = (v: string) => {
    setCategory(v);
    setPage(0);
    setUserPage(0);
  };
  const handleTagChange = (v: string) => {
    setSelectedTag(v);
    setPage(0);
    setUserPage(0);
  };

  const handleTabChange = (newTab: string) => {
    setTab(newTab);
    if (newTab === "my-courses") setUserPage(0);
    if (newTab === "popular") setPopularPage(0);
    if (newTab === "new") setNewPage(0);
    if (newTab === "all-courses") setPage(0);
  };

  // Load filter options (categories + tags) once on mount
  useEffect(() => {
    store
      .getCoursesFilters()
      .then((filters) => {
        setFilterOptions(
          Array.isArray(filters?.categories)
            ? filters
            : { categories: [], tags: [] },
        );
      })
      .catch((error) => {
        console.error("Failed to load course filters:", error);
        // Keep empty filters as fallback
      });
  }, [store]);

  // ── All courses ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const filters: CourseFilterOptions = {};
      if (searchQuery) filters.terms = searchQuery;
      if (level && level !== "all") filters.level = level;
      if (category && category !== "all") filters.category = category;
      if (selectedTag && selectedTag !== "all") filters.tag = selectedTag;

      const res = await store.getCourses({
        size: String(PAGE_SIZE),
        skip: String(page * PAGE_SIZE),
        ...(Object.keys(filters).length && { filters }),
      });
      if (!cancelled) {
        setCourses(res?.courses ?? []);
        setMeta(res?.meta);
        const hasFilters =
          searchQuery ||
          (level && level !== "all") ||
          (category && category !== "all") ||
          (selectedTag && selectedTag !== "all");
        if (page === 0 && !hasFilters) {
          setFreeStarters((res as any)?.freeStarters ?? []);
        } else if (hasFilters) {
          setFreeStarters([]);
        }
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [page, searchQuery, level, category, selectedTag]);

  // ── My courses ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!tab.includes("my-courses")) return;
    let cancelled = false;
    async function load() {
      setUserLoading(true);
      const filters: CourseFilterOptions = {};
      if (searchQuery) filters.terms = searchQuery;
      if (level && level !== "all") filters.level = level;
      if (category && category !== "all") filters.category = category;
      const res = await store.getUserCourses({
        size: String(PAGE_SIZE),
        skip: String(userPage * PAGE_SIZE),
        ...(Object.keys(filters).length && { filters }),
      });
      if (!cancelled) {
        setUserCourses(res?.userCourses ?? []);
        setUserCourseMeta(res?.meta);
        setUserLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [tab, userPage, searchQuery, level, category]);

  // ── Popular ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!tab.includes("popular")) return;
    let cancelled = false;
    async function load() {
      setPopularLoading(true);
      const res = await store.getCourses({
        size: String(PAGE_SIZE),
        skip: String(popularPage * PAGE_SIZE),
        filters: { tab: "popular" },
      });
      if (!cancelled) {
        setPopularCourses(res?.courses ?? []);
        setPopularMeta(res?.meta);
        setPopularLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [tab, popularPage]);

  // ── New releases ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!tab.includes("new")) return;
    let cancelled = false;
    async function load() {
      setNewLoading(true);
      const res = await store.getCourses({
        size: String(PAGE_SIZE),
        skip: String(newPage * PAGE_SIZE),
        filters: { sortBy: "createdAt", desc: true },
      });
      if (!cancelled) {
        setNewCourses(res?.courses ?? []);
        setNewMeta(res?.meta);
        setNewLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [tab, newPage]);

  // ── Saved (bookmarked) courses ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setSavedLoading(true);
      const res = await store
        .getBookmarks(200, 0)
        .catch(() => ({ bookmarks: [] as any[] }));
      if (cancelled) return;
      const courseBookmarks = (res?.bookmarks ?? []).filter(
        (b: any) => b?.course?.id,
      );
      setSavedCourses(courseBookmarks.map((b: any) => b.course as Course));
      setSavedIds(new Set(courseBookmarks.map((b: any) => b.course.id as string)));
      setSavedLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [store]);

  const toggleSave = async (course: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    if (savingId) return;
    const id = course.id;
    const isSaved = savedIds.has(id);
    setSavingId(id);
    // optimistic
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(id);
      else next.add(id);
      return next;
    });
    setSavedCourses((prev) =>
      isSaved ? prev.filter((c) => c.id !== id) : [course, ...prev],
    );
    try {
      if (isSaved) {
        await store.deleteBookmark({ courseId: id });
      } else {
        await store.createBookmark({
          type: "COURSE",
          bookmarkType: "BOOKMARK",
          courseId: id,
        });
      }
    } catch {
      // revert on failure
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(id);
        else next.delete(id);
        return next;
      });
      setSavedCourses((prev) =>
        isSaved ? [course, ...prev] : prev.filter((c) => c.id !== id),
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleViewDetails = (slug: string) =>
    onNavigate(routes.courseDetail(slug));
  const handleContinue = (slug: string) =>
    onNavigate(routes.courseDetail(slug));

  // Tier-aware Start/Continue: free → detail; pro/enterprise → enroll + first lesson.
  const startCourse = (c: Course) =>
    startItem({
      type: "course",
      slug: c.slug,
      id: c.id,
      enrolled: !!c.enrolled,
      isPremiumUser: !!user?.isPremium,
      store,
      onNavigate,
    });

  const clearFilters = () => {
    handleSearchInput("");
    handleLevelChange("all");
    handleCategoryChange("all");
    handleTagChange("all");
  };

  return (
    <Tabs className="space-y-6" value={tab} onValueChange={handleTabChange}>
      <div className="space-y-6">
        {/* ── Blueprint hero (navy anchor · learn pillar) ── */}
        <div className="bg-[#0E1F33] dark:bg-[#080F1A] text-white relative overflow-hidden dark:ring-1 dark:ring-white/10">
          <div className="hero-grid absolute inset-0" aria-hidden="true" />
          <div className="relative px-5 py-6 sm:px-8 sm:py-7 md:min-h-[174px] flex flex-col justify-center">
            <JourneyGlyph
              stage="learn"
              className="absolute right-4 top-4 w-20 opacity-40 md:right-10 md:top-1/2 md:w-60 md:-translate-y-1/2 md:opacity-100"
            />
            <div className="max-w-2xl">
              <div className="eyebrow-mono text-[#4AC5E8]">learn</div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-1.5">Courses</h1>
              <p className="mt-2.5 text-[15px] leading-relaxed text-white/[.78]">
                Master backend development with our comprehensive course
                library.
              </p>
            </div>
          </div>
        </div>

        {/* Upgrade Banner */}
        {!user?.isPremium && (
          <Card className="rounded-2xl border-amber-400/30 bg-amber-400/5">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Crown className="h-6 w-6 md:h-8 md:w-8 text-amber-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm md:text-base">
                      Unlock All Courses with Pro
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Get unlimited access to all courses, bootcamps, and
                      learning paths
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => onNavigate(routes.subscriptionPlans)}
                  className="w-full md:w-auto"
                >
                  Upgrade Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Filter row (mirrors paths/mock-interviews) ── */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center flex-wrap">
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search courses…"
              className="pl-9 pr-4 py-2 w-full sm:w-72 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {(
            [
              { value: "all-courses", label: "All courses", count: meta?.netTotal },
              { value: "my-courses", label: "My courses", count: userCourseMeta?.netTotal },
              { value: "popular", label: "Popular", count: popularMeta?.netTotal },
              { value: "new", label: "New releases", count: newMeta?.netTotal },
              { value: "saved", label: "Saved", count: savedIds.size },
            ] as { value: string; label: string; count?: number }[]
          ).map((t) => (
            <button
              key={t.value}
              onClick={() => handleTabChange(t.value)}
              className={
                tab === t.value
                  ? "rounded-xl px-3.5 py-2 text-sm font-medium transition-colors bg-primary text-primary-foreground"
                  : "rounded-xl px-3.5 py-2 text-sm font-medium transition-colors border border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }
            >
              {t.label}{" "}
              {t.count != null && <span className="opacity-70">{t.count}</span>}
            </button>
          ))}

          <div className="w-full sm:w-auto sm:ml-auto flex flex-wrap gap-2">
            <Select value={level} onValueChange={handleLevelChange}>
              <SelectTrigger className="w-[130px] rounded-xl">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedTag} onValueChange={handleTagChange}>
              <SelectTrigger className="w-[130px] rounded-xl">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {(filterOptions.tags ?? []).map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Category pills (mirror mock-interviews) ── */}
        {(filterOptions.categories ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(filterOptions.categories ?? []).map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  handleCategoryChange(category === cat.id ? "all" : cat.id)
                }
                className={
                  category === cat.id
                    ? "px-3.5 py-1.5 rounded-full border text-sm transition-all whitespace-nowrap border-primary bg-primary/10 text-primary font-medium"
                    : "px-3.5 py-1.5 rounded-full border text-sm transition-all whitespace-nowrap border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* ── All Courses ───────────────────────────────────────────────────── */}
        <TabsContent value="all-courses" className="space-y-6">
          {loading ? (
            <CoursesSkeleton />
          ) : (
            <>
              {freeStarters.length > 0 && (
                <>
                  <FreeStarterSection items={freeStarters} type="course" />
                  <div className="relative flex items-center gap-4">
                    <div className="flex-1 border-t" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                      All Courses
                    </span>
                    <div className="flex-1 border-t" />
                  </div>
                </>
              )}
              {courses.length === 0 ? (
                <EmptyState
                  icon={
                    <Search className="h-12 w-12 text-muted-foreground mb-4" />
                  }
                  title="No courses match your filters"
                  subtitle="Try adjusting your search or filters to find what you're looking for."
                  action={
                    <button
                      onClick={clearFilters}
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:border-primary/30 hover:text-primary transition-colors"
                    >
                      Clear filters
                    </button>
                  }
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onViewDetails={handleViewDetails}
                      onContinue={handleContinue}
                      onStart={() => startCourse(course)}
                      isSaved={savedIds.has(course.id)}
                      isSaving={savingId === course.id}
                      onToggleSave={(e) => toggleSave(course, e)}
                    />
                  ))}
                </div>
              )}
              <Pagination page={page} meta={meta} onPage={setPage} />
            </>
          )}
        </TabsContent>

        {/* ── My Courses ────────────────────────────────────────────────────── */}
        <TabsContent value="my-courses" className="space-y-6">
          {userLoading ? (
            <CoursesSkeleton />
          ) : (
            <>
              {userCourses.length === 0 ? (
                <EmptyState
                  icon={
                    <Play className="h-12 w-12 text-muted-foreground mb-4" />
                  }
                  title="No enrolled courses yet"
                  subtitle="Start a course from the catalog and it will show up here with your progress."
                  action={
                    <button
                      onClick={() => handleTabChange("all-courses")}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Browse courses
                    </button>
                  }
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {userCourses.map((userCourse: UserCourse) => {
                    const c = toEnrolledCourse(userCourse);
                    return (
                      <CourseCard
                        key={userCourse.id}
                        course={c}
                        onViewDetails={handleViewDetails}
                        onContinue={handleContinue}
                        onStart={() => startCourse(c)}
                        isSaved={savedIds.has(c.id)}
                        isSaving={savingId === c.id}
                        onToggleSave={(e) => toggleSave(c, e)}
                      />
                    );
                  })}
                </div>
              )}
              <Pagination
                page={userPage}
                meta={userCourseMeta}
                onPage={setUserPage}
                itemLabel="enrolled courses"
              />
            </>
          )}
        </TabsContent>

        {/* ── Popular ───────────────────────────────────────────────────────── */}
        <TabsContent value="popular" className="space-y-6">
          {popularLoading ? (
            <CoursesSkeleton />
          ) : (
            <>
              {popularCourses.length === 0 ? (
                <EmptyState
                  icon={
                    <Search className="h-12 w-12 text-muted-foreground mb-4" />
                  }
                  title="No popular courses found"
                  subtitle="Check back soon — popular courses update as learners enroll."
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {popularCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onViewDetails={handleViewDetails}
                      onContinue={handleContinue}
                      onStart={() => startCourse(course)}
                      isSaved={savedIds.has(course.id)}
                      isSaving={savingId === course.id}
                      onToggleSave={(e) => toggleSave(course, e)}
                    />
                  ))}
                </div>
              )}
              <Pagination
                page={popularPage}
                meta={popularMeta}
                onPage={setPopularPage}
                itemLabel="popular courses"
              />
            </>
          )}
        </TabsContent>

        {/* ── New Releases ──────────────────────────────────────────────────── */}
        <TabsContent value="new" className="space-y-6">
          {newLoading ? (
            <CoursesSkeleton />
          ) : (
            <>
              {newCourses.length === 0 ? (
                <EmptyState
                  icon={
                    <Search className="h-12 w-12 text-muted-foreground mb-4" />
                  }
                  title="No new releases right now"
                  subtitle="We're constantly adding new courses — check back soon."
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {newCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onViewDetails={handleViewDetails}
                      onContinue={handleContinue}
                      onStart={() => startCourse(course)}
                      isSaved={savedIds.has(course.id)}
                      isSaving={savingId === course.id}
                      onToggleSave={(e) => toggleSave(course, e)}
                    />
                  ))}
                </div>
              )}
              <Pagination
                page={newPage}
                meta={newMeta}
                onPage={setNewPage}
                itemLabel="new releases"
              />
            </>
          )}
        </TabsContent>

        {/* ── Saved ─────────────────────────────────────────────────────────── */}
        <TabsContent value="saved" className="space-y-6">
          {savedLoading ? (
            <CoursesSkeleton />
          ) : savedCourses.length === 0 ? (
            <EmptyState
              icon={<Bookmark className="h-12 w-12 text-muted-foreground mb-4" />}
              title="No saved courses yet"
              subtitle="Bookmark courses by clicking the bookmark icon on any card."
              action={
                <button
                  onClick={() => handleTabChange("all-courses")}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Browse courses
                </button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {savedCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onViewDetails={handleViewDetails}
                  onContinue={handleContinue}
                  onStart={() => startCourse(course)}
                  isSaved={savedIds.has(course.id)}
                  isSaving={savingId === course.id}
                  onToggleSave={(e) => toggleSave(course, e)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </div>
    </Tabs>
  );
}
