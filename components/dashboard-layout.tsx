"use client"
import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { NavigationBar } from "@/components/navigation-bar"
import { DashboardContent } from "@/components/dashboard-content"
import { KapAIAssistant } from "@/components/kap-ai-assistant"
import { useMobile } from "@/hooks/use-mobile"

// Import all page components
import { CoursesPage } from "@/components/pages/courses"
import { CourseDetailPage } from "@/components/pages/course-detail"
import { CoursePreviewPage } from "@/components/pages/course-preview"
import { CourseWatchPage } from "@/components/pages/course-watch"
import { CourseQuizzesPage } from "@/components/pages/course-quizzes"
import { CourseQuizPage } from "@/components/pages/course-quiz"
import { CourseExercisesPage } from "@/components/pages/course-exercises"
import { CourseExercisePage } from "@/components/pages/course-exercise"
import { CoursePlaygroundsPage } from "@/components/pages/course-playgrounds"
import { CoursePlaygroundPage } from "@/components/pages/course-playground"
import { CourseProjectsPage } from "@/components/pages/course-projects"
import { CourseProjectPage } from "@/components/pages/course-project"
import { CourseCertificatePage } from "@/components/pages/course-certificate"

import { ProjectsPage } from "@/components/pages/projects"
import { ProjectDetailPage } from "@/components/pages/project-detail"
import { InterviewsPage } from "@/components/pages/interviews"
import { CommunityPage } from "@/components/pages/community"
import { LandsPage } from "@/components/pages/lands"
import { LandDetailPage } from "@/components/pages/land-detail"
import { StageDetailPage } from "@/components/pages/stage-detail"
import { ChallengeDetailPage } from "@/components/pages/challenge-detail"
import { BootcampsPage } from "@/components/pages/bootcamps"
import { BootcampDetailPage } from "@/components/pages/bootcamp-detail"
import { BootcampDashboardPage } from "@/components/pages/bootcamp-dashboard"
import { BootcampWeekPage } from "@/components/pages/bootcamp-week"
import { LearningPathsPage } from "@/components/pages/learning-paths"
import { LearningPathDetailPage } from "@/components/pages/learning-path-detail"
import { LearningPathContinuePage } from "@/components/pages/learning-path-continue"
import { PathContentWatchPage } from "@/components/pages/path-content-watch"
import { RoadmapsPage } from "@/components/pages/roadmaps"
import { RoadmapDetailPage } from "@/components/pages/roadmap-detail"
import { RoadmapWatchPage } from "@/components/pages/roadmap-watch"
import { RoadmapVideoWatchPage } from "@/components/pages/roadmap-video-watch"
import { RoadmapCoursePreviewPage } from "@/components/pages/roadmap-course-preview"
import { RoadmapCourseWatchPage } from "@/components/pages/roadmap-course-watch"
import { RoadmapCourseQuizzesPage } from "@/components/pages/roadmap-course-quizzes"
import { RoadmapCourseQuizPage } from "@/components/pages/roadmap-course-quiz"
import { RoadmapCourseExercisesPage } from "@/components/pages/roadmap-course-exercises"
import { RoadmapCourseExercisePage } from "@/components/pages/roadmap-course-exercise"
import { RoadmapCoursePlaygroundsPage } from "@/components/pages/roadmap-course-playgrounds"
import { RoadmapCoursePlaygroundPage } from "@/components/pages/roadmap-course-playground"
import { RoadmapCourseProjectsPage } from "@/components/pages/roadmap-course-projects"
import { RoadmapCourseProjectPage } from "@/components/pages/roadmap-course-project"

import { Project30Page } from "@/components/pages/project30"
import { Project30ListingPage } from "@/components/pages/project30-listing"
import { Project30DayPage } from "@/components/pages/project30-day"
import { Project30CommunityPage } from "@/components/pages/project30-community"
import { Project30LeaderboardPage } from "@/components/pages/project30-leaderboard"

import { SubscriptionPlansPage } from "@/components/pages/subscription-plans"
import { CheckoutPage } from "@/components/pages/checkout"
import { SubscriptionManagementPage } from "@/components/pages/subscription-management"
import { XpRedemptionPage } from "@/components/pages/xp-redemption"

// Add these imports for interview components
import { InterviewDetailPage } from "@/components/pages/interview-detail"
import { InterviewResultsPage } from "@/components/pages/interview-results"
import { InterviewProjectPage } from "@/components/pages/interview-project"
import { InterviewAlgorithmPage } from "@/components/pages/interview-algorithm"

