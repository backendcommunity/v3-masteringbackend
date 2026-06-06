// Old page (adapted with API functionality):
import { useState, useEffect, useCallback } from "react";
import { downloadInterviewPDF } from "@/lib/generate-interview-pdf";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  TrendingUp,
  MessageSquare,
  BookOpen,
  Download,
  Star,
  Target,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Clock,
  XCircle,
} from "lucide-react";
import { useAppStore } from "@/lib/store";

// Types
interface TranscriptEntry {
  role: "interviewer" | "candidate";
  content: string;
  timestamp: string;
}

interface TopicBreakdown {
  topic: string;
  score: number;
  feedback?: string;
}

interface QuestionAnalysis {
  questionId: string;
  question: string;
  userAnswer: string;
  score: number;
  feedback: string;
}

interface SessionReport {
  id: string;
  sessionId: string;
  overallScore: number;
  result: "PASS" | "FAIL" | "BORDERLINE";
  grade: string;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  topicBreakdown: TopicBreakdown[];
  questionAnalysis: QuestionAnalysis[];
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  recommendations: Array<{
    title: string;
    description: string;
    resources: string[];
  }>;
  transcript: Array<{
    speaker: "interviewer" | "candidate";
    message: string;
    timestamp: string;
  }>;
  summary?: string;
  interview?: {
    position?: string;
    company?: string;
    difficulty?: string;
    duration?: number;
    title?: string;
    scheduledDate?: string;
  };
  status?: string;
}

interface MockInterviewResultsProps {
  sessionId: string;
  onNavigate: (path: string) => void;
}

type ReportStatus =
  | "loading"
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "skipped";

// Helper functions
function getGradeFromScore(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "B+";
  if (score >= 80) return "B";
  if (score >= 75) return "C+";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function isStringArray(arr: Array<string | any>) {
  return Array.isArray(arr) && arr.every((item) => typeof item === "string");
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case "A+":
    case "A":
      return "text-green-600";
    case "B+":
    case "B":
      return "text-blue-600";
    case "C+":
    case "C":
      return "text-yellow-600";
    default:
      return "text-red-600";
  }
}

function getPerformanceMessage(
  score: number,
  result: string,
): { title: string; description: string } {
  if (result === "PASS" || score >= 80) {
    return {
      title: "Excellent Performance!",
      description:
        "You demonstrated strong technical skills and clear communication throughout the interview.",
    };
  }
  if (result === "BORDERLINE" || score >= 60) {
    return {
      title: "Good Effort!",
      description:
        "You showed solid understanding in several areas. Review the feedback below to improve.",
    };
  }
  return {
    title: "Keep Practicing!",
    description:
      "There's room for improvement. Focus on the areas highlighted in the feedback.",
  };
}

