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
  ArrowLeft,
  Code,
  Trophy,
  CheckCircle,
  AlertCircle,
  Target,
  Play,
  Star,
} from "lucide-react";
import { Roadmap, Milestone, Course, Quiz, Exercise } from "@/lib/data";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import { Loader } from "../ui/loader";

interface RoadmapCourseExercisesProps {
  roadmapId: string;
  topicId: string;
  courseId: string;
  onNavigate: (path: string) => void;
  onStartExercise: (exerciseId: string) => void;
}

export function RoadmapCourseExercises({
  roadmapId,
  courseId,
  topicId,
  onNavigate,
  onStartExercise,
}: RoadmapCourseExercisesProps) {
  const store = useAppStore();
  const [roadmap, setRoadmap] = useState<Roadmap>();
  const [milestone, setMilestone] = useState<Milestone | any>();
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState<Course>();
  const [exercises, setExercises] = useState<Quiz[] | any>([]);

  async function loadExercises() {
    try {
      const exercises = await store.getCourseExercises(courseId);
      setExercises(exercises);
    } catch (error) {}
  }

  async function findRoadmap(slug: string) {
    const roadmap = await store.getRoadmapBySlug(slug);
    setRoadmap(roadmap);

    const milestone = await store.getMilestone(slug, topicId);
    setMilestone(milestone);
  }

  async function findCourse(slug: string) {
    const course = await store.getCourse(slug, { isRoadmap: true });
    setCourse(course);
  }

  const mockExercises = [
    {
      id: "exercise-1",
      title: "Variable Declaration Practice",
      description:
        "Practice declaring and initializing variables in JavaScript",
      difficulty: "Easy",
      estimatedTime: 15,
      points: 50,
      completed: true,
      passed: true,
      attempts: 2,
      bestScore: 100,
      tags: ["variables", "basics"],
    },
    {
      id: "exercise-2",
      title: "Function Implementation",
      description: "Write functions to solve common programming problems",
      difficulty: "Medium",
      estimatedTime: 30,
      points: 100,
      completed: true,
      passed: false,
      attempts: 3,
      bestScore: 65,
      tags: ["functions", "logic"],
    },
    {
      id: "exercise-3",
      title: "Array Manipulation",
      description: "Master array methods and data manipulation techniques",
      difficulty: "Medium",
      estimatedTime: 25,
      points: 100,
      completed: false,
      passed: false,
      attempts: 0,
      bestScore: null,
      tags: ["arrays", "methods"],
    },
    {
      id: "exercise-4",
      title: "Async Programming Challenge",
      description: "Work with promises and async/await patterns",
      difficulty: "Hard",
      estimatedTime: 45,
      points: 150,
      completed: false,
      passed: false,
      attempts: 0,
      bestScore: null,
      tags: ["async", "promises"],
    },
  ];

  useEffect(() => {
    try {
      setLoading(true);
      findRoadmap(roadmapId);
      findCourse(courseId);
      loadExercises();
      setLoading(false);
    } catch (error) {}
  }, [roadmapId, courseId]);

  if (loading) return <Loader isLoader={false} />;

  if (!roadmap || !milestone || !course) {
    return <div>Course not found</div>;
  }

  const completedExercises = exercises?.filter(
    (e: Exercise) => e.completed
  ).length;
  const totalExercises = exercises?.length;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                onNavigate(
                  routes.roadmapCoursePreview(roadmapId, topicId, courseId)
                )
              }
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Button>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{roadmap?.title}</span>
              <span>•</span>
              <span>{milestone?.title}</span>
              <span>•</span>
              <span>{course?.title}</span>
              <span>•</span>
              <span>Exercises</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Code className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold dark:text-gray-100">
                    Coding Exercises
                  </h1>
                  <p className="text-gray-400">
                    Practice your skills with hands-on coding challenges
                  </p>
                </div>
              </div>

              {/* Progress Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-500">
                          {completedExercises}
                        </div>
                        <div className="text-sm text-gray-400">Completed</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Code className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-500">
                          {totalExercises}
                        </div>
                        <div className="text-sm text-gray-400">
                          Total Exercises
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Star className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-500">
                          {totalExercises > 0
                            ? Math.round(
                                (completedExercises / totalExercises) * 100
                              )
                            : 0}
                          %
                        </div>
                        <div className="text-sm text-gray-400">
                          Completion Rate
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Exercises List */}
            <div className="space-y-6">
              {!exercises?.length && !mockExercises?.length ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-500 mb-2">
                      No Exercises Available
                    </h3>
                    <p className="text-gray-400">
                      This course doesn't have any coding exercises yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                [...mockExercises, ...exercises]?.map(
                  (exercise: Exercise, index: number) => (
                    <Card
                      key={exercise?.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 text-purple-600 rounded-full font-semibold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <CardTitle className="text-xl">
                                  {exercise?.title}
                                </CardTitle>
                                <Badge
                                  className={getDifficultyColor(
                                    exercise?.difficulty
                                  )}
                                >
                                  {exercise?.difficulty}
                                </Badge>
                              </div>
                              <CardDescription className="text-base mb-3">
                                {exercise?.description}
                              </CardDescription>

                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Code className="h-4 w-4" />
                                  <span>{exercise?.language}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Trophy className="h-4 w-4" />
                                  <span>
                                    {exercise?.testCases?.length} test cases
                                  </span>
                                </div>
                                {exercise?.hints?.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>
                                      {exercise?.hints?.length} hints available
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            {exercise?.completed ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                {exercise?.attempts > 0
                                  ? "In Progress"
                                  : "Not Started"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Attempts: </span>
                              <span className="font-medium">
                                {exercise?.attempts}
                              </span>
                            </div>

                            {exercise?.completed && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-green-600 font-medium">
                                  Solved
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => onStartExercise(exercise?.id)}
                              className="flex items-center gap-2"
                            >
                              <Play className="h-4 w-4" />
                              {exercise?.completed
                                ? "Review Solution"
                                : exercise?.attempts > 0
                                ? "Continue"
                                : "Start Exercise"}
                            </Button>
                          </div>
                        </div>

                        {/* Show test cases preview */}
                        {exercise?.testCases?.length > 0 && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm font-medium text-gray-500 mb-2">
                              Sample Test Case:
                            </div>
                            <div className="text-sm text-gray-700">
                              <div>
                                <strong>Input:</strong>{" "}
                                {exercise?.testCases?.[0]?.input}
                              </div>
                              <div>
                                <strong>Expected Output:</strong>{" "}
                                {exercise?.testCases?.[0]?.expectedOutput}
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                )
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Roadmap Context */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4 text-primary" />
                  Roadmap Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Current Roadmap
                  </div>
                  <div className="text-sm text-gray-400">{roadmap?.title}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Current Milestone
                  </div>
                  <div className="text-sm text-gray-400">
                    {milestone?.title}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-2">
                    Milestone Progress
                  </div>
                  <Progress value={milestone?.progress} className="h-2" />
                  <div className="text-xs text-gray-500 mt-1">
                    {milestone?.progress}% complete
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exercise Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Exercise Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Read the problem statement carefully</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Start with the sample test cases</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Use hints if you get stuck</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Test your solution thoroughly</span>
                </div>
              </CardContent>
            </Card>

            {/* Difficulty Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Difficulty Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    Easy
                  </Badge>
                  <span>Basic concepts and syntax</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                    Medium
                  </Badge>
                  <span>Algorithms and data structures</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-800 text-xs">
                    Hard
                  </Badge>
                  <span>Complex problem solving</span>
                </div>
              </CardContent>
            </Card>

            {/* Course Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Course Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Overall Progress
                      </span>
                      <span className="text-sm text-gray-400">
                        {course?.progress}%
                      </span>
                    </div>
                    <Progress value={course?.progress} className="h-2" />
                  </div>

                  <div className="text-sm text-gray-400">
                    Complete exercises to practice your coding skills and
                    reinforce your learning.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export { RoadmapCourseExercises as RoadmapCourseExercisesPage };
