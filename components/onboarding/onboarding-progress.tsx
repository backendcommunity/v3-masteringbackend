"use client";

import { Check } from "lucide-react";

const STEPS = ["Welcome", "Experience", "Language", "Goal", "Time"];

interface OnboardingProgressProps {
  currentStep: number; // 0-4
}

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  return (
    <div className="mb-8">
      <div
        className="flex gap-2"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-label={`Step ${currentStep + 1} of ${STEPS.length}: ${STEPS[currentStep]}`}
      >
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1 flex items-center gap-2">
            {/* Step Badge */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-xs transition-all"
              style={{
                background:
                  i < currentStep
                    ? "#22c55e"
                    : i === currentStep
                    ? "hsl(var(--primary))"
                    : "#374151",
                color: i === currentStep || i < currentStep ? "#fff" : "#9CA3AF",
              }}
            >
              {i < currentStep ? (
                <Check className="w-4 h-4" />
              ) : (
                i + 1
              )}
            </div>
            {/* Progress Line */}
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-1 rounded-full"
                style={{
                  background:
                    i < currentStep ? "#22c55e" : "#374151",
                }}
              />
            )}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 6, textAlign: "center" }}>
        Step {currentStep + 1} of {STEPS.length} · {STEPS[currentStep]}
      </div>
    </div>
  );
}
