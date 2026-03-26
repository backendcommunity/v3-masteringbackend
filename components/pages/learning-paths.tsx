"use client";
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
  Code,
  Users,
  Star,
  Target,
  CheckCircle2,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import { WIP } from "../WIP";

interface LearningPathsPageProps {
  onNavigate?: (url: string) => void;
}

export function LearningPathsPage({ onNavigate }: LearningPathsPageProps) {
  const store = useAppStore();
  const paths = store.getLearningPaths();

  return (
    <div className="flex-1 space-y-6 relative">
      {/* <WIP /> */}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Paths</h1>
          <p className="text-muted-foreground">
            Structured learning journeys designed to take you from beginner to
            expert
          </p>
        </div>
        <Button>
          <Target className="mr-2 h-4 w-4" />
          Create Custom Path
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Paths</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {paths?.filter((p) => p.enrolled).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently enrolled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Paths completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Learning time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Learning Paths Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {paths?.map((path) => (
          <Card key={path.id} className="overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-[#0E1F33] to-[#13AECE] flex items-center justify-center">
              <div className="text-center text-white">
                <Target className="h-12 w-12 mx-auto mb-2" />
                <h3 className="text-lg font-bold">Learning Path</h3>
              </div>
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
                  <span className="text-sm">{path.estimatedTime}</span>
                </div>
              </div>
              <CardTitle className="line-clamp-2">{path.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {path.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span>{path.courses.length} courses</span>
                </div>
                <div className="flex items-center gap-1">
                  <Code className="h-4 w-4 text-muted-foreground" />
                  <span>{path.projects.length} projects</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>2.3k enrolled</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <span>4.8 rating</span>
                </div>
              </div>

              {path.enrolled ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{path.progress}%</span>
                    </div>
                    <Progress value={path.progress} className="h-2" />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => onNavigate?.(routes.pathContinue(path.id))}
                  >
                    Continue Learning
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-green-600">
                      Free
                    </span>
                    <p className="text-sm text-muted-foreground">
                      Full access included
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => onNavigate?.(routes.pathDetail(path.id))}
                  >
                    Start Learning Path
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Featured Path */}
      <Card className="bg-gradient-to-r from-[#0E1F33] to-[#13AECE] text-white">
        <CardHeader>
          <CardTitle>🚀 Featured Path: Backend Engineer</CardTitle>
          <CardDescription className="text-blue-100">
            Our most comprehensive path covering everything from basics to
            advanced backend development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <span className="font-medium">12 Courses</span>
              </div>
              <p className="text-sm text-blue-100">
                From Node.js basics to advanced architecture
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                <span className="font-medium">8 Projects</span>
              </div>
              <p className="text-sm text-blue-100">
                Build real-world applications
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                <span className="font-medium">Certificate</span>
              </div>
              <p className="text-sm text-blue-100">
                Industry-recognized completion
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
