"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Play,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Target,
  Code,
  Lightbulb,
  TestTube,
  Eye,
} from "lucide-react"
import {
  getCourseById,
  getRoadmapById,
  getRoadmapMilestoneById,
  getExerciseById,
  submitExerciseAttempt,
} from "@/lib/data"

interface RoadmapCourseExerciseProps {
  roadmapId: string
  milestoneId: string
  courseId: string
  exerciseId: string
  onBack: () => void
  onComplete: () => void
}

export function RoadmapCourseExercise({
  roadmapId,
  milestoneId,
  courseId,
  exerciseId,
  onBack,
  onComplete,
}: RoadmapCourseExerciseProps) {
  const [code, setCode] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<
    Array<{
      passed: boolean
      input: string
      expected: string
      actual: string
      description: string
    }>
  >([])
  const [showHints, setShowHints] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const [activeTab, setActiveTab] = useState("problem")

  const roadmap = getRoadmapById(roadmapId)
  const milestone = getRoadmapMilestoneById(roadmapId, milestoneId)
  const course = getCourseById(courseId)
  const exercise = getExerciseById(courseId, exerciseId)

  if (!roadmap || !milestone || !course || !exercise) {
    return <div>Exercise not found</div>
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleRunCode = async () => {
    setIsRunning(true)
    setActiveTab("results")

    // Simulate running tests
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock test results
    const results = exercise.testCases.map((testCase, index) => ({
      passed: index < 2, // First 2 tests pass for demo
      input: testCase.input,
      expected: testCase.expectedOutput,
      actual: index < 2 ? testCase.expectedOutput : "Different output",
      description: testCase.description,
    }))

    setTestResults(results)
    setIsRunning(false)

    // If all tests pass, mark as completed
    const allPassed = results.every((r) => r.passed)
    if (allPassed) {
      submitExerciseAttempt(courseId, exerciseId, true)
    } else {
      submitExerciseAttempt(courseId, exerciseId, false)
    }
  }

  const handleReset = () => {
    setCode(exercise.starterCode)
    setTestResults([])
    setActiveTab("problem")
  }

  const handleShowSolution = () => {
    setShowSolution(true)
    setCode(exercise.solution)
    setActiveTab("code")
  }

  // Initialize code with starter code if empty
  if (!code && exercise.starterCode) {
    setCode(exercise.starterCode)
  }

  const allTestsPassed = testResults.length > 0 && testResults.every((r) => r.passed)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Exercises
              </Button>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{roadmap.title}</span>
                <span>•</span>
                <span>{milestone.title}</span>
                <span>•</span>
                <span>{course.title}</span>
                <span>•</span>
                <span>{exercise.title}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Target className="h-3 w-3 mr-1" />
                Roadmap Exercise
              </Badge>
              <Badge className={getDifficultyColor(exercise.difficulty)}>{exercise.difficulty}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Problem & Instructions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{exercise.title}</CardTitle>
                    <CardDescription className="text-base mt-2">{exercise.description}</CardDescription>
                  </div>
                  {exercise.completed && (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
              </CardHeader>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="problem">Problem</TabsTrigger>
                <TabsTrigger value="hints">Hints</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
              </TabsList>

              <TabsContent value="problem" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Problem Description</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="prose prose-sm max-w-none">
                      <p>{exercise.description}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Test Cases:</h4>
                      <div className="space-y-3">
                        {exercise.testCases.map((testCase, index) => (
                          <div key={testCase.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              Test Case {index + 1}: {testCase.description}
                            </div>
                            <div className="text-sm text-gray-700">
                              <div>
                                <strong>Input:</strong>{" "}
                                <code className="bg-gray-200 px-1 rounded">{testCase.input}</code>
                              </div>
                              <div>
                                <strong>Expected Output:</strong>{" "}
                                <code className="bg-gray-200 px-1 rounded">{testCase.expectedOutput}</code>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="hints" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      Hints
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {exercise.hints.length === 0 ? (
                      <p className="text-gray-600">No hints available for this exercise.</p>
                    ) : (
                      <div className="space-y-3">
                        {exercise.hints.map((hint, index) => (
                          <div key={index} className="p-3 bg-primary/5 border border-primary/30 rounded-lg">
                            <div className="text-sm font-medium text-blue-900 mb-1">Hint {index + 1}:</div>
                            <div className="text-sm text-primary">{hint}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="results" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TestTube className="h-5 w-5 text-primary" />
                      Test Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {testResults.length === 0 ? (
                      <div className="text-center py-8">
                        <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Run your code to see test results</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {allTestsPassed && (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 text-green-800">
                              <CheckCircle className="h-5 w-5" />
                              <span className="font-medium">All tests passed.</span>
                            </div>
                          </div>
                        )}

                        <div className="space-y-3">
                          {testResults.map((result, index) => (
                            <div
                              key={index}
                              className={`p-3 rounded-lg border ${
                                result.passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                {result.passed ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-red-600" />
                                )}
                                <span
                                  className={`text-sm font-medium ${result.passed ? "text-green-800" : "text-red-800"}`}
                                >
                                  Test Case {index + 1}: {result.passed ? "Passed" : "Failed"}
                                </span>
                              </div>
                              <div className="text-sm text-gray-700">
                                <div>
                                  <strong>Input:</strong>{" "}
                                  <code className="bg-gray-200 px-1 rounded">{result.input}</code>
                                </div>
                                <div>
                                  <strong>Expected:</strong>{" "}
                                  <code className="bg-gray-200 px-1 rounded">{result.expected}</code>
                                </div>
                                <div>
                                  <strong>Actual:</strong>{" "}
                                  <code className="bg-gray-200 px-1 rounded">{result.actual}</code>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Code Editor */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code className="h-5 w-5 text-purple-500" />
                    Code Editor ({exercise.language})
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleReset}>
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                    {!exercise.completed && (
                      <Button variant="outline" size="sm" onClick={handleShowSolution}>
                        <Eye className="h-4 w-4 mr-1" />
                        Show Solution
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Write your code here..."
                    className="min-h-[400px] font-mono text-sm"
                  />

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">Attempts: {exercise.attempts}</div>

                    <Button
                      onClick={handleRunCode}
                      disabled={isRunning || !code.trim()}
                      className="flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      {isRunning ? "Running..." : "Run Code"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exercise Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Exercise Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Language:</span>
                  <span className="font-medium">{exercise.language}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Difficulty:</span>
                  <Badge className={getDifficultyColor(exercise.difficulty)} variant="secondary">
                    {exercise.difficulty}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Test Cases:</span>
                  <span className="font-medium">{exercise.testCases.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hints Available:</span>
                  <span className="font-medium">{exercise.hints.length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {allTestsPassed && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900 mb-2">Exercise Completed!</h3>
                    <p className="text-sm text-gray-600 mb-4">Solved. On to the next one.</p>
                    <Button onClick={onComplete} className="w-full">
                      Continue Learning
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export { RoadmapCourseExercise as RoadmapCourseExercisePage }
