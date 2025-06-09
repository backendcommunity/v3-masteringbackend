"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Star } from "lucide-react"

export interface ProjectCardProps {
  id: string
  title: string
  description: string
  image?: string
  difficulty: "beginner" | "intermediate" | "advanced"
  duration: string
  rating?: number
  progress?: number
  tags?: string[]
  enrolled?: boolean
  completed?: boolean
  onStart?: (id: string) => void
  onView?: (id: string) => void
  externalLink?: string
}

export function ProjectCard({
  id,
  title,
  description,
  image = "/placeholder.svg?height=150&width=300",
  difficulty,
  duration,
  rating = 0,
  progress = 0,
  tags = [],
  enrolled = false,
  completed = false,
  onStart,
  onView,
  externalLink,
}: ProjectCardProps) {
  const difficultyColor = {
    beginner: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    intermediate: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    advanced: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  }

  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300 dark:text-gray-600"}`}
        />
      ))
  }

  const handleStart = () => {
    if (onStart) {
      onStart(id)
    }
  }

  const handleView = () => {
    if (onView) {
      onView(id)
    }
  }

  return (
    <Card className="overflow-hidden border-border h-full flex flex-col">
      <div className="aspect-video relative overflow-hidden">
        <img src={image || "/placeholder.svg"} alt={title} className="w-full h-full object-cover" />
        {tags.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start mb-1">
          <Badge variant="outline" className={`${difficultyColor[difficulty]} text-xs`}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </Badge>
          <span className="text-xs text-muted-foreground">{duration}</span>
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="line-clamp-2 text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        {rating > 0 && <div className="flex items-center gap-1 mb-2">{renderStars(rating)}</div>}
        {enrolled && !completed && (
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {enrolled ? (
          <Button onClick={handleView} className="w-full" variant={completed ? "outline" : "default"}>
            {completed ? "View Project" : "Continue"}
          </Button>
        ) : (
          <Button onClick={handleStart} className="w-full">
            Start Project
          </Button>
        )}
        {externalLink && (
          <Button
            variant="outline"
            className="ml-2"
            onClick={() => window.open(externalLink, "_blank", "noopener,noreferrer")}
          >
            GitHub
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export default ProjectCard
