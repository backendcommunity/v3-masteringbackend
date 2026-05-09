"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  BookOpen,
  Users,
  Star,
  Target,
  CheckCircle2,
  Search,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import { stripHtmlTags } from "@/lib/html-utils";
import { Loader } from "@/components/ui/loader";

interface LearningPathsPageProps {
  onNavigate?: (url: string) => void;
}

export function LearningPathsPage({ onNavigate }: LearningPathsPageProps) {
  const store = useAppStore();
  const [paths, setPaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const loadPaths = async () => {
      try {
        setLoading(true);
        // getRoadmaps runs resolveRoadmaps server-side: returns r.enrolled,
        // r.progress (accurate completedTopics/total), r.students, r.userRoadmap
        // No need for a separate getUserRoadmaps call.
        const roadmaps = await store.getRoadmaps({ skip: 0, size: 50 });

        const merged = (roadmaps || []).map((r: any) => {
          const topics = r.topics || [];
          return {
            id: r.slug,
            slug: r.slug,
            title: r.title,
            description: r.summary,
            banner: r.banner,
            level: topics[0]?.level || "Intermediate",
            estimatedTime:
              topics.reduce((s: number, t: any) => s + (t.duration || 0), 0) > 0
                ? `${Math.ceil(topics.reduce((s: number, t: any) => s + (t.duration || 0), 0) / 4)} months`
                : "Self-paced",
            estimatedWeeks: r.estimatedWeeks ?? 0,
            hoursPerWeek: r.hoursPerWeek ?? 0,
            courses: topics.flatMap(
              (t: any) => t.courses?.map((c: any) => c.id) || [],
            ),
            topics,
            // Backend-computed values from resolveRoadmaps:
            progress: r.userRoadmap?.isCompleted ? 100 : (r.progress ?? 0),
            enrolled: r.enrolled ?? false,
            enrolledCount: r.students ?? 0,
          };
        });

        setPaths(merged);
      } catch (error) {
        console.error("Failed to load learning paths:", error);
        setPaths([]);
      } finally {
        setLoading(false);
      }
    };

    loadPaths();
  }, []);

  if (loading) return <Loader isLoader={false} />;

  // Filter paths based on search + filters
  const filteredPaths = paths.filter((p) => {
    const matchesSearch =
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());

    const matchesLevel =
      levelFilter === "all" ||
      (p.topics?.[0]?.level || "Intermediate").toLowerCase() ===
        levelFilter.toLowerCase();

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "enrolled" && p.enrolled && p.progress < 100) ||
      (statusFilter === "completed" && p.progress === 100) ||
      (statusFilter === "not_enrolled" && !p.enrolled);

    return matchesSearch && matchesLevel && matchesStatus;
  });

  const hasActiveFilters =
    search || levelFilter !== "all" || statusFilter !== "all";

  // Calculate stats from actual data
  const activePaths = paths.filter((p) => p.enrolled).length;
  const completedPaths = paths.filter((p) => p.progress === 100).length;
  const totalHours = Math.round(
    paths
      .filter((p) => p.enrolled)
      .reduce((sum, p) => {
        const pathDuration =
          p.topics?.reduce((s: number, t: any) => s + (t.duration || 0), 0) ||
          0;
        return sum + pathDuration;
      }, 0),
  );
  const certificates = completedPaths;

  return (
    <div className="flex-1 space-y-6 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Paths</h1>
          <p className="text-muted-foreground">
            Structured learning journeys designed to take you from beginner to
            expert
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Paths</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePaths}</div>
            <p className="text-xs text-muted-foreground">Currently enrolled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedPaths}</div>
            <p className="text-xs text-muted-foreground">Paths completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours}</div>
            <p className="text-xs text-muted-foreground">Learning time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{certificates}</div>
            <p className="text-xs text-muted-foreground">Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search learning paths..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="Beginner">Beginner</SelectItem>
            <SelectItem value="Intermediate">Intermediate</SelectItem>
            <SelectItem value="Advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="enrolled">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="not_enrolled">Not Started</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Learning Paths Grid */}
      {paths.length === 0 ? (
        <Card className="col-span-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No Learning Paths Available
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              Check back soon! We're constantly adding new learning paths to
              help you grow your skills.
            </p>
          </CardContent>
        </Card>
      ) : filteredPaths.length === 0 ? (
        <Card className="col-span-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No paths match your filters
            </h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Try adjusting your search or filters to find what you&apos;re
              looking for.
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setLevelFilter("all");
                  setStatusFilter("all");
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPaths.map((path) => (
            <Card key={path.id} className="overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-[#0E1F33] to-[#13AECE] flex items-center justify-center overflow-hidden">
                {path.banner ? (
                  <img
                    src={path.banner}
                    alt={path.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-white">
                    <Target className="h-12 w-12 mx-auto mb-2" />
                    <h3 className="text-lg font-bold">Learning Path</h3>
                  </div>
                )}
              </div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      path?.level === "Advanced"
                        ? "destructive"
                        : path?.level === "Intermediate"
                          ? "default"
                          : "secondary"
                    }
                  >
                    {path?.level}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {path.estimatedWeeks > 0
                        ? `~${path.estimatedWeeks}w · ${path.hoursPerWeek}h/wk`
                        : path.estimatedTime}
                    </span>
                  </div>
                </div>
                <CardTitle className="line-clamp-2">{path.title}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {stripHtmlTags(path.description || "")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{path.courses.length} courses</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{path.enrolledCount.toLocaleString()} enrolled</span>
                  </div>
                </div>

                {path.enrolled ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{path.progress}%</span>
                      </div>
                      <Progress
                        value={path.progress}
                        className="h-2"
                        aria-label={`${path.title} progress: ${path.progress}%`}
                        aria-valuenow={path.progress}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => onNavigate?.(routes.pathDetail(path.slug))}
                    >
                      Continue Learning
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => onNavigate?.(routes.pathDetail(path.slug))}
                  >
                    View Learning Path
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
