"use client";

import { BookOpen, Hammer, Briefcase, Rocket } from "lucide-react";
import { OnboardingProgress } from "./onboarding-progress";
import { OnboardingOptionCard } from "./onboarding-option-card";
import type { LearningGoal } from "@/lib/data";

const OPTIONS: {
  value: LearningGoal;
  icon: typeof BookOpen;
  title: string;
  description: string;
  points: number;
  color: string;
}[] = [
  {
    value: "fundamentals",
    icon: BookOpen,
    title: "Learn Backend Fundamentals",
    description:
      "Structured courses from HTTP to databases to deployment.",
    points: 500,
    color: "bg-primary",
  },
  {
    value: "projects",
    icon: Hammer,
    title: "Build Real Projects",
    description:
      "Hands-on project-based learning with real-world applications.",
    points: 750,
    color: "bg-green-500",
  },
  {
    value: "interviews",
    icon: Briefcase,
    title: "Prepare for Interviews",
    description:
      "Mock interviews, system design, and coding challenges.",
    points: 600,
    color: "bg-purple-500",
  },
  {
    value: "advanced",
    icon: Rocket,
    title: "Level Up My Skills",
    description:
      "Advanced topics: microservices, DevOps, performance, architecture.",
    points: 1000,
    color: "bg-orange-500",
  },
];

interface OnboardingGoalProps {
  value: LearningGoal | null;
  onChange: (value: LearningGoal) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function OnboardingGoal({
  value,
  onChange,
  onContinue,
  onBack,
  onSkip,
}: OnboardingGoalProps) {
  return (
    <div>
      <OnboardingProgress currentStep={3} />

      <h1
        className="font-extrabold mb-2"
        style={{ fontSize: 22, color: "#FFFFFF" }}
      >
        What brings you to Masteringbackend?
      </h1>
      <p className="mb-5" style={{ fontSize: 14, color: "#9CA3AF" }}>
        Pick your primary goal. You can always explore other paths later.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              badge={`+${opt.points} MB`}
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
