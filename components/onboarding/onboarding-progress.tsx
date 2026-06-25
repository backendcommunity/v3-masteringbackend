"use client";

const STEPS = ["Welcome", "Experience", "Language", "Goal", "Time"];

interface OnboardingProgressProps {
  currentStep: number; // 0-4
}

/**
 * Restyled progress rail — flat Pacific-Cyan fill, mono step counter,
 * matching the Bold Simplicity onboarding language.
 */
export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  const pct = Math.round((currentStep / (STEPS.length - 1)) * 100);

  return (
    <div className="mb-8">
      {/* Meta row */}
      <div className="flex items-center justify-between mb-2.5">
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: "0.08em",
            color: "#97C3CC",
            textTransform: "uppercase",
          }}
        >
          Step {currentStep + 1} of {STEPS.length} · {STEPS[currentStep]}
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            fontWeight: 700,
            color: "#13AECE",
          }}
        >
          {pct}%
        </span>
      </div>

      {/* Dot rail */}
      <div
        className="flex gap-1.5"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={0}
        aria-valuemax={STEPS.length - 1}
        aria-label={`Step ${currentStep + 1} of ${STEPS.length}: ${STEPS[currentStep]}`}
      >
        {STEPS.map((label, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <div
              key={label}
              className="flex-1 rounded-full transition-all duration-300"
              style={{
                height: 6,
                background: done || active ? "#13AECE" : "rgba(151,195,204,0.15)",
                boxShadow: active ? "0 0 10px -2px rgba(19,174,206,0.6)" : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
