"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  CheckCircle,
  Star,
  Download,
  Share2,
  RotateCcw,
  Code,
  Briefcase,
  Building,
  Target,
  Clock,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  ChevronRight,
} from "lucide-react"
import { routes } from "@/lib/routes"
import { getInterviewProjectById } from "@/lib/interview-data"

interface InterviewResultsPageProps {
  interviewId: string
  onNavigate: (route: string) => void
}

export function InterviewResultsPage({ interviewId, onNavigate }: InterviewResultsPageProps) {
  const project = getInterviewProjectById(interviewId)
  const [activeTab, setActiveTab] = useState("overview")

  if (!project) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Interview Results Not Found</h1>
          <p className="text-muted-foreground mt-2">The interview results you're looking for don't exist.</p>
          <Button onClick={() => onNavigate(routes.interviews)} className="mt-4">
            Back to Interviews
          </Button>
        </div>
      </div>
    )
  }

  // Mock score data
  const score = project.score || 85
  const maxScore = project.maxScore || 100
  const scorePercentage = (score / maxScore) * 100

  // Determine grade based on score percentage
  const getGrade = (percentage: number) => {
    if (percentage >= 90) return "A"
    if (percentage >= 80) return "B"
    if (percentage >= 70) return "C"
    if (percentage >= 60) return "D"
    return "F"
  }

  const grade = getGrade(scorePercentage)

  // Mock grading criteria
  const gradingCriteria = project.gradingCriteria || [
    { criteria: "Functionality", weight: 40, maxPoints: 40, earnedPoints: 35 },
    { criteria: "Code Quality", weight: 25, maxPoints: 25, earnedPoints: 20 },
    { criteria: "Performance", weight: 15, maxPoints: 15, earnedPoints: 12 },
    { criteria: "Documentation", weight: 10, maxPoints: 10, earnedPoints: 8 },
    { criteria: "UI/UX", weight: 10, maxPoints: 10, earnedPoints: 10 },
  ]

  // Mock strengths and areas for improvement
  const strengths = [
    "Excellent implementation of core functionality",
    "Clean and well-structured code organization",
    "Good error handling and edge case management",
    "Responsive UI design with good accessibility",
  ]

  const improvements = [
    "Could improve code performance for large datasets",
    "Some functions could be more modular and reusable",
    "Add more comprehensive unit tests",
    "Documentation could be more detailed",
  ]

  // Mock test results
  const testResults = {
    passed: 15,
    failed: 3,
    total: 18,
    passRate: Math.round((15 / 18) * 100),
  }

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => onNavigate(routes.interviews)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Interviews
        </Button>
      </div>

      {/* Results Content */}
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Interview Info */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {project.type === "full-project" ? (
                    <Briefcase className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Code className="h-5 w-5 text-green-600" />
                  )}
                  <CardTitle className="text-2xl">{project.title}</CardTitle>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {project.company}
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {project.position}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {project.duration}
                  </div>
                </div>
              </div>
              <Badge
                className={
                  project.difficulty === "Easy"
                    ? "bg-green-100 text-green-800"
                    : project.difficulty === "Medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }
              >
                {project.difficulty}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">{project.description}</CardDescription>
          </CardContent>
        </Card>

        {/* Score Overview */}
        <Card className="bg-gradient-to-r from-[#0E1F33] to-[#13AECE] text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Interview Results</h2>
                <p className="text-sm text-blue-100">Completed on {new Date().toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="secondary" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Overall Score</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                    <span className="font-bold">
                      {score}/{maxScore}
                    </span>
                  </div>
                </div>
                <Progress value={scorePercentage} className="h-2" />
              </div>

              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-bold">{grade}</div>
                  <div className="text-sm text-blue-100">Grade</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Test Pass Rate</span>
                  <span className="font-bold">{testResults.passRate}%</span>
                </div>
                <Progress value={testResults.passRate} className="h-2" />
                <div className="flex items-center justify-between text-xs text-blue-100">
                  <span>
                    {testResults.passed}/{testResults.total} tests passed
                  </span>
                  <span>{testResults.failed} failed</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Results Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="feedback">Detailed Feedback</TabsTrigger>
            <TabsTrigger value="solution">Solution</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Grading Criteria */}
            <Card>
              <CardHeader>
                <CardTitle>Grading Criteria</CardTitle>
                <CardDescription>Breakdown of your score across different criteria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gradingCriteria.map((criteria, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{criteria.criteria}</span>
                          <span className="text-sm text-muted-foreground ml-2">({criteria.weight}%)</span>
                        </div>
                        <span>
                          {(criteria as any).earnedPoints ?? 0}/{criteria.maxPoints}
                        </span>
                      </div>
                      <Progress value={(((criteria as any).earnedPoints ?? 0) / criteria.maxPoints) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Strengths and Improvements */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ThumbsUp className="h-5 w-5 text-green-600" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ThumbsDown className="h-5 w-5 text-amber-600" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Button
                      className="w-full justify-between"
                      onClick={() => onNavigate(routes.interviewDetail(interviewId))}
                    >
                      <span>Retry Interview</span>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="w-full justify-between">
                      <span>View Solution</span>
                      <Code className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="w-full justify-between">
                      <span>Practice Similar</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Code Quality</h3>
                  <p className="text-muted-foreground">
                    Your code is well-structured and follows most best practices. There are some opportunities to
                    improve modularity and reduce duplication in the API implementation. Consider extracting common
                    functionality into reusable utility functions.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Functionality</h3>
                  <p className="text-muted-foreground">
                    The core functionality is well implemented and meets most of the requirements. The application
                    handles basic user flows correctly, but there are some edge cases that aren't properly addressed,
                    particularly around error handling and input validation.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Performance</h3>
                  <p className="text-muted-foreground">
                    The application performs adequately for small to medium datasets, but could be optimized for larger
                    scale. Consider implementing pagination, virtualization, or more efficient data structures to handle
                    larger data volumes.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Documentation</h3>
                  <p className="text-muted-foreground">
                    Documentation is present but could be more comprehensive. Consider adding more detailed comments for
                    complex functions and including a README with setup instructions and architecture overview.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="solution" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Official Solution</CardTitle>
                <CardDescription>Compare your approach with the recommended solution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md font-mono text-sm whitespace-pre overflow-x-auto">
                  {`// Solution approach
function optimizedSolution(data) {
  // Step 1: Preprocess the data
  const processed = preprocess(data);
  
  // Step 2: Apply the algorithm
  const result = algorithm(processed);
  
  // Step 3: Format the output
  return formatOutput(result);
}

// Helper functions
function preprocess(data) {
  // Implementation details
}

function algorithm(data) {
  // Core algorithm implementation
}

function formatOutput(result) {
  // Format the result for the expected output
}
`}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Explanation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  The optimal solution uses a three-step approach: preprocessing, algorithm application, and output
                  formatting. This separation of concerns makes the code more maintainable and easier to test.
                </p>
                <p>
                  The preprocessing step normalizes the input data and handles edge cases. The core algorithm uses an
                  efficient data structure to achieve O(n) time complexity instead of the naive O(n²) approach. Finally,
                  the output is formatted according to the requirements.
                </p>
                <p>
                  This approach is more scalable and handles all the edge cases mentioned in the requirements. It also
                  includes proper error handling and validation.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Solution vs. Optimal Solution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="font-semibold mb-2">Your Approach</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">Time</span>
                          <span>O(n²) - Nested loops</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">Space</span>
                          <span>O(n) - Additional array</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">Approach</span>
                          <span>Brute force with some optimizations</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Optimal Approach</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">Time</span>
                          <span>O(n) - Single pass</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">Space</span>
                          <span>O(1) - Constant space</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">Approach</span>
                          <span>Hash map for lookup</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Performance Comparison</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Runtime</span>
                          <span className="text-sm">Your solution is 2.5x slower</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <div className="bg-blue-500 h-4 rounded" style={{ width: "40%" }}></div>
                          <span className="text-xs">120ms (yours)</span>
                        </div>
                        <div className="flex gap-2 items-center mt-1">
                          <div className="bg-green-500 h-4 rounded" style={{ width: "16%" }}></div>
                          <span className="text-xs">48ms (optimal)</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Memory Usage</span>
                          <span className="text-sm">Your solution uses 1.8x more memory</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <div className="bg-blue-500 h-4 rounded" style={{ width: "36%" }}></div>
                          <span className="text-xs">42.3MB (yours)</span>
                        </div>
                        <div className="flex gap-2 items-center mt-1">
                          <div className="bg-green-500 h-4 rounded" style={{ width: "20%" }}></div>
                          <span className="text-xs">23.5MB (optimal)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => onNavigate(routes.interviews)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Interviews
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => onNavigate(routes.interviewDetail(interviewId))}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry Interview
            </Button>
            <Button>
              <ChevronRight className="h-4 w-4 mr-2" />
              Next Challenge
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
