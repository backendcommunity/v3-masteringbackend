"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, CheckCircle, Target, Calendar, Clock, Link2, ExternalLink, Upload, Save } from "lucide-react"
import {
  getCourseById,
  getRoadmapById,
  getRoadmapMilestoneById,
  getProjectById,
  updateProjectProgress,
} from "@/lib/data"

interface RoadmapCourseProjectProps {
  roadmapId: string
  milestoneId: string
  courseId: string
  projectId: string
  onBack: () => void
  onComplete: () => void
}

export function RoadmapCourseProject({
  roadmapId,
  milestoneId,
  courseId,
  projectId,
  onBack,
  onComplete,
}: RoadmapCourseProjectProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [notes, setNotes] = useState("")
  const [submissionUrl, setSubmissionUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completedRequirements, setCompletedRequirements] = useState<Set<string>>(new Set())

  const roadmap = getRoadmapById(roadmapId)
  const milestone = getRoadmapMilestoneById(roadmapId, milestoneId)
  const course = getCourseById(courseId)
  const project = getProjectById(projectId)

  if (!roadmap || !milestone || !course || !project) {
    return <div>Project not found</div>
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-500"
      case "Submitted":
        return "bg-primary"
      case "In Progress":
        return "bg-yellow-500"
      case "Not Started":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const handleRequirementToggle = (requirement: string) => {
    const newCompleted = new Set(completedRequirements)
    if (newCompleted.has(requirement)) {
      newCompleted.delete(requirement)
    } else {
      newCompleted.add(requirement)
    }
    setCompletedRequirements(newCompleted)

    // Update project progress
    const progress = Math.round((newCompleted.size / project.requirements.length) * 100)
    updateProjectProgress(projectId, progress)
  }

  const handleSubmitProject = () => {
    setIsSubmitting(true)

    // Simulate submission
    setTimeout(() => {
      updateProjectProgress(projectId, 100, "Submitted")
      setIsSubmitting(false)
      onComplete()
    }, 2000)
  }

  const handleMarkComplete = () => {
    updateProjectProgress(projectId, 100, "Completed")
    onComplete()
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
                Back to Projects
              </Button>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{roadmap.title}</span>
                <span>•</span>
                <span>{milestone.title}</span>
                <span>•</span>
                <span>{course.title}</span>
                <span>•</span>
                <span>{project.title}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Target className="h-3 w-3 mr-1" />
                Roadmap Project
              </Badge>
              <Badge className={getDifficultyColor(project.difficulty)}>{project.difficulty}</Badge>
              <Badge variant="default" className={getStatusColor(project.status)}>
                {project.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Project Header */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <img
                      src={project.thumbnail || "/placeholder.svg"}
                      alt={project.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{project.title}</CardTitle>
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
                    </div>
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
                </div>
              </CardContent>
            </Card>

            {/* Project Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
                <TabsTrigger value="submission">Submission</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Project Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="prose prose-sm max-w-none">
                      <p>{project.description}</p>
                      <p>
                        This project will help you apply the concepts you've learned in the course and build a practical
                        application that demonstrates your skills. You'll work with {project.technologies.join(", ")} to
                        create a complete solution.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Project Goals:</h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-700">
                        <li>Demonstrate your understanding of the course material</li>
                        <li>Apply best practices in software development</li>
                        <li>Build a portfolio-worthy project</li>
                        <li>Solve real-world problems using the technologies you've learned</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Evaluation Criteria:</h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-700">
                        <li>Code quality and organization</li>
                        <li>Functionality and feature completeness</li>
                        <li>Adherence to requirements</li>
                        <li>Documentation and code comments</li>
                        <li>User experience (if applicable)</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="requirements" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Project Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {project.requirements.map((requirement, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleRequirementToggle(requirement)}
                        >
                          <div
                            className={`flex items-center justify-center w-5 h-5 rounded-full mt-0.5 ${
                              completedRequirements.has(requirement) ? "bg-green-500 text-white" : "bg-gray-200"
                            }`}
                          >
                            {completedRequirements.has(requirement) && <CheckCircle className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <div
                              className={`text-sm ${
                                completedRequirements.has(requirement) ? "text-gray-500 line-through" : "text-gray-900"
                              }`}
                            >
                              {requirement}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="submission" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Project Submission</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Project URL (GitHub, CodeSandbox, etc.)</label>
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-gray-500" />
                        <input
                          type="text"
                          value={submissionUrl}
                          onChange={(e) => setSubmissionUrl(e.target.value)}
                          placeholder="https://github.com/yourusername/project"
                          className="flex-1 p-2 border rounded-md text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Notes and Comments</label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any notes or comments about your project implementation..."
                        className="min-h-[150px]"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <Button variant="outline" onClick={handleMarkComplete}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Complete
                      </Button>

                      <Button
                        onClick={handleSubmitProject}
                        disabled={isSubmitting || !submissionUrl}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {isSubmitting ? "Submitting..." : "Submit Project"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
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

            {/* Resources */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project Resources</CardTitle>
              </CardHeader>
              <CardContent>
                {project.resources.length === 0 ? (
                  <div className="text-sm text-gray-600">No additional resources available.</div>
                ) : (
                  <div className="space-y-3">
                    {project.resources.map((resource) => (
                      <a
                        key={resource.id}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 text-sm"
                      >
                        <ExternalLink className="h-4 w-4 text-primary" />
                        <span className="text-primary">{resource.title}</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {resource.type}
                        </Badge>
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea placeholder="Add your project notes here..." className="min-h-[150px]" />
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Notes
                </Button>
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
                    Completing this project will contribute to your overall course progress.
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

export { RoadmapCourseProject as RoadmapCourseProjectPage }
