"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Clock,
  Save,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Code,
} from "lucide-react"
import { routes } from "@/lib/routes"
import { getInterviewProjectById } from "@/lib/interview-data"
import Editor from "@monaco-editor/react"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"

interface InterviewAlgorithmPageProps {
  interviewId: string
  onNavigate: (route: string) => void
}

export function InterviewAlgorithmPage({ interviewId, onNavigate }: InterviewAlgorithmPageProps) {
  const project = getInterviewProjectById(interviewId)
  const [activeTab, setActiveTab] = useState("description")
  const [language, setLanguage] = useState("javascript")
  const [timeRemaining, setTimeRemaining] = useState(60) // 60 minutes
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<any[]>([])
  const [showHint, setShowHint] = useState(false)
  const codeTemplates = {
    javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
function solution(nums) {
  // Your code here
  
  return 0;
}`,
    python: `def solution(nums):
    # Your code here
    
    return 0`,
    java: `class Solution {
    public int solution(int[] nums) {
        // Your code here
        
        return 0;
    }
}`,
  }
  const [code, setCode] = useState(codeTemplates.javascript)

  useEffect(() => {
    if (!project) return

    // Initialize test results
    if (project.examples) {
      setTestResults(
        project.examples.map((example) => ({
          input: example.input,
          expected: example.output,
          actual: null,
          status: "pending",
        })),
      )
    }
  }, [project])

  useEffect(() => {
    setCode(codeTemplates[language as keyof typeof codeTemplates])
  }, [language])

  if (!project) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Algorithm Challenge Not Found</h1>
          <p className="text-muted-foreground mt-2">The challenge you're looking for doesn't exist.</p>
          <Button onClick={() => onNavigate(routes.interviews)} className="mt-4">
            Back to Interviews
          </Button>
        </div>
      </div>
    )
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}:${mins.toString().padStart(2, "0")}`
  }

  const handleRunCode = () => {
    // Simulate running code
    setIsRunning(true)
    setTimeout(() => {
      setIsRunning(false)

      // Simulate test results
      const newResults = testResults.map((test) => {
        const passed = Math.random() > 0.3
        return {
          ...test,
          actual: passed ? test.expected : `"${Math.random().toString(36).substring(7)}"`,
          status: passed ? "passed" : "failed",
        }
      })

      setTestResults(newResults)
    }, 1500)
  }

  const handleSubmitSolution = () => {
    onNavigate(routes.interviewResults(interviewId))
  }

  // Default code templates for different languages

  const passedTests = testResults.filter((t) => t.status === "passed").length
  const totalTests = testResults.length

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => onNavigate(routes.interviewDetail(interviewId))}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Details
          </Button>
          <h1 className="font-semibold">{project.title}</h1>
          <Badge variant="outline">{project.company}</Badge>
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

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <span className="font-mono">{formatTime(timeRemaining)}</span>
          </div>
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save Progress
          </Button>
          <Button size="sm" onClick={handleSubmitSolution}>
            <Send className="h-4 w-4 mr-2" />
            Submit Solution
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Panel - Problem Description */}
          <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
            <div className="h-full overflow-y-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
                <div className="border-b">
                  <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                    <TabsTrigger
                      value="description"
                      className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary"
                    >
                      Description
                    </TabsTrigger>
                    <TabsTrigger
                      value="solution"
                      className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary"
                    >
                      Solution
                    </TabsTrigger>
                    <TabsTrigger
                      value="submissions"
                      className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary"
                    >
                      Submissions
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="description" className="flex-1 p-4 space-y-6 overflow-y-auto">
                  <div>
                    <h2 className="text-xl font-bold mb-2">{project.title}</h2>
                    <p className="text-muted-foreground">{project.description}</p>
                  </div>

                  {/* Examples */}
                  <div>
                    <h3 className="font-semibold mb-2">Examples</h3>
                    <div className="space-y-4">
                      {project.examples?.map((example, index) => (
                        <div key={index} className="bg-muted p-4 rounded-lg">
                          <div className="space-y-2">
                            <div>
                              <span className="font-medium">Input: </span>
                              <code className="bg-background px-2 py-1 rounded text-sm">{example.input}</code>
                            </div>
                            <div>
                              <span className="font-medium">Output: </span>
                              <code className="bg-background px-2 py-1 rounded text-sm">{example.output}</code>
                            </div>
                            {example.explanation && (
                              <div>
                                <span className="font-medium">Explanation: </span>
                                <span className="text-sm">{example.explanation}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Constraints */}
                  <div>
                    <h3 className="font-semibold mb-2">Constraints</h3>
                    <ul className="space-y-1 list-disc list-inside text-sm">
                      {project.constraints?.map((constraint, index) => (
                        <li key={index}>{constraint}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Hint */}
                  <div>
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setShowHint(!showHint)}
                    >
                      <h3 className="font-semibold">Hint</h3>
                      <Button variant="ghost" size="sm">
                        {showHint ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                    {showHint && (
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <p className="text-sm">
                            Consider using a dynamic programming approach to solve this problem efficiently.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="solution" className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Solution Approach</h3>
                      <Badge>Premium</Badge>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-md text-center">
                      <Code className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <h4 className="font-medium">Solution Locked</h4>
                      <p className="text-sm text-muted-foreground mb-4">Upgrade to MB Pro to view official solutions</p>
                      <Button size="sm">Upgrade to Pro</Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="submissions" className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Your Submissions</h3>
                    <div className="space-y-2">
                      <div className="p-3 border rounded-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-medium">Submission #3</span>
                          </div>
                          <span className="text-xs text-muted-foreground">2 minutes ago</span>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          <span>Runtime: 120ms</span>
                          <span className="mx-2">|</span>
                          <span>Memory: 42.3MB</span>
                          <span className="mx-2">|</span>
                          <span>Language: JavaScript</span>
                        </div>
                      </div>
                      <div className="p-3 border rounded-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-medium">Submission #2</span>
                          </div>
                          <span className="text-xs text-muted-foreground">5 minutes ago</span>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          <span>Runtime: 115ms</span>
                          <span className="mx-2">|</span>
                          <span>Memory: 41.8MB</span>
                          <span className="mx-2">|</span>
                          <span>Language: JavaScript</span>
                        </div>
                      </div>
                      <div className="p-3 border rounded-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-medium">Submission #1</span>
                          </div>
                          <span className="text-xs text-muted-foreground">10 minutes ago</span>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          <span>Runtime: 130ms</span>
                          <span className="mx-2">|</span>
                          <span>Memory: 43.1MB</span>
                          <span className="mx-2">|</span>
                          <span>Language: JavaScript</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Code Editor and Results */}
          <ResizablePanel defaultSize={65} minSize={50}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              {/* Code Editor Panel */}
              <ResizablePanel defaultSize={70} minSize={40}>
                <div className="flex flex-col h-full">
                  {/* Language Selector and Run Button */}
                  <div className="border-b p-2 flex items-center justify-between bg-muted/30">
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="java">Java</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleRunCode} disabled={isRunning}>
                      {isRunning ? "Running..." : "Run Code"}
                    </Button>
                  </div>

                  {/* Monaco Code Editor */}
                  <div className="flex-1 overflow-hidden">
                    <Editor
                      height="100%"
                      language={language}
                      value={code}
                      onChange={(value) => setCode(value || "")}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: "on",
                        roundedSelection: false,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        insertSpaces: true,
                        wordWrap: "on",
                        contextmenu: true,
                        selectOnLineNumbers: true,
                        glyphMargin: false,
                        folding: true,
                        lineDecorationsWidth: 10,
                        lineNumbersMinChars: 3,
                      }}
                    />
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Test Results Panel */}
              <ResizablePanel defaultSize={30} minSize={20}>
                <div className="h-full overflow-y-auto">
                  <div className="p-3 border-b flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm">Test Results</h3>
                      <Badge variant="outline" className="text-xs">
                        {passedTests}/{totalTests} passing
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Runtime: 112ms</span>
                      <span className="text-xs text-muted-foreground">Memory: 41.2MB</span>
                    </div>
                  </div>
                  <div className="p-2">
                    {testResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 mb-2 rounded-md text-sm ${
                          result.status === "passed"
                            ? "bg-green-50 border border-green-200"
                            : result.status === "failed"
                              ? "bg-red-50 border border-red-200"
                              : "bg-gray-50 border border-gray-200"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {result.status === "passed" ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : result.status === "failed" ? (
                                <XCircle className="h-4 w-4 text-red-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-gray-600" />
                              )}
                              <span className="font-medium">Test Case {index + 1}</span>
                            </div>
                            <div className="pl-6 space-y-1">
                              <div>
                                <span className="text-xs text-muted-foreground">Input: </span>
                                <code className="text-xs bg-muted px-1 py-0.5 rounded">{result.input}</code>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">Expected: </span>
                                <code className="text-xs bg-muted px-1 py-0.5 rounded">{result.expected}</code>
                              </div>
                              {result.actual !== null && (
                                <div>
                                  <span className="text-xs text-muted-foreground">Output: </span>
                                  <code
                                    className={`text-xs px-1 py-0.5 rounded ${
                                      result.status === "passed" ? "bg-green-100" : "bg-red-100"
                                    }`}
                                  >
                                    {result.actual}
                                  </code>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
