"use client";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Clock,
  BookOpen,
  Code2,
  Target,
  CheckCircle2,
  Users,
  Star,
  Play,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Course } from "@/lib/data";

interface LearningPathDetailPageProps {
  pathId: string;
  onNavigate?: (route: string) => void;
}

export function LearningPathDetailPage({
  pathId,
  onNavigate,
}: LearningPathDetailPageProps) {
  const store = useAppStore();
  const path = store?.getLearningPaths()?.find((p) => p.id === pathId);
  const courses = store?.getCourses();
  const projects = store?.getProjects();

  if (!path) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Learning Path not found</h1>
          <Button onClick={() => onNavigate?.("/paths")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Learning Paths
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => onNavigate?.("/paths")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{path.title}</h1>
          <p className="text-muted-foreground">{path.description}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Card (if enrolled) */}
          {path.enrolled && (
            <Card className="bg-gradient-to-r from-[#0E1F33] to-[#13AECE] text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Overall Progress</span>
                    <span>{path.progress}%</span>
                  </div>
                  <Progress value={path.progress} className="h-3" />
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span className="text-sm">Courses</span>
                      </div>
                      <Progress value={60} className="h-2" />
                      <span className="text-xs text-blue-100">
                        2 of {path?.courses?.length} completed
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Code2 className="h-4 w-4" />
                        <span className="text-sm">Projects</span>
                      </div>
                      <Progress value={50} className="h-2" />
                      <span className="text-xs text-blue-100">
                        1 of {path.projects.length} completed
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm">Assessments</span>
                      </div>
                      <Progress value={25} className="h-2" />
                      <span className="text-xs text-blue-100">
                        1 of 4 completed
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="community">Community</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Learning Objectives</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    {[
                      "Master backend development fundamentals",
                      "Build scalable APIs and microservices",
                      "Implement database design and optimization",
                      "Deploy applications to cloud platforms",
                      "Apply DevOps and CI/CD practices",
                      "Develop production-ready applications",
                    ].map((objective, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        <span>{objective}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Path Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {path?.courses?.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Courses
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {path.projects.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Projects
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {path.estimatedTime}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Est. Time
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="curriculum" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Courses ({path.courses.length})</CardTitle>
                  <CardDescription>
                    Core courses in this learning path
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {path?.courses?.map((courseId, index) => {
                    const course = path?.courses?.find(
                      (c: Course) => c.id === courseId,
                    );
                    if (!course) return null;

                    return (
                      <div key={courseId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-medium">{course.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {course.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{course?.level}</Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                onNavigate?.(`/courses/${course.id}`)
                              }
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {course.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {course.chapters?.length || 0} lessons
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4" />
                            {course.rating}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projects" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Hands-on Projects ({path.projects.length})
                  </CardTitle>
                  <CardDescription>
                    Build real-world applications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {path?.projects?.map((projectId, index) => {
                    const project = path?.projects?.find(
                      (p) => p.id === projectId,
                    );
                    if (!project) return null;

                    return (
                      <div key={projectId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-medium">{project.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {project.description}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">{project.difficulty}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {project.technologies.map((tech, techIndex) => (
                            <Badge
                              key={techIndex}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="community" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Learning Community</CardTitle>
                  <CardDescription>
                    Connect with fellow learners
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="text-center p-4 border rounded-lg">
                      <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold">1,247</div>
                      <div className="text-sm text-muted-foreground">
                        Active learners
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold">892</div>
                      <div className="text-sm text-muted-foreground">
                        Completed path
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Enrollment Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge
                  variant={
                    path?.level === "Advanced" ? "destructive" : "default"
                  }
                >
                  {path?.level}
                </Badge>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{path.estimatedTime}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {path.enrolled ? (
                <div className="space-y-3">
                  <Badge
                    variant="outline"
                    className="w-full justify-center bg-green-50 text-green-700 border-green-200"
                  >
                    Enrolled - {path.progress}% Complete
                  </Badge>
                  <Button
                    className="w-full"
                    onClick={() => onNavigate?.(`/paths/${path.id}/continue`)}
                  >
                    Continue Learning
                  </Button>
                  <Button variant="outline" className="w-full">
                    View Certificate
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button
                    className="w-full"
                    onClick={() => store.enrollInPath(path.id)}
                  >
                    Start Learning Path
                  </Button>
                  <Button variant="outline" className="w-full">
                    Add to Wishlist
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
