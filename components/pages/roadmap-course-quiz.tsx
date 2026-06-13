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
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Quiz, Course, Roadmap } from "@/lib/data";
import { useAppStore } from "@/lib/store";
import ConfettiCelebration from "../confetti-celebration";
import { toast } from "sonner";
import { routes } from "@/lib/routes";

interface RoadmapCourseQuizProps {
  roadmapId: string;
  courseId?: string;
  quizId: string;
  showNav?: boolean;
  handleQuizSubmit: (passed: boolean) => void;
  onNavigate: (path: string) => void;
}

export function RoadmapCourseQuiz({
  roadmapId,
  courseId,
  quizId,
  showNav = true,
  onNavigate,
  handleQuizSubmit,
}: RoadmapCourseQuizProps) {
  const store = useAppStore();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap>();
  const [course, setCourse] = useState<Course>();
  const [quiz, setQuiz] = useState<Quiz>();
  const [celebration, setCelebration] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [newUserQuiz, setNewUserQuiz] = useState<any>();
  const [quizCompleted, setQuizCompleted] = useState(
    quiz?.userQuiz?.passed ?? false
  );

  async function loadData() {
    const roadmap = await store.getRoadmapBySlug(roadmapId);
    setRoadmap(roadmap);
    if (courseId) {
      const course = await store.getCourse(courseId);
      setCourse(course);
    }

    const quiz = await store.getQuiz(quizId);

    setQuiz(quiz);
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmitQuiz = async () => {
    let totalPoints = 0;
    let earnedPoints = 0;
    let result: any = [];

    if (!quiz) return;

    quiz?.questions.forEach((question, index) => {
      const userAnswerIndex = parseInt(answers[index]);

      // If user didn't answer, skip
      if (isNaN(userAnswerIndex)) return;

      const userAnswerValue = question?.options![userAnswerIndex];
      const correctAnswerValue = question.correctAnswer;
      const questionPoints = question.points || 0;

      totalPoints += questionPoints;

      if (userAnswerValue === correctAnswerValue) {
        earnedPoints += questionPoints;
        result.push({
          ...question,
          passed: true,
        });
      }
    });

    // Avoid division by 0
    const finalScore =
      totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    setScore(finalScore);

    await store.submitQuiz(quiz?.id!, {
      items: result,
      userQuizId: quiz?.userQuiz?.id ?? newUserQuiz?.id,
      score: finalScore,
    });

    setQuizCompleted(true);
    setCelebration(finalScore >= quiz?.passingScore!);
    handleQuizSubmit(finalScore >= quiz?.passingScore!);
  };

  useEffect(() => {
    if (quizStarted && !quizCompleted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !quizCompleted) {
      handleSubmitQuiz();
    }
  }, [quizStarted, quizCompleted, timeLeft]);

  if (!roadmap || (courseId && !course) || !quiz) {
    return <div>Quiz not found</div>;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answerIndex,
    }));
  };

  const startQuiz = async () => {
    try {
      const new_quiz = await store.startQuiz(quiz?.id);

      if (!new_quiz) return;

      setQuizStarted(true);

      setTimeLeft(quiz?.timeLimit * 60);
      setNewUserQuiz(new_quiz);

      Object.assign(quiz, { userQuiz: new_quiz, enrolled: true });
      if (!quiz?.userQuiz?.passed)
        toast.success("Quiz started and your time starts now");
    } catch (error: any) {
      console.log(error?.message);
      toast.error("An error occured. Please try again");
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setQuizStarted(false);
    setQuizCompleted(false);
    setScore(null);
    setTimeLeft(quiz?.timeLimit * 60);
  };

  if (!quizStarted) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {showNav && (
            <div className="border-b">
              <div className="px-1 sm:px-3 lg:px-2 py-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate(routes.roadmapDetail(roadmapId))}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Roadmap
                  </Button>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{roadmap?.title ?? "Roadmap title"}</span>
                    <span>•</span>
                    {/* <span>{milestone?.title ?? "Milestone title"}</span> */}
                    {/* <span>•</span> */}
                    <span>{course?.title ?? "Course title"}</span>
                    <span>•</span>
                    <span>{quiz?.title ?? "Quiz title"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{quiz?.title}</CardTitle>
              <p className="text-gray-600">{quiz?.description}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm text-gray-600">Questions</p>
                  <p className="text-2xl font-bold text-primary">
                    {quiz?.questions.length}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Time Limit</p>
                  <p className="text-2xl font-bold text-green-600">
                    {quiz?.timeLimit} min
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
                      <li>
                        • You have {quiz?.timeLimit} minutes to complete this
                        quiz
                      </li>
                      <li>• You need {quiz?.passingScore}% to pass</li>
                      <li>• You can retake the quiz if needed</li>
                      <li>• Make sure you have a stable internet connection</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button onClick={startQuiz} className="w-full" size="lg">
                {quiz?.enrolled && !quiz?.userQuiz?.passed
                  ? "Retake Quiz"
                  : quiz?.userQuiz?.passed
                  ? "Review Quiz"
                  : "Start Quiz"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  <ConfettiCelebration
    onComplete={() => setCelebration(false)}
    isVisible={celebration}
    celebrationType="completion"
    courseName={quiz?.title!}
  />;

  if (quizCompleted) {
    const _score = score ?? quiz?.userQuiz?.score;
    const passed = _score >= quiz?.passingScore!;

    const questions =
      quiz?.enrolled && quiz?.userQuiz?.completed
        ? quiz?.userQuiz.items
        : quiz?.questions;

    return (
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {showNav && (
            <div className="border-b">
              <div className="px-1 sm:px-3 lg:px-2 py-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate(routes.roadmapDetail(roadmapId))}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Roadmap
                  </Button>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{roadmap?.title ?? "Roadmap title"}</span>
                    <span>•</span>
                    {/* <span>{milestone?.title ?? "Milestone title"}</span> */}
                    {/* <span>•</span> */}
                    <span>{course?.title ?? "Course title"}</span>
                    <span>•</span>
                    <span>{quiz?.title ?? "Quiz title"}</span>
                  </div>
                </div>
              </div>
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
              <CardTitle className="text-2xl">
                {passed ? "Congratulations!" : "Quiz Complete"}
              </CardTitle>
              <p className="text-gray-600">
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
                <Badge
                  variant={passed ? "default" : "destructive"}
                  className="mb-4"
                >
                  {passed ? "PASSED" : "FAILED"} (Need {quiz?.passingScore}%)
                </Badge>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Quiz Review</h4>
                {questions.map((question: any, index: number) => {
                  const userAnswerIndex = parseInt(answers[index]);
                  const userAnswer = question?.options![userAnswerIndex];
                  const isCorrect = userAnswer === question.correctAnswer;

                  const text = () => {
                    if (userAnswer) return userAnswer;
                    if (question.passed) return question.correctAnswer;
                    return quiz?.userQuiz?.completed
                      ? "Not available"
                      : "Not answered";
                  };

                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start gap-2 mb-2">
                        {isCorrect || !question?.passed ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{question.question}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Your answer: {text()}
                          </p>
                          {(!isCorrect || !question?.passed) && (
                            <p className="text-sm text-green-600 mt-1">
                              Correct answer: {question?.correctAnswer}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 mt-2">
                            {question.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={resetQuiz}
                  variant="outline"
                  className="flex-1"
                >
                  Retake Quiz
                </Button>
                {showNav && (
                  <Button
                    onClick={() => onNavigate(routes.courseQuizzes(courseId ?? ""))}
                    className="flex-1"
                  >
                    Back to Quizzes
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQ = quiz?.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz?.questions.length) * 100;

  return (
    <div className="flex-1 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(routes.courseQuizzes(courseId ?? ""))}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit Quiz
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              {formatTime(timeLeft)}
            </div>
            <Badge variant="outline">
              {currentQuestion + 1} of {quiz?.questions.length}
            </Badge>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>

        {/* Question */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{currentQ.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentQ?.options?.map((option, index) => (
              <button
                key={index}
                onClick={() =>
                  handleAnswerSelect(currentQuestion, index.toString())
                }
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  answers[currentQuestion] === index.toString()
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      answers[currentQuestion] === index.toString()
                        ? "border-primary bg-primary"
                        : "border-gray-300"
                    }`}
                  >
                    {answers[currentQuestion] === index.toString() && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                    )}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>

          {currentQuestion === quiz?.questions?.length - 1 ? (
            <Button
              onClick={handleSubmitQuiz}
              disabled={Object.keys(answers).length !== quiz?.questions.length}
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

export { RoadmapCourseQuiz as RoadmapCourseQuizPage };
