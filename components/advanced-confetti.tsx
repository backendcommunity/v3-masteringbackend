"use client"

import { useEffect, useRef } from "react"

interface AdvancedConfettiProps {
  isActive: boolean
  duration?: number
  particleCount?: number
  colors?: string[]
  shapes?: ("square" | "circle" | "triangle")[]
}

export function AdvancedConfetti({
  isActive,
  duration = 3000,
  particleCount = 100,
  colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"],
  shapes = ["square", "circle", "triangle"],
}: AdvancedConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!isActive) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    updateCanvasSize()

    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      color: string
      size: number
      rotation: number
      rotationSpeed: number
      gravity: number
      shape: string
      life: number
      maxLife: number
    }> = []

    // Create particles from multiple spawn points
    const spawnPoints = [
      { x: canvas.width * 0.2, y: -20 },
      { x: canvas.width * 0.5, y: -20 },
      { x: canvas.width * 0.8, y: -20 },
    ]

    spawnPoints.forEach((spawn) => {
      for (let i = 0; i < particleCount / spawnPoints.length; i++) {
        particles.push({
          x: spawn.x + (Math.random() - 0.5) * 100,
          y: spawn.y,
          vx: (Math.random() - 0.5) * 12,
          vy: Math.random() * 4 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 10 + 6,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 15,
          gravity: 0.15 + Math.random() * 0.1,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          life: 0,
          maxLife: duration + Math.random() * 1000,
        })
      }
    })

    const startTime = Date.now()
    let animationId: number

    const drawShape = (ctx: CanvasRenderingContext2D, shape: string, size: number) => {
      switch (shape) {
        case "circle":
          ctx.beginPath()
          ctx.arc(0, 0, size / 2, 0, Math.PI * 2)
          ctx.fill()
          break
        case "triangle":
          ctx.beginPath()
          ctx.moveTo(0, -size / 2)
          ctx.lineTo(-size / 2, size / 2)
          ctx.lineTo(size / 2, size / 2)
          ctx.closePath()
          ctx.fill()
          break
        default: // square
          ctx.fillRect(-size / 2, -size / 2, size, size)
      }
    }

    const animate = () => {
      const currentTime = Date.now()
      const elapsed = currentTime - startTime

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle, index) => {
        particle.life = elapsed

        // Update position
        particle.x += particle.vx
        particle.y += particle.vy
        particle.vy += particle.gravity
        particle.rotation += particle.rotationSpeed

        // Add air resistance
        particle.vx *= 0.99
        particle.vy *= 0.99

        // Calculate opacity based on life
        const lifeRatio = particle.life / particle.maxLife
        const opacity = Math.max(0, 1 - lifeRatio)

        if (opacity > 0) {
          // Draw particle
          ctx.save()
          ctx.translate(particle.x, particle.y)
          ctx.rotate((particle.rotation * Math.PI) / 180)
          ctx.globalAlpha = opacity
          ctx.fillStyle = particle.color
          drawShape(ctx, particle.shape, particle.size)
          ctx.restore()
        }

        // Remove dead particles
        if (particle.life > particle.maxLife || particle.y > canvas.height + 50) {
          particles.splice(index, 1)
        }
      })

      if (particles.length > 0 && elapsed < duration + 2000) {
        animationId = requestAnimationFrame(animate)
      }
    }

    animate()

    // Handle window resize
    const handleResize = () => updateCanvasSize()
    window.addEventListener("resize", handleResize)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      window.removeEventListener("resize", handleResize)
    }
  }, [isActive, duration, particleCount, colors, shapes])

  if (!isActive) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-40"
      style={{ background: "transparent" }}
    />
  )
}
