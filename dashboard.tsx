"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardContent } from "@/components/dashboard-content"
import { CoursesPage } from "@/components/pages/courses"
import { ProjectsPage } from "@/components/pages/projects"
import { InterviewsPage } from "@/components/pages/interviews"
import { Project30Page } from "@/components/pages/project30"
import { CommunityPage } from "@/components/pages/community"
import { BootcampsPage } from "@/components/pages/bootcamps"
import { LearningPathsPage } from "@/components/pages/learning-paths"
import { RoadmapsPage } from "@/components/pages/roadmaps"
import { LandsPage } from "@/components/pages/lands"
import { MockInterviewsPage } from "@/components/pages/mock-interviews"
import { ProfilePage } from "@/components/pages/profile"
import { SettingsPage } from "@/components/pages/settings"
import { SubscriptionManagementPage } from "@/components/pages/subscription-management"
import { SubscriptionPlansPage } from "@/components/pages/subscription-plans"
import { XPRedemptionPage } from "@/components/pages/xp-redemption"
import { CheckoutPage } from "@/components/pages/checkout"
import { CourseDetailPage } from "@/components/pages/course-detail"
import { CourseWatchPage } from "@/components/pages/course-watch"
import { CourseExercisesPage } from "@/components/pages/course-exercises"
import { CourseExercisePage } from "@/components/pages/course-exercise"
import { CourseQuizzesPage } from "@/components/pages/course-quizzes"
import { CourseQuizPage } from "@/components/pages/course-quiz"
import { CourseProjectsPage } from "@/components/pages/course-projects"
import { CourseProjectPage } from "@/components/pages/course-project"
import { CoursePlaygroundsPage } from "@/components/pages/course-playgrounds"
import { CoursePlaygroundPage } from "@/components/pages/course-playground"
import { CourseCertificatePage } from "@/components/pages/course-certificate"
import { CoursePreviewPage } from "@/components/pages/course-preview"
import { ProjectDetailPage } from "@/components/pages/project-detail"
import { InterviewDetailPage } from "@/components/pages/interview-detail"
import { InterviewAlgorithmPage } from "@/components/pages/interview-algorithm"
import { InterviewAlgorithmEditorPage } from "@/components/pages/interview-algorithm-editor"
import { InterviewProjectPage } from "@/components/pages/interview-project"
import { InterviewProjectEditorPage } from "@/components/pages/interview-project-editor"
import { InterviewResultsPage } from "@/components/pages/interview-results"
import { MockInterviewSession } from "@/components/pages/mock-interview-session"
import { MockInterviewResults } from "@/components/pages/mock-interview-results"
import { LearningPathDetailPage } from "@/components/pages/learning-path-detail"
import { LearningPathContinuePage } from "@/components/pages/learning-path-continue"
import { PathContentWatchPage } from "@/components/pages/path-content-watch"
import { RoadmapDetailPage } from "@/components/pages/roadmap-detail"
import { RoadmapWatchPage } from "@/components/pages/roadmap-watch"
import { RoadmapVideoWatchPage } from "@/components/pages/roadmap-video-watch"
import { RoadmapCoursePreviewPage } from "@/components/pages/roadmap-course-preview"
import { RoadmapCourseWatchPage } from "@/components/pages/roadmap-course-watch"
import { RoadmapCourseExercisesPage } from "@/components/pages/roadmap-course-exercises"
import { RoadmapCourseExercisePage } from "@/components/pages/roadmap-course-exercise"
import { RoadmapCourseQuizzesPage } from "@/components/pages/roadmap-course-quizzes"
import { RoadmapCourseQuizPage } from "@/components/pages/roadmap-course-quiz"
import { RoadmapCourseProjectsPage } from "@/components/pages/roadmap-course-projects"
import { RoadmapCourseProjectPage } from "@/components/pages/roadmap-course-project"
import { RoadmapCoursePlaygroundsPage } from "@/components/pages/roadmap-course-playgrounds"
import { RoadmapCoursePlaygroundPage } from "@/components/pages/roadmap-course-playground"
import { LandDetailPage } from "@/components/pages/land-detail"
import { StageDetailPage } from "@/components/pages/stage-detail"
import { ChallengeDetailPage } from "@/components/pages/challenge-detail"
import { CodingChallengePage } from "@/components/pages/challenges/coding-challenge"
import { QuizChallengePage } from "@/components/pages/challenges/quiz-challenge"
import { PuzzleChallengePage } from "@/components/pages/challenges/puzzle-challenge"
import { DebugChallengePage } from "@/components/pages/challenges/debug-challenge"
import { Project30ListingPage } from "@/components/pages/project30-listing"
import { Project30DayPage } from "@/components/pages/project30-day"
import { Project30CommunityPage } from "@/components/pages/project30-community"
import { Project30LeaderboardPage } from "@/components/pages/project30-leaderboard"
import { BootcampDashboardPage } from "@/components/pages/bootcamp-dashboard"
import { BootcampDetailPage } from "@/components/pages/bootcamp-detail"
import { BootcampWeekPage } from "@/components/pages/bootcamp-week"
import { routes } from "@/lib/routes"

