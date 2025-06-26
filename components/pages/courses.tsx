"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { BookOpen, Clock, Star, Users, Search, Play, Crown, Gift, CreditCard, Lock } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { routes } from "@/lib/routes"
import { ConfettiCelebration } from "@/components/confetti-celebration"
import { useCelebration } from "@/hooks/use-celebration"

interface CoursesPageProps {
  onNavigate: (path: string) => void
}

export function CoursesPage({ onNavigate }: CoursesPageProps) {
  const store = useAppStore()
  const courses = store.getCourses()
  const { enrollInCourse } = store
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)

  const { celebration, triggerCelebration, hideCelebration } = useCelebration()

  // Mock subscription data
  const subscription = {
    plan: "Pro", // Free, Pro, Enterprise
    status: "active",
    xpBalance: 2450,
  }

  const handleEnroll = (courseId: string) => {
    try {
      const course = courses.find((c) => c.id === courseId)
      if (!course) {
        console.error("Course not found:", courseId)
        return
      }

      console.log("Enrolling in course:", courseId)
      enrollInCourse(courseId)

      // Trigger celebration for first-time enrollment
      triggerCelebration(course.title, courseId, "enrollment")
    } catch (error) {
      console.error("Error enrolling in course:", error)
    }
  }

  const handleViewDetails = (courseId: string) => {
    const detailPath = routes.courseDetail(courseId)
    console.log("View Details - Navigating to:", detailPath)
    onNavigate(detailPath)
  }

  const handlePreview = (courseId: string) => {
    const previewPath = routes.coursePreview(courseId)
    console.log("Preview - Navigating to:", previewPath)
    onNavigate(previewPath)
  }

  const handleContinueLearning = (courseId: string) => {
    const detailPath = routes.courseDetail(courseId)
    console.log("Continue Learning - Navigating to:", detailPath)
    onNavigate(detailPath)
  }

  const handlePurchase = (courseId: string, method: "subscription" | "individual" | "xp") => {
    const course = courses.find((c) => c.id === courseId)
    if (!course) return

    switch (method) {
      case "subscription":
        onNavigate(routes.subscriptionPlans)
        break
      case "individual":
        onNavigate(routes.checkout("course", courseId))
        break
      case "xp":
        onNavigate(routes.xpRedeem("course", courseId))
        break
    }
    setShowPaymentDialog(false)
  }

  const canAccessCourse = (course: any) => {
    return subscription.plan !== "Free" || course.enrolled || course.isFree
  }

  const getXPCost = (price: number) => {
    return Math.round(price * 50) // 1 dollar = 50 XP
  }

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Master backend development with our comprehensive course library
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {subscription.plan === "Free" && (
            <Button onClick={() => onNavigate("/dashboard/subscription-plans")} className="w-full sm:w-auto">
              <Crown className="mr-2 h-4 w-4" />
              Upgrade to Pro
            </Button>
          )}
          <Button variant="outline" className="w-full sm:w-auto">
            <BookOpen className="mr-2 h-4 w-4" />
            Browse All Courses
          </Button>
        </div>
      </div>

      {/* Subscription Status Banner */}
      {subscription.plan === "Free" && (
        <Card className="bg-gradient-to-r from-[#F2C94C]/10 to-[#F2C94C]/5 border-[#F2C94C]/20">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Crown className="h-6 w-6 md:h-8 md:w-8 text-[#F2C94C] flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm md:text-base">Unlock All Courses with Pro</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Get unlimited access to all courses, bootcamps, and learning paths
                  </p>
                </div>
              </div>
              <Button onClick={() => onNavigate("/dashboard/subscription-plans")} className="w-full md:w-auto">
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search courses..." className="pl-8" />
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Select>
            <SelectTrigger className="w-full sm:w-[140px] md:w-[180px]">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-full sm:w-[140px] md:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="nodejs">Node.js</SelectItem>
              <SelectItem value="database">Database</SelectItem>
              <SelectItem value="api">API Design</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => {
          const hasAccess = canAccessCourse(course)
          const xpCost = getXPCost(course.price)

          return (
            <Card key={course.id} className="overflow-hidden relative">
              {!hasAccess && (
                <div className="absolute inset-0 bg-black/20 z-10 flex items-center justify-center">
                  <div className="bg-white rounded-full p-2">
                    <Lock className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
              )}

              <div
                className="aspect-video bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => (hasAccess ? handleViewDetails(course.id) : setSelectedCourse(course.id))}
              >
                <img
                  src={course.thumbnail || "/placeholder.svg"}
                  alt={course.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <CardHeader className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge
                    variant={
                      course.level === "Advanced"
                        ? "destructive"
                        : course.level === "Intermediate"
                          ? "default"
                          : "secondary"
                    }
                    className="text-xs"
                  >
                    {course.level}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs md:text-sm">{course.rating}</span>
                  </div>
                </div>
                <CardTitle
                  className="line-clamp-2 cursor-pointer hover:text-primary transition-colors text-sm md:text-base"
                  onClick={() => (hasAccess ? handleViewDetails(course.id) : setSelectedCourse(course.id))}
                >
                  {course.title}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-xs md:text-sm">{course.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 md:space-y-4 p-4 pt-0">
                <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 md:h-4 md:w-4" />
                    {course.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 md:h-4 md:w-4" />
                    {course.students.toLocaleString()}
                  </div>
                </div>

                {course.enrolled ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs md:text-sm">
                      <span>Progress</span>
                      <span>{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                    <Button className="w-full text-xs md:text-sm" onClick={() => handleContinueLearning(course.id)}>
                      <Play className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                      Continue Learning
                    </Button>
                  </div>
                ) : hasAccess ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs">
                        <Crown className="mr-1 h-3 w-3" />
                        Included in {subscription.plan}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => handlePreview(course.id)} className="text-xs">
                        Preview
                      </Button>
                    </div>
                    <Button className="w-full text-xs md:text-sm" onClick={() => handleEnroll(course.id)}>
                      Start Learning
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg md:text-2xl font-bold">${course.price}</span>
                      <Button variant="outline" size="sm" onClick={() => handlePreview(course.id)} className="text-xs">
                        Preview
                      </Button>
                    </div>

                    <Dialog
                      open={showPaymentDialog && selectedCourse === course.id}
                      onOpenChange={setShowPaymentDialog}
                    >
                      <DialogTrigger asChild>
                        <Button
                          className="w-full text-xs md:text-sm"
                          onClick={() => {
                            setSelectedCourse(course.id)
                            setShowPaymentDialog(true)
                          }}
                        >
                          Get Access
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-[95vw] max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-base md:text-lg">Get Access to {course.title}</DialogTitle>
                          <DialogDescription className="text-sm">
                            Choose how you'd like to access this course
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 md:space-y-4">
                          <Card
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handlePurchase(course.id, "subscription")}
                          >
                            <CardContent className="p-3 md:p-4">
                              <div className="flex items-center gap-3">
                                <Crown className="h-6 w-6 md:h-8 md:w-8 text-[#F2C94C] flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-sm md:text-base">Upgrade to Pro</h3>
                                  <p className="text-xs md:text-sm text-muted-foreground">
                                    Get unlimited access to all courses
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-sm md:text-base">$39.99/mo</div>
                                  <div className="text-xs text-muted-foreground">Best value</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handlePurchase(course.id, "individual")}
                          >
                            <CardContent className="p-3 md:p-4">
                              <div className="flex items-center gap-3">
                                <CreditCard className="h-6 w-6 md:h-8 md:w-8 text-[#13AECE] flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-sm md:text-base">Buy This Course</h3>
                                  <p className="text-xs md:text-sm text-muted-foreground">
                                    One-time purchase for lifetime access
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-sm md:text-base">${course.price}</div>
                                  <div className="text-xs text-muted-foreground">One-time</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handlePurchase(course.id, "xp")}
                          >
                            <CardContent className="p-3 md:p-4">
                              <div className="flex items-center gap-3">
                                <Gift className="h-6 w-6 md:h-8 md:w-8 text-[#EB5757] flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-sm md:text-base">Redeem with XP</h3>
                                  <p className="text-xs md:text-sm text-muted-foreground">Use your earned XP points</p>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-sm md:text-base">{xpCost.toLocaleString()} XP</div>
                                  <div className="text-xs text-muted-foreground">
                                    Balance: {subscription.xpBalance.toLocaleString()} XP
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}

                <div className="flex flex-wrap gap-1">
                  {course.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      {/* Confetti Celebration */}
      <ConfettiCelebration
        isVisible={celebration.isVisible}
        onComplete={hideCelebration}
        courseName={celebration.courseName}
        celebrationType={celebration.celebrationType}
      />
    </div>
  )
}
