"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Code,
  Clock,
  CheckCircle,
  XCircle,
  Trophy,
  Filter,
  Star,
} from "lucide-react";
import { routes } from "@/lib/routes";

interface CourseExercisesPageProps {
  courseId: string;
  onNavigate: (path: string) => void;
}

export function CourseExercisesPage({
  courseId,
  onNavigate,
}: CourseExercisesPageProps) {
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<
    "all" | "Easy" | "Medium" | "Hard"
  >("all");

  // Mock exercises data
  const exercises = [
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

  const filteredExercises = exercises.filter((exercise) => {
    const statusMatch =
      filter === "all" ||
      (filter === "completed" && exercise.completed) ||
      (filter === "pending" && !exercise.completed);

    const difficultyMatch =
      difficultyFilter === "all" || exercise.difficulty === difficultyFilter;

    return statusMatch && difficultyMatch;
  });

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

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-gray-500";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const totalPoints = exercises
    .filter((e) => e.passed)
    .reduce((acc, e) => acc + e.points, 0);
  const completedCount = exercises.filter((e) => e.completed).length;
  const passedCount = exercises.filter((e) => e.passed).length;

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(routes.courseDetail(courseId))}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Course
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Code className="h-6 w-6 text-primary" />
              Coding Exercises
            </h1>
            <p className="text-gray-600">
              Practice your coding skills with hands-on exercises
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-gray-600">Total Exercises</p>
                <p className="text-2xl font-bold">{exercises.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Passed</p>
                <p className="text-2xl font-bold">{passedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">MB Earned</p>
                <p className="text-2xl font-bold">{totalPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium">Status:</span>
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("completed")}
            >
              Completed
            </Button>
            <Button
              variant={filter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("pending")}
            >
              Pending
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Difficulty:</span>
            <Button
              variant={difficultyFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setDifficultyFilter("all")}
            >
              All
            </Button>
            <Button
              variant={difficultyFilter === "Easy" ? "default" : "outline"}
              size="sm"
              onClick={() => setDifficultyFilter("Easy")}
            >
              Easy
            </Button>
            <Button
              variant={difficultyFilter === "Medium" ? "default" : "outline"}
              size="sm"
              onClick={() => setDifficultyFilter("Medium")}
            >
              Medium
            </Button>
            <Button
              variant={difficultyFilter === "Hard" ? "default" : "outline"}
              size="sm"
              onClick={() => setDifficultyFilter("Hard")}
            >
              Hard
            </Button>
          </div>
        </div>
      </div>

      {/* Exercises Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {filteredExercises.map((exercise) => (
          <Card key={exercise.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{exercise.title}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {exercise.description}
                  </p>
                </div>
                <Badge className={getDifficultyColor(exercise.difficulty)}>
                  {exercise.difficulty}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Exercise Info */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />~{exercise.estimatedTime} min
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  {exercise.points} MB
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {exercise.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Progress/Score */}
              {exercise.completed ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Best Score</span>
                    <span
                      className={`font-semibold ${getScoreColor(
                        exercise.bestScore
                      )}`}
                    >
                      {exercise.bestScore}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {exercise.passed ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm text-gray-600">
                      {exercise.attempts} attempt
                      {exercise.attempts !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500">Not attempted yet</p>
                </div>
              )}

              {/* Action Button */}
              <Button
                className="w-full"
                onClick={() =>
                  onNavigate(routes.courseExercise(courseId, exercise.id))
                }
                variant={
                  exercise.completed && !exercise.passed ? "outline" : "default"
                }
              >
                {exercise.completed
                  ? exercise.passed
                    ? "Review Solution"
                    : "Try Again"
                  : "Start Exercise"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No exercises found
            </h3>
            <p className="text-gray-500">
              No exercises match your current filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
