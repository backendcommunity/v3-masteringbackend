"use client";

import { OnboardingProgress } from "./onboarding-progress";

interface OnboardingWelcomeProps {
  firstName: string;
  onContinue: () => void;
  onSkip: () => void;
}

export function OnboardingWelcome({ firstName, onContinue, onSkip }: OnboardingWelcomeProps) {
  return (
    <div>
      <OnboardingProgress currentStep={0} />

      <h1 className="font-bold mb-2" style={{ fontSize: 32, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
        Welcome, {firstName}
      </h1>
      <p className="mb-7" style={{ fontSize: 15, color: "#97C3CC", lineHeight: 1.6 }}>
        Let&apos;s build your verified learning path. This takes about 60 seconds.
      </p>

      {/* Value props — flat outline cards */}
      <div className="flex flex-col gap-3 mb-8">
        {[
          ["Personalized recommendations", "Based on your goals and experience"],
          ["Structured learning path", "From fundamentals to mastery"],
        ].map(([title, sub]) => (
          <div
            key={title}
            className="rounded-xl p-4"
            style={{ background: "transparent", border: "1px solid rgba(151,195,204,0.18)" }}
          >
            <div style={{ fontSize: 14, color: "#FFFFFF", fontWeight: 600 }}>{title}</div>
            <div style={{ fontSize: 13, color: "#97C3CC", marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onContinue}
          className="w-full font-bold rounded-lg transition-all duration-200 hover:brightness-110 hover:-translate-y-px active:translate-y-0"
          style={{ height: 52, background: "#13AECE", color: "#0E1F33", fontSize: 16 }}
        >
          Get Started
        </button>
        <button
          onClick={onSkip}
          className="mx-auto transition-colors"
          style={{ fontSize: 13, color: "#97C3CC", padding: 8 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#97C3CC")}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
