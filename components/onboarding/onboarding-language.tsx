"use client";

import { Code2, Coffee } from "lucide-react";
import { OnboardingProgress } from "./onboarding-progress";
import { OnboardingOptionCard } from "./onboarding-option-card";
import type { ProgrammingLanguage } from "@/lib/data";

const OPTIONS: {
  value: ProgrammingLanguage;
  icon: typeof Code2;
  title: string;
  description: string;
  emoji: string;
  color: string;
}[] = [
  {
    value: "PYTHON",
    icon: Code2,
    title: "Python",
    description:
      "Popular for ML, data science, and rapid backend development.",
    emoji: "🐍",
    color: "bg-primary",
  },
  {
    value: "JAVA",
    icon: Code2,
    title: "Java",
    description: "Enterprise-grade backend development with strong typing.",
    emoji: "☕",
    color: "bg-orange-500",
  },
  {
    value: "NODEJS",
    icon: Code2,
    title: "Node.js",
    description: "JavaScript runtime for full-stack development.",
    emoji: "⚡",
    color: "bg-green-500",
  },
  {
    value: "RUST",
    icon: Code2,
    title: "Rust",
    description: "Performance and memory safety for systems programming.",
    emoji: "🦀",
    color: "bg-red-500",
  },
  {
    value: "RUBY",
    icon: Code2,
    title: "Ruby",
    description: "Developer productivity and elegant syntax.",
    emoji: "💎",
    color: "bg-pink-500",
  },
];

interface OnboardingLanguageProps {
  value: ProgrammingLanguage | null;
  onChange: (value: ProgrammingLanguage) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function OnboardingLanguage({
  value,
  onChange,
  onContinue,
  onBack,
  onSkip,
}: OnboardingLanguageProps) {
  return (
    <div>
      <OnboardingProgress currentStep={2} />

      <h1
        className="font-extrabold mb-2"
        style={{ fontSize: 22, color: "#FFFFFF" }}
      >
        Which programming language do you prefer?
      </h1>
      <p className="mb-5" style={{ fontSize: 14, color: "#9CA3AF" }}>
        We'll recommend courses and projects in your chosen language.
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
              badge={opt.emoji}
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