// Add mock interview imports
import { MockInterviewsPage } from "@/components/pages/mock-interviews"
import { MockInterviewSession } from "@/components/pages/mock-interview-session"
import { MockInterviewResults } from "@/components/pages/mock-interview-results"

export function DashboardLayout() {
  const [currentPath, setCurrentPath] = useState("/dashboard")
  const [mounted, setMounted] = useState(false)
  const isMobile = useMobile()

  useEffect(() => {
    setMounted(true)
    // Set initial path from window location if available
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname)
    }
  }, [])

  const handleNavigate = (path: string) => {
    console.log("Navigating to:", path)
    setCurrentPath(path)
    // Update browser URL
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", path)
    }
  }

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Parse the current path to extract parameters
  const pathSegments = currentPath.split("/").filter(Boolean)
  console.log("Current path segments:", pathSegments)

  const renderCurrentPage = () => {
    console.log("Rendering page for path:", currentPath)

    // Dashboard home
    if (currentPath === "/dashboard") {
      return <DashboardContent onNavigate={handleNavigate} />
    }

    // Mock Interviews routes
    if (currentPath === "/dashboard/mock-interviews") {
      return <MockInterviewsPage onNavigate={handleNavigate} />
    }

    if (currentPath.includes("/dashboard/mock-interviews/") && currentPath.includes("/results")) {
      const interviewId = pathSegments[2]
      return <MockInterviewResults interviewId={interviewId} onNavigate={handleNavigate} />
    }

    if (currentPath.includes("/dashboard/mock-interviews/") && pathSegments.length === 3) {
      const interviewId = pathSegments[2]
      return <MockInterviewSession interviewId={interviewId} onNavigate={handleNavigate} />
    }

    // Courses routes
    if (currentPath === "/dashboard/courses") {
      return <CoursesPage onNavigate={handleNavigate} />
    }

    // Course certificate route
    if (currentPath.includes("/dashboard/courses/") && currentPath.includes("/certificate")) {
      const courseId = pathSegments[2]
      return <CourseCertificatePage courseId={courseId} onNavigate={handleNavigate} />
    }

    // Course feature routes - handle these before general course routes
    if (currentPath.includes("/dashboard/courses/") && currentPath.includes("/quizzes/") && pathSegments.length === 5) {
      const courseId = pathSegments[2]
      const quizId = pathSegments[4]
      return <CourseQuizPage courseId={courseId} quizId={quizId} onNavigate={handleNavigate} />
    }

    if (currentPath.includes("/dashboard/courses/") && currentPath.includes("/quizzes")) {
      const courseId = pathSegments[2]
      return <CourseQuizzesPage courseId={courseId} onNavigate={handleNavigate} />
    }

    if (
      currentPath.includes("/dashboard/courses/") &&
      currentPath.includes("/exercises/") &&
      pathSegments.length === 5
    ) {
      const courseId = pathSegments[2]
      const exerciseId = pathSegments[4]
      return <CourseExercisePage courseId={courseId} exerciseId={exerciseId} onNavigate={handleNavigate} />
    }

    if (currentPath.includes("/dashboard/courses/") && currentPath.includes("/exercises")) {
      const courseId = pathSegments[2]
      return <CourseExercisesPage courseId={courseId} onNavigate={handleNavigate} />
    }

    if (
      currentPath.includes("/dashboard/courses/") &&
      currentPath.includes("/playgrounds/") &&
      pathSegments.length === 5
    ) {
      const courseId = pathSegments[2]
      const playgroundId = pathSegments[4]
      return <CoursePlaygroundPage courseId={courseId} playgroundId={playgroundId} onNavigate={handleNavigate} />
    }

    if (currentPath.includes("/dashboard/courses/") && currentPath.includes("/playgrounds")) {
      const courseId = pathSegments[2]
      return <CoursePlaygroundsPage courseId={courseId} onNavigate={handleNavigate} />
    }

    if (
      currentPath.includes("/dashboard/courses/") &&
      currentPath.includes("/projects/") &&
      pathSegments.length === 5
    ) {
      const courseId = pathSegments[2]
      const projectId = pathSegments[4]
      return <CourseProjectPage courseId={courseId} projectId={projectId} onNavigate={handleNavigate} />
    }

    if (currentPath.includes("/dashboard/courses/") && currentPath.includes("/projects")) {
      const courseId = pathSegments[2]
      return <CourseProjectsPage courseId={courseId} onNavigate={handleNavigate} />
    }

    // Course preview route
    if (currentPath.includes("/dashboard/courses/") && currentPath.includes("/preview")) {
      const courseId = pathSegments[2]
      return <CoursePreviewPage courseId={courseId} onNavigate={handleNavigate} />
    }

    // Course watch route
    if (currentPath.includes("/dashboard/courses/") && currentPath.includes("/watch/")) {
      const courseId = pathSegments[2]
      const chapterId = pathSegments[4]
      return <CourseWatchPage courseId={courseId} chapterId={chapterId} onNavigate={handleNavigate} />
    }

    // Course detail route (must be after specific routes)
    if (currentPath.includes("/dashboard/courses/") && pathSegments.length === 3) {
      const courseId = pathSegments[2]
      return <CourseDetailPage courseId={courseId} onNavigate={handleNavigate} />
    }

    // Projects routes
    if (currentPath === "/dashboard/projects") {
      return <ProjectsPage onNavigate={handleNavigate} />
    }

    if (currentPath.includes("/dashboard/projects/") && pathSegments.length === 3) {
      const projectId = pathSegments[2]
      return <ProjectDetailPage projectId={projectId} onNavigate={handleNavigate} />
    }

    // Bootcamps routes
    if (currentPath === "/dashboard/bootcamps") {
      return <BootcampsPage onNavigate={handleNavigate} />
    }

    if (currentPath.includes("/dashboard/bootcamps/") && currentPath.includes("/dashboard")) {
      const bootcampId = pathSegments[2]
      return <BootcampDashboardPage bootcampId={bootcampId} onNavigate={handleNavigate} />
    }

    if (currentPath.includes("/dashboard/bootcamps/") && currentPath.includes("/week/")) {
      const bootcampId = pathSegments[2]
      const weekId = pathSegments[4]
      return <BootcampWeekPage bootcampId={bootcampId} weekId={weekId} onNavigate={handleNavigate} />
    }

    if (currentPath.includes("/dashboard/bootcamps/") && pathSegments.length === 3) {
      const bootcampId = pathSegments[2]
      return <BootcampDetailPage bootcampId={bootcampId} onNavigate={handleNavigate} />
    }

    // Learning Paths routes
    if (currentPath === "/dashboard/paths") {
      return <LearningPathsPage onNavigate={handleNavigate} />
    }

    if (currentPath.includes("/dashboard/paths/") && currentPath.includes("/continue")) {
      const pathId = pathSegments[2]
      return <LearningPathContinuePage pathId={pathId} onNavigate={handleNavigate} />
    }

    if (currentPath.includes("/dashboard/paths/") && currentPath.includes("/watch/")) {
      const pathId = pathSegments[2]
      const stepId = pathSegments[4]
      return <PathContentWatchPage pathId={pathId} stepId={stepId} onNavigate={handleNavigate} />
    }

    if (currentPath.includes("/dashboard/paths/") && pathSegments.length === 3) {
      const pathId = pathSegments[2]
      return <LearningPathDetailPage pathId={pathId} onNavigate={handleNavigate} />
    }

    // Roadmaps routes
    if (currentPath === "/dashboard/roadmaps") {
      return <RoadmapsPage onNavigate={handleNavigate} />
    }

    // Roadmap course routes
    if (
      currentPath.includes("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.includes("/watch/")
    ) {
      const roadmapId = pathSegments[2]
      const courseId = pathSegments[4]
      const chapterId = pathSegments[6]
      return (
        <RoadmapCourseWatchPage
          roadmapId={roadmapId}
          courseId={courseId}
          chapterId={chapterId}
          onNavigate={handleNavigate}
        />
      )
    }

    if (
      currentPath.includes("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.includes("/quizzes/")
    ) {
      const roadmapId = pathSegments[2]
      const courseId = pathSegments[4]
      const quizId = pathSegments[6]
      return (
        <RoadmapCourseQuizPage roadmapId={roadmapId} courseId={courseId} quizId={quizId} onNavigate={handleNavigate} />
      )
    }

    if (
      currentPath.includes("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.includes("/quizzes")
    ) {
      const roadmapId = pathSegments[2]
      const courseId = pathSegments[4]
      return <RoadmapCourseQuizzesPage roadmapId={roadmapId} courseId={courseId} onNavigate={handleNavigate} />
    }

    if (
      currentPath.includes("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.includes("/exercises/")
    ) {
      const roadmapId = pathSegments[2]
      const courseId = pathSegments[4]
      const exerciseId = pathSegments[6]
      return (
        <RoadmapCourseExercisePage
          roadmapId={roadmapId}
          courseId={courseId}
          exerciseId={exerciseId}
          onNavigate={handleNavigate}
        />
      )
    }

    if (
      currentPath.includes("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.includes("/exercises")
    ) {
      const roadmapId = pathSegments[2]
      const courseId = pathSegments[4]
      return <RoadmapCourseExercisesPage roadmapId={roadmapId} courseId={courseId} onNavigate={handleNavigate} />
    }

    if (
      currentPath.includes("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.includes("/playgrounds/")
    ) {
      const roadmapId = pathSegments[2]
      const courseId = pathSegments[4]
      const playgroundId = pathSegments[6]
      return (
        <RoadmapCoursePlaygroundPage
          roadmapId={roadmapId}
          courseId={courseId}
          playgroundId={playgroundId}
          onNavigate={handleNavigate}
        />
      )
    }

    if (
      currentPath.includes("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.includes("/playgrounds")
    ) {
      const roadmapId = pathSegments[2]
      const courseId = pathSegments[4]
      return <RoadmapCoursePlaygroundsPage roadmapId={roadmapId} courseId={courseId} onNavigate={handleNavigate} />
    }

    if (
      currentPath.includes("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.includes("/projects/")
    ) {
      const roadmapId = pathSegments[2]
      const courseId = pathSegments[4]
      const projectId = pathSegments[6]
      return (
        <RoadmapCourseProjectPage
          roadmapId={roadmapId}
          courseId={courseId}
          projectId={projectId}
          onNavigate={handleNavigate}
        />
      )
    }

    if (
      currentPath.includes("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.includes("/projects")
    ) {
      const roadmapId = pathSegments[2]
      const courseId = pathSegments[4]
      return <RoadmapCourseProjectsPage roadmapId={roadmapId} courseId={courseId} onNavigate={handleNavigate} />
    }

    if (
      currentPath.includes("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      pathSegments.length === 5
    ) {
      const roadmapId = pathSegments[2]
      const courseId = pathSegments[4]
      return <RoadmapCoursePreviewPage roadmapId={roadmapId} courseId={courseId} onNavigate={handleNavigate} />
    }

    if (currentPath.includes("/dashboard/roadmaps/") && currentPath.includes("/video/")) {
      const roadmapId = pathSegments[2]
      const videoId = pathSegments[4]
      return <RoadmapVideoWatchPage roadmapId={roadmapId} videoId={videoId} onNavigate={handleNavigate} />
    }

    if (currentPath.includes("/dashboard/roadmaps/") && currentPath.includes("/watch")) {
      const roadmapId = pathSegments[2]
      return <RoadmapWatchPage roadmapId={roadmapId} onNavigate={handleNavigate} />
    }

    if (currentPath.includes("/dashboard/roadmaps/") && pathSegments.length === 3) {
      const roadmapId = pathSegments[2]
      return <RoadmapDetailPage roadmapId={roadmapId} onNavigate={handleNavigate} />
    }

    // Project30 routes
    if (currentPath === "/dashboard/project30") {
      return <Project30ListingPage onNavigate={handleNavigate} />
    }

    if (currentPath.includes("/dashboard/project30/") && currentPath.includes("/leaderboard")) {
      const courseId = pathSegments[2]
      return <Project30LeaderboardPage courseId={courseId} onNavigate={handleNavigate} />
    }

    if (currentPath.includes("/dashboard/project30/") && currentPath.includes("/community")) {
      const courseId = pathSegments[2]
      return <Project30CommunityPage courseId={courseId} onNavigate={handleNavigate} />
    }

    if (currentPath.includes("/dashboard/project30/") && currentPath.includes("/day/")) {
      const courseId = pathSegments[2]
      const dayNumber = pathSegments[pathSegments.length - 1]
      return <Project30DayPage courseId={courseId} dayNumber={dayNumber} onNavigate={handleNavigate} />
    }

    if (currentPath.includes("/dashboard/project30/") && pathSegments.length === 3) {
      const courseId = pathSegments[2]
      return <Project30Page courseId={courseId} onNavigate={handleNavigate} />
    }

    // MB Lands routes
    if (currentPath === "/dashboard/lands") {
      return <LandsPage onNavigate={handleNavigate} />
    }

    if (
      currentPath.includes("/dashboard/lands/") &&
      currentPath.includes("/stages/") &&
      currentPath.includes("/challenges/")
    ) {
      const landId = pathSegments[2]
      const stageId = pathSegments[4]
      const challengeId = pathSegments[6]
      return (
        <ChallengeDetailPage landId={landId} stageId={stageId} challengeId={challengeId} onNavigate={handleNavigate} />
      )
    }

    if (currentPath.includes("/dashboard/lands/") && currentPath.includes("/stages/") && pathSegments.length === 5) {
      const landId = pathSegments[2]
      const stageId = pathSegments[4]
      return <StageDetailPage landId={landId} stageId={stageId} onNavigate={handleNavigate} />
    }

    if (currentPath.includes("/dashboard/lands/") && pathSegments.length === 3) {
      const landId = pathSegments[2]
      return <LandDetailPage landId={landId} onNavigate={handleNavigate} />
    }

    // Interviews
    if (currentPath === "/dashboard/interviews") {
      return <InterviewsPage onNavigate={handleNavigate} />
    }

    if (currentPath.includes("/dashboard/interviews/") && currentPath.includes("/results")) {
      const interviewId = pathSegments[2]
      return <InterviewResultsPage interviewId={interviewId} onNavigate={handleNavigate} />
    }

    if (currentPath.includes("/dashboard/interviews/") && currentPath.includes("/project")) {
      const interviewId = pathSegments[2]
      return <InterviewProjectPage interviewId={interviewId} onNavigate={handleNavigate} />
    }

    if (currentPath.includes("/dashboard/interviews/") && currentPath.includes("/algorithm")) {
      const interviewId = pathSegments[2]
      return <InterviewAlgorithmPage interviewId={interviewId} onNavigate={handleNavigate} />
    }

    if (currentPath.includes("/dashboard/interviews/") && pathSegments.length === 3) {
      const interviewId = pathSegments[2]
      return <InterviewDetailPage interviewId={interviewId} onNavigate={handleNavigate} />
    }

    // Community
    if (currentPath === "/dashboard/community") {
      return <CommunityPage onNavigate={handleNavigate} />
    }

    // Subscription Plans
    if (currentPath === "/dashboard/subscription/plans") {
      return <SubscriptionPlansPage onNavigate={handleNavigate} />
    }

    // Subscription Management
    if (currentPath === "/dashboard/subscription" || currentPath === "/dashboard/subscription/management") {
      return <SubscriptionManagementPage onNavigate={handleNavigate} />
    }

    // Checkout
    if (currentPath.includes("/dashboard/checkout")) {
      return <CheckoutPage onNavigate={handleNavigate} />
    }

    // XP Store
    if (currentPath === "/dashboard/xp-store") {
      return <XpRedemptionPage onNavigate={handleNavigate} />
    }

    // Billing (redirect to subscription management for now)
    if (currentPath === "/dashboard/billing") {
      return <SubscriptionManagementPage onNavigate={handleNavigate} />
    }

    // Profile & Settings
    if (currentPath === "/dashboard/profile") {
      return (
        <div className="p-4 md:p-6">
          <h1 className="text-2xl font-bold mb-4">Profile</h1>
          <p>Profile page coming soon...</p>
        </div>
      )
    }

    if (currentPath === "/dashboard/settings") {
      return (
        <div className="p-4 md:p-6">
          <h1 className="text-2xl font-bold mb-4">Settings</h1>
          <p>Settings page coming soon...</p>
        </div>
      )
    }

    // Default fallback
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <button
          onClick={() => handleNavigate("/dashboard")}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Go to Dashboard
        </button>
      </div>
    )
  }

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar - Hidden on mobile, shown on desktop */}
        <DashboardSidebar currentPath={currentPath} onNavigate={handleNavigate} />

        {/* Main Content */}
        <SidebarInset className="flex-1 flex flex-col min-w-0">
          {/* Navigation Bar */}
          <NavigationBar onNavigate={handleNavigate} currentPath={currentPath} />

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            <div className="h-full">{renderCurrentPage()}</div>
          </main>

          {/* Kap AI Assistant */}
          <KapAIAssistant />
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
