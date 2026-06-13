"use client";

import { Clock, Zap, Flame } from "lucide-react";
import { OnboardingProgress } from "./onboarding-progress";
import { OnboardingOptionCard } from "./onboarding-option-card";
import type { WeeklyCommitment } from "@/lib/data";

const OPTIONS: {
  value: WeeklyCommitment;
  icon: typeof Clock;
  title: string;
  description: string;
  multiplier: number;
  color: string;
}[] = [
  {
    value: "casual",
    icon: Clock,
    title: "1–3 hours",
    description: "Steady exploration. No rush.",
    multiplier: 1,
    color: "bg-primary",
  },
  {
    value: "steady",
    icon: Zap,
    title: "3–7 hours",
    description: "Consistent progress. Best for most.",
    multiplier: 1.5,
    color: "bg-purple-500",
  },
  {
    value: "intensive",
    icon: Flame,
    title: "7+ hours",
    description: "Maximum momentum & growth.",
    multiplier: 2,
    color: "bg-orange-500",
  },
];

interface OnboardingTimeProps {
  value: WeeklyCommitment | null;
  onChange: (value: WeeklyCommitment) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function OnboardingTime({
  value,
  onChange,
  onContinue,
  onBack,
  onSkip,
}: OnboardingTimeProps) {
  return (
    <div>
      <OnboardingProgress currentStep={4} />

      <h1
        className="font-extrabold mb-2"
        style={{ fontSize: 22, color: "#FFFFFF" }}
      >
        How much time can you invest each week?
      </h1>
      <p className="mb-5" style={{ fontSize: 14, color: "#9CA3AF" }}>
        No pressure — we&apos;ll adjust your pace to match your schedule.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              badge={`${opt.multiplier}x XP`}
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
            background: value ? "#13AECE" : "rgba(19, 174, 206, 0.3)",
            color: "#FFFFFF",
            fontSize: 16,
            cursor: value ? "pointer" : "not-allowed",
            opacity: value ? 1 : 0.5,
          }}
        >
          See My Learning Path &rarr;
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
