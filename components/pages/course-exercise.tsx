"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  Lightbulb,
  Eye,
} from "lucide-react";
import { routes } from "@/lib/routes";
import { executeCode } from "@/lib/executor";
import { sanitizeHtml } from "@/lib/sanitize";

interface CourseExercisePageProps {
  courseId: string;
  exerciseId: string;
  onNavigate: (path: string) => void;
}

export function CourseExercisePage({
  courseId,
  exerciseId,
  onNavigate,
}: CourseExercisePageProps) {
  const [code, setCode] = useState("");
  const [testResults, setTestResults] = useState<any[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Mock exercise data
  const exercise = {
    id: exerciseId,
    title: "Variable Declaration Practice",
    description: "Practice declaring and initializing variables in JavaScript",
    difficulty: "Easy",
    points: 50,
    instructions: `
Write a function called 'createUser' that:
1. Takes two parameters: name (string) and age (number)
2. Returns an object with properties: name, age, and isAdult (boolean)
3. isAdult should be true if age >= 18, false otherwise

Example:
createUser("John", 25) should return { name: "John", age: 25, isAdult: true }
createUser("Jane", 16) should return { name: "Jane", age: 16, isAdult: false }
    `,
    starterCode: `function createUser(name, age) {
  // Your code here
  
}`,
    solution: `function createUser(name, age) {
  return {
    name: name,
    age: age,
    isAdult: age >= 18
  };
}`,
    hint: "Remember to return an object with three properties. Use the >= operator to check if age is 18 or greater.",
    testCases: [
      {
        input: ["John", 25],
        expected: { name: "John", age: 25, isAdult: true },
        description: "Adult user",
      },
      {
        input: ["Jane", 16],
        expected: { name: "Jane", age: 16, isAdult: false },
        description: "Minor user",
      },
      {
        input: ["Bob", 18],
        expected: { name: "Bob", age: 18, isAdult: true },
        description: "Exactly 18 years old",
      },
    ],
  };

  // Initialize with starter code if empty
  if (!code) {
    setCode(exercise.starterCode);
  }

  const runTests = async () => {
    setIsRunning(true);
    try {
      const result = await executeCode(
        code,
        "node",
        exercise.testCases,
        "createUser",
      );

      if (!result.success) {
        setTestResults([
          {
            id: 0,
            description: "Code execution error",
            error: result.error ?? "Execution failed",
            passed: false,
          },
        ]);
        return;
      }

      const results = exercise.testCases.map((testCase, index) => ({
        id: index,
        description: testCase.description,
        input: testCase.input,
        expected: testCase.expected,
        actual: result.results?.[index]?.pass
          ? testCase.expected
          : { error: "Function not implemented correctly" },
        passed: result.results?.[index]?.pass ?? false,
      }));

      setTestResults(results);
    } catch {
      setTestResults([
        {
          id: 0,
          description: "Code execution error",
          error: "Failed to connect to execution service",
          passed: false,
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const resetCode = () => {
    setCode(exercise.starterCode);
    setTestResults([]);
    setShowHint(false);
    setShowSolution(false);
  };

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

  const passedTests = testResults.filter((t) => t.passed).length;
  const totalTests = testResults.length;
  const allTestsPassed = totalTests > 0 && passedTests === totalTests;

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(routes.courseExercises(courseId))}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Exercises
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{exercise.title}</h1>
            <p className="text-gray-600">{exercise.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getDifficultyColor(exercise.difficulty)}>
            {exercise.difficulty}
          </Badge>
          <Badge variant="outline">{exercise.points} pts</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel - Instructions & Tests */}
        <div className="space-y-6">
          <Tabs defaultValue="instructions" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="instructions">Instructions</TabsTrigger>
              <TabsTrigger value="tests">
                Tests ({passedTests}/{totalTests})
              </TabsTrigger>
              <TabsTrigger value="help">Help</TabsTrigger>
            </TabsList>

            <TabsContent value="instructions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Exercise Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="text-sm leading-relaxed [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_li]:ml-4 [&_li]:list-disc [&_ol]:space-y-1 [&_pre]:whitespace-pre-wrap [&_ul]:space-y-1"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(String(exercise.instructions ?? "")),
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tests" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {testResults.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Run your code to see test results
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {testResults.map((result) => (
                        <div key={result.id} className="border rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            {result.passed ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="font-medium">
                              {result.description}
                            </span>
                          </div>
                          {result.input && (
                            <div className="text-sm text-gray-600">
                              <p>Input: {JSON.stringify(result.input)}</p>
                              <p>Expected: {JSON.stringify(result.expected)}</p>
                              {result.actual && (
                                <p>Actual: {JSON.stringify(result.actual)}</p>
                              )}
                            </div>
                          )}
                          {result.error && (
                            <p className="text-sm text-red-600">
                              {result.error}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="help" className="space-y-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Hint
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {showHint ? (
                      <p className="text-sm">{exercise.hint}</p>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setShowHint(true)}
                        className="flex items-center gap-2"
                      >
                        <Lightbulb className="h-4 w-4" />
                        Show Hint
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Solution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {showSolution ? (
                      <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                        <code>{exercise.solution}</code>
                      </pre>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setShowSolution(true)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Show Solution
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Code Editor</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetCode}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                  <Button
                    onClick={runTests}
                    disabled={isRunning}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    {isRunning ? "Running..." : "Run Tests"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-64 p-3 font-mono text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Write your code here..."
              />
            </CardContent>
          </Card>

          {/* Results Summary */}
          {testResults.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {allTestsPassed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {allTestsPassed
                        ? "All tests passed!"
                        : `${passedTests}/${totalTests} tests passed`}
                    </span>
                  </div>
                  {allTestsPassed && (
                    <Badge className="bg-green-100 text-green-800">
                      +{exercise.points} pts
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
