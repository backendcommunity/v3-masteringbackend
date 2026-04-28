"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Clock,
  Users,
  Search,
  Play,
  Crown,
  Code2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { routes } from "@/lib/routes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Course, CourseFilterOptions, Meta, UserCourse } from "@/lib/data";
import { useUser } from "@/hooks/use-user";
import { useAppStore } from "@/lib/store";
import { Loader } from "../ui/loader";

interface CoursesPageProps {
  onNavigate: (path: string) => void;
  onFilter: (filters: CourseFilterOptions) => void;
}

const PAGE_SIZE = 9;

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
  onPreview,
  onContinue,
}: {
  course: Course;
  onViewDetails: (slug: string) => void;
  onPreview: (slug: string) => void;
  onContinue: (slug: string) => void;
}) {
  return (
    <Card className="overflow-hidden relative">
      <div
        className="aspect-video bg-muted cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => onViewDetails(course.slug)}
      >
        <img
          src={course?.banner ?? "/placeholder.svg"}
          alt={course.title}
          className="h-full w-full object-cover"
        />
      </div>

      <CardHeader className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge
            variant={
              course?.level === "Advanced"
                ? "destructive"
                : course?.level === "Intermediate"
                  ? "default"
                  : "secondary"
            }
            className="text-xs"
          >
            {course?.level}
          </Badge>

          <Badge
            className="uppercase text-xs"
            variant={
              course?.type === "WORKSHOP"
                ? "purple"
                : course?.type === "VIDEO"
                  ? "default"
                  : "success"
            }
          >
            {course?.type === "WORKSHOP"
              ? "Workshop"
              : course?.type === "VIDEO"
                ? "Course"
                : "Tutorial"}
          </Badge>
        </div>
        <CardTitle
          className="line-clamp-2 cursor-pointer hover:text-primary transition-colors text-sm md:text-base"
          onClick={() => onViewDetails(course.slug)}
        >
          {course.title}
        </CardTitle>
        <CardDescription
          dangerouslySetInnerHTML={{
            __html: course?.summary ?? course?.description,
          }}
          className="line-clamp-2 text-xs md:text-sm [&>*>span]:!text-black [&>p]:text-black dark:[&>*>span]:!text-muted-foreground dark:[&>p]:text-muted-foreground"
        />
      </CardHeader>

      <CardContent className="space-y-3 md:space-y-4 p-4 pt-0">
        <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 md:h-4 md:w-4" />
            {course?.totalDuration} hour{course?.totalDuration > 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 md:h-4 md:w-4" />
            {course?.students?.toLocaleString()}
          </div>
        </div>

        {course?.enrolled ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs md:text-sm">
              <span>Progress</span>
              <span>{Math.floor(course?.progress ?? 0)}%</span>
            </div>
            <Progress value={course?.progress ?? 0} className="h-2" />
            <Button
              className="w-full text-xs md:text-sm"
              onClick={() => onContinue(course.slug)}
            >
              <Play className="mr-2 h-3 w-3 md:h-4 md:w-4" />
              Continue Learning
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              {course.isPremium && (
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800 border-green-200 text-xs"
                >
                  <Crown className="mr-1 h-3 w-3" />
                  Included in Pro
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPreview(course.slug)}
                className="text-xs"
              >
                Preview
              </Button>
            </div>
            <Button
              className="w-full text-xs md:text-sm"
              onClick={() => onViewDetails(course.slug)}
            >
              Start Learning
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {course?.tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
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
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [tab, setTab] = useState("all-courses");
  const store = useAppStore();

  // All courses
  const [courses, setCourses] = useState<Course[]>([]);
  const [meta, setMeta] = useState<Meta>();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);

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

  // Debounce search input — only update searchQuery (the API trigger) after 350ms
  const handleSearchInput = (value: string) => {
    setSearchInput(value);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setSearchQuery(value);
      setPage(0);
    }, 350);
  };

  // Reset page when level / category change
  const handleLevelChange = (v: string) => {
    setLevel(v);
    setPage(0);
  };
  const handleCategoryChange = (v: string) => {
    setCategory(v);
    setPage(0);
  };

  // ── All courses ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const filters: CourseFilterOptions = {};
      if (searchQuery) filters.terms = searchQuery;
      if (level && level !== "all") filters.level = level;
      if (category && category !== "all") filters.category = category;

      const res = await store.getCourses({
        size: String(PAGE_SIZE),
        skip: String(page * PAGE_SIZE),
        ...(Object.keys(filters).length && { filters }),
      });
      if (!cancelled) {
        setCourses(res?.courses ?? []);
        setMeta(res?.meta);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [page, searchQuery, level, category]);

  // ── My courses ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!tab.includes("my-courses")) return;
    let cancelled = false;
    async function load() {
      setUserLoading(true);
      const res = await store.getUserCourses({
        size: String(PAGE_SIZE),
        skip: String(userPage * PAGE_SIZE),
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
  }, [tab, userPage]);

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
  const handlePreview = (slug: string) =>
    onNavigate(routes.coursePreview(slug));
  const handleContinue = (slug: string) =>
    onNavigate(routes.courseDetail(slug));

  return (
    <Tabs className="space-y-4" value={tab} onValueChange={setTab}>
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
          <div className="flex gap-2 sm:gap-3">
            <Select value={level} onValueChange={handleLevelChange}>
              <SelectTrigger className="w-full sm:w-[140px] md:w-[180px]">
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
              <SelectTrigger className="w-full sm:w-[140px] md:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="nodejs">Node.js</SelectItem>
                <SelectItem value="database">Database</SelectItem>
                <SelectItem value="api">API Design</SelectItem>
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
              <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onViewDetails={handleViewDetails}
                    onPreview={handlePreview}
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
                  <Card
                    key={userCourse.id}
                    className="overflow-hidden relative"
                  >
                    <div
                      className="aspect-video bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() =>
                        handleViewDetails(userCourse?.course?.slug!)
                      }
                    >
                      <img
                        src={userCourse?.course?.banner ?? "/placeholder.svg"}
                        alt={userCourse?.course?.title}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant={
                            userCourse?.course?.level === "Advanced"
                              ? "destructive"
                              : userCourse?.course?.level === "Intermediate"
                                ? "default"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {userCourse?.course?.level}
                        </Badge>
                      </div>
                      <CardTitle
                        className="line-clamp-2 cursor-pointer hover:text-primary transition-colors text-sm md:text-base"
                        onClick={() =>
                          handleViewDetails(userCourse?.course?.slug!)
                        }
                      >
                        {userCourse?.course?.title}
                      </CardTitle>
                      <CardDescription
                        dangerouslySetInnerHTML={{
                          __html: userCourse?.course?.description!,
                        }}
                        className="line-clamp-2 text-xs md:text-sm [&>*>span]:!text-black [&>p]:text-black dark:[&>*>span]:!text-muted-foreground dark:[&>p]:text-muted-foreground"
                      />
                    </CardHeader>

                    <CardContent className="space-y-3 md:space-y-4 p-4 pt-0">
                      <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 md:h-4 md:w-4" />
                          {userCourse?.course?.totalDuration}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 md:h-4 md:w-4" />
                          {userCourse?.course?.students}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs md:text-sm">
                          <span>Progress</span>
                          <span>{userCourse?.progress ?? 0}%</span>
                        </div>
                        <Progress
                          value={userCourse?.progress ?? 0}
                          className="h-2"
                        />
                        <Button
                          className="w-full text-xs md:text-sm"
                          onClick={() =>
                            handleContinue(userCourse?.course?.slug!)
                          }
                        >
                          <Play className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                          Continue Learning
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {userCourse?.course?.tags?.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
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
                    onPreview={handlePreview}
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
                    onPreview={handlePreview}
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
