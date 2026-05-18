"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, FolderKanban, CheckCircle, Target, Play, Star, Clock, Calendar, FileText } from "lucide-react"
import { getCourseById, getRoadmapById, getRoadmapMilestoneById, getCourseProjects } from "@/lib/data"

interface RoadmapCourseProjectsProps {
  roadmapId: string
  milestoneId: string
  courseId: string
  onBack: () => void
  onStartProject: (projectId: string) => void
}

export function RoadmapCourseProjects({
  roadmapId,
  milestoneId,
  courseId,
  onBack,
  onStartProject,
}: RoadmapCourseProjectsProps) {
  const roadmap = getRoadmapById(roadmapId)
  const milestone = getRoadmapMilestoneById(roadmapId, milestoneId)
  const course = getCourseById(courseId)
  const projects = getCourseProjects(courseId)

  if (!roadmap || !milestone || !course) {
    return <div>Course not found</div>
  }

  const completedProjects = projects.filter((p) => (p.status as string) === "Completed" || (p.status as string) === "Submitted").length
  const totalProjects = projects.length

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-500"
      case "Submitted":
        return "bg-blue-500"
      case "In Progress":
        return "bg-yellow-500"
      case "Not Started":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

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
              <span>Projects</span>
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
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FolderKanban className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Course Projects</h1>
                  <p className="text-gray-600">Apply your skills with hands-on projects</p>
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
                        <div className="text-2xl font-bold text-gray-900">{completedProjects}</div>
                        <div className="text-sm text-gray-600">Completed</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <FolderKanban className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{totalProjects}</div>
                        <div className="text-sm text-gray-600">Total Projects</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Star className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0}%
                        </div>
                        <div className="text-sm text-gray-600">Completion Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Projects List */}
            <div className="space-y-6">
              {projects.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FolderKanban className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Available</h3>
                    <p className="text-gray-600">This course doesn't have any projects yet.</p>
                  </CardContent>
                </Card>
              ) : (
                projects.map((project, index) => (
                  <Card key={project.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <img
                              src={project.thumbnail || "/placeholder.svg"}
                              alt={project.title}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-xl">{project.title}</CardTitle>
                              <Badge className={getDifficultyColor(project.difficulty)}>{project.difficulty}</Badge>
                            </div>
                            <CardDescription className="text-base mb-3">{project.description}</CardDescription>

                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{project.estimatedTime}</span>
                              </div>
                              {project.dueDate && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>Due: {new Date(project.dueDate).toLocaleDateString()}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                <span>{project.requirements.length} requirements</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="default" className={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-4">
                        {/* Progress bar */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Progress</span>
                            <span className="text-sm text-gray-600">{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                        </div>

                        {/* Technologies */}
                        <div className="flex flex-wrap gap-2">
                          {project.technologies.map((tech) => (
                            <Badge key={tech} variant="outline" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>

                        {/* Action Button */}
                        <div className="flex justify-end">
                          <Button onClick={() => onStartProject(project.id)} className="flex items-center gap-2">
                            <Play className="h-4 w-4" />
                            {project.status === "Not Started"
                              ? "Start Project"
                              : (project.status as string) === "Completed" || (project.status as string) === "Submitted"
                                ? "View Project"
                                : "Continue Project"}
                          </Button>
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
                  <Target className="h-4 w-4 text-blue-500" />
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

            {/* Project Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Break down the project into smaller tasks</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Regularly commit your code to version control</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Test your code thoroughly</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Document your code and decisions</span>
                </div>
              </CardContent>
            </Card>

            {/* Difficulty Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Difficulty Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 text-xs">Easy</Badge>
                  <span>5-10 hours to complete</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">Medium</Badge>
                  <span>10-20 hours to complete</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-800 text-xs">Hard</Badge>
                  <span>20+ hours to complete</span>
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
                    Projects help you apply what you've learned and build your portfolio.
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

export { RoadmapCourseProjects as RoadmapCourseProjectsPage }
