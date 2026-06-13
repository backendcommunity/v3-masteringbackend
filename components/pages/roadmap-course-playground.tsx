"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Play, RotateCcw, CheckCircle, Target, Code, FileText, Save, Terminal } from "lucide-react"
import {
  getCourseById,
  getRoadmapById,
  getRoadmapMilestoneById,
  getPlaygroundById,
  markPlaygroundComplete,
} from "@/lib/data"

interface RoadmapCoursePlaygroundProps {
  roadmapId: string
  milestoneId: string
  courseId: string
  playgroundId: string
  onBack: () => void
  onComplete: () => void
}

export function RoadmapCoursePlayground({
  roadmapId,
  milestoneId,
  courseId,
  playgroundId,
  onBack,
  onComplete,
}: RoadmapCoursePlaygroundProps) {
  const [activeFile, setActiveFile] = useState("")
  const [fileContents, setFileContents] = useState<Record<string, string>>({})
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [activeTab, setActiveTab] = useState("editor")
  const [isSaved, setIsSaved] = useState(true)

  const roadmap = getRoadmapById(roadmapId)
  const milestone = getRoadmapMilestoneById(roadmapId, milestoneId)
  const course = getCourseById(courseId)
  const playground = getPlaygroundById(courseId, playgroundId)

  if (!roadmap || !milestone || !course || !playground) {
    return <div>Playground not found</div>
  }

  // Initialize file contents if empty
  if (Object.keys(fileContents).length === 0 && (playground.files ?? []).length > 0) {
    const contents: Record<string, string> = {}
    ;(playground.files ?? []).forEach((file) => {
      contents[file.id] = file.content
    })
    setFileContents(contents)
    setActiveFile((playground.files ?? [])[0]?.id ?? "")
  }

  const currentFile = (playground.files ?? []).find((f) => f.id === activeFile)

  const handleFileChange = (fileId: string) => {
    setActiveFile(fileId)
  }

  const handleCodeChange = (content: string) => {
    setFileContents((prev) => ({
      ...prev,
      [activeFile]: content,
    }))
    setIsSaved(false)
  }

  const handleRunCode = async () => {
    setIsRunning(true)
    setActiveTab("console")
    setConsoleOutput(["> Running code...", "> Initializing environment..."])

    // Simulate running code
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock console output
    setConsoleOutput((prev) => [
      ...prev,
      "> Loading dependencies...",
      ...(playground.dependencies ?? []).map((dep) => `> Loaded ${dep}`),
      "> Executing code...",
      "",
      "// Console output:",
      "Hello from the playground!",
      "Code executed successfully.",
      "",
      "> Process completed in 0.35s",
    ])

    setIsRunning(false)

    // Mark as completed
    if (!playground.completed) {
      markPlaygroundComplete(courseId, playgroundId)
    }
  }

  const handleSaveCode = () => {
    // In a real app, this would save to a database
    setIsSaved(true)
  }

  const handleResetCode = () => {
    const contents: Record<string, string> = {}
    ;(playground.files ?? []).forEach((file) => {
      contents[file.id] = file.content
    })
    setFileContents(contents)
    setIsSaved(true)
    setConsoleOutput([])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Playgrounds
              </Button>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{roadmap.title}</span>
                <span>•</span>
                <span>{milestone.title}</span>
                <span>•</span>
                <span>{course.title}</span>
                <span>•</span>
                <span>{playground.title}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Target className="h-3 w-3 mr-1" />
                Roadmap Playground
              </Badge>
              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                {playground.language}
              </Badge>
              {playground.completed && (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Playground Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{playground.title}</CardTitle>
                  <CardDescription className="text-base mt-2">{playground.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleSaveCode} disabled={isSaved}>
                    <Save className="h-4 w-4 mr-1" />
                    {isSaved ? "Saved" : "Save"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleResetCode}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                  <Button size="sm" onClick={handleRunCode} disabled={isRunning} className="flex items-center gap-1">
                    <Play className="h-4 w-4" />
                    {isRunning ? "Running..." : "Run Code"}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Playground IDE */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* File Explorer */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Files
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto">
                  {(playground.files ?? []).map((file) => (
                    <button
                      key={file.id}
                      onClick={() => handleFileChange(file.id)}
                      className={`w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                        activeFile === file.id ? "bg-primary/5 border-r-2 border-primary" : ""
                      }`}
                    >
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">{file.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Editor and Console */}
            <div className="lg:col-span-3 space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="editor">
                    <Code className="h-4 w-4 mr-2" />
                    Editor
                  </TabsTrigger>
                  <TabsTrigger value="console">
                    <Terminal className="h-4 w-4 mr-2" />
                    Console
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Code className="h-4 w-4 text-purple-500" />
                        {currentFile?.name || "Select a file"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={currentFile ? fileContents[currentFile.id] || "" : ""}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        placeholder="Write your code here..."
                        className="min-h-[400px] font-mono text-sm"
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="console" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-green-500" />
                        Console Output
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-md min-h-[400px] font-mono text-sm">
                        {consoleOutput.length === 0 ? (
                          <div className="text-gray-500">Run your code to see output here</div>
                        ) : (
                          <pre className="whitespace-pre-wrap">{consoleOutput.join("\n")}</pre>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Dependencies */}
              {(playground.dependencies ?? []).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Dependencies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {(playground.dependencies ?? []).map((dep) => (
                        <Badge key={dep} variant="outline" className="text-xs">
                          {dep}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              {playground.completed && (
                <div className="flex justify-end">
                  <Button onClick={onComplete}>Continue Learning</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { RoadmapCoursePlayground as RoadmapCoursePlaygroundPage }
