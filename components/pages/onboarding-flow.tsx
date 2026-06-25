"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { useAuth } from "@/store/auth";
import { analytics } from "@/lib/analytics";
import { routes } from "@/lib/routes";
import type {
  ExperienceLevel,
  LearningGoal,
  ProgrammingLanguage,
  OnboardingRecommendation,
} from "@/lib/data";

import styles from "./onboarding-flow.module.css";

/* ─── Content (Frame 1.1) ─────────────────────────────────────────── */
interface Option {
  id: string;
  title: string;
  desc?: string;
}
interface StepDef {
  id: "experience" | "language" | "career";
  h2: string;
  h3: string;
  options: Option[];
  suggest?: { label: string; placeholder: string };
}

const STEPS: StepDef[] = [
  {
    id: "experience",
    h2: "What is your current experience level?",
    h3: "We will customize your starting point based on your background.",
    options: [
      { id: "beginner", title: "Beginner", desc: "New to programming or backend concepts." },
      {
        id: "intermediate",
        title: "Intermediate",
        desc: "Comfortable with basic coding; ready to learn real-world system building.",
      },
      {
        id: "advanced",
        title: "Advanced",
        desc: "Experienced engineer looking to master large-scale architecture and distributed systems.",
      },
    ],
  },
  {
    id: "language",
    h2: "Choose your primary language track",
    h3: "Don't worry, you can always learn other language tracks later.",
    suggest: {
      label: "Don't see your stack? Suggest a language track",
      placeholder: "e.g., Go, Ruby, C#…",
    },
    options: [
      { id: "node", title: "Node.js" },
      { id: "python", title: "Python" },
      { id: "java", title: "Java" },
    ],
  },
  {
    id: "career",
    h2: "What is your primary career target?",
    h3: "This sets the focus for your Capstone projects and career tracking.",
    options: [
      { id: "remote", title: "Global Remote Role", desc: "Aiming to become a highly-paid international engineer." },
      {
        id: "promotion",
        title: "Promotion & Fast-Track Growth",
        desc: "Looking to level up from mid-level to Senior or Staff Engineer at your current company.",
      },
      {
        id: "transition",
        title: "Career Transition",
        desc: "Moving smoothly from frontend, mobile, or QA engineering into a dedicated backend role.",
      },
    ],
  },
];

const COMPILE_STRINGS = [
  "Evaluating skill gaps and mapping your starting point…",
  "Generating your custom learning path…",
  "Setting up your personal learning space…",
];

/* Map Frame 1.1 answer ids → the backend onboarding contract.
   experience ids match ExperienceLevel directly. The career taxonomy
   (remote/promotion/transition) maps best-fit onto LearningGoal. */
const LANG_TO_ENUM: Record<string, ProgrammingLanguage> = {
  node: "NODEJS",
  python: "PYTHON",
  java: "JAVA",
};
const CAREER_TO_GOAL: Record<string, LearningGoal> = {
  remote: "projects",
  promotion: "advanced",
  transition: "fundamentals",
};

/* ─── Icons / atoms ───────────────────────────────────────────────── */
function StarIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 1.5 L13.85 9.1 L21.5 11.0 L13.85 12.9 L12 22.5 L10.15 12.9 L2.5 11.0 L10.15 9.1 Z" />
    </svg>
  );
}
function ArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}
function ArrowLeftIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5" />
      <path d="M11 18l-6-6 6-6" />
    </svg>
  );
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
        <pattern id="mb-onb-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M0 40 L40 0 L80 40 L40 80 Z" fill="none" stroke="#FFFFFF" strokeWidth="1" />
          <path d="M20 40 L40 20 L60 40 L40 60 Z" fill="none" stroke="#FFFFFF" strokeWidth="1" />
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

