"use client";

import type React from "react";
import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { soundManager } from "@/lib/sound-manager";

interface ConfettiCelebrationProps {
  isVisible: boolean;
  onComplete: () => void;
  courseName: string;
  celebrationType?: "enrollment" | "completion" | "achievement" | "milestone";
  duration?: number;
  colors?: string[];
}

const ConfettiCelebration: React.FC<ConfettiCelebrationProps> = ({
  isVisible,
  onComplete,
  courseName,
  celebrationType = "enrollment",
  duration = 4000,
  colors,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    if (!isVisible) return;

    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    });

    const defaults = {
      startVelocity: 80,
      spread: 360,
      ticks: 60,
      zIndex: 0,
    };

    const interval: NodeJS.Timeout[] = [];

    const party = () => {
      myConfetti({
        ...defaults,
        particleCount: 100,
        angle: 120,
        origin: { x: 0.9, y: 0.9 },
        colors: getCelebrationColors(celebrationType),
      });
    };

    const getCelebrationColors = (
      type: ConfettiCelebrationProps["celebrationType"]
    ) => {
      switch (type) {
        case "enrollment":
          return ["#13AECE", "#F2C94C", "#27AE60"];
        case "completion":
          return ["#27AE60", "#2ECC71", "#58D68D"];
        case "achievement":
          return ["#F2C94C", "#F39C12", "#E67E22"];
        case "milestone":
          return ["#9B59B6", "#8E44AD", "#BB8FCE"];
        default:
          return ["#13AECE", "#F2C94C", "#27AE60"];
      }
    };

    // Play different sounds based on celebration type
    switch (celebrationType) {
      case "enrollment":
        soundManager.play("enrollment", 0.5);
        break;
      case "completion":
        soundManager.play("success", 0.8);
        break;
      case "achievement":
        soundManager.play("achievement", 0.6);
        break;
    }

    const intervalId = setInterval(party, 200);
    interval.push(intervalId);

    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      myConfetti.reset();
      onComplete();
    }, duration);

    return () => {
      interval.forEach((i) => {
        clearInterval(i);
        clearTimeout(timeoutId);
      });
      myConfetti.reset();
    };
  }, [isVisible, celebrationType, duration, colors]);

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
  );
};

export default ConfettiCelebration;
