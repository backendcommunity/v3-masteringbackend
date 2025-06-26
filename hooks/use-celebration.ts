"use client"

import { useState, useCallback, useRef } from "react"

interface CelebrationState {
  isVisible: boolean
  courseName: string
  courseId: string
  celebrationType: "enrollment" | "completion" | "achievement"
}

export function useCelebration() {
  const [celebration, setCelebration] = useState<CelebrationState>({
    isVisible: false,
    courseName: "",
    courseId: "",
    celebrationType: "enrollment",
  })

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const triggerCelebration = useCallback(
    (courseName: string, courseId: string, type: "enrollment" | "completion" | "achievement" = "enrollment") => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      setCelebration({
        isVisible: true,
        courseName,
        courseId,
        celebrationType: type,
      })
    },
    [],
  )

  const hideCelebration = useCallback(() => {
    setCelebration((prev) => ({
      ...prev,
      isVisible: false,
    }))

    // Clear timeout when manually hiding
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  return {
    celebration,
    triggerCelebration,
    hideCelebration,
  }
}
