"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { useAuth } from "@/store/auth";
import { useAppStore } from "@/lib/store";
import { analytics } from "@/lib/analytics";
import { routes } from "@/lib/routes";
import type {
  ExperienceLevel,
  LearningGoal,
  ProgrammingLanguage,
  WeeklyCommitment,
} from "@/lib/data";

import styles from "./onboarding-flow.module.css";

/* ─── Content ─────────────────────────────────────────────────────── */
interface Option {
  id: string;
  title: string;
  desc?: string;
}

const MOTIVATIONS: Option[] = [
  { id: "land-role", title: "To land my first Backend Role" },
  { id: "change-career", title: "To change my career" },
  { id: "current-role", title: "For my current role" },
  { id: "learn-ai", title: "To learn AI Engineering" },
];

const TECHNOLOGIES: Option[] = [
  { id: "python", title: "Python" },
  { id: "node", title: "Node.js" },
  { id: "java", title: "Java" },
];

/* Map answers → the backend onboarding contract.
   Motivation drives BOTH the experience level (difficulty/level of the
   recommended path) and the learning goal ("ai" routes by AI skills). */
const MOTIVATION_TO_LEVEL: Record<string, ExperienceLevel> = {
  "land-role": "beginner",
  "change-career": "beginner",
  "current-role": "intermediate",
  "learn-ai": "beginner",
};
const MOTIVATION_TO_GOAL: Record<string, LearningGoal> = {
  "land-role": "interviews",
  "change-career": "projects",
  "current-role": "advanced",
  "learn-ai": "ai",
};
const LANG_TO_ENUM: Record<string, ProgrammingLanguage> = {
  python: "PYTHON",
  node: "NODEJS",
  java: "JAVA",
};

/* ─── Icons / atoms ───────────────────────────────────────────────── */
function StarIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 1.5 L13.85 9.1 L21.5 11.0 L13.85 12.9 L12 22.5 L10.15 12.9 L2.5 11.0 L10.15 9.1 Z" />
    </svg>
  );
}
function ArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}
function ArrowLeftIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="M11 18l-6-6 6-6" />
    </svg>
  );
}
function Spinner() {
  return <span className={styles.btnSpinner} aria-hidden="true" />;
}
function Watermark() {
  // Identical to the Login left-panel background (auth-shell LineworkWatermark),
  // spanning the full onboarding page.
  return (
    <svg
      className={styles.watermark}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="mb-onb-pattern"
          x="0"
          y="0"
          width="80"
          height="80"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 40 L40 0 L80 40 L40 80 Z"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1"
          />
          <path
            d="M20 40 L40 20 L60 40 L40 60 Z"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1"
          />
          <circle cx="40" cy="40" r="1.6" fill="#FFFFFF" />
          <circle cx="0" cy="0" r="1.4" fill="#FFFFFF" />
          <circle cx="80" cy="0" r="1.4" fill="#FFFFFF" />
          <circle cx="0" cy="80" r="1.4" fill="#FFFFFF" />
          <circle cx="80" cy="80" r="1.4" fill="#FFFFFF" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mb-onb-pattern)" />
    </svg>
  );
}

function Card({
  title,
  desc,
  selected,
  compact,
  onClick,
}: {
  title: string;
  desc?: string;
  selected: boolean;
  compact?: boolean;
  onClick: () => void;
}) {
  const cls = [
    styles.card,
    selected && styles.cardSelected,
    compact && styles.cardCompact,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type="button"
      className={cls}
      aria-pressed={selected}
      onClick={onClick}
    >
      <h3 className={styles.cardTitle}>{title}</h3>
      {desc && <p className={styles.cardDesc}>{desc}</p>}
      <span className={styles.cardStar}>
        <StarIcon size={22} />
      </span>
    </button>
  );
}

