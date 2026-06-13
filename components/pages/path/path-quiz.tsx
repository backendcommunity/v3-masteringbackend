"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  X,
  Clock,
  Sparkles,
  RotateCcw,
  ArrowRight,
  Trophy,
  Target,
  ListChecks,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { Quiz, QuizQuestion } from "@/lib/data";
import { PathSessionStep } from "@/lib/path-types";
import StableTimer from "@/components/atoms/Timer";
import ConfettiCelebration from "@/components/confetti-celebration";

type Status = "loading" | "intro" | "active" | "results" | "failed";

interface AnsweredResult {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
  points: number;
  passed: boolean;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

// Quiz data comes in two shapes: seeded path quizzes use `answer` (an index into
// options); older quizzes use `correctAnswer` (the option's text). Normalise both.
function correctIndexOf(q: QuizQuestion): number {
  const a = (q as unknown as { answer?: number }).answer;
  if (typeof a === "number") return a;
  const ca = q.correctAnswer;
  if (ca != null && q.options) {
    const byText = q.options.indexOf(ca);
    if (byText >= 0) return byText;
    const n = Number(ca);
    if (!Number.isNaN(n)) return n;
  }
  return -1;
}
function correctTextOf(q: QuizQuestion): string {
  return q.options?.[correctIndexOf(q)] ?? q.correctAnswer ?? "";
}

export function PathQuiz({
  step,
  quizId,
  onComplete,
  quizData,
}: {
  step: PathSessionStep;
  quizId: string;
  onComplete: (stepId: string, payload?: Record<string, unknown>) => void;
  // Optional injected quiz (preview/testing) — bypasses the store fetch.
  quizData?: Quiz | null;
}) {
  const store = useAppStore();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [starting, setStarting] = useState(false);

  const [index, setIndex] = useState(0);
  // Single mode: immediate-feedback selection. Group mode: answers map, graded
  // only at the end.
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [results, setResults] = useState<AnsweredResult[]>([]);
  const [score, setScore] = useState(0);
  const [celebrate, setCelebrate] = useState(false);

  const questions: QuizQuestion[] = useMemo(
    () => quiz?.questions ?? [],
    [quiz],
  );
  const single = questions.length === 1;
  const passingScore = quiz?.passingScore ?? 50;
  const totalPoints = useMemo(
    () => questions.reduce((sum, q) => sum + (q.points || 0), 0),
    [questions],
  );

  // Load the quiz; jump straight in for single-question quizzes.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setStatus("loading");
        const data = quizData ?? (await store.getQuiz(quizId));
        if (!active) return;
        if (!data) {
          setStatus("failed");
          return;
        }
        setQuiz(data);
        if (data?.userQuiz?.passed) {
          setScore(data.userQuiz?.bestScore ?? data.userQuiz?.score ?? 100);
          setStatus("results");
        } else {
          setStatus((data.questions?.length ?? 0) === 1 ? "active" : "intro");
        }
      } catch {
        if (active) setStatus("failed");
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId, quizData]);

  const begin = async () => {
    if (!quiz) return;
    setStarting(true);
    try {
      const started = await store.startQuiz(quiz.id);
      if (started) Object.assign(quiz, { enrolled: true, userQuiz: started });
    } catch {
      // Non-fatal — the learner can still take the quiz locally.
    } finally {
      setStarting(false);
    }
    setIndex(0);
    setSelected(null);
    setRevealed(false);
    setAnswers({});
    setResults([]);
    setScore(0);
    setStatus("active");
  };

  const current = questions[index];

  const computeScore = (final: AnsweredResult[]) => {
    const totalPts = final.reduce((s, r) => s + (r.points || 0), 0);
    if (totalPts > 0) {
      const earned = final.reduce((s, r) => s + (r.passed ? r.points : 0), 0);
      return Math.round((earned / totalPts) * 100);
    }
    // No per-question points defined → score by the share of correct answers.
    const correct = final.filter((r) => r.passed).length;
    return final.length ? Math.round((correct / final.length) * 100) : 0;
  };

  const submitAttempt = async (final: AnsweredResult[], finalScore: number) => {
    try {
      await store.submitQuiz(quiz!.id, {
        items: final,
        userQuizId: quiz?.userQuiz?.id ?? quiz?.id,
        score: finalScore,
        completed: true,
      });
    } catch {
      // ignore — UI already reflects the result
    }
  };

  const check = () => {
    if (selected == null || !current) return;
    const userAnswer = current.options?.[selected] ?? "";
    const passed = selected === correctIndexOf(current);
    const updated: AnsweredResult[] = [
      ...results,
      {
        question: current.question,
        userAnswer,
        correctAnswer: correctTextOf(current),
        explanation: current.explanation,
        points: current.points || 0,
        passed,
      },
    ];
    setResults(updated);
    setRevealed(true);
    // Single-question quizzes record the attempt the moment it's checked; the
    // learner then taps Continue (pass) or Try Again (fail).
    if (single) {
      const fs = computeScore(updated);
      setScore(fs);
      submitAttempt(updated, fs);
    }
  };

  const finalize = (final: AnsweredResult[]) => {
    const fs = computeScore(final);
    setResults(final); // drives the results-page review list
    setScore(fs);
    setCelebrate(fs >= passingScore);
    submitAttempt(final, fs);
    setStatus("results");
  };

  // Group mode: grade every answer at once, only when the learner finishes.
  const submitGroup = () => {
    const final: AnsweredResult[] = questions.map((q, i) => {
      const userAnswer = q.options?.[answers[i]] ?? "";
      return {
        question: q.question,
        userAnswer,
        correctAnswer: correctTextOf(q),
        explanation: q.explanation,
        points: q.points || 0,
        passed: answers[i] === correctIndexOf(q),
      };
    });
    finalize(final);
  };

  const goNext = () => {
    if (index >= questions.length - 1) {
      submitGroup();
      return;
    }
    setIndex((i) => i + 1);
  };
  const goPrev = () => setIndex((i) => Math.max(0, i - 1));

  const retake = () => {
    setIndex(0);
    setSelected(null);
    setRevealed(false);
    setAnswers({});
    setResults([]);
    setScore(0);
    setCelebrate(false);
    setStatus(single ? "active" : "intro");
  };

  // The last answered result, used to drive single-question footer states.
  const lastResult = results[results.length - 1];
  const singlePassed = single && revealed && !!lastResult?.passed;
  const singleFailed = single && revealed && lastResult && !lastResult.passed;

  // Group navigation state.
  const currentSelected = single ? selected : answers[index] ?? null;
  const showFeedback = single && revealed; // group never reveals correctness
  const allAnswered =
    !single && questions.every((_, i) => answers[i] != null);

  // ── Shells ────────────────────────────────────────────────────────────
  const Shell = ({
    children,
    max = "max-w-[760px]",
  }: {
    children: React.ReactNode;
    max?: string;
  }) => (
    <div className="flex h-full w-full items-start justify-center overflow-y-auto px-3 py-4 sm:px-6">
      <div className={`my-auto w-full ${max}`}>{children}</div>
    </div>
  );

  if (status === "loading") {
    return (
      <Shell>
        <div className="flex h-[320px] items-center justify-center rounded-2xl border border-border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  if (status === "failed" || !quiz) {
    return (
      <Shell max="max-w-[520px]">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h2 className="text-lg font-bold">Quiz unavailable</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This quiz could not be loaded. Try again in a moment.
          </p>
        </div>
      </Shell>
    );
  }

  // ── Intro (group quizzes) ─────────────────────────────────────────────
  if (status === "intro") {
    const stats = [
      { icon: ListChecks, value: String(questions.length), label: "Questions" },
      {
        icon: Clock,
        value: quiz.timeLimit ? `${quiz.timeLimit} min` : "Untimed",
        label: "Time limit",
      },
      { icon: Target, value: `${passingScore}%`, label: "To pass" },
    ];

    return (
      <Shell max="max-w-[480px]">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_10px_40px_-20px_rgba(0,0,0,0.5)]">
          {/* Hero */}
          <div className="flex flex-col items-center px-8 pt-10 text-center">
            <span className="relative grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
              <span
                aria-hidden
                className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl"
              />
              <ListChecks className="relative h-7 w-7" />
            </span>
            <span className="mt-5 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              Knowledge Check
            </span>
            <h1 className="mt-2 text-2xl font-bold leading-tight">
              {quiz.title}
            </h1>
            {quiz.description && (
              <p className="mt-2 max-w-[40ch] text-sm leading-relaxed text-muted-foreground">
                {quiz.description}
              </p>
            )}
          </div>

          {/* Stat strip */}
          <div className="mx-8 mt-7 grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-background/40">
            {stats.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1 px-2 py-4"
              >
                <Icon className="h-4 w-4 text-muted-foreground/80" />
                <span className="text-base font-bold leading-none">{value}</span>
                <span className="text-[11px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          {/* Note + CTA */}
          <div className="px-8 pb-9 pt-6">
            <p className="text-center text-[13px] leading-relaxed text-muted-foreground">
              Answer all {questions.length} questions, then submit to see your
              score. You need {passingScore}% to pass — retake anytime.
            </p>
            <Button
              onClick={begin}
              disabled={starting}
              className="mt-5 h-11 w-full rounded-xl bg-gradient-to-br from-primary to-[#2BB8D8] text-sm font-extrabold text-[#06222b] shadow-[0_6px_20px_-4px_rgba(19,174,206,0.5)] hover:brightness-110"
            >
              {starting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Start Quiz
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  // ── Results (group quizzes) ───────────────────────────────────────────
  if (status === "results") {
    const passed = score >= passingScore;
    const review: AnsweredResult[] =
      results.length > 0
        ? results
        : (quiz.userQuiz?.items as AnsweredResult[]) ?? [];

    return (
      <Shell max="max-w-[680px]">
        {celebrate && (
          <ConfettiCelebration
            isVisible={celebrate}
            onComplete={() => setCelebrate(false)}
            celebrationType="completion"
            courseName={quiz.title}
          />
        )}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_10px_40px_-20px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-center gap-3 border-b border-border px-6 py-8 text-center">
            <div
              className={`grid h-20 w-20 place-items-center rounded-full ${
                passed
                  ? "bg-[#347474]/15 text-[#5fb0b0]"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {passed ? (
                <Trophy className="h-9 w-9" />
              ) : (
                <Target className="h-9 w-9" />
              )}
            </div>
            <div className="text-4xl font-extrabold tabular-nums">{score}%</div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                passed
                  ? "bg-[#347474]/15 text-[#5fb0b0]"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {passed ? "Passed" : "Keep practicing"} · need {passingScore}%
            </span>
            <p className="text-sm text-muted-foreground">
              {passed
                ? "Great work — you've mastered this check."
                : "Review the answers below, then retake to pass."}
            </p>
          </div>

          <div className="max-h-[60vh] space-y-3 overflow-y-auto px-4 py-5 sm:max-h-[42vh] sm:px-6">
            {review.map((r, i) => (
              <ReviewRow key={i} index={i} result={r} />
            ))}
          </div>

          <div className="flex flex-col gap-2 border-t border-border px-6 py-5 sm:flex-row">
            <Button
              variant="outline"
              onClick={retake}
              className="h-11 flex-1 gap-1.5 border-border bg-transparent"
            >
              <RotateCcw className="h-4 w-4" /> Retake
            </Button>
            {passed && (
              <Button
                onClick={() => onComplete(step.id, { passed: true, score })}
                className="h-11 flex-1 gap-1.5 rounded-xl bg-gradient-to-br from-primary to-[#2BB8D8] font-extrabold text-[#06222b] hover:brightness-110"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Shell>
    );
  }

  // ── Active (single = instant feedback · group = answer-all) ───────────
  return (
    <Shell max="max-w-[620px]">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_10px_40px_-20px_rgba(0,0,0,0.5)]">
        {/* Header: progress + meta */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/20 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            {!single && (
              <div className="flex items-center gap-1">
                {questions.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-5 rounded-full transition-colors ${
                      answers[i] != null
                        ? "bg-foreground/70"
                        : i === index
                          ? "bg-foreground/40"
                          : "bg-muted-foreground/20"
                    }`}
                  />
                ))}
              </div>
            )}
            <span className="whitespace-nowrap text-xs font-semibold text-muted-foreground">
              {single
                ? "Quick check"
                : `Question ${index + 1} of ${questions.length}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!single && quiz.timeLimit ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <StableTimer
                  duration={quiz.timeLimit * 60}
                  isRunning={status === "active"}
                  onComplete={submitGroup}
                />
              </span>
            ) : null}
            {totalPoints > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F2C94C]/15 px-2.5 py-1 text-xs font-extrabold text-[#caa000]">
                <Sparkles className="h-3.5 w-3.5" />
                {totalPoints} XP
              </span>
            )}
          </div>
        </div>

        {/* Question */}
        <div className="px-5 py-6 sm:px-7">
          <h2 className="text-lg font-bold leading-snug">{current?.question}</h2>

          <div className="mt-5 space-y-2.5">
            {current?.options?.map((option, i) => {
              const isSelected = currentSelected === i;
              const isCorrect = i === correctIndexOf(current);
              const showCorrect = showFeedback && isCorrect;
              const showWrong = showFeedback && isSelected && !isCorrect;

              let cls = "border-border bg-background/40 hover:bg-muted/60";
              if (showCorrect) cls = "border-[#5fb0b0] bg-[#347474]/15";
              else if (showWrong) cls = "border-red-500/60 bg-red-500/10";
              else if (isSelected) cls = "border-foreground/40 bg-muted";

              return (
                <button
                  key={i}
                  type="button"
                  disabled={showFeedback}
                  onClick={() =>
                    single
                      ? setSelected(i)
                      : setAnswers((a) => ({ ...a, [index]: i }))
                  }
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[14px] transition-colors disabled:cursor-default ${cls}`}
                >
                  <span
                    className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg text-xs font-bold ${
                      showCorrect
                        ? "bg-[#347474] text-white"
                        : showWrong
                          ? "bg-red-500 text-white"
                          : isSelected
                            ? "bg-foreground text-background"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {showCorrect ? (
                      <Check className="h-4 w-4" />
                    ) : showWrong ? (
                      <X className="h-4 w-4" />
                    ) : (
                      LETTERS[i]
                    )}
                  </span>
                  <span className="min-w-0 flex-1">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback — single mode only (group grades at the end) */}
          {showFeedback && lastResult && (
            <div
              className={`mt-5 rounded-xl border p-4 ${
                lastResult.passed
                  ? "border-[#5fb0b0]/40 bg-[#347474]/10"
                  : "border-red-500/30 bg-red-500/5"
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-bold">
                {lastResult.passed ? (
                  <>
                    <Check className="h-4 w-4 text-[#5fb0b0]" />
                    <span className="text-[#5fb0b0]">Correct!</span>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 text-red-400" />
                    <span className="text-red-400">Not quite</span>
                  </>
                )}
              </div>
              {!lastResult.passed && (
                <p className="mt-1.5 text-[13px] text-muted-foreground">
                  Correct answer:{" "}
                  <span className="font-semibold text-foreground">
                    {lastResult.correctAnswer}
                  </span>
                </p>
              )}
              {current?.explanation && (
                <p className="mt-2 flex gap-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#caa000]" />
                  {current.explanation}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-7">
          {single ? (
            <>
              <span className="text-xs text-muted-foreground">
                {current?.points ? `${current.points} pts` : ""}
              </span>
              {!revealed ? (
                <Button
                  onClick={check}
                  disabled={selected == null}
                  className="h-10 rounded-xl bg-gradient-to-br from-primary to-[#2BB8D8] px-6 font-extrabold text-[#06222b] hover:brightness-110 disabled:opacity-40"
                >
                  Check Answer
                </Button>
              ) : singlePassed ? (
                <Button
                  onClick={() => onComplete(step.id, { passed: true, score })}
                  className="h-10 gap-1.5 rounded-xl bg-gradient-to-br from-primary to-[#2BB8D8] px-6 font-extrabold text-[#06222b] hover:brightness-110"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : singleFailed ? (
                <Button
                  onClick={retake}
                  variant="outline"
                  className="h-10 gap-1.5 border-border bg-transparent px-6"
                >
                  <RotateCcw className="h-4 w-4" /> Try Again
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={goPrev}
                disabled={index === 0}
                className="h-10 px-4 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                Previous
              </Button>
              {index >= questions.length - 1 ? (
                <Button
                  onClick={submitGroup}
                  disabled={!allAnswered}
                  className="h-10 gap-1.5 rounded-xl bg-gradient-to-br from-primary to-[#2BB8D8] px-6 font-extrabold text-[#06222b] hover:brightness-110 disabled:opacity-40"
                  title={allAnswered ? "" : "Answer every question first"}
                >
                  Submit Quiz
                </Button>
              ) : (
                <Button
                  onClick={goNext}
                  disabled={currentSelected == null}
                  className="h-10 gap-1.5 px-6 disabled:opacity-40"
                  variant="outline"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Shell>
  );
}

function ReviewRow({
  index,
  result,
}: {
  index: number;
  result: AnsweredResult;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <div className="flex items-start gap-2.5">
        <span
          className={`mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full ${
            result.passed
              ? "bg-[#347474]/20 text-[#5fb0b0]"
              : "bg-red-500/15 text-red-400"
          }`}
        >
          {result.passed ? (
            <Check className="h-3 w-3" />
          ) : (
            <X className="h-3 w-3" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-snug">
            <span className="text-muted-foreground">{index + 1}. </span>
            {result.question}
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Your answer:{" "}
            <span
              className={
                result.passed ? "text-[#5fb0b0]" : "text-red-400"
              }
            >
              {result.userAnswer || "Not answered"}
            </span>
          </p>
          {!result.passed && (
            <p className="text-[12px] text-[#5fb0b0]">
              Correct: {result.correctAnswer}
            </p>
          )}
          {result.explanation && (
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
              {result.explanation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
