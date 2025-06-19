"use client"

import type React from "react"

import { useState, useCallback } from "react"
import ConfettiCelebration from "./confetti-celebration"
import { soundManager } from "@/lib/sound-manager"

interface CelebrationEvent {
  type: "enrollment" | "completion" | "achievement" | "milestone"
  title: string
  message: string
  courseName?: string
  achievementName?: string
  xpEarned?: number
}

interface CelebrationSystemProps {
  children: React.ReactNode
}

export function CelebrationSystem({ children }: CelebrationSystemProps) {
  const [currentCelebration, setCurrentCelebration] = useState<CelebrationEvent | null>(null)

  const triggerCelebration = useCallback((event: CelebrationEvent) => {
    setCurrentCelebration(event)
  }, [])

  const hideCelebration = useCallback(() => {
    setCurrentCelebration(null)
  }, [])

  const getCelebrationColors = (type: CelebrationEvent["type"]) => {
    switch (type) {
      case "enrollment":
        return ["#13AECE", "#F2C94C", "#27AE60"]
      case "completion":
        return ["#27AE60", "#2ECC71", "#58D68D"]
      case "achievement":
        return ["#F2C94C", "#F39C12", "#E67E22"]
      case "milestone":
        return ["#9B59B6", "#8E44AD", "#BB8FCE"]
      default:
        return ["#13AECE", "#F2C94C", "#27AE60"]
    }
  }

  return (
    <>
      {children}
      {currentCelebration && (
        <ConfettiCelebration
          isVisible={true}
          onComplete={hideCelebration}
          courseName={currentCelebration.courseName || ""}
          celebrationType={currentCelebration.type === "milestone" ? "achievement" : currentCelebration.type}
          colors={getCelebrationColors(currentCelebration.type)}
        />
      )}
    </>
  )
}

// Hook for using celebrations
export function useCelebrations() {
  const triggerEnrollmentCelebration = useCallback((courseName: string) => {
    const event: CelebrationEvent = {
      type: "enrollment",
      title: "Welcome to Your New Course!",
      message: `You've successfully enrolled in ${courseName}. Let's start learning!`,
      courseName,
    }
    // This would be called through context in a real implementation
    console.log("Celebration triggered:", event)
  }, [])

  const triggerCompletionCelebration = useCallback((courseName: string, xpEarned: number) => {
    const event: CelebrationEvent = {
      type: "completion",
      title: "Course Completed! 🎉",
      message: `Congratulations! You've completed ${courseName} and earned ${xpEarned} XP!`,
      courseName,
      xpEarned,
    }
    soundManager.play("success", 0.8)
    console.log("Completion celebration:", event)
  }, [])

  const triggerAchievementCelebration = useCallback((achievementName: string, xpEarned: number) => {
    const event: CelebrationEvent = {
      type: "achievement",
      title: "Achievement Unlocked! 🏆",
      message: `You've earned the "${achievementName}" achievement and gained ${xpEarned} XP!`,
      achievementName,
      xpEarned,
    }
    soundManager.play("achievement", 0.6)
    console.log("Achievement celebration:", event)
  }, [])

  const triggerMilestoneCelebration = useCallback((milestone: string, courseName?: string) => {
    const event: CelebrationEvent = {
      type: "milestone",
      title: "Milestone Reached! 🎯",
      message: `Great progress! You've reached: ${milestone}`,
      courseName,
    }
    soundManager.play("achievement", 0.5)
    console.log("Milestone celebration:", event)
  }, [])

  return {
    triggerEnrollmentCelebration,
    triggerCompletionCelebration,
    triggerAchievementCelebration,
    triggerMilestoneCelebration,
  }
}
