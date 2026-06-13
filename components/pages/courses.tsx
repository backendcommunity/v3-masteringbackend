"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  Search,
  Crown,
  ChevronLeft,
  ChevronRight,
  Play,
  Clock,
} from "lucide-react";
import { routes } from "@/lib/routes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Loader } from "../ui/loader";
import { FreeStarterSection } from "@/components/free-starter-section";
import { JourneyGlyph } from "@/components/journey-glyph";
import { stripHtmlTags } from "@/lib/html-utils";

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

function buildPageList(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);

  const visible = new Set(
    [0, current - 1, current, current + 1, total - 1].filter(
      (p) => p >= 0 && p < total,
    ),
  );
  const sorted = Array.from(visible).sort((a, b) => a - b);
  const result: (number | "...")[] = [];
  let prev = -1;
  for (const p of sorted) {
    if (prev >= 0 && p - prev > 1) result.push("...");
    result.push(p);
    prev = p;
  }
  return result;
}

function Pagination({
  page,
  meta,
  onPage,
  itemLabel = "courses",
}: {
  page: number;
  meta?: Meta;
  onPage: (p: number) => void;
  itemLabel?: string;
}) {
  if (!meta || !meta.netTotal) return null;

  const totalPages = Math.ceil(meta.netTotal / PAGE_SIZE);
  const start = page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, meta.netTotal);
  const pages = buildPageList(page, totalPages);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t mt-2">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{start}</span>–
        <span className="font-medium text-foreground">{end}</span> of{" "}
        <span className="font-medium text-foreground">{meta.netTotal}</span>{" "}
        {itemLabel}
      </p>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={page === 0}
            onClick={() => onPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {pages.map((p, i) =>
            p === "..." ? (
              <span
                key={`ellipsis-${i}`}
                className="w-8 text-center text-sm text-muted-foreground"
              >
                …
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0 text-xs"
                onClick={() => onPage(p as number)}
              >
                {(p as number) + 1}
              </Button>
            ),
          )}

          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={page >= totalPages - 1}
            onClick={() => onPage(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Course Card ─────────────────────────────────────────────────────────────

const COURSE_LEVEL_STYLES: Record<string, { pill: string; dot: string }> = {
  Beginner: {
    pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  Intermediate: {
    pill: "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  Advanced: {
    pill: "bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300",
    dot: "bg-red-500",
  },
};

function CourseCard({
  course,
  onViewDetails,
  onContinue,
}: {
  course: Course;
  onViewDetails: (slug: string) => void;
  onContinue: (slug: string) => void;
}) {
  const typeLabel =
    course.type === "WORKSHOP"
      ? "Workshop"
      : course.type === "VIDEO"
        ? "Course"
        : "Tutorial";
  const levelStyle = COURSE_LEVEL_STYLES[course.level ?? ""] ?? {
    pill: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  };

  return (
    <div
      onClick={() => onViewDetails(course.slug)}
      className="group bg-card rounded-2xl border border-border flex flex-col cursor-pointer hover:shadow-md hover:border-primary/30 transition-all p-5"
    >
      {/* Meta line: type · category */}
      <div className="flex items-center gap-1.5 min-w-0 text-[11px]">
        <span className="text-muted-foreground font-medium truncate">
          {typeLabel}
        </span>
        <span className="text-muted-foreground/40 shrink-0">·</span>
        <span className="text-muted-foreground font-medium truncate">
          {course.category?.name ?? "Backend"}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-bold text-foreground text-[15px] mt-1 leading-snug line-clamp-2">
        {course.title}
      </h3>

      {/* Description */}
      <p className="text-muted-foreground text-[13px] line-clamp-4 mt-2 leading-relaxed flex-1">
        {stripHtmlTags(course.summary ?? course.description ?? "")}
      </p>

      {/* Progress (enrolled only) */}
      {course.enrolled && (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Progress</span>
            <span className="font-semibold text-foreground">
              {Math.floor(course.progress ?? 0)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${course.progress ?? 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-border/50 flex items-center justify-between pt-3 mt-3">
        <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          {course.totalDuration} hr
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${levelStyle.pill}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${levelStyle.dot}`} />
            {course.level ?? "All levels"}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              course.enrolled
                ? onContinue(course.slug)
                : onViewDetails(course.slug);
            }}
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {course.enrolled ? (
              <Play className="w-2.5 h-2.5" />
            ) : (
              <ChevronRight className="w-2.5 h-2.5" />
            )}
            {course.enrolled ? "Continue" : "Start"}
          </button>
        </div>
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

  const handleViewDetails = (slug: string) =>
    onNavigate(routes.courseDetail(slug));
  const handleContinue = (slug: string) =>
    onNavigate(routes.courseDetail(slug));

  return (
    <Tabs className="space-y-4" value={tab} onValueChange={handleTabChange}>
      <div className="flex-1 space-y-4 md:space-y-6">
        {/* ── Blueprint hero (navy anchor · learn pillar) ── */}
        <div className="bg-[#0E1F33] text-white relative overflow-hidden dark:ring-1 dark:ring-white/10">
          <div className="hero-grid absolute inset-0" aria-hidden="true" />
          <div className="relative px-5 py-6 sm:px-8 sm:py-7">
            <JourneyGlyph
              stage="learn"
              className="absolute right-10 top-1/2 -translate-y-1/2 hidden md:block"
            />
            <div className="max-w-2xl">
              <div className="eyebrow-mono text-[#4AC5E8]">learn</div>
              <h1 className="text-2xl font-bold mt-1.5">Courses</h1>
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
                  <Crown className="h-6 w-6 md:h-8 md:w-8 text-[#F2C94C] flex-shrink-0" />
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

        {/* Tabs + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <div className="flex-1">
            <TabsList>
              <TabsTrigger value="all-courses">
                All Courses ({meta?.netTotal ?? 0})
              </TabsTrigger>
              <TabsTrigger value="my-courses">My Courses</TabsTrigger>
              <TabsTrigger value="popular">Popular</TabsTrigger>
              <TabsTrigger value="new">New Releases</TabsTrigger>
            </TabsList>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search courses..."
              className="pl-8"
            />
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Select value={level} onValueChange={handleLevelChange}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {(filterOptions.categories ?? []).map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTag} onValueChange={handleTagChange}>
              <SelectTrigger className="w-[130px]">
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

        {/* ── All Courses ───────────────────────────────────────────────────── */}
        <TabsContent value="all-courses" className="space-y-4">
          {loading ? (
            <Loader isLoader={false} />
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
              <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onViewDetails={handleViewDetails}

                    onContinue={handleContinue}
                  />
                ))}
              </div>
              <Pagination page={page} meta={meta} onPage={setPage} />
            </>
          )}
        </TabsContent>

        {/* ── My Courses ────────────────────────────────────────────────────── */}
        <TabsContent value="my-courses" className="space-y-4">
          {userLoading ? (
            <Loader isLoader={false} />
          ) : (
            <>
              <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {userCourses.map((userCourse: UserCourse) => (
                  <CourseCard
                    key={userCourse.id}
                    course={toEnrolledCourse(userCourse)}
                    onViewDetails={handleViewDetails}

                    onContinue={handleContinue}
                  />
                ))}
              </div>
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
        <TabsContent value="popular" className="space-y-4">
          {popularLoading ? (
            <Loader isLoader={false} />
          ) : (
            <>
              <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {popularCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onViewDetails={handleViewDetails}

                    onContinue={handleContinue}
                  />
                ))}
              </div>
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
        <TabsContent value="new" className="space-y-4">
          {newLoading ? (
            <Loader isLoader={false} />
          ) : (
            <>
              <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {newCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onViewDetails={handleViewDetails}

                    onContinue={handleContinue}
                  />
                ))}
              </div>
              <Pagination
                page={newPage}
                meta={newMeta}
                onPage={setNewPage}
                itemLabel="new releases"
              />
            </>
          )}
        </TabsContent>
      </div>
    </Tabs>
  );
}
