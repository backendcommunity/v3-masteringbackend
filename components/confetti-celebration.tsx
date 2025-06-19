"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import confetti from "canvas-confetti"
import { soundManager } from "@/lib/sound-manager"

interface ConfettiCelebrationProps {
  duration?: number
  colors?: string[]
}

const ConfettiCelebration: React.FC<ConfettiCelebrationProps> = ({ duration = 5000, colors }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

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

    // Play celebration sound
    soundManager.play("celebration", 0.7)

    interval.push(setInterval(party, 200))

    return () => {
      interval.forEach((i) => clearInterval(i))
      myConfetti.reset()
    }
  }, [duration, colors])

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
