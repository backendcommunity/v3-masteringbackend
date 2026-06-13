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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlayCircle,
  Clock,
  Star,
  Search,
  Filter,
  BookOpen,
  Code2,
  Database,
  Globe,
  Smartphone,
  Brain,
  ChevronRight,
  Calendar,
  Trophy,
  Crown,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Meta, Project30, UserProject30 } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { Loader } from "../ui/loader";

interface Project30ListingPageProps {
  onNavigate: (path: string) => void;
}

export function Project30ListingPage({
  onNavigate,
}: Project30ListingPageProps) {
  const store = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState<Project30[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<UserProject30[]>();
  const [meta, setMeta] = useState<Meta>();
  const [activeTab, setActiveTab] = useState("all-courses");
  const debouncedSearch = useDebounce(searchQuery, 500);

  async function loadProject30s() {
    try {
      setLoading(true);
      const data = await store.getProject30s();
      setOffers(data?.offers);
      setMeta(data?.meta);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (
        selectedCategory.includes("all") &&
        !debouncedSearch &&
        selectedLevel.includes("all")
      ) {
        await loadProject30s();
        return;
      }

      const data = await store.getProject30s({
        filters: {
          category: selectedCategory,
          terms: debouncedSearch,
          level: selectedLevel,
        },
      });
      if (!cancelled) {
        setOffers(data?.offers);
        setMeta(data?.meta);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, selectedCategory, selectedLevel, store]);

  useEffect(() => {
    let cancelled = false;

    if (activeTab.includes("my-courses")) {
      const load = async () => {
        const data = await store.loadMyProject30s();
        if (!cancelled) {
          setEnrolledCourses(data?.data);
        }
      };
      load();
    }

    return () => {
      cancelled = true;
    };
  }, [activeTab, store]);

  if (loading) return <Loader isLoader={false} />;

  const categories = [
    { value: "all", label: "All Categories", icon: BookOpen },
    { value: "Backend", label: "Backend", icon: Database },
    { value: "Full-Stack", label: "Full-Stack", icon: Globe },
    { value: "Mobile", label: "Mobile", icon: Smartphone },
    { value: "DevOps", label: "DevOps", icon: Code2 },
    { value: "AI/ML", label: "AI/ML", icon: Brain },
  ];

  const levels = [
    { value: "all", label: "All Levels" },
    { value: "Beginner", label: "Beginner" },
    { value: "Intermediate", label: "Intermediate" },
    { value: "Advanced", label: "Advanced" },
  ];

  // Filter courses based on search and filters
  const filteredCourses = offers.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course?.instructor?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || course.category === selectedCategory;
    const matchesLevel =
      selectedLevel === "all" || course.level === selectedLevel;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  // const enrolledCourses = offers.filter((course) => course.isEnrolled);

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find((cat) => cat.value === category);
    return categoryData ? categoryData.icon : BookOpen;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-green-100 text-green-800 border-green-200";
      case "Intermediate":
        return "bg-primary/10 text-blue-800 border-primary/30";
      case "Advanced":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Project30 Courses
          </h1>
          <p className="text-muted-foreground">
            Choose from our collection of 30-day project-based courses to master
            backend development
          </p>
        </div>
        {/* <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div> */}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses, instructors, or technologies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                <div className="flex items-center gap-2">
                  <category.icon className="h-4 w-4" />
                  {category.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
          <SelectTrigger className="w-full md:w-32">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            {levels.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <Tabs
        defaultValue="all-courses"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="all-courses">
            All Courses ({filteredCourses?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="my-courses">
            My Courses ({enrolledCourses?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="new">New Releases</TabsTrigger>
        </TabsList>

        <TabsContent value="all-courses" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses?.map((course) => {
              const CategoryIcon = getCategoryIcon(course.category?.name);
              return (
                <Card
                  key={course.id}
                  className="group hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  <div className="relative">
                    <img
                      src={course.banner || "/placeholder.svg"}
                      alt={course.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-t-lg flex items-center justify-center">
                      <PlayCircle className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute top-3 left-3">
                      <Badge className={getLevelColor(course?.level)}>
                        {course?.level}
                      </Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge
                        variant="secondary"
                        className={` text-white border-none ${
                          course?.userProject30?.isCompleted
                            ? "bg-green-500"
                            : "bg-black/70"
                        }`}
                      >
                        {course?.userProject30?.isCompleted
                          ? "Completed"
                          : `$${course.amount}`}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 mb-2">
                        <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {course?.category?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {course.isPremium && (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 border-green-200 text-xs"
                          >
                            <Crown className="mr-1 h-3 w-3" />
                            Included in Pro
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-lg leading-tight">
                      {course.title}
                    </CardTitle>
                    <CardDescription
                      dangerouslySetInnerHTML={{ __html: course.description }}
                      className="line-clamp-2"
                    ></CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.totalDuration}
                      </div>
                      <div className="flex items-center gap-1">
                        <PlayCircle className="h-4 w-4" />
                        {course.totalContents} videos
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <img
                        src={"/placeholder.svg"}
                        alt={course.instructor?.banner}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm text-muted-foreground">
                        {course?.instructor?.name ?? "Masteringbackend"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {course?.technologies!?.slice(0, 3).map((tech) => (
                        <Badge key={tech} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                      {course?.technologies!?.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{course?.technologies!?.length - 3} more
                        </Badge>
                      )}
                    </div>

                    {course.isEnrolled ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span>{course.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={` h-2 rounded-full ${
                              course?.userProject30?.isCompleted
                                ? "bg-green-500/70"
                                : "bg-[#F2C94C]"
                            }`}
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                        <Button
                          className="w-full"
                          onClick={() =>
                            onNavigate(`/project30/${course.slug}`)
                          }
                        >
                          {course?.userProject30?.isCompleted
                            ? "Review Learning"
                            : "Continue Learning"}
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => onNavigate(`/project30/${course.slug}`)}
                      >
                        View Course
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="my-courses" className="space-y-4">
          {enrolledCourses?.length! > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {enrolledCourses?.map((course) => {
                const CategoryIcon = getCategoryIcon(
                  course?.offer?.category?.name
                );

                return (
                  <Card
                    key={course?.offer?.id}
                    className="group hover:shadow-lg transition-all duration-200"
                  >
                    <div className="relative">
                      <img
                        src={course?.offer?.banner || "/placeholder.svg"}
                        alt={course?.offer?.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          {course?.isCompleted ? "Completed" : "Enrolled"}
                        </Badge>
                      </div>
                    </div>

                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {course?.offer?.category?.name}
                        </span>
                      </div>
                      <CardTitle className="text-lg leading-tight">
                        {course?.offer?.title}
                      </CardTitle>
                      <CardDescription>
                        Last accessed: {formatDate(course?.updatedAt + "")}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span>{course.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={` h-2 rounded-full ${
                              course?.isCompleted
                                ? "bg-green-500"
                                : "bg-[#F2C94C]"
                            }`}
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <Button
                        className={`w-full`}
                        onClick={() =>
                          onNavigate(`/project30/${course?.offer?.slug}`)
                        }
                      >
                        {course?.isCompleted
                          ? "Review Learning"
                          : "Continue Learning"}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No enrolled courses
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  Start your learning journey by enrolling in a Project30 course
                </p>
                <Button onClick={() => setSelectedCategory("all")}>
                  Browse All Courses
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {offers
              .sort((a, b) => b.students - a.students)
              .slice(0, 6)
              .map((course) => {
                const CategoryIcon = getCategoryIcon(course.category?.name);

                return (
                  <Card
                    key={course.id}
                    className="group hover:shadow-lg transition-all duration-200"
                  >
                    <div className="relative">
                      <img
                        src={course.banner || "/placeholder.svg"}
                        alt={course.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                          <Trophy className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      </div>
                    </div>

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 mb-2">
                          <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {course.category?.name}
                          </span>
                        </div>
                        {/* <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {course.rating}
                          </span>
                        </div> */}
                      </div>
                      <CardTitle className="text-lg leading-tight">
                        {course.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {course.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {course.totalDuration}
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => onNavigate(`/project30/${course.slug}`)}
                      >
                        View Course
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>

        <TabsContent value="new" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {offers
              .slice(-3)
              .reverse()
              .map((course) => {
                const CategoryIcon = getCategoryIcon(course.category?.name);

                return (
                  <Card
                    key={course.id}
                    className="group hover:shadow-lg transition-all duration-200"
                  >
                    <div className="relative">
                      <img
                        src={course.banner || "/placeholder.svg"}
                        alt={course.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-primary/10 text-blue-800 border-primary/30">
                          New
                        </Badge>
                      </div>
                    </div>

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 mb-2">
                          <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {course.category?.name}
                          </span>
                        </div>
                        {/* <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {course.rating}
                          </span>
                        </div> */}
                      </div>
                      <CardTitle className="text-lg leading-tight">
                        {course.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {course.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Just released
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {course.totalDuration}
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => onNavigate(`/project30/${course.slug}`)}
                      >
                        View Course
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
