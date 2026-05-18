"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  Code2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  BarChart2,
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
import { getTagIcon } from "@/lib/tag-icons";

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

function CourseCard({
  course,
  onViewDetails,
  onContinue,
}: {
  course: Course;
  onViewDetails: (slug: string) => void;
  onContinue: (slug: string) => void;
}) {
  const TagIcon = getTagIcon(course.tags);
  return (
    <Card
      className="overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onViewDetails(course.slug)}
    >
      <CardHeader className="p-4 pb-3 flex-1 space-y-3">
        {/* Type label */}
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {course.type === "WORKSHOP"
            ? "Workshop"
            : course.type === "VIDEO"
              ? "Course"
              : "Tutorial"}
        </p>

        {/* Title */}
        <CardTitle className="text-base font-bold line-clamp-2 leading-snug">
          {course.title}
        </CardTitle>

        {/* Level */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <BarChart2 className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{course.level ?? "All levels"}</span>
        </div>

        {/* Description */}
        <p
          className="text-sm text-muted-foreground line-clamp-3 [&>*>span]:!text-muted-foreground [&>p]:text-muted-foreground"
          dangerouslySetInnerHTML={{
            __html: course.summary ?? course.description,
          }}
        />

        {/* Category + progress if enrolled */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {course.category?.name ?? "Backend"}
          </span>
          {course.enrolled && (
            <span className="text-xs text-muted-foreground">
              {Math.floor(course.progress ?? 0)}%
            </span>
          )}
        </div>

        {/* First tag badge */}
        {course.tags?.length > 0 && (
          <Badge
            variant="outline"
            className="text-[10px] uppercase tracking-wide w-fit"
          >
            {course.tags[0]}
          </Badge>
        )}
      </CardHeader>

      {/* Footer */}
      <CardContent className="p-4 pt-3 border-t space-y-2">
        {course.enrolled && (
          <Progress value={course.progress ?? 0} className="h-1" />
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground flex-shrink-0">
              <TagIcon className="h-4 w-4 text-background" />
            </div>
            <span className="text-sm text-muted-foreground">
              {course.totalDuration} hr
            </span>
          </div>
          {course.enrolled ? (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onContinue(course.slug);
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
                onViewDetails(course.slug);
              }}
            >
              Start
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
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
        setFilterOptions(filters || { categories: [], tags: [] });
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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Courses
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Master backend development with our comprehensive course library
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">
                Total Courses
              </CardTitle>
              <Code2 className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">
                {meta?.netTotal}
              </div>
              <p className="text-xs text-muted-foreground">
                +{user?.lastMonthCourses ?? 0} from last month
              </p>
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
                {user?.numberOfCoursesCompleted}
              </div>
              <p className="text-xs text-muted-foreground">
                +{user?.lastMonthCompletedCourses ?? 0} from last month
              </p>
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
                {user?.numberOfCoursesInProgress}
              </div>
              <p className="text-xs text-muted-foreground">Active courses</p>
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
              <div className="text-lg md:text-2xl font-bold">
                {user?.averageCourseTime}w
              </div>
              <p className="text-xs text-muted-foreground">Per course</p>
            </CardContent>
          </Card>
        </div>

        {/* Upgrade Banner */}
        {!user?.isPremium && (
          <Card className="bg-gradient-to-r from-[#F2C94C]/10 to-[#F2C94C]/5 border-[#F2C94C]/20">
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
                {filterOptions.categories.map((cat) => (
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
                {filterOptions.tags.map((tag) => (
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
