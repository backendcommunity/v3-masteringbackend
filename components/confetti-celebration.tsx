"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import confetti from "canvas-confetti"
import { soundManager } from "@/lib/sound-manager"

interface ConfettiCelebrationProps {
  isVisible: boolean
  onComplete: () => void
  courseName: string
  celebrationType?: "enrollment" | "completion" | "achievement"
  duration?: number
  colors?: string[]
}

const ConfettiCelebration: React.FC<ConfettiCelebrationProps> = ({
  isVisible,
  onComplete,
  courseName,
  celebrationType = "enrollment",
  duration = 5000,
  colors,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    if (!isVisible) return

    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    })

    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 0,
    }

    const getAnimationEnd = () => {
      return Date.now() + duration
    }

    const interval: NodeJS.Timeout[] = []

    const party = () => {
      myConfetti({
        ...defaults,
        particleCount: 50,
        angle: 60,
        origin: { x: 0, y: 0.7 },
        colors: colors,
      })
      myConfetti({
        ...defaults,
        particleCount: 50,
        angle: 120,
        origin: { x: 1, y: 0.7 },
        colors: colors,
      })
    }

    // Play different sounds based on celebration type
    switch (celebrationType) {
      case "enrollment":
        soundManager.play("celebration", 0.7)
        break
      case "completion":
        soundManager.play("success", 0.8)
        break
      case "achievement":
        soundManager.play("achievement", 0.6)
        break
    }

    interval.push(setInterval(party, 200))

    return () => {
      interval.forEach((i) => clearInterval(i))
      myConfetti.reset()
    }
  }, [isVisible, celebrationType, duration, colors])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        pointerEvents: "none",
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
        zIndex: 1000,
      }}
    />
  )
}

export default ConfettiCelebration
