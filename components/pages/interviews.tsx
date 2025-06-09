"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Star, ChevronRight, Code, Brain, MessageSquare } from "lucide-react"

interface InterviewsPageProps {
  onNavigate: (path: string) => void
}

const interviewTypes = [
  {
    id: "technical",
    title: "Technical Interviews",
    description: "Practice coding problems and system design questions",
    icon: Code,
    difficulty: "Intermediate",
    duration: "45-60 min",
    participants: "1-2 interviewers",
    rating: 4.8,
    count: 150,
    color: "bg-blue-500",
  },
  {
    id: "behavioral",
    title: "Behavioral Interviews",
    description: "Master soft skills and situational questions",
    icon: MessageSquare,
    difficulty: "Beginner",
    duration: "30-45 min",
    participants: "1 interviewer",
    rating: 4.6,
    count: 89,
    color: "bg-green-500",
  },
  {
    id: "system-design",
    title: "System Design",
    description: "Learn to design scalable systems and architectures",
    icon: Brain,
    difficulty: "Advanced",
    duration: "60-90 min",
    participants: "1-2 interviewers",
    rating: 4.9,
    count: 67,
    color: "bg-purple-500",
  },
]

export function InterviewsPage({ onNavigate }: InterviewsPageProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Interview Practice</h1>
        <p className="text-muted-foreground">
          Prepare for your next interview with our comprehensive practice sessions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {interviewTypes.map((type) => {
          const IconComponent = type.icon
          return (
            <Card key={type.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${type.color} text-white`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <Badge variant="secondary">{type.difficulty}</Badge>
                </div>
                <CardTitle className="text-xl">{type.title}</CardTitle>
                <CardDescription>{type.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    {type.duration}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    {type.participants}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm font-medium">{type.rating}</span>
                      <span className="text-sm text-muted-foreground ml-1">({type.count} reviews)</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4" onClick={() => onNavigate(`/dashboard/interviews/${type.id}`)}>
                    Start Practice
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Recent Practice Sessions</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((session) => (
            <Card key={session}>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <h3 className="font-semibold">Technical Interview #{session}</h3>
                  <p className="text-sm text-muted-foreground">Completed 2 days ago • Score: 85%</p>
                </div>
                <Button variant="outline" size="sm">
                  View Results
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
