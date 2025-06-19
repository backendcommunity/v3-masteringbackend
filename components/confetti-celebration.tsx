"use client"

import { useEffect, useRef } from "react"
import { soundManager } from "@/lib/sound-manager"
import { createFallbackConfetti } from "@/lib/confetti-fallback"

interface ConfettiCelebrationProps {
  isVisible: boolean
  onComplete: () => void
  courseName: string
  celebrationType?: "enrollment" | "completion" | "achievement"
  duration?: number
  colors?: string[]
}

export function ConfettiCelebration({
  isVisible,
  onComplete,
  courseName,
  celebrationType = "enrollment",
  duration = 5000,
  colors,
}: ConfettiCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!isVisible) return

    let confetti: any = null
    let myConfetti: any = null

    // Try to import canvas-confetti dynamically
    const loadConfetti = async () => {
      try {
        const confettiModule = await import("canvas-confetti")
        confetti = confettiModule.default
      } catch (error) {
        console.warn("Canvas-confetti not available, using fallback")
        createFallbackConfetti()
        return
      }

      const canvas = canvasRef.current
      if (!canvas || !confetti) return

      myConfetti = confetti.create(canvas, {
        resize: true,
        useWorker: true,
      })

      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 0,
      }

      const intervals: NodeJS.Timeout[] = []

      const party = () => {
        myConfetti({
          ...defaults,
          particleCount: 50,
          angle: 60,
          origin: { x: 0, y: 0.7 },
          colors: colors || ["#13AECE", "#F2C94C", "#27AE60"],
        })
        myConfetti({
          ...defaults,
          particleCount: 50,
          angle: 120,
          origin: { x: 1, y: 0.7 },
          colors: colors || ["#13AECE", "#F2C94C", "#27AE60"],
        })
      }

      // Start the party!
      party()
      intervals.push(setInterval(party, 200))

      // Cleanup function
      return () => {
        intervals.forEach((interval) => clearInterval(interval))
        if (myConfetti) {
          myConfetti.reset()
        }
      }
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

    const cleanup = loadConfetti()

    // Auto-complete after duration
    const timeout = setTimeout(() => {
      onComplete()
    }, duration)

    return () => {
      clearTimeout(timeout)
      cleanup.then((cleanupFn) => {
        if (cleanupFn) cleanupFn()
      })
    }
  }, [isVisible, celebrationType, duration, colors, onComplete])

  if (!isVisible) return null

  return (
    <>
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
      {/* Celebration Modal */}
      <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 text-center animate-in zoom-in-95 duration-300">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Congratulations!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            You've successfully enrolled in <strong>{courseName}</strong>!
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Your learning journey begins now. Let's build something amazing together!
          </p>
          <button
            onClick={onComplete}
            className="bg-[#13AECE] hover:bg-[#0F8BA8] text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Start Learning
          </button>
        </div>
      </div>
    </>
  )
}

export default ConfettiCelebration
