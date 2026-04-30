"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  CheckCircle2,
  BookOpen,
  Code2,
  Target,
  Clock,
  SkipForward,
  SkipBack,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";

interface PathContentWatchPageProps {
  pathId: string;
  stepId: string;
  onNavigate?: (route: string) => void;
}

export function PathContentWatchPage({
  pathId,
  stepId,
  onNavigate,
}: PathContentWatchPageProps) {
  const store = useAppStore();
  const path = store.getLearningPaths().find((p) => p.id === pathId);

  // Mock step data
  const steps = [
    {
      id: "1",
      title: "Introduction to Backend Development",
      type: "lesson",
      duration: "15 min",
      completed: true,
    },
    {
      id: "2",
      title: "Setting up Node.js Environment",
      type: "hands-on",
      duration: "30 min",
      completed: true,
    },
    {
      id: "3",
      title: "Building Your First API",
      type: "project",
      duration: "45 min",
      completed: false,
      current: true,
    },
    {
      id: "4",
      title: "Database Integration",
      type: "lesson",
      duration: "25 min",
      completed: false,
    },
  ];

  const currentStep = steps.find((s) => s.id === stepId) || steps[0];
  const currentIndex = steps.findIndex((s) => s.id === stepId);
  const nextStep = steps[currentIndex + 1];
  const prevStep = steps[currentIndex - 1];

  if (!path) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Learning path not found</h1>
          <Button
            onClick={() => onNavigate?.(routes.learningPaths)}
            className="mt-4"
          >
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
        <Button
          variant="ghost"
          onClick={() => onNavigate?.(routes.learningPathContinue(pathId))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {currentStep.title}
          </h1>
          <p className="text-muted-foreground">{path.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{currentStep.type}</Badge>
          <Badge variant="outline">{currentStep.duration}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Content Area */}
          <Card className="overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-[#0E1F33] to-[#13AECE] flex items-center justify-center">
              <div className="text-center text-white">
                {currentStep.type === "lesson" && (
                  <BookOpen className="h-16 w-16 mx-auto mb-4" />
                )}
                {currentStep.type === "hands-on" && (
                  <Code2 className="h-16 w-16 mx-auto mb-4" />
                )}
                {currentStep.type === "project" && (
                  <Target className="h-16 w-16 mx-auto mb-4" />
                )}
                <h3 className="text-xl font-bold">{currentStep.title}</h3>
                <p className="text-blue-200">Learning path step content</p>
              </div>
            </div>
          </Card>

          {/* Step Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-blue-600 border-blue-600"
              >
                Step {currentIndex + 1} of {steps.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark Complete
              </Button>
              {nextStep && (
                <Button
                  onClick={() =>
                    onNavigate?.(routes.pathContentWatch(pathId, nextStep.id))
                  }
                >
                  Next Step
                  <SkipForward className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="content" className="w-full">
            <TabsList>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="exercise">Exercise</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Step Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      In this step, you'll learn how to build your first API
                      using Node.js and Express. We'll cover routing,
                      middleware, and basic CRUD operations.
                    </p>
                    <div className="space-y-3">
                      <h4 className="font-medium">What You'll Learn:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                        <li>• Setting up Express server</li>
                        <li>• Creating API routes</li>
                        <li>• Handling HTTP methods</li>
                        <li>• Error handling basics</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="exercise" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Hands-on Exercise</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium mb-2">
                        Task: Build a Simple API
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Create a basic Express server with the following
                        endpoints:
                      </p>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                        <li>• GET /api/users - Return list of users</li>
                        <li>• POST /api/users - Create a new user</li>
                        <li>• GET /api/users/:id - Get user by ID</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Submit your solution:
                      </label>
                      <Textarea
                        placeholder="Paste your code here..."
                        className="min-h-[200px]"
                      />
                      <Button>Submit Solution</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Take notes for this step..."
                    className="min-h-[200px]"
                  />
                  <Button className="mt-2">Save Notes</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resources" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Additional Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      {
                        title: "Express.js Documentation",
                        type: "Documentation",
                        url: "#",
                      },
                      {
                        title: "REST API Best Practices",
                        type: "Article",
                        url: "#",
                      },
                      {
                        title: "Node.js HTTP Module",
                        type: "Tutorial",
                        url: "#",
                      },
                    ].map((resource, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                          <div>
                            <h4 className="font-medium">{resource.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {resource.type}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Path Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Path Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{path.progress}%</span>
                </div>
                <Progress value={path.progress} className="h-2" />
              </div>
              <div className="text-sm text-muted-foreground">
                {steps.filter((s) => s.completed).length} of {steps.length}{" "}
                steps completed
              </div>
            </CardContent>
          </Card>

          {/* Step Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted ${
                    step.id === stepId
                      ? "bg-blue-50 border border-blue-200"
                      : ""
                  }`}
                  onClick={() =>
                    onNavigate?.(routes.pathContentWatch(pathId, step.id))
                  }
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                    {step.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{step.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{step.duration}</span>
                      <Badge variant="outline" className="text-xs">
                        {step.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="space-y-2">
            {prevStep && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  onNavigate?.(routes.pathContentWatch(pathId, prevStep.id))
                }
              >
                <SkipBack className="mr-2 h-4 w-4" />
                Previous: {prevStep.title}
              </Button>
            )}
            {nextStep && (
              <Button
                className="w-full justify-start"
                onClick={() =>
                  onNavigate?.(routes.pathContentWatch(pathId, nextStep.id))
                }
              >
                Next: {nextStep.title}
                <SkipForward className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