function Progress({ step, total = 4 }: { step: number; total?: number }) {
  const pct = Math.min(100, (step / total) * 100);
  return (
    <div className={styles.progress}>
      <div className={styles.progressMeta}>
        <span className={styles.progressMetaLabel}>Step {step} of {total}</span>
        <span className={styles.progressMetaPct}>{Math.round(pct)}%</span>
      </div>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
      </div>
    </div>
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
  const cls = [styles.card, selected && styles.cardSelected, compact && styles.cardCompact]
    .filter(Boolean)
    .join(" ");
  return (
    <button type="button" className={cls} aria-pressed={selected} onClick={onClick}>
      <h3 className={styles.cardTitle}>{title}</h3>
      {desc && <p className={styles.cardDesc}>{desc}</p>}
      <span className={styles.cardStar}><StarIcon size={22} /></span>
    </button>
  );
}

function QuestionStep({
  stepIdx,
  value,
  onSelect,
  suggestion,
  onSuggestionChange,
}: {
  stepIdx: number;
  value: string | null;
  onSelect: (v: string) => void;
  suggestion: string;
  onSuggestionChange: (v: string) => void;
}) {
  const s = STEPS[stepIdx];
  const compact = !s.options[0].desc;
  return (
    <div className={styles.stepEnter} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div className={styles.qhead}>
        <h2 className={styles.qheadH2}>{s.h2}</h2>
        <p className={styles.qheadH3}>{s.h3}</p>
      </div>
      <div className={styles.options} role="radiogroup" aria-label={s.h2}>
        {s.options.map((o) => (
          <Card key={o.id} title={o.title} desc={o.desc} selected={value === o.id} compact={compact} onClick={() => onSelect(o.id)} />
        ))}
      </div>
      {s.suggest && (
        <div className={styles.suggest}>
          <label className={styles.suggestLabel} htmlFor="lang-suggest">{s.suggest.label}</label>
          <input
            id="lang-suggest"
            className={styles.suggestInput}
            type="text"
            placeholder={s.suggest.placeholder}
            value={suggestion}
            onChange={(e) => onSuggestionChange(e.target.value)}
            autoComplete="off"
          />
        </div>
      )}
    </div>
  );
}

function CompileStep({ onComplete }: { onComplete: () => void }) {
  const [lineIdx, setLineIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let i = 0;
    const tick = () => {
      if (cancelled) return;
      setFading(true);
      setTimeout(() => {
        if (cancelled) return;
        i += 1;
        if (i >= COMPILE_STRINGS.length) {
          setTimeout(() => { if (!cancelled) onComplete(); }, 350);
          return;
        }
        setLineIdx(i);
        setFading(false);
        setTimeout(tick, 1200);
      }, 300);
    };
    const start = setTimeout(tick, 1200);
    return () => { cancelled = true; clearTimeout(start); };
  }, [onComplete]);

  return (
    <div className={styles.stepEnter} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <Progress step={4} total={4} />
      <div className={styles.compile}>
        <h2 className={styles.compileH2}>Analyzing your profile…</h2>
        <div className={styles.ringWrap} aria-hidden="true">
          <div className={styles.ring} />
          <div className={`${styles.ring} ${styles.ringInner}`} />
          <div className={styles.ringPulse} />
          <div className={styles.ringStar}><StarIcon size={40} /></div>
        </div>
        <div className={styles.compileLine} style={{ opacity: fading ? 0 : 1 }}>
          {COMPILE_STRINGS[lineIdx]}
        </div>
        <div className={styles.compileMeta}>
          <span>{lineIdx + 1} / {COMPILE_STRINGS.length}</span>
        </div>
      </div>
    </div>
  );
}

function labelOf(stepIdx: number, value: string | null): string {
  return STEPS[stepIdx]?.options.find((o) => o.id === value)?.title ?? "—";
}

