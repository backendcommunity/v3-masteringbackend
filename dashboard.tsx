"use client"

import { useState } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { NavigationBar } from "@/components/navigation-bar"
import { DashboardContent } from "@/components/dashboard-content"
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
import { LearningPathsPage } from "@/components/pages/learning-paths"
import { LearningPathDetailPage } from "@/components/pages/learning-path-detail"
import { LearningPathContinuePage } from "@/components/pages/learning-path-continue"
import { PathContentWatchPage } from "@/components/pages/path-content-watch"
import { BootcampsPage } from "@/components/pages/bootcamps"
import { BootcampDetailPage } from "@/components/pages/bootcamp-detail"
import { BootcampDashboardPage } from "@/components/pages/bootcamp-dashboard"
import { BootcampWeekPage } from "@/components/pages/bootcamp-week"
import { Project30Page } from "@/components/pages/project30"
import { Project30ListingPage } from "@/components/pages/project30-listing"
import { Project30DayPage } from "@/components/pages/project30-day"
import { Project30CommunityPage } from "@/components/pages/project30-community"
import { Project30LeaderboardPage } from "@/components/pages/project30-leaderboard"
import { ProjectsPage } from "@/components/pages/projects"
import { ProjectDetailPage } from "@/components/pages/project-detail"
import { LandsPage } from "@/components/pages/lands"
import { LandDetailPage } from "@/components/pages/land-detail"
import { StageDetailPage } from "@/components/pages/stage-detail"
import { ChallengeDetailPage } from "@/components/pages/challenge-detail"
import { InterviewsPage } from "@/components/pages/interviews"
import { InterviewDetailPage } from "@/components/pages/interview-detail"
import { InterviewProjectPage } from "@/components/pages/interview-project"
import { InterviewAlgorithmPage } from "@/components/pages/interview-algorithm"
import { InterviewResultsPage } from "@/components/pages/interview-results"
import { MockInterviewsPage } from "@/components/pages/mock-interviews"
import { MockInterviewSessionPage } from "@/components/pages/mock-interview-session"
import { MockInterviewResultsPage } from "@/components/pages/mock-interview-results"
import { CommunityPage } from "@/components/pages/community"
import { SubscriptionPlansPage } from "@/components/pages/subscription-plans"
import { SubscriptionManagementPage } from "@/components/pages/subscription-management"
import { CheckoutPage } from "@/components/pages/checkout"
import { XpRedemptionPage } from "@/components/pages/xp-redemption"
import { ProfilePage } from "@/components/pages/profile"
import { SettingsPage } from "@/components/pages/settings"
import { routes } from "@/lib/routes"