// Loading State Component
function LoadingState() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Loader2 className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h2 className="text-lg font-semibold mt-6">Loading results...</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Please wait while we fetch your interview results.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Processing State Component
function ProcessingState({ attempts }: { attempts?: number }) {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-10 h-10 text-primary animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mt-6">
            Analyzing Your Interview
          </h2>
          <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">
            Our AI is reviewing your responses and generating detailed feedback.
            This usually takes 1-2 minutes.
          </p>
          <div className="flex items-center gap-2 mt-6">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
            <div
              className="w-2 h-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: "0.1s" }}
            />
            <div
              className="w-2 h-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: "0.2s" }}
            />
          </div>
          {attempts && attempts > 0 && (
            <p className="text-xs text-muted-foreground mt-4">
              Processing attempt {attempts}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Failed State Component
function FailedState({
  error,
  onRetry,
  isRetrying,
  onNavigate,
}: {
  error?: string;
  onRetry: () => void;
  isRetrying: boolean;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mt-6">
            Report Generation Failed
          </h2>
          <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">
            {error ||
              "We encountered an issue while generating your report. Please try again."}
          </p>
          <div className="flex items-center gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => onNavigate("/mock-interviews")}
            >
              Back to Interviews
            </Button>
            <Button onClick={onRetry} disabled={isRetrying}>
              {isRetrying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Skipped State Component
function SkippedState({
  reason,
  onNavigate,
}: {
  reason?: string;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
          <h2 className="text-xl font-semibold mt-6">
            Insufficient Data for Report
          </h2>
          <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">
            {reason ||
              "The interview session didn't have enough conversation data to generate a meaningful report. Please complete a full interview session."}
          </p>
          <Button
            className="mt-6"
            onClick={() => onNavigate("/mock-interviews")}
          >
            <Trophy className="w-4 h-4 mr-2" />
            Start New Interview
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Main component
export function MockInterviewResultsPage({
  sessionId,
  onNavigate,
}: MockInterviewResultsProps) {
  const store = useAppStore();

  // State
  const [report, setReport] = useState<SessionReport | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [status, setStatus] = useState<ReportStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch report directly
  const fetchReport = useCallback(async () => {
    try {
      setStatus("processing");

      const data = await store.getChatSessionReport(sessionId);

      if (!data) {
        setStatus("failed");
        setError("Failed to generate report");
        return;
      }

      setReport(data);
      setStatus("completed");
    } catch (err: any) {
      console.error("Failed to generate report:", err);
      setStatus("failed");
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to generate report",
      );
    }
  }, [sessionId, store]);

  // Initial fetch
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Handle retry
  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await store.generateSessionReport(sessionId);
      setStatus("pending");
      setError(null);
      // Restart polling
      fetchReport();
    } catch (err: any) {
      console.error("Failed to retry:", err);
      setError(err?.response?.data?.message || "Failed to retry");
    } finally {
      setIsRetrying(false);
    }
  };

  // Handle PDF download
  const handleDownloadReport = async () => {
    if (!report) return;

    setIsDownloading(true);
    try {
      await downloadInterviewPDF(report);
    } catch (err: any) {
      console.error("Failed to download PDF:", err);
      alert("Failed to download report. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Render based on status
  if (status === "loading") {
    return <LoadingState />;
  }

  if (status === "pending" || status === "processing") {
    return <ProcessingState attempts={attempts} />;
  }

  if (status === "skipped") {
    return <SkippedState reason={error || undefined} onNavigate={onNavigate} />;
  }

  if (status === "failed" || !report) {
    return (
      <FailedState
        error={error || undefined}
        onRetry={handleRetry}
        isRetrying={isRetrying}
        onNavigate={onNavigate}
      />
    );
  }

  // Extract data from report
  const grade = report.grade || getGradeFromScore(report.overallScore);
  // const performance = getPerformanceMessage(report.overallScore, report.result);
  const score = report?.overallScore ?? 0;
  const feedback = {
    grade,
    summary: report.summary || "",
    overallScore: score,
    technicalScore: ((report?.technicalScore ?? 0) || score) ?? 0,
    communicationScore:
      (report?.communicationScore ?? 0) || Math.max(score - 5, 0),
    problemSolvingScore: report.problemSolvingScore || Math.max(score - 3, 0),
    questionAnalysis: report.questionAnalysis || [],
    strengths: report.strengths || [],
    improvements: report.weaknesses || report.improvements || [],
    recommendations: report.recommendations || [],
    transcript:
      report.transcript ||
      transcript.map((t) => ({
        speaker: t.role,
        message: t.content,
        timestamp: t.timestamp,
      })),
  };

  return (
    <div className="container mx-auto px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center flex-col lg:flex-row gap-3 justify-between">
        <div>
          <h1 className="text-3xl font-bold">Interview Results</h1>
          <p className="text-muted-foreground">
            {report.interview?.title ||
              report.interview?.position ||
              "Mock Interview"}{" "}
            •{" "}
            {report.interview?.scheduledDate
              ? new Date(report.interview.scheduledDate).toLocaleDateString()
              : new Date().toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadReport}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </>
            )}
          </Button>
          <Button onClick={() => onNavigate("/mock-interviews")}>
            Back to Interviews
          </Button>
        </div>
      </div>

      {/* Overall Score Card */}
      <Card className="border-2">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-center">
              <div
                className={`text-6xl font-bold ${getGradeColor(
                  feedback.grade,
                )}`}
              >
                {feedback.grade}
              </div>
              <p className="text-sm text-muted-foreground">Overall Grade</p>
            </div>
            <div className="text-center">
              <div className="text-6xl font-bold text-primary">
                {feedback.overallScore}
              </div>
              <p className="text-sm text-muted-foreground">Score</p>
            </div>
          </div>
          <CardTitle className="text-md">{feedback.summary}</CardTitle>
          {/* <CardDescription>{feedback.summary}</CardDescription> */}
        </CardHeader>
      </Card>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Technical Skills
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedback.technicalScore}%</div>
            <Progress value={feedback.technicalScore} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Communication</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedback.communicationScore}%
            </div>
            <Progress value={feedback.communicationScore} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Problem Solving
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedback.problemSolvingScore}%
            </div>
            <Progress value={feedback.problemSolvingScore} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analysis">Question Analysis</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          <div className="space-y-4">
            {feedback?.questionAnalysis.length <= 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No Question Analysis Found
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Try answering some questions in the interview to see
                    detailed analysis and feedback here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {feedback?.questionAnalysis?.map((analysis, index) => (
                  <Card key={analysis.questionId}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          Question {index + 1}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              analysis.score >= 80
                                ? "default"
                                : analysis.score >= 60
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {analysis.score}%
                          </Badge>
                          {analysis.score >= 80 ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                          )}
                        </div>
                      </div>
                      <CardDescription>{analysis.question}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="font-medium mb-2">Your Answer:</h4>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                          {analysis.userAnswer}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Feedback:</h4>
                        <p className="text-sm">{analysis.feedback}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feedback?.strengths?.length <= 0 ? (
                    <li className="flex items-start gap-2">
                      <Star className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">
                        No transcript data available to evaluate performance.
                      </span>
                    </li>
                  ) : (
                    <>
                      {feedback?.strengths?.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Star className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                    </>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <TrendingUp className="h-5 w-5" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feedback?.improvements?.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transcript" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Interview Transcript
              </CardTitle>
              <CardDescription>
                Complete conversation log from your interview session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {feedback.transcript.length <= 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        No transcript data available.
                      </h3>
                      <p className="text-muted-foreground text-center mb-4">
                        Try answering some questions in the interview to see the
                        full transcript here.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {feedback.transcript.map((entry, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex-shrink-0">
                          <Badge
                            variant={
                              entry.speaker === "interviewer"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {entry.speaker === "interviewer" ? "AI" : "You"}
                          </Badge>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{entry.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {isStringArray(feedback?.recommendations) ? (
            <div className="space-y-4">
              {" "}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                {feedback?.recommendations?.map(
                  (recommendation: any, index) => (
                    <div key={index} className="space-y-2 px-4">
                      <ul className="space-y-1 pb-3">
                        <li className="flex items-center  gap-2 py-1">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          <span className="text-sm">{recommendation}</span>
                        </li>
                      </ul>
                    </div>
                  ),
                )}
              </Card>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {feedback?.recommendations?.length <= 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        No Question Analysis Found
                      </h3>
                      <p className="text-muted-foreground text-center mb-4">
                        Try answering some questions in the interview to see
                        detailed analysis and feedback here.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {feedback?.recommendations?.map((recommendation, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            {recommendation.title}
                          </CardTitle>
                          <CardDescription>
                            {recommendation?.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <h4 className="font-medium">
                              Recommended Resources:
                            </h4>
                            <ul className="space-y-1">
                              {recommendation?.resources?.map(
                                (resource, resourceIndex) => (
                                  <li
                                    key={resourceIndex}
                                    className="flex items-center gap-2"
                                  >
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                    <span className="text-sm">{resource}</span>
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <Card>
        <CardContent className="flex items-center flex-col lg:flex-row justify-center gap-4 py-6">
          <Button onClick={() => onNavigate("/mock-interviews")}>
            <Trophy className="h-4 w-4 mr-2" />
            Book Another Interview
          </Button>
          <Button variant="outline" onClick={() => onNavigate("/courses")}>
            <BookOpen className="h-4 w-4 mr-2" />
            Explore Courses
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default MockInterviewResultsPage;
