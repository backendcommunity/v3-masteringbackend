"use client"

import { useState, useCallback } from "react"

interface CelebrationState {
  isVisible: boolean
  courseName: string
  courseId: string
}

export function useCelebration() {
  const [celebration, setCelebration] = useState<CelebrationState>({
    isVisible: false,
    courseName: "",
    courseId: "",
  })

  const triggerCelebration = useCallback((courseName: string, courseId: string) => {
    setCelebration({
      isVisible: true,
      courseName,
      courseId,
    })
  }, [])

  const hideCelebration = useCallback(() => {
    setCelebration((prev) => ({
      ...prev,
      isVisible: false,
    }))
  }, [])

  return {
    celebration,
    triggerCelebration,
    hideCelebration,
  }
}
