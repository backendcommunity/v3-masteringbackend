"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  Lightbulb,
  Eye,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Exercise } from "@/lib/data";
import { Editor } from "@monaco-editor/react";
import { useTheme } from "next-themes";

interface CourseExercisePageProps {
  courseId: string;
  exercise: Exercise;
  onNavigate: (path: string) => void;
}

export function ExercisePage({
  courseId,
  exercise,
  onNavigate,
}: CourseExercisePageProps) {
  const { theme } = useTheme();
  const store = useAppStore();
  const editorRef = useRef<any>(null);
  const [code, setCode] = useState("");
  const [testResults, setTestResults] = useState<any[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setCode(exercise?.starterCode);
  }, [exercise]);

  const runTests = async () => {
    setIsRunning(true);

    // Simulate test execution
    try {
      // await new Promise((resolve) => setTimeout(resolve, 1000));

      const data = await store.executeCode({
        language: "java",
        code: btoa(code),
      });

      const result = data?.stdout ?? data?.stderr;
      console.log(result, exercise?.testCases);

      // In a real implementation, this would execute the code safely
      const results = exercise?.testCases.map((testCase, index) => {
        // Mock test execution - in reality, you'd run the actual code
        const mockResult = Math.random() > 0.3; // 70% pass rate for demo
        return {
          id: index,
          description: testCase.description,
          input: testCase.input,
          expected: testCase.expected,
          actual: mockResult
            ? testCase.expected
            : { error: "Function not implemented correctly" },
          passed: mockResult,
        };
      });

      setTestResults(results);
    } catch (error) {
      setTestResults([
        {
          id: 0,
          description: "Code execution error",
          error: "Syntax error in your code",
          passed: false,
        },
      ]);
    }

    setIsRunning(false);
  };

  const resetCode = () => {
    setCode(exercise?.starterCode);
    setTestResults([]);
  };

  const passedTests = testResults.filter((t) => t.passed).length;
  const totalTests = testResults.length;
  const allTestsPassed = totalTests > 0 && passedTests === totalTests;

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      fontFamily:
        "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
      lineHeight: 1.6,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: "on",
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      renderWhitespace: "selection",
      bracketPairColorization: { enabled: true },
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="instructions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
          <TabsTrigger value="code">Code Editor</TabsTrigger>
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
              <pre className="whitespace-pre-wrap text-sm">
                {exercise?.instructions}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="code" className="space-y-4">
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
                <div className="relative flex h-80 border rounded-md overflow-hidden flex-col ">
                  <Editor
                    height="100%"
                    language={"java"}
                    theme={theme?.includes("dark") ? "vs-dark" : "light"}
                    value={code}
                    onChange={(e) => setCode(e!)}
                    onMount={handleEditorDidMount}
                    options={{
                      fontSize: 14,
                      fontFamily:
                        "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                      lineHeight: 1.6,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      automaticLayout: true,
                      tabSize: 2,
                      insertSpaces: true,
                      renderWhitespace: "selection",
                      bracketPairColorization: { enabled: true },
                      suggestOnTriggerCharacters: true,
                      quickSuggestions: true,
                      parameterHints: { enabled: true },
                      formatOnPaste: true,
                      formatOnType: true,
                    }}
                  />
                </div>
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
                        +{exercise?.points} pts
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
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
                        <p className="text-sm text-red-600">{result.error}</p>
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
                  <article
                    className="text-muted-foreground leading-relaxed [&>*>span]:!text-muted-foreground [&>*>table]:p-3 [&>*>table]:border [&>*>code]:rounded-xl [&>*>code]:bg-zinc-800 [&>*>code]:p-1 [&>*>code]:text-sm [&>*>code]:font-medium [&>*>code]:text-zinc-100 [&>*>code]:overflow-x-auto w-full [&>*>li>pre]:mt-5 [&>*>li>pre]:rounded-xl [&>*>li>pre]:bg-zinc-800 [&>*>li>pre]:p-4 [&>*>li>pre]:text-sm [&>*>li>pre]:font-medium [&>*>li>pre]:text-zinc-100 [&>*>li>pre]:overflow-x-auto [&>*>li>a]:text-amber-300 [&>p>a]:text-amber-300 mx-auto w-full text-zinc-700 dark:text-zinc-300 [&>pre]:overflow-x-auto [&>h2]:text-2xl [&>h2]:font-bold [&>h3]:text-xl [&>h3]:font-bold [&>p]:mt-2 [&>p]:leading-relaxed [&>pre]:mt-5 [&>pre]:rounded-xl [&>pre]:bg-zinc-800 [&>pre]:p-4 [&>pre]:text-sm [&>pre]:font-medium [&>pre]:text-zinc-100 [&>ul]:mt-5 [&>ul]:flex [&>ul]:list-disc [&>ul]:flex-col [&>ul]:gap-2 [&>ul]:pl-6 [&>ol]:mt-5 [&>ol]:flex [&>ol]:list-decimal [&>ol]:flex-col [&>ol]:gap-2 [&>ol]:pl-6"
                    dangerouslySetInnerHTML={{ __html: exercise?.hint! }}
                  ></article>
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
                  <pre className="bg-transparent p-3 rounded text-sm overflow-x-auto">
                    <code>{exercise?.solution}</code>
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
  );
}
