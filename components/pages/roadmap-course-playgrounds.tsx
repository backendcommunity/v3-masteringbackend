"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Zap, CheckCircle, Target, Play, Star, Code, FileText } from "lucide-react"
import { getCourseById, getRoadmapById, getRoadmapMilestoneById, getCoursePlaygrounds } from "@/lib/data"

interface RoadmapCoursePlaygroundsProps {
  roadmapId: string
  milestoneId: string
  courseId: string
  onBack: () => void
  onStartPlayground: (playgroundId: string) => void
}

export function RoadmapCoursePlaygrounds({
  roadmapId,
  milestoneId,
  courseId,
  onBack,
  onStartPlayground,
}: RoadmapCoursePlaygroundsProps) {
  const roadmap = getRoadmapById(roadmapId)
  const milestone = getRoadmapMilestoneById(roadmapId, milestoneId)
  const course = getCourseById(courseId)
  const playgrounds = getCoursePlaygrounds(courseId)

  if (!roadmap || !milestone || !course) {
    return <div>Course not found</div>
  }

  const completedPlaygrounds = playgrounds.filter((p) => p.completed).length
  const totalPlaygrounds = playgrounds.length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Button>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{roadmap.title}</span>
              <span>•</span>
              <span>{milestone.title}</span>
              <span>•</span>
              <span>{course.title}</span>
              <span>•</span>
              <span>Playgrounds</span>
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
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Code Playgrounds</h1>
                  <p className="text-gray-600">Experiment with code in interactive environments</p>
                </div>
              </div>

              {/* Progress Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{completedPlaygrounds}</div>
                        <div className="text-sm text-gray-600">Completed</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Zap className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{totalPlaygrounds}</div>
                        <div className="text-sm text-gray-600">Total Playgrounds</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Star className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {totalPlaygrounds > 0 ? Math.round((completedPlaygrounds / totalPlaygrounds) * 100) : 0}%
                        </div>
                        <div className="text-sm text-gray-600">Completion Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Playgrounds List */}
            <div className="space-y-6">
              {playgrounds.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Playgrounds Available</h3>
                    <p className="text-gray-600">This course doesn't have any code playgrounds yet.</p>
                  </CardContent>
                </Card>
              ) : (
                playgrounds.map((playground, index) => (
                  <Card key={playground.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center justify-center w-10 h-10 bg-orange-100 text-orange-600 rounded-full font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-xl">{playground.title}</CardTitle>
                              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                                {playground.language}
                              </Badge>
                            </div>
                            <CardDescription className="text-base mb-3">{playground.description}</CardDescription>

                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Code className="h-4 w-4" />
                                <span>{playground.language}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                <span>{(playground.files ?? []).length} files</span>
                              </div>
                              {(playground.dependencies ?? []).length > 0 && (
                                <div className="flex items-center gap-1">
                                  <Zap className="h-4 w-4" />
                                  <span>{(playground.dependencies ?? []).length} dependencies</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {playground.completed ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Not Started</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          {(playground.files ?? []).map((file) => file.name).join(", ")}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button onClick={() => onStartPlayground(playground.id)} className="flex items-center gap-2">
                            <Play className="h-4 w-4" />
                            {playground.completed ? "Open Playground" : "Start Playground"}
                          </Button>
                        </div>
                      </div>

                      {/* Show files preview */}
                      {(playground.files ?? []).length > 0 && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-900 mb-2">Files:</div>
                          <div className="grid grid-cols-2 gap-2">
                            {(playground.files ?? []).map((file) => (
                              <div key={file.id} className="flex items-center gap-2 text-sm text-gray-700">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span>{file.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
                  <div className="text-sm font-medium text-gray-900 mb-1">Current Roadmap</div>
                  <div className="text-sm text-gray-600">{roadmap.title}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 mb-1">Current Milestone</div>
                  <div className="text-sm text-gray-600">{milestone.title}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 mb-2">Milestone Progress</div>
                  <Progress value={milestone.progress} className="h-2" />
                  <div className="text-xs text-gray-500 mt-1">{milestone.progress}% complete</div>
                </div>
              </CardContent>
            </Card>

            {/* Playground Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Playground Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Experiment freely with the code</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Try different approaches and solutions</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Your code is automatically saved</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Use the console for debugging</span>
                </div>
              </CardContent>
            </Card>

            {/* Course Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Course Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm text-gray-600">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>

                  <div className="text-sm text-gray-600">
                    Playgrounds help you experiment with code and reinforce concepts in a safe environment.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export { RoadmapCoursePlaygrounds as RoadmapCoursePlaygroundsPage }
