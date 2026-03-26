"use client";

import { useEffect, useState } from "react";
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

export function CoursesPage({ onNavigate, onFilter }: CoursesPageProps) {
  const user = useUser();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [level, setLevel] = useState("");
  const [category, setCategory] = useState("");
  const [courses, setCourses] = useState([]);
  const [meta, setMeta] = useState<Meta>();
  const [userCourses, setUserCourses] = useState([]);
  const [userCourseMeta, setUserCourseMeta] = useState<Meta>();
  const [popularCourses, setPopularCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [popularLoading, setPopularLoading] = useState(false);
  const [popularCourseMeta, setPopularCourseMeta] = useState<Meta>();
  const [tab, setTab] = useState(searchParams?.get("tab") || "all-courses");
  const store = useAppStore();

  const handleFilter = async (filters: CourseFilterOptions) => {
    setLoading(true);

    if (filters.tab?.includes("new")) filters.sortBy = "createdAt";
    const res = await store.getCourses({ filters });
    if (filters!["tab"]?.includes("popular")) {
      setPopularLoading(true);
      setPopularCourses(res.data?.courses);
      setPopularCourseMeta(res.data?.meta);
      setPopularLoading(true);
      return;
    }
    setLoading(false);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSearchParams(new URLSearchParams(window.location.search));
    }
  }, []);

  useEffect(() => {
    if (!searchParams) return;
    const tabParam = searchParams.get("tab");
    setTab(tabParam || "all-courses");
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const res = await store.getCourses();
      if (!cancelled) {
        setCourses(res.courses);
        setMeta(res?.meta);
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [store]);

  useEffect(() => {
    if (!searchQuery && !level && !category) return;
    handleFilter({
      terms: searchQuery,
      level,
      category,
    });
  }, [searchQuery, level, category]);

  useEffect(() => {
    let cancelled = false;

    if (tab?.includes("my-courses")) {
      const load = async () => {
        setUserLoading(true);
        const res = await store.getUserCourses();
        if (!cancelled) {
          setUserCourses(res?.userCourses);
          setUserCourseMeta(res?.meta);
          setUserLoading(false);
        }
      };

      load();
    }

    return () => {
      cancelled = true;
    };
  }, [tab, store]);

  if (loading) return <Loader isLoader={false} />;

  const handleViewDetails = (slug: string) => {
    const detailPath = routes.courseDetail(slug);
    onNavigate(detailPath);
  };

  const handlePreview = (courseId: string) => {
    const previewPath = routes.coursePreview(courseId);
    onNavigate(previewPath);
  };

  const handleContinueLearning = (courseId: string) => {
    const detailPath = routes.courseDetail(courseId);
    onNavigate(detailPath);
  };

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

        {/* Subscription Status Banner */}
        {!user.isPremium && (
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
                  onClick={() => onNavigate("/subscription/plans")}
                  className="w-full md:w-auto"
                >
                  Upgrade Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <div className="flex-1">
            <TabsList>
              <TabsTrigger value="all-courses">
                All Courses ({meta?.total})
              </TabsTrigger>
              <TabsTrigger value="my-courses">My Courses</TabsTrigger>
              <TabsTrigger value="popular">Popular</TabsTrigger>

              <TabsTrigger value="new">New Releases</TabsTrigger>
            </TabsList>
          </div>
          <div className="relative ">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              className="pl-8"
            />
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Select value={level} onValueChange={setLevel}>
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
            <Select value={category} onValueChange={setCategory}>
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

        {/* Course Grid */}
        <TabsContent value="all-courses" className="space-y-4">
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course: Course) => {
              return (
                <Card key={course.id} className="overflow-hidden relative">
                  <div
                    className="aspect-video bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleViewDetails(course.slug)}
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
                    </div>
                    <CardTitle
                      className="line-clamp-2 cursor-pointer hover:text-primary transition-colors text-sm md:text-base"
                      onClick={() => handleViewDetails(course.slug)}
                    >
                      {course.title}
                    </CardTitle>
                    <CardDescription
                      dangerouslySetInnerHTML={{ __html: course?.summary }}
                      className="line-clamp-2 text-xs md:text-sm [&>*>span]:!text-black [&>p]:text-black dark:[&>*>span]:!text-muted-foreground dark:[&>p]:text-muted-foreground"
                    ></CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 md:space-y-4 p-4 pt-0">
                    <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 md:h-4 md:w-4" />
                        {course?.totalDuration} hour
                        {course?.totalDuration > 1 ? "s" : ""}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 md:h-4 md:w-4" />
                        {course?.students}
                      </div>
                    </div>

                    {course?.enrolled ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs md:text-sm">
                          <span>Progress</span>
                          <span>{Math.floor(course?.progress ?? 0)}%</span>
                        </div>
                        <Progress
                          value={course?.progress ?? 0}
                          className="h-2"
                        />
                        <Button
                          className="w-full text-xs md:text-sm"
                          onClick={() => handleContinueLearning(course.slug)}
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
                            onClick={() => handlePreview(course.slug)}
                            className="text-xs"
                          >
                            Preview
                          </Button>
                        </div>
                        <Button
                          className="w-full text-xs md:text-sm"
                          onClick={() => handleViewDetails(course.slug)}
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
            })}
          </div>
        </TabsContent>

        <TabsContent value="my-courses" className="space-y-4">
          {userLoading ? (
            <Loader isLoader={false} />
          ) : (
            <>
              <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {userCourses.map((userCourse: UserCourse) => {
                  return (
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
                        ></CardDescription>
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
                              handleContinueLearning(userCourse?.course?.slug!)
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
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          {popularLoading ? (
            <Loader isLoader={false} />
          ) : (
            <>
              <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {popularCourses?.map((course: any) => {
                  return (
                    <Card key={course.id} className="overflow-hidden relative">
                      <div
                        className="aspect-video bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleViewDetails(course.slug)}
                      >
                        <img
                          src={
                            course?.banner ??
                            course?.thumbnail ??
                            "/placeholder.svg"
                          }
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
                          {/* <div className="flex items-center gap-1 flex flex-col">
                        <span>
                          <DollarSign className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs md:text-sm">
                            <span>{course.amount}</span>
                          </span>
                        </span>
                        <i className="text-xs">lifetime</i>
                      </div> */}
                        </div>
                        <CardTitle
                          className="line-clamp-2 cursor-pointer hover:text-primary transition-colors text-sm md:text-base"
                          onClick={() => handleViewDetails(course.slug)}
                        >
                          {course.title}
                        </CardTitle>
                        <CardDescription
                          dangerouslySetInnerHTML={{
                            __html: course?.description,
                          }}
                          className="line-clamp-2 text-xs md:text-sm"
                        ></CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-3 md:space-y-4 p-4 pt-0">
                        <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 md:h-4 md:w-4" />
                            {course?.totalDuration}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 md:h-4 md:w-4" />
                            {course?.students?.toLocaleString()}
                          </div>
                        </div>

                        {course.enrolled ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs md:text-sm">
                              <span>Progress</span>
                              <span>{course?.progress ?? 0}%</span>
                            </div>
                            <Progress
                              value={course?.progress ?? 0}
                              className="h-2"
                            />
                            <Button
                              className="w-full text-xs md:text-sm"
                              onClick={() =>
                                handleContinueLearning(course.slug)
                              }
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
                                onClick={() => handlePreview(course.slug)}
                                className="text-xs"
                              >
                                Preview
                              </Button>
                            </div>
                            <Button
                              className="w-full text-xs md:text-sm"
                              onClick={() => handleViewDetails(course.slug)}
                            >
                              Start Learning
                            </Button>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1">
                          {course?.tags?.slice(0, 3).map((tag: any) => (
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
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="new" className="space-y-4">
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {courses?.sort()?.map((course: Course) => {
              return (
                <Card key={course.id} className="overflow-hidden relative">
                  <div
                    className="aspect-video bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleViewDetails(course.slug)}
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
                    </div>
                    <CardTitle
                      className="line-clamp-2 cursor-pointer hover:text-primary transition-colors text-sm md:text-base"
                      onClick={() => handleViewDetails(course.slug)}
                    >
                      {course.title}
                    </CardTitle>
                    <CardDescription
                      dangerouslySetInnerHTML={{ __html: course?.description }}
                      className="line-clamp-2 text-xs md:text-sm"
                    ></CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 md:space-y-4 p-4 pt-0">
                    <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 md:h-4 md:w-4" />
                        {course?.totalDuration}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 md:h-4 md:w-4" />
                        {course?.students?.toLocaleString()}
                      </div>
                    </div>

                    {course.enrolled ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs md:text-sm">
                          <span>Progress</span>
                          <span>{course?.progress ?? 0}%</span>
                        </div>
                        <Progress
                          value={course?.progress ?? 0}
                          className="h-2"
                        />
                        <Button
                          className="w-full text-xs md:text-sm"
                          onClick={() => handleContinueLearning(course.slug)}
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
                            onClick={() => handlePreview(course.slug)}
                            className="text-xs"
                          >
                            Preview
                          </Button>
                        </div>
                        <Button
                          className="w-full text-xs md:text-sm"
                          onClick={() => handleViewDetails(course.slug)}
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
            })}
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