export default function Dashboard() {
  const [currentPath, setCurrentPath] = useState("/dashboard")

  const handleNavigate = (path: string) => {
    setCurrentPath(path)
  }

  const renderContent = () => {
    console.log("Current path:", currentPath)

    // Profile
    if (currentPath === "/dashboard/profile") {
      return <ProfilePage onNavigate={handleNavigate} />
    }

    // Settings
    if (currentPath === "/dashboard/settings") {
      return <SettingsPage onNavigate={handleNavigate} />
    }

    // XP Store
    if (currentPath === "/dashboard/xp-store") {
      return <XpRedemptionPage onNavigate={handleNavigate} />
    }

    // Courses
    if (currentPath === routes.courses) {
      return <CoursesPage onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/courses/") && currentPath.includes("/preview")) {
      const courseId = currentPath.split("/")[3]
      return <CoursePreviewPage courseId={courseId} onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/courses/") && currentPath.includes("/watch/")) {
      const parts = currentPath.split("/")
      const courseId = parts[3]
      const chapterId = parts[5]
      return <CourseWatchPage courseId={courseId} chapterId={chapterId} onNavigate={handleNavigate} />
    }

    if (
      currentPath.startsWith("/dashboard/courses/") &&
      currentPath.includes("/quizzes/") &&
      currentPath.split("/").length === 6
    ) {
      const parts = currentPath.split("/")
      const courseId = parts[3]
      const quizId = parts[5]
      return <CourseQuizPage courseId={courseId} quizId={quizId} onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/courses/") && currentPath.endsWith("/quizzes")) {
      const courseId = currentPath.split("/")[3]
      return <CourseQuizzesPage courseId={courseId} onNavigate={handleNavigate} />
    }

    if (
      currentPath.startsWith("/dashboard/courses/") &&
      currentPath.includes("/exercises/") &&
      currentPath.split("/").length === 6
    ) {
      const parts = currentPath.split("/")
      const courseId = parts[3]
      const exerciseId = parts[5]
      return <CourseExercisePage courseId={courseId} exerciseId={exerciseId} onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/courses/") && currentPath.endsWith("/exercises")) {
      const courseId = currentPath.split("/")[3]
      return <CourseExercisesPage courseId={courseId} onNavigate={handleNavigate} />
    }

    if (
      currentPath.startsWith("/dashboard/courses/") &&
      currentPath.includes("/playgrounds/") &&
      currentPath.split("/").length === 6
    ) {
      const parts = currentPath.split("/")
      const courseId = parts[3]
      const playgroundId = parts[5]
      return <CoursePlaygroundPage courseId={courseId} playgroundId={playgroundId} onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/courses/") && currentPath.endsWith("/playgrounds")) {
      const courseId = currentPath.split("/")[3]
      return <CoursePlaygroundsPage courseId={courseId} onNavigate={handleNavigate} />
    }

    if (
      currentPath.startsWith("/dashboard/courses/") &&
      currentPath.includes("/projects/") &&
      currentPath.split("/").length === 6
    ) {
      const parts = currentPath.split("/")
      const courseId = parts[3]
      const projectId = parts[5]
      return <CourseProjectPage courseId={courseId} projectId={projectId} onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/courses/") && currentPath.endsWith("/projects")) {
      const courseId = currentPath.split("/")[3]
      return <CourseProjectsPage courseId={courseId} onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/courses/") && currentPath.endsWith("/certificate")) {
      const courseId = currentPath.split("/")[3]
      return <CourseCertificatePage courseId={courseId} onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/courses/") && currentPath.split("/").length === 4) {
      const courseId = currentPath.split("/")[3]
      return <CourseDetailPage courseId={courseId} onNavigate={handleNavigate} />
    }

    // Roadmaps
    if (currentPath === routes.roadmaps) {
      return <RoadmapsPage onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/roadmaps/") && currentPath.endsWith("/watch")) {
      const roadmapId = currentPath.split("/")[3]
      return <RoadmapWatchPage roadmapId={roadmapId} onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/roadmaps/") && currentPath.includes("/video/")) {
      const parts = currentPath.split("/")
      const roadmapId = parts[3]
      const videoId = parts[5]
      return <RoadmapVideoWatchPage roadmapId={roadmapId} videoId={videoId} onNavigate={handleNavigate} />
    }

    if (
      currentPath.startsWith("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.includes("/watch/")
    ) {
      const parts = currentPath.split("/")
      const roadmapId = parts[3]
      const courseId = parts[5]
      const chapterId = parts[7]
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
      currentPath.startsWith("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.includes("/quizzes/") &&
      currentPath.split("/").length === 8
    ) {
      const parts = currentPath.split("/")
      const roadmapId = parts[3]
      const courseId = parts[5]
      const quizId = parts[7]
      return (
        <RoadmapCourseQuizPage roadmapId={roadmapId} courseId={courseId} quizId={quizId} onNavigate={handleNavigate} />
      )
    }

    if (
      currentPath.startsWith("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.endsWith("/quizzes")
    ) {
      const parts = currentPath.split("/")
      const roadmapId = parts[3]
      const courseId = parts[5]
      return <RoadmapCourseQuizzesPage roadmapId={roadmapId} courseId={courseId} onNavigate={handleNavigate} />
    }

    if (
      currentPath.startsWith("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.includes("/exercises/") &&
      currentPath.split("/").length === 8
    ) {
      const parts = currentPath.split("/")
      const roadmapId = parts[3]
      const courseId = parts[5]
      const exerciseId = parts[7]
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
      currentPath.startsWith("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.endsWith("/exercises")
    ) {
      const parts = currentPath.split("/")
      const roadmapId = parts[3]
      const courseId = parts[5]
      return <RoadmapCourseExercisesPage roadmapId={roadmapId} courseId={courseId} onNavigate={handleNavigate} />
    }

    if (
      currentPath.startsWith("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.includes("/playgrounds/") &&
      currentPath.split("/").length === 8
    ) {
      const parts = currentPath.split("/")
      const roadmapId = parts[3]
      const courseId = parts[5]
      const playgroundId = parts[7]
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
      currentPath.startsWith("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.endsWith("/playgrounds")
    ) {
      const parts = currentPath.split("/")
      const roadmapId = parts[3]
      const courseId = parts[5]
      return <RoadmapCoursePlaygroundsPage roadmapId={roadmapId} courseId={courseId} onNavigate={handleNavigate} />
    }

    if (
      currentPath.startsWith("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.includes("/projects/") &&
      currentPath.split("/").length === 8
    ) {
      const parts = currentPath.split("/")
      const roadmapId = parts[3]
      const courseId = parts[5]
      const projectId = parts[7]
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
      currentPath.startsWith("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.endsWith("/projects")
    ) {
      const parts = currentPath.split("/")
      const roadmapId = parts[3]
      const courseId = parts[5]
      return <RoadmapCourseProjectsPage roadmapId={roadmapId} courseId={courseId} onNavigate={handleNavigate} />
    }

    if (
      currentPath.startsWith("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.split("/").length === 6
    ) {
      const parts = currentPath.split("/")
      const roadmapId = parts[3]
      const courseId = parts[5]
      return <RoadmapCoursePreviewPage roadmapId={roadmapId} courseId={courseId} onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/roadmaps/") && currentPath.split("/").length === 4) {
      const roadmapId = currentPath.split("/")[3]
      return <RoadmapDetailPage roadmapId={roadmapId} onNavigate={handleNavigate} />
    }

    // Learning Paths
    if (currentPath === routes.paths) {
      return <LearningPathsPage onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/paths/") && currentPath.endsWith("/continue")) {
      const pathId = currentPath.split("/")[3]
      return <LearningPathContinuePage pathId={pathId} onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/paths/") && currentPath.includes("/watch/")) {
      const parts = currentPath.split("/")
      const pathId = parts[3]
      const stepId = parts[5]
      return <PathContentWatchPage pathId={pathId} stepId={stepId} onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/paths/") && currentPath.split("/").length === 4) {
      const pathId = currentPath.split("/")[3]
      return <LearningPathDetailPage pathId={pathId} onNavigate={handleNavigate} />
    }

    // Bootcamps
    if (currentPath === routes.bootcamps) {
      return <BootcampsPage onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/bootcamps/") && currentPath.endsWith("/dashboard")) {
      const bootcampId = currentPath.split("/")[3]
      return <BootcampDashboardPage bootcampId={bootcampId} onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/bootcamps/") && currentPath.includes("/week/")) {
      const parts = currentPath.split("/")
      const bootcampId = parts[3]
      const weekId = parts[5]
      return <BootcampWeekPage bootcampId={bootcampId} weekId={weekId} onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/bootcamps/") && currentPath.split("/").length === 4) {
      const bootcampId = currentPath.split("/")[3]
      return <BootcampDetailPage bootcampId={bootcampId} onNavigate={handleNavigate} />
    }

    // Project30
    if (currentPath === routes.project30) {
      return <Project30ListingPage onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/project30/") && currentPath.includes("/day/")) {
      const parts = currentPath.split("/")
      const courseId = parts[3]
      const dayNumber = parts[5]
      return <Project30DayPage courseId={courseId} dayNumber={dayNumber} onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/project30/") && currentPath.endsWith("/community")) {
      const courseId = currentPath.split("/")[3]
      return <Project30CommunityPage courseId={courseId} onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/project30/") && currentPath.endsWith("/leaderboard")) {
      const courseId = currentPath.split("/")[3]
      return <Project30LeaderboardPage courseId={courseId} onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/project30/") && currentPath.split("/").length === 4) {
      const courseId = currentPath.split("/")[3]
      return <Project30Page courseId={courseId} onNavigate={handleNavigate} />
    }

    // Projects
    if (currentPath === routes.projects) {
      return <ProjectsPage onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/projects/") && currentPath.split("/").length === 4) {
      const projectId = currentPath.split("/")[3]
      return <ProjectDetailPage projectId={projectId} onNavigate={handleNavigate} />
    }

    // MB Lands
    if (currentPath === routes.lands) {
      return <LandsPage onNavigate={handleNavigate} />
    }

    if (
      currentPath.startsWith("/dashboard/lands/") &&
      currentPath.includes("/stages/") &&
      currentPath.includes("/challenges/")
    ) {
      const parts = currentPath.split("/")
      const landId = parts[3]
      const stageId = parts[5]
      const challengeId = parts[7]
      return (
        <ChallengeDetailPage landId={landId} stageId={stageId} challengeId={challengeId} onNavigate={handleNavigate} />
      )
    }

    if (
      currentPath.startsWith("/dashboard/lands/") &&
      currentPath.includes("/stages/") &&
      currentPath.split("/").length === 6
    ) {
      const parts = currentPath.split("/")
      const landId = parts[3]
      const stageId = parts[5]
      return <StageDetailPage landId={landId} stageId={stageId} onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/lands/") && currentPath.split("/").length === 4) {
      const landId = currentPath.split("/")[3]
      return <LandDetailPage landId={landId} onNavigate={handleNavigate} />
    }

    // Interviews - UPDATED TO USE NEW EDITOR
    if (currentPath === routes.interviews) {
      return <InterviewsPage onNavigate={handleNavigate} />
    }

    // Interview Project Editor - This now uses the new InterviewProjectEditor
    if (currentPath.startsWith("/dashboard/interviews/") && currentPath.endsWith("/project")) {
      const interviewId = currentPath.split("/")[3]
      return <InterviewProjectPage interviewId={interviewId} onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/interviews/") && currentPath.endsWith("/algorithm")) {
      const interviewId = currentPath.split("/")[3]
      return <InterviewAlgorithmPage interviewId={interviewId} onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/interviews/") && currentPath.endsWith("/results")) {
      const interviewId = currentPath.split("/")[3]
      return <InterviewResultsPage interviewId={interviewId} onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/interviews/") && currentPath.split("/").length === 4) {
      const interviewId = currentPath.split("/")[3]
      return <InterviewDetailPage interviewId={interviewId} onNavigate={handleNavigate} />
    }

    // Mock Interviews
    if (currentPath === routes.mockInterviews) {
      return <MockInterviewsPage onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/mock-interviews/") && currentPath.endsWith("/results")) {
      const id = currentPath.split("/")[3]
      return <MockInterviewResultsPage interviewId={id} onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/mock-interviews/") && currentPath.split("/").length === 4) {
      const id = currentPath.split("/")[3]
      return <MockInterviewSessionPage interviewId={id} onNavigate={handleNavigate} />
    }

    // Community
    if (currentPath === routes.community) {
      return <CommunityPage onNavigate={handleNavigate} />
    }

    // Subscription & Billing
    if (currentPath === routes.subscriptionPlans) {
      return <SubscriptionPlansPage onNavigate={handleNavigate} />
    }

    if (currentPath === routes.subscriptionManagement) {
      return <SubscriptionManagementPage onNavigate={handleNavigate} />
    }

    if (currentPath === routes.billing) {
      return <SubscriptionManagementPage onNavigate={handleNavigate} />
    }

    if (currentPath.startsWith("/dashboard/checkout")) {
      return <CheckoutPage onNavigate={handleNavigate} />
    }

    // Default dashboard
    return <DashboardContent onNavigate={handleNavigate} />
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar currentPath={currentPath} onNavigate={handleNavigate} />
        <div className="flex-1 flex flex-col">
          <NavigationBar onNavigate={handleNavigate} />
          <main className="flex-1 overflow-auto">{renderContent()}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