/* ─── Wizard ──────────────────────────────────────────────────────── */
export function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") ?? undefined;
  const { completeOnboarding } = useAuth();

  // step: 1..3 = question, 4 = compile, 5 = done
  const [step, setStep] = useState(1);
  const [q1, setQ1] = useState<string | null>(null);
  const [q2, setQ2] = useState<string | null>(null);
  const [q3, setQ3] = useState<string | null>(null);
  const [suggest, setSuggest] = useState("");
  const [isSkipping, setIsSkipping] = useState(false);
  const recommendationRef = useRef<OnboardingRecommendation | null>(null);
  const submitRef = useRef<Promise<{ ok: boolean }> | null>(null);

  const current = step <= 3 ? [q1, q2, q3][step - 1] : null;
  const setCurrent = step === 1 ? setQ1 : step === 2 ? setQ2 : step === 3 ? setQ3 : () => {};
  // Step 2 advances with a card pick OR a typed suggestion.
  const canAdvance = step === 2 ? !!current || suggest.trim().length > 0 : !!current;

  const isQuestion = step >= 1 && step <= 3;
  const isCompile = step === 4;
  const isDone = step === 5;

  useEffect(() => {
    analytics.track("onboarding_step_viewed", { step });
  }, [step]);

  // Fire the real API as soon as the compile loader appears, so it resolves
  // while the animation plays. The recommendation is used for the recap/route.
  const submitOnboarding = useCallback(async (): Promise<{ ok: boolean }> => {
    if (!q1 || !q3) return { ok: false };
    try {
      const res = await completeOnboarding({
        experienceLevel: q1 as ExperienceLevel,
        learningGoal: CAREER_TO_GOAL[q3],
        preferredLanguage: q2 ? LANG_TO_ENUM[q2] : undefined,
        skipped: false,
      });
      recommendationRef.current = res?.data?.recommendation ?? null;
      return { ok: res ? res.success !== false : true };
    } catch {
      return { ok: false };
    }
  }, [q1, q2, q3, completeOnboarding]);

  useEffect(() => {
    if (step === 4 && !submitRef.current) {
      submitRef.current = submitOnboarding();
    }
  }, [step, submitOnboarding]);

  const advance = () => {
    if (step < 4) setStep(step + 1);
  };
  const back = () => {
    if (step > 1 && step <= 3) setStep(step - 1);
  };
  const restart = () => {
    setQ1(null); setQ2(null); setQ3(null); setSuggest("");
    submitRef.current = null;
    recommendationRef.current = null;
    setStep(1);
  };

  // Compile animation finished → wait for the API, then show the done screen.
  const onCompileComplete = useCallback(async () => {
    const result = await (submitRef.current ?? Promise.resolve({ ok: false }));
    if (!result.ok) {
      toast.error("Something went wrong saving your answers. Let's try again.");
      submitRef.current = null;
      setStep(3);
      return;
    }
    setStep(5);
  }, []);

  const launch = () => {
    router.replace(redirect || routes.dashboard);
  };

  const handleSkip = useCallback(async () => {
    try {
      setIsSkipping(true);
      await completeOnboarding({ skipped: true });
      router.replace(redirect || routes.dashboard);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsSkipping(false);
    }
  }, [completeOnboarding, redirect, router]);

  return (
    <div className={styles.wiz}>
      <Watermark />

      <header className={styles.header}>
        <img
          src="/White-trimed.png"
          alt="masteringbackend."
          width={431}
          height={50}
          style={{ height: 28, width: "auto", display: "block", userSelect: "none" }}
          draggable={false}
        />
        <div className={styles.headerRight}>
          {!isDone ? (
            <div className={styles.stepCounter}>
              <span><strong>{Math.min(step, 4)}</strong> of 4</span>
            </div>
          ) : (
            <div className={styles.stepCounter}><strong>Complete.</strong></div>
          )}
          {/* Skip is offered on the first and last question, never mid-flow or on compile/done. */}
          {(step === 1 || step === 3) && (
            <button type="button" className={styles.exitLink} onClick={handleSkip} disabled={isSkipping}>
              Skip to Dashboard <ArrowRight size={14} />
            </button>
          )}
        </div>
      </header>

      <main className={styles.body}>
        <div className={styles.panel}>
          {isQuestion && (
            <>
              <Progress step={step} total={4} />
              <QuestionStep
                key={step}
                stepIdx={step - 1}
                value={current}
                onSelect={(v) => setCurrent(v)}
                suggestion={suggest}
                onSuggestionChange={setSuggest}
              />
              <div className={styles.nav}>
                <button type="button" className={styles.navBack} disabled={step === 1} onClick={back}>
                  <ArrowLeftIcon /> Back
                </button>
                <button type="button" className={styles.cta} disabled={!canAdvance} onClick={advance}>
                  {step === 3 ? "Compile My Path" : "Next Step"}
                  <ArrowRight />
                </button>
              </div>
            </>
          )}

          {isCompile && <CompileStep onComplete={onCompileComplete} />}

          {isDone && (
            <div className={styles.stepEnter} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <Progress step={4} total={4} />
              <div className={styles.done}>
                <div className={styles.doneBurst}><StarIcon size={72} /></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
                  <h2 className={styles.doneH2}>Assessment complete.</h2>
                  <p className={styles.doneSub}>Your tailored path has been assembled.</p>
                </div>
                <div className={styles.doneChip}>
                  <StarIcon size={14} /> +25 XP earned
                </div>
                <div className={styles.recap}>
                  {[
                    ["Experience", labelOf(0, q1)],
                    ["Language", q2 ? labelOf(1, q2) : (suggest.trim() || "—")],
                    ["Goal", labelOf(2, q3)],
                  ].map(([k, v]) => (
                    <div key={k} className={styles.recapItem}>
                      <span className={styles.recapKey}>{k}</span>
                      <span className={styles.recapVal}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  <button type="button" className={styles.navBack} onClick={restart}>
                    <ArrowLeftIcon /> Restart
                  </button>
                  <button type="button" className={styles.cta} onClick={launch}>
                    Start My Path <ArrowRight />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
