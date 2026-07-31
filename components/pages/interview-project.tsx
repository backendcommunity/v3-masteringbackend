"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, Save, Send } from "lucide-react"
import { routes } from "@/lib/routes"
import { getInterviewProjectById } from "@/lib/interview-data"
import { InterviewProjectEditor } from "./interview-project-editor"

interface InterviewProjectPageProps {
  interviewId: string
  onNavigate: (route: string) => void
}

export function InterviewProjectPage({ interviewId, onNavigate }: InterviewProjectPageProps) {
  const project = getInterviewProjectById(interviewId)
  const [timeRemaining, setTimeRemaining] = useState(240) // 4 hours in minutes
  const [isStarted, setIsStarted] = useState(true) // Auto-start for project editor

  useEffect(() => {
    if (!project) return

    // Initialize timer
    if (timeRemaining > 0 && isStarted) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 60000) // Update every minute
      return () => clearTimeout(timer)
    }
  }, [timeRemaining, isStarted, project])

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

  const handleSubmitProject = () => {
    onNavigate(routes.interviewResults(interviewId))
  }

  const handleExitInterview = () => {
    onNavigate(routes.interviewDetail(interviewId))
  }

  // Use the new InterviewProjectEditor component
  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleExitInterview}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Exit Interview
          </Button>
          <h1 className="font-semibold">{project.title}</h1>
          <Badge variant="outline">{project.company}</Badge>
          <Badge variant="destructive">Live Interview</Badge>
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
          <Button size="sm" onClick={handleSubmitProject}>
            <Send className="h-4 w-4 mr-2" />
            Submit Interview
          </Button>
        </div>
      </div>

      {/* Use the new Interview Project Editor */}
      <InterviewProjectEditor project={project} onNavigate={onNavigate} />
    </div>
  )
}
