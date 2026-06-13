"use client";

import { OnboardingProgress } from "./onboarding-progress";

interface OnboardingWelcomeProps {
  firstName: string;
  onContinue: () => void;
  onSkip: () => void;
}

export function OnboardingWelcome({
  firstName,
  onContinue,
  onSkip,
}: OnboardingWelcomeProps) {
  return (
    <div style={{ textAlign: "center" }}>
      <OnboardingProgress currentStep={0} />

      <h1
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: "#FFFFFF",
          marginBottom: 12,
          letterSpacing: "-0.5px",
        }}
      >
        Welcome, {firstName}
      </h1>

      <p
        style={{
          fontSize: 15,
          color: "#D1D5DB",
          marginBottom: 28,
          lineHeight: 1.6,
        }}
      >
        Let&apos;s build your learning path. This takes about 60 seconds.
      </p>

      {/* Value Props */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            padding: 16,
            marginBottom: 12,
            backgroundColor: "#1F2937",
            borderRadius: 8,
            border: "1px solid #374151",
          }}
        >
          <div style={{ fontSize: 14, color: "#F3F4F6", fontWeight: 500 }}>
            Personalized recommendations
          </div>
          <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>
            Based on your goals and experience
          </div>
        </div>
        <div
          style={{
            padding: 16,
            backgroundColor: "#1F2937",
            borderRadius: 8,
            border: "1px solid #374151",
          }}
        >
          <div style={{ fontSize: 14, color: "#F3F4F6", fontWeight: 500 }}>
            Structured learning path
          </div>
          <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>
            From fundamentals to mastery
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          onClick={onContinue}
          style={{
            width: "100%",
            padding: "12px 24px",
            fontSize: 15,
            fontWeight: 600,
            color: "#FFFFFF",
            background: "hsl(var(--primary))",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#0FA3C4";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "hsl(var(--primary))";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Get Started
        </button>

        <button
          onClick={onSkip}
          style={{
            fontSize: 14,
            color: "#9CA3AF",
            background: "none",
            border: "none",
            cursor: "pointer",
            transition: "color 0.2s ease",
            padding: 8,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#D1D5DB")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9CA3AF")}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
