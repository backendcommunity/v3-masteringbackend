"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Trophy,
  TrendingUp,
  MessageSquare,
  BookOpen,
  Download,
  Share2,
  Star,
  Target,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { getMockInterviewById } from "@/lib/mock-interview-data"

interface MockInterviewResultsProps {
  interviewId: string
  onNavigate: (path: string) => void
}

export function MockInterviewResultsPage({ interviewId, onNavigate }: MockInterviewResultsProps) {
  const interview = getMockInterviewById(interviewId)

  if (!interview || !interview.feedback) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p>Interview results not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { feedback } = interview

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A+":
      case "A":
        return "text-green-600"
      case "B+":
      case "B":
        return "text-blue-600"
      case "C+":
      case "C":
        return "text-yellow-600"
      default:
        return "text-red-600"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Interview Results</h1>
          <p className="text-muted-foreground">
            {interview.type.title} • {new Date(interview.scheduledDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
          <Button variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button onClick={() => onNavigate("/dashboard/mock-interviews")}>Back to Interviews</Button>
        </div>
      </div>

      {/* Overall Score Card */}
      <Card className="border-2">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-center">
              <div className={`text-6xl font-bold ${getGradeColor(feedback.grade)}`}>{feedback.grade}</div>
              <p className="text-sm text-muted-foreground">Overall Grade</p>
            </div>
            <div className="text-center">
              <div className="text-6xl font-bold text-primary">{feedback.overallScore}</div>
              <p className="text-sm text-muted-foreground">Score</p>
            </div>
          </div>
          <CardTitle className="text-2xl">Excellent Performance!</CardTitle>
          <CardDescription>
            You demonstrated strong technical skills and clear communication throughout the interview.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Technical Skills</CardTitle>
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
            <div className="text-2xl font-bold">{feedback.communicationScore}%</div>
            <Progress value={feedback.communicationScore} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Problem Solving</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedback.problemSolvingScore}%</div>
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
            {feedback.questionAnalysis.map((analysis, index) => (
              <Card key={analysis.questionId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={analysis.score >= 80 ? "default" : analysis.score >= 60 ? "secondary" : "destructive"}
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
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">{analysis.userAnswer}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Feedback:</h4>
                    <p className="text-sm">{analysis.feedback}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                  {feedback.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Star className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
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
                  {feedback.improvements.map((improvement, index) => (
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
              <CardDescription>Complete conversation log from your interview session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {feedback.transcript.map((entry, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0">
                      <Badge variant={entry.speaker === "interviewer" ? "default" : "secondary"}>
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="space-y-4">
            {feedback.recommendations.map((recommendation, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {recommendation.title}
                  </CardTitle>
                  <CardDescription>{recommendation.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-medium">Recommended Resources:</h4>
                    <ul className="space-y-1">
                      {recommendation.resources.map((resource, resourceIndex) => (
                        <li key={resourceIndex} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          <span className="text-sm">{resource}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <Card>
        <CardContent className="flex items-center justify-center gap-4 py-6">
          <Button onClick={() => onNavigate("/dashboard/mock-interviews")}>
            <Trophy className="h-4 w-4 mr-2" />
            Book Another Interview
          </Button>
          <Button variant="outline" onClick={() => onNavigate("/dashboard/courses")}>
            <BookOpen className="h-4 w-4 mr-2" />
            Explore Courses
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Export both named and default
export const MockInterviewResults = MockInterviewResultsPage
export default MockInterviewResultsPage
