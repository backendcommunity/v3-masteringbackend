"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Brain,
  Clock,
  CheckCircle,
  XCircle,
  Trophy,
  Filter,
} from "lucide-react";
import { routes } from "@/lib/routes";
import { useAppStore } from "@/lib/store";
import { Course, Quiz } from "@/lib/data";
import { PaymentDialog } from "../payment-dialog";
import { PageSkeleton } from "@/components/ui/page-skeleton";

interface CourseQuizzesPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export function CourseQuizzesPage({
  slug,
  onNavigate,
}: CourseQuizzesPageProps) {
  const store = useAppStore();
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all");
  const [quizzes, setQuizzes] = useState<Quiz[] | any>();
  const [course, setCourse] = useState<Course | any>();
  const [filteredQuizzes, setFilteredQuizzes] = useState<any[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  async function loadQuizzes() {
    const quizzes = await store.getCourseQuizzes(slug);

    const uniqueFiltered = Array.from(
      new Map(quizzes.map((item: any) => [item.quiz.id, item])).values()
    );

    setQuizzes(uniqueFiltered);
    setCourse(quizzes?.[0]?.course);
  }

  useEffect(() => {
    loadQuizzes();
  }, []);

  useEffect(() => {
    if (!quizzes) return;

    const filtered = quizzes?.filter(({ userQuiz, enrolled }: any) => {
      if (filter === "completed") return enrolled && userQuiz?.completed;
      if (filter === "pending") return !enrolled || !userQuiz?.completed;
      return true;
    });

    const uniqueFiltered = Array.from(
      new Map(filtered.map((item: any) => [item.quiz.id, item])).values()
    );

    setFilteredQuizzes(uniqueFiltered);
  }, [filter, quizzes]);

  if (!quizzes) return <PageSkeleton />;

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

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(routes.courseDetail(slug))}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Course
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              Course Quizzes
            </h1>
            <p className="text-gray-400">
              Test your knowledge and track your progress
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-gray-400">Total Quizzes</p>
                <p className="text-2xl font-bold">{quizzes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-400">Completed</p>
                <p className="text-2xl font-bold">
                  {
                    quizzes.filter(({ userQuiz }: any) => userQuiz?.completed)
                      ?.length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-400">Passed</p>
                <p className="text-2xl font-bold">
                  {
                    quizzes.filter(({ userQuiz }: any) => userQuiz?.passed)
                      .length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-gray-400">Avg Score</p>
                <p className="text-2xl font-bold">
                  {Math.round(
                    quizzes
                      .filter(({ userQuiz }: any) => {
                        return userQuiz?.bestScore;
                      })
                      .reduce(
                        (acc: any, { userQuiz }: any) =>
                          acc + (userQuiz?.bestScore || 0),
                        0
                      ) /
                      quizzes.filter(({ userQuiz }: any) => userQuiz?.bestScore)
                        .length
                  ) || 0}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-4 w-4 text-gray-400" />
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All Quizzes
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

      {/* Quizzes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {filteredQuizzes?.map(({ quiz, userQuiz, enrolled }: any) => (
          <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{quiz.title}</CardTitle>
                  <p className="text-sm text-gray-400 mt-1">
                    {quiz.description}
                  </p>
                </div>
                <Badge className={getDifficultyColor(quiz.difficulty)}>
                  {quiz.difficulty}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quiz Info */}
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Brain className="h-4 w-4" />
                  {quiz?.questions?.length} questions
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {quiz.timeLimit} min
                </div>
              </div>

              {/* Progress/Score */}

              {enrolled && userQuiz?.completed ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Best Score</span>
                    <span
                      className={`font-semibold ${getScoreColor(
                        userQuiz?.bestScore
                      )}`}
                    >
                      {userQuiz?.bestScore}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {userQuiz?.passed ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm text-gray-400">
                      {userQuiz?.attempts} attempt
                      {userQuiz?.attempts !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500">Not attempted yet</p>
                </div>
              )}

              {/* Action Button */}

              {!enrolled && !course?.enrolled ? (
                <Button
                  className="w-full"
                  onClick={() => setShowPaymentDialog(true)}
                  variant={"default"}
                >
                  Start Quiz
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => onNavigate(routes.courseQuiz(slug, quiz.id))}
                  variant={
                    userQuiz?.completed && !userQuiz?.passed
                      ? "outline"
                      : "default"
                  }
                >
                  {userQuiz?.completed
                    ? userQuiz?.passed
                      ? "Review Quiz"
                      : "Retake Quiz"
                    : "Start Quiz"}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredQuizzes?.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">
              No quizzes found
            </h3>
            <p className="text-gray-500">
              {filter === "all"
                ? "No quizzes available for this course yet."
                : `No ${filter} quizzes found.`}
            </p>
          </CardContent>
        </Card>
      )}

      {showPaymentDialog && (
        <PaymentDialog
          onClose={() => setShowPaymentDialog(false)}
          open={showPaymentDialog}
          data={course}
          onHandlePreview={() => {}}
          onHandlePurchase={() => {}}
        />
      )}
    </div>
  );
}
