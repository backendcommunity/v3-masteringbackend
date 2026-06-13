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
  Clock,
  Trophy,
  CheckCircle,
  AlertCircle,
  Target,
  FileText,
  Play,
  Star,
} from "lucide-react";
import { Roadmap, Milestone, Course, Quiz } from "@/lib/data";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";

interface RoadmapCourseQuizzesProps {
  roadmapId: string;
  topicId: string;
  courseId: string;
  onNavigate: (path: string) => void;
  onStartQuiz: (quizId: string) => void;
}

export function RoadmapCourseQuizzes({
  roadmapId,
  topicId,
  courseId,
  onNavigate,
  onStartQuiz,
}: RoadmapCourseQuizzesProps) {
  const store = useAppStore();
  const [roadmap, setRoadmap] = useState<Roadmap>();
  const [milestone, setMilestone] = useState<Milestone | any>();
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState<Course>();
  const [quizzes, setQuizzes] = useState<Quiz[] | any>();

  async function loadQuizzes() {
    const quizzes = await store.getCourseQuizzes(courseId);
    setQuizzes(quizzes);
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

  useEffect(() => {
    setLoading(true);
    findRoadmap(roadmapId);
    findCourse(courseId);
    loadQuizzes();
    setLoading(false);
  }, [roadmapId, courseId]);

  if (loading || !roadmap || !milestone || !course) {
    return <div>Course not found</div>;
  }

  const completedQuizzes = quizzes.filter(
    ({ userQuiz, enrolled }: any) => enrolled && userQuiz?.completed
  ).length;

  const totalQuizzes = quizzes.length;
  const averageScore =
    quizzes
      .filter((q: any) => q?.userQuiz?.score !== undefined)
      .reduce((acc: number, q: any) => acc + (q?.userQuiz?.score || 0), 0) /
    Math.max(
      1,
      quizzes.filter((q: any) => q?.userQuiz?.score !== undefined).length
    );

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <div className="bg-whit border-b">
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
              <span>Quizzes</span>
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
              {/* <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-100">
                    Course Quizzes
                  </h1>
                  <p className="text-gray-300">
                    Test your knowledge with interactive quizzes
                  </p>
                </div>
              </div> */}

              {/* Progress Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-400">
                          {completedQuizzes}
                        </div>
                        <div className="text-sm text-gray-400">Completed</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-400">
                          {totalQuizzes}
                        </div>
                        <div className="text-sm text-gray-400">
                          Total Quizzes
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Star className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-400">
                          {isNaN(averageScore)
                            ? "--"
                            : Math.round(averageScore)}
                          %
                        </div>
                        <div className="text-sm text-gray-400">
                          Average Score
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quizzes List */}
            <div className="space-y-6">
              {quizzes.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-400 mb-2">
                      No Quizzes Available
                    </h3>
                    <p className="text-gray-300">
                      This course doesn't have any quizzes yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                quizzes.map((course: any, index: number) => (
                  <Card
                    key={course?.quiz?.id + index}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 text-primary rounded-full font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-2">
                              {course?.quiz?.title}
                            </CardTitle>
                            <CardDescription className="text-base mb-3">
                              {course?.quiz?.description}
                            </CardDescription>

                            <div className="flex items-center gap-4 text-sm text-gray-300">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{course?.quiz?.timeLimit} minutes</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                <span>
                                  {course?.quiz?.questions?.length} questions
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Trophy className="h-4 w-4" />
                                <span>
                                  {course?.quiz?.passingScore}% to pass
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {course?.userQuiz?.completed ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Not Started</Badge>
                          )}

                          {course?.userQuiz?.score !== undefined && (
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-400">
                                {course?.userQuiz?.bestScore}%
                              </div>
                              <div className="text-xs text-gray-500">
                                Best Score
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <span className="text-gray-300">Attempts: </span>
                            <span className="font-medium">
                              {course?.userQuiz?.attempts} /{" "}
                              {course?.quiz?.maxAttempts}
                            </span>
                          </div>

                          {course?.userQuiz?.completed &&
                            course?.userQuiz?.score !== undefined && (
                              <div className="flex items-center gap-1">
                                {course?.userQuiz?.score >=
                                course?.quiz?.passingScore ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-green-600 font-medium">
                                      Passed
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                    <span className="text-red-600 font-medium">
                                      Failed
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                          {course?.userQuiz?.completed &&
                            course?.userQuiz?.score !== undefined &&
                            course?.userQuiz?.score <
                              course?.quiz.passingScore &&
                            course?.userQuiz?.attempts <
                              course?.quiz?.maxAttempts && (
                              <Button
                                variant="outline"
                                onClick={() => onStartQuiz(course?.quiz?.id)}
                                className="flex items-center gap-2"
                              >
                                <Play className="h-4 w-4" />
                                Retake Quiz
                              </Button>
                            )}

                          {!course?.userQuiz?.completed &&
                            course?.userQuiz?.attempts <
                              course?.quiz.maxAttempts && (
                              <Button
                                onClick={() => onStartQuiz(course?.quiz?.id)}
                                className="flex items-center gap-2"
                              >
                                <Play className="h-4 w-4" />
                                {course?.quiz?.attempts > 0
                                  ? "Continue Quiz"
                                  : "Start Quiz"}
                              </Button>
                            )}

                          {course?.userQuiz?.attempts >=
                            course?.quiz.maxAttempts &&
                            !course?.userQuiz?.completed && (
                              <Badge variant="destructive">
                                Max Attempts Reached
                              </Badge>
                            )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
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
                  <div className="text-sm font-medium text-gray-400 mb-1">
                    Current Roadmap
                  </div>
                  <div className="text-sm text-gray-300">{roadmap?.title}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-1">
                    Current Milestone
                  </div>
                  <div className="text-sm text-gray-300">
                    {milestone?.title}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-2">
                    Milestone Progress
                  </div>
                  <Progress
                    value={milestone?.userTopic?.progress}
                    className="h-2"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {milestone?.userTopic?.progress}% complete
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quiz Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quiz Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Read each question carefully before answering</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>You can retake quizzes if you don't pass</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Review course materials before attempting</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Time limits help simulate real-world scenarios</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export { RoadmapCourseQuizzes as RoadmapCourseQuizzesPage };
