"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { toast } from "sonner";

import { useAuth } from "@/store/auth";
import { analytics } from "@/lib/analytics";

import type {
  ExperienceLevel,
  LearningGoal,
  WeeklyCommitment,
  ProgrammingLanguage,
  OnboardingRecommendation,
} from "@/lib/data";
import { routes } from "@/lib/routes";

import { OnboardingWelcome } from "@/components/onboarding/onboarding-welcome";
import { OnboardingExperience } from "@/components/onboarding/onboarding-experience";
import { OnboardingLanguage } from "@/components/onboarding/onboarding-language";
import { OnboardingGoal } from "@/components/onboarding/onboarding-goal";
import { OnboardingTime } from "@/components/onboarding/onboarding-time";
import { OnboardingResult } from "@/components/onboarding/onboarding-result";

type Step = "welcome" | "experience" | "language" | "goal" | "time" | "result";

const STEP_ORDER: Step[] = ["welcome", "experience", "language", "goal", "time", "result"];

export function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") ?? undefined;
  const { user, completeOnboarding } = useAuth();

  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel | null>(null);
  const [preferredLanguage, setPreferredLanguage] =
    useState<ProgrammingLanguage | null>(null);
  const [learningGoal, setLearningGoal] = useState<LearningGoal | null>(null);
  const [weeklyCommitment, setWeeklyCommitment] =
    useState<WeeklyCommitment | null>(null);
  const [recommendation, setRecommendation] =
    useState<OnboardingRecommendation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const firstName = user?.name?.split(" ")[0] ?? "there";

  // ── Navigation ──────────────────────────────────────────────────────────
  const goTo = useCallback((step: Step) => {
    analytics.track("onboarding_step_viewed", { step, previousStep: currentStep });
    setCurrentStep(step);
  }, [currentStep]);

  const goBack = useCallback(() => {
    const idx = STEP_ORDER.indexOf(currentStep);
    if (idx > 0) setCurrentStep(STEP_ORDER[idx - 1]);
  }, [currentStep]);

  // ── Skip Flow ───────────────────────────────────────────────────────────
  const handleSkip = useCallback(async () => {
    try {
      setIsSubmitting(true);
      await completeOnboarding({ skipped: true });
      router.replace(redirect || routes.dashboard);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [completeOnboarding, redirect, router]);

  // ── Submit (after time commitment selected) ─────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!experienceLevel || !preferredLanguage || !learningGoal || !weeklyCommitment) return;

    try {
      setIsSubmitting(true);
      const res = await completeOnboarding({
        experienceLevel,
        learningGoal,
        weeklyCommitment,
        preferredLanguage,
        skipped: false,
      });

      if (res?.success && res?.data?.recommendation) {
        setRecommendation(res.data.recommendation);
        setCurrentStep("result");
      } else {
        // API succeeded but no recommendation — go to redirect or dashboard
        toast.success("Onboarding complete!");
        router.replace(redirect || routes.dashboard);
      }
    } catch {
      toast.error("Something went wrong. Let's try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    experienceLevel,
    preferredLanguage,
    learningGoal,
    weeklyCommitment,
    completeOnboarding,
    router,
  ]);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex items-center justify-center px-5"
      style={{ background: "#0c1222" }}
    >
      <div className="w-full" style={{ maxWidth: 640 }}>
        {/* Loading overlay */}
        {isSubmitting && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(12, 18, 34, 0.8)" }}
            aria-live="polite"
          >
            <div className="text-center">
              <div
                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
                style={{
                  borderColor: "#13AECE",
                  borderTopColor: "transparent",
                }}
              />
              <p style={{ color: "#9CA3AF", fontSize: 14 }}>
                Building your learning path...
              </p>
            </div>
          </div>
        )}

        {/* Step content */}
        {currentStep === "welcome" && (
          <OnboardingWelcome
            firstName={firstName}
            onContinue={() => goTo("experience")}
            onSkip={handleSkip}
          />
        )}

        {currentStep === "experience" && (
          <OnboardingExperience
            value={experienceLevel}
            onChange={setExperienceLevel}
            onContinue={() => goTo("language")}
            onBack={goBack}
            onSkip={handleSkip}
          />
        )}

        {currentStep === "language" && (
          <OnboardingLanguage
            value={preferredLanguage}
            onChange={setPreferredLanguage}
            onContinue={() => goTo("goal")}
            onBack={goBack}
            onSkip={handleSkip}
          />
        )}

        {currentStep === "goal" && (
          <OnboardingGoal
            value={learningGoal}
            onChange={setLearningGoal}
            onContinue={() => goTo("time")}
            onBack={goBack}
            onSkip={handleSkip}
          />
        )}

        {currentStep === "time" && (
          <OnboardingTime
            value={weeklyCommitment}
            onChange={setWeeklyCommitment}
            onContinue={handleSubmit}
            onBack={goBack}
            onSkip={handleSkip}
          />
        )}

        {currentStep === "result" && recommendation && (
          <OnboardingResult recommendation={recommendation} learningGoal={learningGoal} redirect={redirect} />
        )}
      </div>
    </div>
  );
}
