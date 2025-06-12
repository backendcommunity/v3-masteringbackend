"use client"

import { useState, useEffect } from "react"
import {
  Play,
  Pause,
  CheckCircle,
  Users,
  Award,
  Briefcase,
  Video,
  Map,
  Target,
  Folder,
  Calendar,
  Globe,
  MessageCircle,
  Zap,
  Monitor,
  Trophy,
  Volume2,
  Maximize,
  Settings,
} from "lucide-react"

export function HeroVisual() {
  const [currentActivity, setCurrentActivity] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)

  // Define all activities in sequence
  const allActivities = [
    // LEARN Phase
    {
      phase: "Learn",
      icon: Video,
      title: "Taking Courses",
      description: "Sarah is watching Python Backend Fundamentals",
      visual: "course-video",
      duration: 1680, // 28 minutes
      currentTime: 765, // 12:45
    },
    {
      phase: "Learn",
      icon: Map,
      title: "Following Roadmaps",
      description: "Completing Backend Developer Roadmap",
      visual: "roadmap-progress",
      duration: 2400,
      currentTime: 1608,
    },
    {
      phase: "Learn",
      icon: Target,
      title: "Specialized Paths",
      description: "Mastering API Development Path",
      visual: "learning-path",
      duration: 1800,
      currentTime: 1404,
    },
    {
      phase: "Learn",
      icon: Zap,
      title: "Intensive Bootcamp",
      description: "Full-Stack Backend Bootcamp - Week 3",
      visual: "bootcamp-session",
      duration: 3600,
      currentTime: 3060,
    },

    // BUILD Phase
    {
      phase: "Build",
      icon: Folder,
      title: "MB Projects",
      description: "Building E-commerce API with authentication",
      visual: "coding-project",
      duration: 2700,
      currentTime: 1620,
    },
    {
      phase: "Build",
      icon: Calendar,
      title: "Project30 Challenge",
      description: "Day 15: Real-time Chat Application",
      visual: "challenge-coding",
      duration: 1500,
      currentTime: 750,
    },
    {
      phase: "Build",
      icon: Globe,
      title: "MB Lands Deployment",
      description: "Deploying portfolio to production",
      visual: "deployment",
      duration: 900,
      currentTime: 855,
    },

    // GROW Phase
    {
      phase: "Grow",
      icon: Briefcase,
      title: "MB Interviews Prep",
      description: "Practicing system design questions",
      visual: "interview-prep",
      duration: 2100,
      currentTime: 1680,
    },
    {
      phase: "Grow",
      icon: MessageCircle,
      title: "Mock Interview",
      description: "Live coding session with mentor",
      visual: "mock-interview",
      duration: 1800,
      currentTime: 1800,
    },
    {
      phase: "Grow",
      icon: Award,
      title: "Getting Certified",
      description: "Backend Development Certification earned!",
      visual: "certification",
      duration: 300,
      currentTime: 300,
    },
    {
      phase: "Grow",
      icon: Users,
      title: "Community Support",
      description: "Helping others and getting job referrals",
      visual: "community",
      duration: 1200,
      currentTime: 1200,
    },
  ]

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentActivity((prev) => (prev + 1) % allActivities.length)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [isPlaying])

  const currentActivityData = allActivities[currentActivity]
  const ActivityIcon = currentActivityData.icon

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progressPercentage = (currentActivityData.currentTime / currentActivityData.duration) * 100

  // Simple video-like content for each activity
  const renderVideoContent = (visualType: string) => {
    switch (visualType) {
      case "course-video":
        return (
          <div className="bg-gray-900 h-full flex items-center justify-center relative">
            <div className="text-center text-white">
              <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Python Backend Fundamentals</h3>
              <p className="text-gray-300">Lesson 12: Database Relationships</p>
            </div>
            <div className="absolute bottom-4 left-4 bg-black/50 px-2 py-1 rounded text-white text-sm">HD</div>
          </div>
        )

      case "roadmap-progress":
        return (
          <div className="bg-white h-full flex items-center justify-center p-8">
            <div className="w-full max-w-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Backend Developer Roadmap</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-900">Python Basics</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-900">Web Frameworks</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="w-5 h-5 border-2 border-blue-600 rounded-full animate-pulse" />
                  <span className="text-gray-900 font-medium">Database Design</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                  <span className="text-gray-500">API Development</span>
                </div>
              </div>
            </div>
          </div>
        )

      case "learning-path":
        return (
          <div className="bg-white h-full flex items-center justify-center p-8">
            <div className="w-full max-w-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">API Development Path</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-100 p-4 rounded-lg text-center border border-green-200">
                  <div className="text-sm font-medium text-gray-900 mb-2">REST APIs</div>
                  <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                </div>
                <div className="bg-blue-100 p-4 rounded-lg text-center border-2 border-blue-300">
                  <div className="text-sm font-medium text-gray-900 mb-2">GraphQL</div>
                  <div className="w-6 h-6 border-2 border-blue-600 rounded-full mx-auto animate-pulse" />
                </div>
                <div className="bg-gray-100 p-4 rounded-lg text-center border border-gray-200">
                  <div className="text-sm text-gray-500 mb-2">WebSockets</div>
                  <div className="w-6 h-6 border-2 border-gray-300 rounded-full mx-auto" />
                </div>
              </div>
            </div>
          </div>
        )

      case "bootcamp-session":
        return (
          <div className="bg-gray-900 h-full flex items-center justify-center relative">
            <div className="text-center text-white">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 font-medium">LIVE</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Full-Stack Backend Bootcamp</h3>
              <p className="text-gray-300 mb-4">Building microservices architecture</p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                <Users className="w-4 h-4" />
                <span>45 students online</span>
              </div>
            </div>
          </div>
        )

      case "coding-project":
        return (
          <div className="bg-gray-900 h-full flex items-center justify-center p-8">
            <div className="w-full max-w-md">
              <h3 className="text-xl font-semibold text-white mb-4 text-center">E-commerce API Project</h3>
              <div className="bg-black p-4 rounded-lg font-mono text-sm">
                <div className="text-green-400">POST /api/auth/login ✓</div>
                <div className="text-green-400">GET /api/products ✓</div>
                <div className="text-yellow-400 flex items-center">
                  <span className="animate-pulse mr-2">▶</span> POST /api/orders
                </div>
                <div className="text-gray-500">PUT /api/users/:id</div>
              </div>
              <div className="mt-4 text-center">
                <span className="text-white text-sm">Tests passing: 24/30</span>
              </div>
            </div>
          </div>
        )

      case "challenge-coding":
        return (
          <div className="bg-white h-full flex items-center justify-center p-8">
            <div className="w-full max-w-md text-center">
              <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm inline-block mb-4">
                Project30 - Day 15/30
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Real-time Chat Application</h3>
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Monitor className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">WebSocket connections: 127</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: "50%" }} />
                </div>
              </div>
            </div>
          </div>
        )

      case "deployment":
        return (
          <div className="bg-white h-full flex items-center justify-center p-8">
            <div className="w-full max-w-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Deploying to Production</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-900">Build successful</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-900">Tests passed</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-5 h-5 border-2 border-blue-600 rounded-full animate-pulse" />
                  <span className="text-gray-900">Deploying...</span>
                </div>
              </div>
            </div>
          </div>
        )

      case "interview-prep":
        return (
          <div className="bg-white h-full flex items-center justify-center p-8">
            <div className="w-full max-w-md text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">System Design Practice</h3>
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <p className="text-gray-700 font-medium mb-2">"Design a URL shortener like bit.ly"</p>
                <div className="text-sm text-gray-600">Drawing architecture diagram...</div>
              </div>
              <div className="text-sm text-gray-500">Time remaining: 15:42</div>
            </div>
          </div>
        )

      case "mock-interview":
        return (
          <div className="bg-gray-900 h-full flex items-center justify-center relative">
            <div className="text-center text-white">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400 font-medium">LIVE INTERVIEW</span>
              </div>
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">JD</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">John Doe</h3>
              <p className="text-gray-300 text-sm mb-4">Senior Engineer @ Google</p>
              <div className="bg-black/50 p-3 rounded-lg text-sm">
                "Great solution! Let's optimize the time complexity..."
              </div>
            </div>
          </div>
        )

      case "certification":
        return (
          <div className="bg-white h-full flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-yellow-800" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Certification Earned!</h3>
              <p className="text-gray-600 mb-4">Backend Development Professional</p>
              <div className="bg-gray-100 p-3 rounded-lg text-sm text-gray-700">Certificate ID: MB-2023-45678</div>
            </div>
          </div>
        )

      case "community":
        return (
          <div className="bg-white h-full flex items-center justify-center p-8">
            <div className="w-full max-w-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Community Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-900">Answered 3 questions today</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <Briefcase className="w-5 h-5 text-green-600" />
                  <span className="text-gray-900">Got job referral from Alex</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-900">Mentoring 2 junior developers</span>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl">
      {/* Video Content Area */}
      <div className="relative h-full">
        <div key={currentActivity} className="h-full">
          {renderVideoContent(currentActivityData.visual)}
        </div>

        {/* Three-Step Progress Bar */}
        <div className="absolute bottom-16 left-4 right-4">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm font-medium">Backend Engineer Transformation</span>
              <span className="text-white/70 text-xs">
                Step {currentActivity + 1} of {allActivities.length}
              </span>
            </div>

            {/* Progress Line */}
            <div className="relative">
              <div className="flex items-center justify-between">
                {/* Learn Phase */}
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      currentActivityData.phase === "Learn"
                        ? "bg-blue-500 border-blue-500 text-white"
                        : allActivities.slice(0, currentActivity).some((a) => a.phase === "Learn")
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "bg-white/20 border-white/40 text-white/60"
                    }`}
                  >
                    <span className="text-xs font-bold">1</span>
                  </div>
                  <span
                    className={`text-sm font-medium transition-colors duration-300 ${
                      currentActivityData.phase === "Learn" ? "text-white" : "text-white/70"
                    }`}
                  >
                    Learn
                  </span>
                </div>

                {/* Build Phase */}
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      currentActivityData.phase === "Build"
                        ? "bg-purple-500 border-purple-500 text-white"
                        : allActivities.slice(0, currentActivity).some((a) => a.phase === "Build")
                          ? "bg-purple-500 border-purple-500 text-white"
                          : "bg-white/20 border-white/40 text-white/60"
                    }`}
                  >
                    <span className="text-xs font-bold">2</span>
                  </div>
                  <span
                    className={`text-sm font-medium transition-colors duration-300 ${
                      currentActivityData.phase === "Build" ? "text-white" : "text-white/70"
                    }`}
                  >
                    Build
                  </span>
                </div>

                {/* Grow Phase */}
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      currentActivityData.phase === "Grow"
                        ? "bg-green-500 border-green-500 text-white"
                        : allActivities.slice(0, currentActivity).some((a) => a.phase === "Grow")
                          ? "bg-green-500 border-green-500 text-white"
                          : "bg-white/20 border-white/40 text-white/60"
                    }`}
                  >
                    <span className="text-xs font-bold">3</span>
                  </div>
                  <span
                    className={`text-sm font-medium transition-colors duration-300 ${
                      currentActivityData.phase === "Grow" ? "text-white" : "text-white/70"
                    }`}
                  >
                    Grow
                  </span>
                </div>
              </div>

              {/* Connecting Lines */}
              <div className="absolute top-4 left-8 right-8 h-0.5 bg-white/20">
                {/* Progress Line */}
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transition-all duration-500"
                  style={{
                    width: `${((currentActivity + 1) / allActivities.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Phase Description */}
            <div className="mt-3 text-center">
              <span className="text-white/80 text-xs">
                {currentActivityData.phase === "Learn" && "Master the fundamentals through structured learning"}
                {currentActivityData.phase === "Build" && "Apply knowledge with real-world projects"}
                {currentActivityData.phase === "Grow" && "Get job-ready and advance your career"}
              </span>
            </div>
          </div>
        </div>

        {/* Video Controls Overlay */}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-300 group">
          {/* Play/Pause Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-16 h-16 bg-black/70 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" />}
            </button>
          </div>

          {/* Video Controls Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="w-full bg-white/30 rounded-full h-1 cursor-pointer">
                <div
                  className="bg-white h-1 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-4">
                <button onClick={() => setIsPlaying(!isPlaying)}>
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <Volume2 className="w-5 h-5" />
                <div className="text-sm">
                  {formatTime(currentActivityData.currentTime)} / {formatTime(currentActivityData.duration)}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Settings className="w-5 h-5" />
                <Maximize className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Title Overlay */}
      <div className="absolute top-4 left-4 right-4">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <ActivityIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-sm">{currentActivityData.title}</div>
              <div className="text-white/70 text-xs">{currentActivityData.description}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Indicator */}
      <div className="absolute top-4 right-4">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
          <div className="text-white text-sm font-medium">{currentActivityData.phase}</div>
        </div>
      </div>

      {/* Video Timeline */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-1">
          {allActivities.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentActivity(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentActivity
                  ? "bg-white scale-125"
                  : index < currentActivity
                    ? "bg-white/70"
                    : "bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
