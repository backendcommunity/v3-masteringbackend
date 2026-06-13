"use client";

import { Sprout, Zap, Crown } from "lucide-react";
import { OnboardingProgress } from "./onboarding-progress";
import { OnboardingOptionCard } from "./onboarding-option-card";
import type { ExperienceLevel } from "@/lib/data";

const OPTIONS: {
  value: ExperienceLevel;
  icon: typeof Sprout;
  title: string;
  description: string;
  level: string;
  color: string;
}[] = [
  {
    value: "beginner",
    icon: Sprout,
    title: "Just Getting Started",
    description:
      "I'm new to backend development or programming in general. I want to learn the fundamentals.",
    level: "Level 1 - Apprentice",
    color: "bg-primary",
  },
  {
    value: "intermediate",
    icon: Zap,
    title: "I Know the Basics",
    description:
      "I've built simple APIs or followed tutorials. Ready to level up with real-world skills.",
    level: "Level 2 - Engineer",
    color: "bg-purple-500",
  },
  {
    value: "advanced",
    icon: Crown,
    title: "Experienced Developer",
    description:
      "I build production systems professionally. Looking for advanced patterns and mastery.",
    level: "Level 3 - Architect",
    color: "bg-amber-500",
  },
];

interface OnboardingExperienceProps {
  value: ExperienceLevel | null;
  onChange: (value: ExperienceLevel) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function OnboardingExperience({
  value,
  onChange,
  onContinue,
  onBack,
  onSkip,
}: OnboardingExperienceProps) {
  return (
    <div>
      <OnboardingProgress currentStep={1} />

      <h1
        className="font-extrabold mb-2"
        style={{ fontSize: 22, color: "#FFFFFF" }}
      >
        Where are you in your backend journey?
      </h1>
      <p className="mb-5" style={{ fontSize: 14, color: "#9CA3AF" }}>
        This helps us recommend the right starting point.
      </p>

      <div className="flex flex-col gap-3">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <OnboardingOptionCard
              key={opt.value}
              icon={<Icon className="w-6 h-6" />}
              title={opt.title}
              description={opt.description}
              selected={value === opt.value}
              onClick={() => onChange(opt.value)}
              badge={opt.level}
              badgeColor={opt.color}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={onBack}
          className="font-semibold rounded-lg px-5 py-3"
          style={{ color: "#9CA3AF", fontSize: 14 }}
        >
          &larr; Back
        </button>
        <button
          onClick={onContinue}
          disabled={!value}
          className="flex-1 font-bold rounded-lg py-3 transition-all"
          style={{
            background: value ? "hsl(var(--primary))" : "rgba(19, 174, 206, 0.3)",
            color: "#FFFFFF",
            fontSize: 16,
            cursor: value ? "pointer" : "not-allowed",
            opacity: value ? 1 : 0.5,
          }}
        >
          Continue &rarr;
        </button>
      </div>

      <button
        onClick={onSkip}
        className="block mx-auto mt-3 underline"
        style={{ fontSize: 12, color: "#6B7280" }}
      >
        Skip for now
      </button>
    </div>
  );
}
