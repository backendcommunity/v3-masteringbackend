"use client"

import { useEffect, useRef, useState } from "react"
import { soundManager } from "@/lib/sound-manager"

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
  colors = ["#13AECE", "#F2C94C", "#27AE60"],
}: ConfettiCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!isVisible) {
      setShowModal(false)
      return
    }

    setShowModal(true)

    // Play sound based on celebration type
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

    // Create simple confetti animation
    const createConfetti = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Set canvas size
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      const particles: Array<{
        x: number
        y: number
        vx: number
        vy: number
        color: string
        size: number
        rotation: number
        rotationSpeed: number
      }> = []

      // Create particles
      for (let i = 0; i < 100; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: -10,
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * 3 + 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 4,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
        })
      }

      let animationId: number

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        particles.forEach((particle, index) => {
          particle.x += particle.vx
          particle.y += particle.vy
          particle.vy += 0.1 // gravity
          particle.rotation += particle.rotationSpeed

          ctx.save()
          ctx.translate(particle.x, particle.y)
          ctx.rotate((particle.rotation * Math.PI) / 180)
          ctx.fillStyle = particle.color
          ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size)
          ctx.restore()

          // Remove particles that are off screen
          if (particle.y > canvas.height + 10) {
            particles.splice(index, 1)
          }
        })

        if (particles.length > 0) {
          animationId = requestAnimationFrame(animate)
        }
      }

      animate()

      return () => {
        if (animationId) {
          cancelAnimationFrame(animationId)
        }
      }
    }

    const cleanup = createConfetti()

    // Auto-complete after duration
    const timeout = setTimeout(() => {
      setShowModal(false)
      setTimeout(onComplete, 300) // Allow modal to fade out
    }, duration)

    return () => {
      clearTimeout(timeout)
      if (cleanup) cleanup()
    }
  }, [isVisible, celebrationType, duration, colors, onComplete, courseName])

  if (!isVisible) return null

  return (
    <>
      {/* Canvas for confetti */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[1000]"
        style={{
          width: "100%",
          height: "100%",
        }}
      />

      {/* Celebration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-black/20">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 text-center transform transition-all duration-300 scale-100 opacity-100">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
              {celebrationType === "enrollment" && "Welcome to Your Course!"}
              {celebrationType === "completion" && "Course Completed!"}
              {celebrationType === "achievement" && "Achievement Unlocked!"}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {celebrationType === "enrollment" && (
                <>
                  You've successfully enrolled in <strong>{courseName}</strong>!
                </>
              )}
              {celebrationType === "completion" && (
                <>
                  Congratulations on completing <strong>{courseName}</strong>!
                </>
              )}
              {celebrationType === "achievement" && (
                <>
                  You've unlocked a new achievement in <strong>{courseName}</strong>!
                </>
              )}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {celebrationType === "enrollment" && "Your learning journey begins now. Let's build something amazing!"}
              {celebrationType === "completion" && "You've mastered new skills. Keep up the great work!"}
              {celebrationType === "achievement" && "Your dedication is paying off. Keep learning!"}
            </p>
            <button
              onClick={() => {
                setShowModal(false)
                setTimeout(onComplete, 300)
              }}
              className="bg-[#13AECE] hover:bg-[#0F8BA8] text-white px-6 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#13AECE] focus:ring-offset-2"
            >
              {celebrationType === "enrollment" && "Start Learning"}
              {celebrationType === "completion" && "Continue Journey"}
              {celebrationType === "achievement" && "Keep Going"}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default ConfettiCelebration