/* ─── Wizard ──────────────────────────────────────────────────────── */
export function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") ?? undefined;
  const { completeOnboarding } = useAuth();
  const enrollInRoadmap = useAppStore((s) => s.enrollInRoadmap);

  // step: 1 = motivation, 2 = technology, 3 = ready
  const [step, setStep] = useState(1);
  const [motivation, setMotivation] = useState<string | null>(null);
  const [technology, setTechnology] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const isQuestion = step === 1 || step === 2;
  const current = step === 1 ? motivation : technology;
  const setCurrent = step === 1 ? setMotivation : setTechnology;

  useEffect(() => {
    analytics.track("onboarding_step_viewed", { step });
  }, [step]);

  const advance = () => {
    if (step < 3) setStep(step + 1);
  };
  const back = () => {
    if (step > 1) setStep(step - 1);
  };

  // Start Lesson 1: persist answers → enroll in the recommended path → open
  // the first item of that path.
  const startLesson = useCallback(async () => {
    if (!motivation || !technology || isStarting) return;
    setIsStarting(true);
    try {
      // Motivation → experience level + goal; technology → language.
      // weeklyCommitment isn't asked, so send a sensible default.
      const res = await completeOnboarding({
        experienceLevel: MOTIVATION_TO_LEVEL[motivation],
        learningGoal: MOTIVATION_TO_GOAL[motivation],
        weeklyCommitment: "steady" as WeeklyCommitment,
        preferredLanguage: LANG_TO_ENUM[technology],
        skipped: false,
      });

      const slug: string | undefined = res?.data?.recommendation?.roadmap?.slug;
      if (slug) {
        // Enroll as a free preview join (isPreview=true) — premium steps gate
        // individually rather than granting the full paid path. A 409
        // (already enrolled) is non-fatal.
        try {
          await enrollInRoadmap(slug, true);
        } catch {
          /* already enrolled — proceed */
        }
        // Only fires when a lesson genuinely starts — keep pathSlug real,
        // never undefined, so this funnel event stays trustworthy.
        analytics.track("onboarding_started_lesson", {
          motivation,
          technology,
          pathSlug: slug,
        });
      } else {
        // No recommendation resolved — distinct from "started_lesson" so
        // the funnel isn't inflated with a slug-less event.
        analytics.track("onboarding_completed_no_recommendation", {
          motivation,
          technology,
        });
      }

      // Route through the region-aware pricing upsell before dropping the
      // learner into their path. Carry `redirect` through so a deep link
      // (OAuth existing-user / share link) survives the upsell instead of
      // being erased — the pricing page's free-plan exit reads it back off
      // the URL and falls back to the dashboard when absent.
      const pricingUrl = redirect
        ? `/pricing?from=onboarding&redirect=${encodeURIComponent(redirect)}`
        : "/pricing?from=onboarding";
      router.replace(pricingUrl);
    } catch {
      toast.error("Couldn't start your lesson. Let's try again.");
      setIsStarting(false);
    }
  }, [
    motivation,
    technology,
    isStarting,
    completeOnboarding,
    enrollInRoadmap,
    router,
    redirect,
  ]);

  // Skip onboarding: mark as skipped so we don't re-prompt, then go to the
  // dashboard. Never block the user on a failed persist.
  const handleSkip = useCallback(async () => {
    if (isStarting) return;
    analytics.track("onboarding_skipped", { step });
    try {
      await completeOnboarding({ skipped: true });
    } catch {
      /* non-fatal — still let the user through */
    }
    router.replace(redirect || routes.dashboard);
  }, [isStarting, step, completeOnboarding, router, redirect]);

  return (
    <div className={styles.wiz}>
      <Watermark />

      <header className={styles.header}>
        <img
          src="/White-trimed.png"
          alt="masteringbackend."
          width={431}
          height={50}
          style={{
            height: 28,
            width: "auto",
            display: "block",
            userSelect: "none",
          }}
          draggable={false}
        />
        <button
          type="button"
          className={styles.skip}
          disabled={isStarting}
          onClick={handleSkip}
        >
          Skip for now
        </button>
      </header>

      <main className={styles.body}>
        <div className={styles.panel}>
          {isQuestion && (
            <>
              <div
                className={styles.stepEnter}
                key={step}
                style={{ display: "flex", flexDirection: "column", gap: 28 }}
              >
                <div className={styles.qhead}>
                  {step === 1 ? (
                    <>
                      <h2 className={styles.qheadH2}>
                        I want to build backend and AI skills…
                      </h2>
                      <p className={styles.qheadH3}>What's your main goal?</p>
                    </>
                  ) : (
                    <>
                      <h2 className={styles.qheadH2}>
                        What technology would you like to start with?
                      </h2>
                      <p className={styles.qheadH3}>
                        Sets your curriculum and labs — you can add more later.
                      </p>
                    </>
                  )}
                </div>
                <div
                  className={styles.options}
                  role="radiogroup"
                  aria-label={step === 1 ? "reason" : "technology"}
                >
                  {(step === 1 ? MOTIVATIONS : TECHNOLOGIES).map((o) => (
                    <Card
                      key={o.id}
                      title={o.title}
                      selected={current === o.id}
                      compact
                      onClick={() => setCurrent(o.id)}
                    />
                  ))}
                </div>
              </div>
              <div className={styles.nav}>
                <button
                  type="button"
                  className={styles.navBack}
                  disabled={step === 1 || isStarting}
                  onClick={back}
                >
                  <ArrowLeftIcon /> Back
                </button>
                {step === 1 ? (
                  <button
                    type="button"
                    className={styles.cta}
                    disabled={!current}
                    onClick={advance}
                  >
                    Next step <ArrowRight />
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.cta}
                    disabled={!current || isStarting}
                    onClick={startLesson}
                  >
                    {isStarting ? (
                      <>
                        <Spinner /> Starting…
                      </>
                    ) : (
                      <>
                        Start Lesson 1 <ArrowRight />
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
