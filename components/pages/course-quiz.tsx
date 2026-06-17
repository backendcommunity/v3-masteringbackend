"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { routes } from "@/lib/routes";
import { useAppStore } from "@/lib/store";
import { Quiz } from "@/lib/data";
import { DEFAULT_QUIZ_PASSING_SCORE } from "@/lib/constants";
import { toast } from "sonner";
import ConfettiCelebration from "../confetti-celebration";
import { Loader } from "../ui/loader";
import StableTimer from "../atoms/Timer";

interface CourseQuizPageProps {
  courseId: string;
  quizId: string;
  onNavigate: (path: string) => void;
  showNav?: boolean;
  handleQuizSubmit: (passed: boolean) => void;
  // Called when the learner closes the quiz after passing — lets the parent
  // advance to the next video/chapter automatically.
  onClose?: () => void;
}

export function CourseQuizPage({
  courseId,
  quizId,
  onNavigate,
  showNav = true,
  handleQuizSubmit,
  onClose,
}: CourseQuizPageProps) {
  const store = useAppStore();

  const [quiz, setQuiz] = useState<Quiz>();
  const [quizStatus, setQuizStatus] = useState<
    "loading" | "not_started" | "in_progress" | "completed" | "failed"
  >("loading");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState<number>(0);
  const [celebration, setCelebration] = useState(false);

  // ✅ Load quiz details on mount
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setQuizStatus("loading");
        const _quiz = await store.getQuiz(quizId);

        if (!_quiz) {
          toast.error("Quiz not found!");
          setQuizStatus("failed");
          return;
        }

        setQuiz(_quiz);

        // Determine initial quiz status
        if (_quiz.userQuiz?.completed || _quiz.userQuiz?.passed) {
          setQuizStatus("completed");
          setScore(_quiz.userQuiz?.score);
        } else if (_quiz.enrolled) {
          setQuizStatus("in_progress");
        } else {
          setQuizStatus("not_started");
        }

        // Initialize timer
        setTimeLeft((_quiz?.timeLimit ?? 20) * 60);
      } catch (error) {
        toast.error("Failed to load quiz");
        setQuizStatus("failed");
      }
    };

    loadQuiz();
  }, [quizId]);

  const handleAnswerSelect = (questionIndex: number, answerIndex: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answerIndex,
    }));
  };

  // ✅ Submit quiz
  const handleSubmitQuiz = async () => {
    if (!quiz) return;

    let totalPoints = 0;
    let earnedPoints = 0;
    const results: any[] = [];

    quiz.questions.forEach((question, index) => {
      const userAnswerIndex = parseInt(answers[index]);
      if (isNaN(userAnswerIndex)) return;

      const userAnswerValue = question.options![userAnswerIndex];
      const correctAnswerValue = question.correctAnswer;
      const questionPoints = question.points || 0;

      totalPoints += questionPoints;
      const passed = userAnswerValue === correctAnswerValue;
      if (passed) earnedPoints += questionPoints;

      results.push({ ...question, userAnswer: userAnswerValue, passed });
    });

    const finalScore =
      totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = finalScore >= (quiz?.passingScore ?? DEFAULT_QUIZ_PASSING_SCORE);

    setScore(finalScore);
    setQuizStatus("completed");
    setCelebration(passed);
    handleQuizSubmit(passed);

    const updatedQuiz = {
      ...quiz,
      userQuiz: {
        ...quiz.userQuiz,
        score: finalScore,
        completed: true,
        items: results,
      },
      passed,
    };
    setQuiz(updatedQuiz);

    await store.submitQuiz(quiz.id, {
      items: results,
      userQuizId: quiz?.userQuiz?.id ?? quiz?.id,
      score: finalScore,
      completed: true,
    });
  };

  // ✅ Start quiz
  const startQuiz = async () => {
    if (!quiz) return;
    try {
      const startedQuiz = await store.startQuiz(quiz.id);
      if (!startedQuiz) throw new Error("asa");

      Object.assign(quiz, { enrolled: true, userQuiz: startedQuiz });

      // setQuiz((prev) => ({
      //   ...prev,
      //   enrolled: true,
      //   userQuiz: startedQuiz,
      //   id: "asas",
      // }));

      setQuizStatus("in_progress");
      setTimeLeft((quiz?.timeLimit ?? 20) * 60);
      setCurrentQuestion(0);
      setAnswers({});
      toast.success("Quiz started — your time starts now!");
    } catch {
      toast.error("Failed to start quiz. Try again.");
    }
  };

  const resetQuiz = () => {
    if (!quiz) return;
    setQuizStatus("not_started");
    setAnswers({});
    setScore(0);
    setCurrentQuestion(0);
    setTimeLeft((quiz?.timeLimit ?? 20) * 60);
  };

  const handleClose = () => {
    setQuizStatus("not_started");
    // After a pass, closing should auto-advance to the next video/chapter.
    onClose?.();
  };

  // ===============================
  // Render Logic
  // ===============================

  if (quizStatus === "loading") {
    return (
      <div className="flex items-center p-6 h-[400px]">
        <div className="max-w-2xl mx-auto space-y-6">
          <Loader isFull={false} isLoader={true} />
        </div>
      </div>
    );
  }

  if (quizStatus === "failed") {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto text-center space-y-4 py-12">
          <h2 className="text-xl font-semibold">Quiz Unavailable</h2>
          <p className="text-muted-foreground">
            This quiz could not be loaded. Please try again later.
          </p>
          {showNav && (
            <Button variant="outline" onClick={() => onNavigate(-1 as any)}>
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  // 🧩 Not Started
  if (quizStatus === "not_started") {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {showNav && (
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate(routes.courseQuizzes(courseId))}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Quizzes
              </Button>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl dark:text-white">
                {quiz.title}
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-300">
                {quiz.description}
              </p>
            </CardHeader>
            <CardContent className="space-y-6 dark:text-white">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm text-gray-600">Questions</p>
                  <p className="text-2xl font-bold text-primary">
                    {quiz?.questions?.length}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Time Limit</p>
                  <p className="text-2xl font-bold text-green-600">
                    {quiz.timeLimit} min
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800">
                      Quiz Instructions
                    </h4>
                    <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                      <li>• You have {quiz.timeLimit} minutes to complete</li>
                      <li>• You need {quiz.passingScore}% to pass</li>
                      <li>• You can retake if needed</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button onClick={startQuiz} className="w-full" size="lg">
                Start Quiz
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 🧩 In Progress
  if (quizStatus === "in_progress") {
    const currentQ = quiz?.questions?.[currentQuestion];
    const progress = ((currentQuestion + 1) / quiz?.questions?.length) * 100;

    return (
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {showNav && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate(routes.courseQuizzes(courseId))}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Exit Quiz
            </Button>
          )}

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              {/* {formatTime(timeLeft)} */}

              <StableTimer
                duration={timeLeft} // 5 minutes
                isRunning={quizStatus === "in_progress"}
                onComplete={handleSubmitQuiz}
              />
            </div>
            <Badge variant="outline">
              {currentQuestion + 1} / {quiz?.questions?.length}
            </Badge>
          </div>

          <Progress value={progress} />

          <Card>
            <CardHeader>
              <CardTitle className="text-xl dark:text-white">
                {currentQ?.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentQ?.options?.map((option, index) => (
                <button
                  key={index}
                  onClick={() =>
                    handleAnswerSelect(currentQuestion, index.toString())
                  }
                  className={`w-full text-left p-4 rounded-lg border transition-colors dark:text-white ${
                    answers[currentQuestion] === index.toString()
                      ? "bg-primary border-primary dark:bg-primary-900 dark:border-primary"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {option}
                </button>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() =>
                setCurrentQuestion((prev) => Math.max(0, prev - 1))
              }
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>

            {currentQuestion === quiz?.questions?.length - 1 ? (
              <Button
                onClick={handleSubmitQuiz}
                disabled={
                  Object.keys(answers).length !== quiz?.questions?.length
                }
              >
                Submit Quiz
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestion((prev) => prev + 1)}
                disabled={!answers[currentQuestion]}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 🧩 Completed
  if (quizStatus === "completed") {
    const _score =
      score > 0
        ? score
        : quiz.enrolled
          ? quiz.userQuiz.bestScore
          : quiz.userQuiz?.score;

    const passed = _score >= (quiz.passingScore ?? DEFAULT_QUIZ_PASSING_SCORE);
    const questions = quiz.userQuiz?.items ?? quiz?.questions;

    return (
      <div className="flex-1 p-6 relative">
        {celebration && (
          <ConfettiCelebration
            onComplete={() => setCelebration(false)}
            isVisible={celebration}
            celebrationType="completion"
            courseName={quiz.title}
          />
        )}

        <div className="max-w-2xl mx-auto space-y-6">
          {showNav && (
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate(routes.courseQuizzes(courseId))}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Quizzes
              </Button>
            </div>
          )}

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                {passed ? (
                  <CheckCircle className="h-16 w-16 text-green-600" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-600" />
                )}
              </div>
              <CardTitle className="text-2xl dark:text-white">
                {passed ? "Congratulations!" : "Quiz Complete"}
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-300">
                {passed
                  ? "You passed the quiz!"
                  : "You can retake the quiz to improve your score."}
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center">
                <div
                  className="text-4xl font-bold mb-2"
                  style={{ color: passed ? "#16a34a" : "#dc2626" }}
                >
                  {_score}%
                </div>
                <Badge variant={passed ? "default" : "destructive"}>
                  {passed ? "PASSED" : "FAILED"} (Need {quiz.passingScore}%)
                </Badge>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold dark:text-white">Quiz Review</h4>
                {questions?.map((question: any, index: number) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 dark:border-gray-600 dark:bg-gray-900"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {question?.passed ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium dark:text-white">
                          {question?.question}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Your answer:{" "}
                          {question?.userAnswer
                            ? question.userAnswer
                            : question.passed
                              ? question.correctAnswer
                              : "Not answered"}
                        </p>
                        {!question.passed && (
                          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                            Correct answer: {question.correctAnswer}
                          </p>
                        )}
                        {question.explanation && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            {question.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 flex-col">
                <Button
                  onClick={resetQuiz}
                  variant="outline"
                  className="flex-1"
                >
                  Retake Quiz
                </Button>
                {passed && (
                  <Button
                    variant="destructive"
                    onClick={handleClose}
                    className="w-full"
                    size="lg"
                  >
                    Close Quiz
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
