"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Clock,
  Building,
  Target,
  Play,
  Save,
  Send,
  Code,
  Briefcase,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { routes } from "@/lib/routes"
import { getInterviewProjectById } from "@/lib/interview-data"

interface InterviewDetailPageProps {
  interviewId: string
  onNavigate: (route: string) => void
}

export function InterviewDetailPage({ interviewId, onNavigate }: InterviewDetailPageProps) {
  const project = getInterviewProjectById(interviewId)
  const [timeRemaining, setTimeRemaining] = useState(240) // 4 hours in minutes
  const [isStarted, setIsStarted] = useState(false)

  if (!project) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Interview Not Found</h1>
          <p className="text-muted-foreground mt-2">The interview you're looking for doesn't exist.</p>
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

  const handleStartInterview = () => {
    // Navigate directly to the project editor
    if (project.type === "full-project") {
      onNavigate(routes.interviewProject(interviewId))
    } else {
      onNavigate(routes.interviewAlgorithm(interviewId))
    }
  }

  const handleSubmitInterview = () => {
    onNavigate(routes.interviewResults(interviewId))
  }

  if (isStarted) {
    // This should not happen anymore since we navigate directly to the editor
    return (
      <div className="flex-1 flex flex-col h-screen">
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => onNavigate(routes.interviews)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Exit Interview
            </Button>
            <div className="flex items-center gap-2">
              {project.type === "full-project" ? (
                <Briefcase className="h-4 w-4 text-primary" />
              ) : (
                <Code className="h-4 w-4 text-green-600" />
              )}
              <h1 className="font-semibold">{project.title}</h1>
            </div>
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
            <Button size="sm" onClick={handleSubmitInterview}>
              <Send className="h-4 w-4 mr-2" />
              Submit Interview
            </Button>
          </div>
        </div>

        <div className="flex-1">
          <div className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Loading Editor...</h3>
            <p className="text-muted-foreground">Please wait while we prepare your interview environment</p>
          </div>
        </div>
      </div>
    )
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

      {/* Interview Overview */}
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {project.type === "full-project" ? (
                    <Briefcase className="h-5 w-5 text-primary" />
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
            <CardDescription className="text-base mt-4">{project.description}</CardDescription>
          </CardHeader>
        </Card>

        {/* Requirements */}
        {project.requirements && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {project.requirements.map((req: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{req}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Constraints (for algorithms) */}
        {project.constraints && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Constraints</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {project.constraints.map((constraint: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{constraint}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Examples (for algorithms) */}
        {project.examples && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.examples.map((example: any, index: number) => (
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
            </CardContent>
          </Card>
        )}

        {/* Technologies (for full projects) */}
        {project.technologies && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Technologies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech: string) => (
                  <Badge key={tech} variant="secondary">
                    {tech}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grading Criteria (for full projects) */}
        {project.gradingCriteria && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Grading Criteria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {project.gradingCriteria.map((criteria: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{criteria.criteria}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{criteria.weight}%</span>
                      <Badge variant="outline">{criteria.maxPoints} MB</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Start Interview */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Ready to start your interview?</h3>
                <p className="text-muted-foreground">
                  You have {project.duration} to complete this interview. Make sure you have a stable internet
                  connection.
                </p>
              </div>
              <Button size="lg" onClick={handleStartInterview} className="px-8">
                <Play className="h-4 w-4 mr-2" />
                Start Interview
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