export default function Dashboard() {
  const [currentPath, setCurrentPath] = useState("/dashboard")

  const handleNavigate = (path: string) => {
    setCurrentPath(path)
  }

  const renderContent = () => {
    // Dashboard
    if (currentPath === routes.dashboard) {
      return <DashboardContent />
    }

    // Courses
    if (currentPath === routes.courses) {
      return <CoursesPage />
    }
    if (currentPath.startsWith("/dashboard/courses/") && currentPath.endsWith("/preview")) {
      const courseId = currentPath.split("/")[3]
      return <CoursePreviewPage courseId={courseId} />
    }
    if (currentPath.startsWith("/dashboard/courses/") && currentPath.includes("/watch/")) {
      const parts = currentPath.split("/")
      const courseId = parts[3]
      const lessonId = parts[5]
      return <CourseWatchPage courseId={courseId} lessonId={lessonId} />
    }
    if (currentPath.startsWith("/dashboard/courses/") && currentPath.endsWith("/exercises")) {
      const courseId = currentPath.split("/")[3]
      return <CourseExercisesPage courseId={courseId} />
    }
    if (currentPath.startsWith("/dashboard/courses/") && currentPath.includes("/exercises/")) {
      const parts = currentPath.split("/")
      const courseId = parts[3]
      const exerciseId = parts[5]
      return <CourseExercisePage courseId={courseId} exerciseId={exerciseId} />
    }
    if (currentPath.startsWith("/dashboard/courses/") && currentPath.endsWith("/quizzes")) {
      const courseId = currentPath.split("/")[3]
      return <CourseQuizzesPage courseId={courseId} />
    }
    if (currentPath.startsWith("/dashboard/courses/") && currentPath.includes("/quizzes/")) {
      const parts = currentPath.split("/")
      const courseId = parts[3]
      const quizId = parts[5]
      return <CourseQuizPage courseId={courseId} quizId={quizId} />
    }
    if (currentPath.startsWith("/dashboard/courses/") && currentPath.endsWith("/projects")) {
      const courseId = currentPath.split("/")[3]
      return <CourseProjectsPage courseId={courseId} />
    }
    if (currentPath.startsWith("/dashboard/courses/") && currentPath.includes("/projects/")) {
      const parts = currentPath.split("/")
      const courseId = parts[3]
      const projectId = parts[5]
      return <CourseProjectPage courseId={courseId} projectId={projectId} />
    }
    if (currentPath.startsWith("/dashboard/courses/") && currentPath.endsWith("/playgrounds")) {
      const courseId = currentPath.split("/")[3]
      return <CoursePlaygroundsPage courseId={courseId} />
    }
    if (currentPath.startsWith("/dashboard/courses/") && currentPath.includes("/playgrounds/")) {
      const parts = currentPath.split("/")
      const courseId = parts[3]
      const playgroundId = parts[5]
      return <CoursePlaygroundPage courseId={courseId} playgroundId={playgroundId} />
    }
    if (currentPath.startsWith("/dashboard/courses/") && currentPath.endsWith("/certificate")) {
      const courseId = currentPath.split("/")[3]
      return <CourseCertificatePage courseId={courseId} />
    }
    if (currentPath.startsWith("/dashboard/courses/")) {
      const courseId = currentPath.split("/")[3]
      return <CourseDetailPage courseId={courseId} />
    }

    // Projects
    if (currentPath === routes.projects) {
      return <ProjectsPage />
    }
    if (currentPath.startsWith("/dashboard/projects/")) {
      const projectId = currentPath.split("/")[3]
      return <ProjectDetailPage projectId={projectId} />
    }

    // Interviews
    if (currentPath === routes.interviews) {
      return <InterviewsPage />
    }
    if (currentPath.startsWith("/dashboard/interviews/") && currentPath.includes("/algorithm/editor")) {
      const interviewId = currentPath.split("/")[3]
      return <InterviewAlgorithmEditorPage interviewId={interviewId} />
    }
    if (currentPath.startsWith("/dashboard/interviews/") && currentPath.includes("/algorithm")) {
      const interviewId = currentPath.split("/")[3]
      return <InterviewAlgorithmPage interviewId={interviewId} />
    }
    if (currentPath.startsWith("/dashboard/interviews/") && currentPath.includes("/project/editor")) {
      const interviewId = currentPath.split("/")[3]
      return <InterviewProjectEditorPage interviewId={interviewId} />
    }
    if (currentPath.startsWith("/dashboard/interviews/") && currentPath.includes("/project")) {
      const interviewId = currentPath.split("/")[3]
      return <InterviewProjectPage interviewId={interviewId} />
    }
    if (currentPath.startsWith("/dashboard/interviews/") && currentPath.includes("/results")) {
      const interviewId = currentPath.split("/")[3]
      return <InterviewResultsPage interviewId={interviewId} />
    }
    if (currentPath.startsWith("/dashboard/interviews/")) {
      const interviewId = currentPath.split("/")[3]
      return <InterviewDetailPage interviewId={interviewId} />
    }

    // Mock Interviews
    if (currentPath === routes.mockInterviews) {
      return <MockInterviewsPage />
    }
    if (currentPath.startsWith("/dashboard/mock-interviews/") && currentPath.includes("/session")) {
      const sessionId = currentPath.split("/")[3]
      return <MockInterviewSession sessionId={sessionId} />
    }
    if (currentPath.startsWith("/dashboard/mock-interviews/") && currentPath.includes("/results")) {
      const sessionId = currentPath.split("/")[3]
      return <MockInterviewResults sessionId={sessionId} />
    }

    // Project30
    if (currentPath === routes.project30) {
      return <Project30Page />
    }
    if (currentPath === "/dashboard/project30/listing") {
      return <Project30ListingPage />
    }
    if (currentPath === "/dashboard/project30/community") {
      return <Project30CommunityPage />
    }
    if (currentPath === "/dashboard/project30/leaderboard") {
      return <Project30LeaderboardPage />
    }
    if (currentPath.startsWith("/dashboard/project30/day/")) {
      const dayNumber = currentPath.split("/")[4]
      return <Project30DayPage dayNumber={Number.parseInt(dayNumber)} />
    }

    // Community
    if (currentPath === routes.community) {
      return <CommunityPage />
    }

    // Bootcamps
    if (currentPath === routes.bootcamps) {
      return <BootcampsPage />
    }
    if (currentPath === "/dashboard/bootcamps/dashboard") {
      return <BootcampDashboardPage />
    }
    if (currentPath.startsWith("/dashboard/bootcamps/") && currentPath.includes("/week/")) {
      const parts = currentPath.split("/")
      const bootcampId = parts[3]
      const weekNumber = parts[5]
      return <BootcampWeekPage bootcampId={bootcampId} weekNumber={Number.parseInt(weekNumber)} />
    }
    if (currentPath.startsWith("/dashboard/bootcamps/")) {
      const bootcampId = currentPath.split("/")[3]
      return <BootcampDetailPage bootcampId={bootcampId} />
    }

    // Learning Paths
    if (currentPath === routes.paths) {
      return <LearningPathsPage />
    }
    if (currentPath.startsWith("/dashboard/paths/") && currentPath.includes("/continue")) {
      const pathId = currentPath.split("/")[3]
      return <LearningPathContinuePage pathId={pathId} />
    }
    if (currentPath.startsWith("/dashboard/paths/") && currentPath.includes("/content/")) {
      const parts = currentPath.split("/")
      const pathId = parts[3]
      const contentId = parts[5]
      return <PathContentWatchPage pathId={pathId} contentId={contentId} />
    }
    if (currentPath.startsWith("/dashboard/paths/")) {
      const pathId = currentPath.split("/")[3]
      return <LearningPathDetailPage pathId={pathId} />
    }

    // Roadmaps
    if (currentPath === routes.roadmaps) {
      return <RoadmapsPage />
    }
    if (
      currentPath.startsWith("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.endsWith("/preview")
    ) {
      const parts = currentPath.split("/")
      const roadmapId = parts[3]
      const courseId = parts[5]
      return <RoadmapCoursePreviewPage roadmapId={roadmapId} courseId={courseId} />
    }
    if (
      currentPath.startsWith("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.includes("/watch/")
    ) {
      const parts = currentPath.split("/")
      const roadmapId = parts[3]
      const courseId = parts[5]
      const lessonId = parts[7]
      return <RoadmapCourseWatchPage roadmapId={roadmapId} courseId={courseId} lessonId={lessonId} />
    }
    if (
      currentPath.startsWith("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.endsWith("/exercises")
    ) {
      const parts = currentPath.split("/")
      const roadmapId = parts[3]
      const courseId = parts[5]
      return <RoadmapCourseExercisesPage roadmapId={roadmapId} courseId={courseId} />
    }
    if (
      currentPath.startsWith("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.includes("/exercises/")
    ) {
      const parts = currentPath.split("/")
      const roadmapId = parts[3]
      const courseId = parts[5]
      const exerciseId = parts[7]
      return <RoadmapCourseExercisePage roadmapId={roadmapId} courseId={courseId} exerciseId={exerciseId} />
    }
    if (
      currentPath.startsWith("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.endsWith("/quizzes")
    ) {
      const parts = currentPath.split("/")
      const roadmapId = parts[3]
      const courseId = parts[5]
      return <RoadmapCourseQuizzesPage roadmapId={roadmapId} courseId={courseId} />
    }
    if (
      currentPath.startsWith("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.includes("/quizzes/")
    ) {
      const parts = currentPath.split("/")
      const roadmapId = parts[3]
      const courseId = parts[5]
      const quizId = parts[7]
      return <RoadmapCourseQuizPage roadmapId={roadmapId} courseId={courseId} quizId={quizId} />
    }
    if (
      currentPath.startsWith("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.endsWith("/projects")
    ) {
      const parts = currentPath.split("/")
      const roadmapId = parts[3]
      const courseId = parts[5]
      return <RoadmapCourseProjectsPage roadmapId={roadmapId} courseId={courseId} />
    }
    if (
      currentPath.startsWith("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.includes("/projects/")
    ) {
      const parts = currentPath.split("/")
      const roadmapId = parts[3]
      const courseId = parts[5]
      const projectId = parts[7]
      return <RoadmapCourseProjectPage roadmapId={roadmapId} courseId={courseId} projectId={projectId} />
    }
    if (
      currentPath.startsWith("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.endsWith("/playgrounds")
    ) {
      const parts = currentPath.split("/")
      const roadmapId = parts[3]
      const courseId = parts[5]
      return <RoadmapCoursePlaygroundsPage roadmapId={roadmapId} courseId={courseId} />
    }
    if (
      currentPath.startsWith("/dashboard/roadmaps/") &&
      currentPath.includes("/courses/") &&
      currentPath.includes("/playgrounds/")
    ) {
      const parts = currentPath.split("/")
      const roadmapId = parts[3]
      const courseId = parts[5]
      const playgroundId = parts[7]
      return <RoadmapCoursePlaygroundPage roadmapId={roadmapId} courseId={courseId} playgroundId={playgroundId} />
    }
    if (currentPath.startsWith("/dashboard/roadmaps/") && currentPath.includes("/watch/")) {
      const parts = currentPath.split("/")
      const roadmapId = parts[3]
      const videoId = parts[5]
      return <RoadmapVideoWatchPage roadmapId={roadmapId} videoId={videoId} />
    }
    if (currentPath.startsWith("/dashboard/roadmaps/") && currentPath.includes("/watch")) {
      const roadmapId = currentPath.split("/")[3]
      return <RoadmapWatchPage roadmapId={roadmapId} />
    }
    if (currentPath.startsWith("/dashboard/roadmaps/")) {
      const roadmapId = currentPath.split("/")[3]
      return <RoadmapDetailPage roadmapId={roadmapId} />
    }

    // Lands
    if (currentPath === routes.lands) {
      return <LandsPage />
    }
    if (
      currentPath.startsWith("/dashboard/lands/") &&
      currentPath.includes("/stages/") &&
      currentPath.includes("/challenges/") &&
      currentPath.includes("/coding")
    ) {
      const parts = currentPath.split("/")
      const landId = parts[3]
      const stageId = parts[5]
      const challengeId = parts[7]
      return <CodingChallengePage landId={landId} stageId={stageId} challengeId={challengeId} />
    }
    if (
      currentPath.startsWith("/dashboard/lands/") &&
      currentPath.includes("/stages/") &&
      currentPath.includes("/challenges/") &&
      currentPath.includes("/quiz")
    ) {
      const parts = currentPath.split("/")
      const landId = parts[3]
      const stageId = parts[5]
      const challengeId = parts[7]
      return <QuizChallengePage landId={landId} stageId={stageId} challengeId={challengeId} />
    }
    if (
      currentPath.startsWith("/dashboard/lands/") &&
      currentPath.includes("/stages/") &&
      currentPath.includes("/challenges/") &&
      currentPath.includes("/puzzle")
    ) {
      const parts = currentPath.split("/")
      const landId = parts[3]
      const stageId = parts[5]
      const challengeId = parts[7]
      return <PuzzleChallengePage landId={landId} stageId={stageId} challengeId={challengeId} />
    }
    if (
      currentPath.startsWith("/dashboard/lands/") &&
      currentPath.includes("/stages/") &&
      currentPath.includes("/challenges/") &&
      currentPath.includes("/debug")
    ) {
      const parts = currentPath.split("/")
      const landId = parts[3]
      const stageId = parts[5]
      const challengeId = parts[7]
      return <DebugChallengePage landId={landId} stageId={stageId} challengeId={challengeId} />
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
      return <ChallengeDetailPage landId={landId} stageId={stageId} challengeId={challengeId} />
    }
    if (currentPath.startsWith("/dashboard/lands/") && currentPath.includes("/stages/")) {
      const parts = currentPath.split("/")
      const landId = parts[3]
      const stageId = parts[5]
      return <StageDetailPage landId={landId} stageId={stageId} />
    }
    if (currentPath.startsWith("/dashboard/lands/")) {
      const landId = currentPath.split("/")[3]
      return <LandDetailPage landId={landId} />
    }

    // Profile and Settings
    if (currentPath === routes.profile) {
      return <ProfilePage />
    }
    if (currentPath === routes.settings) {
      return <SettingsPage />
    }

    // Subscription and Billing
    if (currentPath === routes.subscriptionManagement) {
      return <SubscriptionManagementPage />
    }
    if (currentPath === routes.subscriptionPlans) {
      return <SubscriptionPlansPage />
    }
    if (currentPath === routes.xpStore) {
      return <XPRedemptionPage />
    }
    if (currentPath === routes.checkout) {
      return <CheckoutPage />
    }

    // Default fallback
    return <DashboardContent />
  }

  return (
    <DashboardLayout currentPath={currentPath} onNavigate={handleNavigate}>
      {renderContent()}
    </DashboardLayout>
  )
}
