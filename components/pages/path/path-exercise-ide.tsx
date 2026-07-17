"use client";

import { useEffect, useRef, useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import Editor from "@monaco-editor/react";
import { toast } from "sonner";
import {
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Play,
  Lightbulb,
  Loader2,
  CheckCircle2,
  XCircle,
  Sun,
  Moon,
  ChevronDown,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { InsufficientMbModal } from "@/components/exercises/insufficient-mb-modal";
import { useAppStore } from "@/lib/store";
import { useUserStore } from "@/lib/user-store";
import { PathSessionStep } from "@/lib/path-types";
import { getExerciseSocket } from "@/lib/exercise-socket";
import { analytics } from "@/lib/analytics";
import { languageOptions, stubFor, ALL_LANGUAGES } from "@/lib/exercise-stubs";
import type { SubmissionResult } from "@/lib/data";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Exercise = any;

// The 13 runnable languages. `code` is what the gateway/executor expect,
// `label` is what the learner sees, `monaco` is the editor syntax id.
const LANGS: { code: string; label: string; monaco: string }[] = [
  { code: "node", label: "JavaScript", monaco: "javascript" },
  { code: "python", label: "Python", monaco: "python" },
  { code: "php", label: "PHP", monaco: "php" },
  { code: "ruby", label: "Ruby", monaco: "ruby" },
  { code: "java", label: "Java", monaco: "java" },
  { code: "c", label: "C", monaco: "c" },
  { code: "cpp", label: "C++", monaco: "cpp" },
  { code: "go", label: "Go", monaco: "go" },
  { code: "rust", label: "Rust", monaco: "rust" },
  { code: "csharp", label: "C#", monaco: "csharp" },
  { code: "kotlin", label: "Kotlin", monaco: "kotlin" },
  { code: "scala", label: "Scala", monaco: "scala" },
  { code: "perl", label: "Perl", monaco: "perl" },
];
const LANG_BY_CODE = (c: string) => LANGS.find((l) => l.code === String(c).toLowerCase());

// Monaco syntax ids for every code the any-language selector may offer.
// Falls back to LANGS (then the code itself) for anything not listed here.
const MONACO_BY_CODE: Record<string, string> = {
  node: "javascript",
  kotlin: "kotlin",
};
const monacoForCode = (c: string) =>
  MONACO_BY_CODE[c] ?? LANG_BY_CODE(c)?.monaco ?? c;
// Display label for a code: prefer the IDE's LANGS label, then the
// any-language list, then the raw code.
const labelForCode = (c: string) =>
  LANG_BY_CODE(c)?.label ??
  ALL_LANGUAGES.find((l) => l.value === c)?.label ??
  c;

// Editor surface matches the chrome (#171B26) so the panel reads as one piece.
const EDITOR_BG = "#171B26";

type OutTab = "Output" | "Input" | "Tests";
interface TestResult {
  description?: string;
  passed: boolean;
}

// Draggable gutter — no grip icon, a small gap (page bg shows through) that
// highlights on hover, giving each pane a little breathing room.
function Handle({ vertical }: { vertical?: boolean }) {
  return (
    <ResizableHandle
      className={
        vertical
          ? "h-2 w-full bg-background data-[panel-group-orientation=vertical]:h-2 data-[panel-group-orientation=vertical]:w-full hover:bg-primary/40 active:bg-primary/60"
          : "w-2 bg-background hover:bg-primary/40 active:bg-primary/60"
      }
    />
  );
}

export function PathExerciseIde({
  step,
  exercise,
  onComplete,
  onPassed: _onPassed,
  onContinue: _onContinue,
}: {
  step: PathSessionStep;
  exercise: Exercise;
  onComplete: (stepId: string) => void;
  // Threaded through from ExerciseStep; Task 4 will wire these to replace
  // the onComplete call once the Continue button is added.
  onPassed?: (stepId: string, payload?: Record<string, unknown>) => void;
  onContinue?: () => void;
}) {
  const store = useAppStore();
  const currentUser = useUserStore((s) => s.user);
  const editorRef = useRef<unknown>(null);
  const pendingId = useRef<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The in-flight plain-run id (from run:started). Separate from grading's
  // pendingId so run:result and submission:result never cross-talk.
  const runIdRef = useRef<string | null>(null);

  const [code, setCode] = useState<string>("");
  const [collapsed, setCollapsed] = useState(false);
  const [outputOpen, setOutputOpen] = useState(true);
  const [editorTheme, setEditorTheme] = useState<"mb-dark" | "mb-light">(
    "mb-dark",
  );
  // Languages the learner may pick (f3 — any-language selector):
  // - TEST_CASES -> locked to the single authored language.
  // - OUTPUT_MATCH -> all 13.
  // - FUNCTION_CALL -> all 13 if graderConfig.signature present, else the 5
  //   dynamic langs (static langs can't be graded without a signature).
  const graderType: string = exercise?.graderType ?? "OUTPUT_MATCH";
  const isTestCases = graderType === "TEST_CASES";
  const langOptions = languageOptions(graderType, exercise ?? {}).map(
    (o) => o.value,
  );
  const lockLanguage = isTestCases || langOptions.length <= 1;

  // `language` is a lowercase code (e.g. "node", "cpp"). Default to the
  // authored native language (so its starterCode shows) when it's offered,
  // else the first available option.
  const [language, setLanguage] = useState<string>(() => {
    const native = Array.isArray(exercise?.languages)
      ? String(exercise.languages[0] ?? "").toLowerCase()
      : "";
    if (native && langOptions.includes(native)) return native;
    return langOptions[0] ?? "python";
  });
  const [showHint, setShowHint] = useState(false);
  // Below lg the three-pane horizontal split is too cramped — stack vertically.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => {
      setNarrow(mq.matches);
      // On narrow screens give the editor the room: start with the
      // instructions collapsed (the learner can reopen them any time).
      setCollapsed(mq.matches);
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [outTab, setOutTab] = useState<OutTab>("Output");
  const [output, setOutput] = useState<string>("");
  const [tests, setTests] = useState<TestResult[]>([]);
  // stdin piped to the program on a plain "Run" (exercise:run). One value per
  // line; persisted across runs but reset when the exercise changes.
  const [stdin, setStdin] = useState<string>("");
  // F4 — streaming phase status and per-check stdout blocks.
  // `phaseStatus` is null when no run is in flight; a human-readable string otherwise.
  // `streamChecks` accumulates visible per-check stdout chunks while running.
  const [phaseStatus, setPhaseStatus] = useState<string | null>(null);
  const [streamChecks, setStreamChecks] = useState<
    { index: number; name: string; stdout: string }[]
  >([]);
  // `passed` is set on a successful submit OR pre-populated from userSubmission.
  const [passed, setPassed] = useState<boolean>(
    () => exercise?.userSubmission?.passed === true,
  );
  // bestScore shown in the Passed badge — comes from userSubmission or the last
  // graded result (updated when a submit comes back PASSED).
  const [bestScore, setBestScore] = useState<number | undefined>(
    () => exercise?.userSubmission?.bestScore,
  );
  const [attempts, setAttempts] = useState<number>(() => exercise?.attempts ?? 0);
  const [maxAttempts, setMaxAttempts] = useState<number>(
    () => exercise?.maxAttempts ?? Infinity,
  );
  const [attemptsResetAt, setAttemptsResetAt] = useState<Date | null>(() =>
    exercise?.attemptsResetAt ? new Date(exercise.attemptsResetAt) : null,
  );

  const monacoLanguage = monacoForCode(language);
  const windowExpired = attemptsResetAt ? attemptsResetAt.getTime() <= Date.now() : true;
  const exhausted = !passed && !windowExpired && attempts >= maxAttempts;

  function formatCountdown(target: Date | null): string {
    if (!target) return "";
    const ms = target.getTime() - Date.now();
    if (ms <= 0) return "now";
    const totalMinutes = Math.ceil(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }
  // `dirty` tracks whether the learner has edited the editor beyond the
  // current stub/starter. Switching language clobbers content only when the
  // editor is at a stub (not dirty); otherwise we confirm first.
  const dirtyRef = useRef(false);
  // The stub/starter currently seeded into the editor — used to decide
  // whether an onChange counts as a learner edit.
  const currentStubRef = useRef<string>("");
  // `language` is already the lowercase code the gateway/executor expect.
  const langCode = language;
  const exerciseId: string =
    exercise?.id ?? exercise?.exerciseId ?? step.itemId;
  const points: number | undefined = exercise?.points;
  // Hint cost comes from the exercise field; fall back to 30 MB.
  const hintCost: number = exercise?.hintCost ?? 30;
  const hintHtml: string = exercise?.hint ?? exercise?.hints?.[0] ?? "";
  // Track whether the hint has been taken (paid) this session or was pre-paid.
  const [hintTaken, setHintTaken] = useState<boolean>(
    () => exercise?.hintTaken === true,
  );
  // Insufficient-MB modal state
  const [insufficientModal, setInsufficientModal] = useState<{
    open: boolean;
    shortfall: number;
  }>({ open: false, shortfall: 0 });
  const [hintLoading, setHintLoading] = useState(false);

  useEffect(() => {
    const sub = exercise?.userSubmission;
    if (sub?.code) {
      // Returning learner: seed editor with their saved solution (f1).
      setCode(sub.code);
      if (sub.language) setLanguage(String(sub.language).toLowerCase());
      setPassed(sub.passed === true);
      setBestScore(sub.bestScore);
      // Saved code is the learner's own — treat as untouched baseline so
      // switching away then back doesn't prompt a needless confirm.
      currentStubRef.current = sub.code;
    } else {
      const starter = exercise?.starterCode ?? "";
      setCode(starter);
      setPassed(false);
      setBestScore(undefined);
      currentStubRef.current = starter;
    }
    setAttempts(exercise?.attempts ?? 0);
    setMaxAttempts(exercise?.maxAttempts ?? Infinity);
    setAttemptsResetAt(exercise?.attemptsResetAt ? new Date(exercise.attemptsResetAt) : null);
    dirtyRef.current = false;
    setOutput("");
    setTests([]);
    setStdin("");
    setShowHint(false);
    setHintTaken(exercise?.hintTaken === true);
  }, [exercise]);

  // Academy exercise gateway. Run Code + Submit Answer both emit
  // exercise:submit (the backend grades every case); the mode flag decides
  // whether a PASS completes the step.
  useEffect(() => {
    const socket = getExerciseSocket();

    const onQueued = (p: { submissionId: string }) => {
      pendingId.current = p.submissionId;
      // Practice runs use an ephemeral id with no DB row — nothing to poll, so
      // skip the fallback (it would 404 "submission not found"). Only persisted
      // submissions get the poll safety net.
      if (!p.submissionId.startsWith("run_")) {
        pollTimer.current = setTimeout(() => pollOnce(p.submissionId), 8000);
      }
    };
    const onResult = (r: SubmissionResult) => {
      if (r.submissionId !== pendingId.current) return;
      finish(r);
    };
    const onErr = (e: {
      message: string;
      attempts?: number;
      maxAttempts?: number;
      attemptsResetAt?: string | null;
    }) => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
      pendingId.current = null;
      setRunning(false);
      setSubmitting(false);
      setOutputOpen(true);
      setOutTab("Output");
      setOutput(e.message || "Execution error.");
      toast.error(e.message || "Execution error.");
      if (e.attempts != null) setAttempts(e.attempts);
      if (e.maxAttempts != null) setMaxAttempts(e.maxAttempts);
      if (e.attemptsResetAt !== undefined) {
        setAttemptsResetAt(e.attemptsResetAt ? new Date(e.attemptsResetAt) : null);
      }
    };

    const onAttempts = (p: {
      exerciseId: string;
      attempts: number;
      maxAttempts: number;
      attemptsResetAt: string | null;
    }) => {
      if (p.exerciseId !== exerciseId) return;
      setAttempts(p.attempts);
      setMaxAttempts(p.maxAttempts);
      setAttemptsResetAt(p.attemptsResetAt ? new Date(p.attemptsResetAt) : null);
    };

    // F4 — streaming phase marker: update the status line for the in-flight submission.
    const onPhase = (p: { submissionId: string; phase: string }) => {
      if (p.submissionId !== pendingId.current) return; // ignore stale
      switch (p.phase) {
        case "queued":
          setPhaseStatus("Queued…");
          break;
        case "compiling":
          setPhaseStatus("Compiling…");
          break;
        case "running":
          setPhaseStatus("Running…");
          break;
        case "done":
          // "done" immediately precedes submission:result; keep visible briefly
          setPhaseStatus("Done");
          break;
        default:
          break;
      }
    };

    // F4 — per-check streaming: append each visible check's stdout as it arrives.
    const onCheck = (c: {
      submissionId: string;
      index: number;
      total: number;
      name: string;
      passed: boolean;
      stdout: string;
      hidden: boolean;
    }) => {
      if (c.submissionId !== pendingId.current) return; // ignore stale
      // Update running count in status line
      setPhaseStatus(`Running… (${c.index + 1}/${c.total})`);
      // Skip empty stdout (hidden checks or checks with no output)
      if (!c.stdout) return;
      setStreamChecks((prev) => [
        ...prev,
        { index: c.index, name: c.name, stdout: c.stdout },
      ]);
    };

    // Plain-run path (exercise:run) — ungraded, streams stdout/stderr straight
    // back. Kept fully separate from grading above so the two never cross-talk.
    const onRunStarted = (p: { runId: string }) => {
      runIdRef.current = p.runId;
    };
    const onRunResult = (r: {
      runId: string;
      stdout: string;
      stderr: string;
      exitCode?: number;
      timedOut?: boolean;
      timeMs?: number;
      error?: string;
    }) => {
      if (r.runId !== runIdRef.current) return; // ignore stale
      runIdRef.current = null;
      setRunning(false);
      setOutputOpen(true);
      setOutTab("Output");
      if (r.error) {
        setOutput(r.error);
        return;
      }
      const parts: string[] = [];
      if (r.stdout) parts.push(r.stdout);
      if (r.stderr) parts.push(`stderr:\n${r.stderr}`);
      if (r.timedOut) parts.push("— Timed out.");
      else parts.push(`— Exit ${r.exitCode ?? 0}${r.timeMs != null ? ` · ${r.timeMs}ms` : ""}`);
      setOutput(parts.filter(Boolean).join("\n\n") || "(no output)");
    };
    const onRunError = (e: { message: string }) => {
      runIdRef.current = null;
      setRunning(false);
      setOutputOpen(true);
      setOutTab("Output");
      setOutput(e.message || "Execution error.");
      toast.error(e.message || "Execution error.");
    };

    socket.on("submission:queued", onQueued);
    socket.on("submission:result", onResult);
    socket.on("submission:error", onErr);
    socket.on("exercise:attempts", onAttempts);
    socket.on("exercise:phase", onPhase);
    socket.on("exercise:check", onCheck);
    socket.on("run:started", onRunStarted);
    socket.on("run:result", onRunResult);
    socket.on("run:error", onRunError);
    return () => {
      socket.off("submission:queued", onQueued);
      socket.off("submission:result", onResult);
      socket.off("submission:error", onErr);
      socket.off("exercise:attempts", onAttempts);
      socket.off("exercise:phase", onPhase);
      socket.off("exercise:check", onCheck);
      socket.off("run:started", onRunStarted);
      socket.off("run:result", onRunResult);
      socket.off("run:error", onRunError);
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pollOnce(submissionId: string) {
    const sub = await store.getSubmissionStatus(exerciseId, submissionId);
    if (sub && ["PASSED", "FAILED", "ERROR"].includes(sub.status)) {
      finish({
        submissionId,
        status: sub.status,
        score: sub.score,
        passedCount: sub.passedCount,
        totalCount: sub.totalCount,
        caseResults: sub.caseResults ?? [],
        stderr: sub.stderr ?? undefined,
      });
    }
  }

  function finish(r: SubmissionResult) {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    pendingId.current = null;
    setRunning(false);
    setSubmitting(false);
    // F4 — clear streaming state on final result
    setPhaseStatus(null);
    setStreamChecks([]);

    setTests(
      (r.caseResults ?? []).map((c) => ({ description: c.name, passed: c.passed })),
    );
    // Output tab = the program's real stdout per case (+ stderr + a summary),
    // so learners see their logs/output, not just the score.
    const stdoutBlocks = (r.caseResults ?? [])
      .filter((c) => c.gotPreview != null && c.gotPreview !== "")
      .map((c) => `▸ ${c.name}\n${c.gotPreview}`)
      .join("\n\n");
    setOutput(
      r.status === "ERROR"
        ? r.error || r.stderr || "Execution error."
        : [
            stdoutBlocks,
            r.stderr ? `stderr:\n${r.stderr}` : "",
            `— ${r.status} ${r.score}% (${r.passedCount}/${r.totalCount})`,
          ]
            .filter(Boolean)
            .join("\n\n"),
    );

    if (r.status === "PASSED") {
      toast.success("Nice work — answer accepted!");
      // Set local passed state (shows Continue button + Passed badge) and
      // record completion WITHOUT navigating. Navigation happens when the
      // learner clicks the Continue → button.
      setPassed(true);
      setBestScore(r.score);
      _onPassed?.(step.id);
    } else if (r.status === "ERROR") {
      toast.error("Execution error. Check the output and try again.");
    } else {
      toast.error("Some tests failed. Check the Tests tab and try again.");
    }
  }

  // Run Code — a plain, ungraded execution. Pipes the learner's stdin to their
  // program and streams stdout/stderr straight back (exercise:run), no grading.
  const run = () => {
    if (!exerciseId || running || submitting) return;
    runIdRef.current = null;
    setRunning(true);
    setOutputOpen(true);
    setOutput("");
    setTests([]);
    setOutTab("Output");
    // Clear any grading-stream leftovers so the plain run reads clean.
    setPhaseStatus(null);
    setStreamChecks([]);
    analytics.track("exercise_run", { exerciseId, language: langCode });
    getExerciseSocket().emit("exercise:run", {
      exerciseId,
      language: langCode,
      code,
      stdin,
    });
  };

  const submit = () => {
    if (!exerciseId || running || submitting) return;
    setSubmitting(true);
    setOutputOpen(true);
    setOutput("");
    setTests([]);
    setOutTab("Tests");
    // F4 — reset streaming state on each new submit
    setPhaseStatus(null);
    setStreamChecks([]);
    analytics.track("exercise_submitted", { exerciseId, language: langCode });
    getExerciseSocket().emit("exercise:submit", { exerciseId, language: langCode, code, mode: "submit" });
  };

  const reset = () => {
    const starter = stubFor(graderType, language, exercise ?? {});
    setCode(starter);
    currentStubRef.current = starter;
    dirtyRef.current = false;
    setOutput("");
    setTests([]);
  };

  // Switch the editor language and re-seed its contents:
  // - saved submission for that language wins (f1 precedence);
  // - else if the learner has edited, confirm before replacing;
  // - else swap in the generated stub for the new language.
  const switchLanguage = (newLang: string) => {
    if (newLang === language) return;
    const sub = exercise?.userSubmission;
    const savedForLang =
      sub?.code && String(sub.language).toLowerCase() === newLang
        ? sub.code
        : null;
    const newStub = savedForLang ?? stubFor(graderType, newLang, exercise ?? {});

    if (
      !savedForLang &&
      dirtyRef.current &&
      typeof window !== "undefined" &&
      !window.confirm("Switching languages will replace your code. Continue?")
    ) {
      return; // learner cancelled — keep current language + code
    }

    setLanguage(newLang);
    setCode(newStub);
    currentStubRef.current = newStub;
    dirtyRef.current = false;
  };

  const instructionsHtml = exercise?.instructions
    ? sanitizeHtml(String(exercise.instructions))
    : "";

  const editor = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md" style={{ background: EDITOR_BG }}>
      {/* Editor header */}
      <div
        className="flex flex-shrink-0 items-center justify-between border-b border-border px-3 py-2"
        style={{ background: EDITOR_BG }}
      >
        <div className="flex items-center gap-3">
          {collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="text-muted-foreground hover:text-foreground"
              title="Show instructions"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}
          <select
            value={language}
            onChange={(e) => switchLanguage(e.target.value)}
            disabled={lockLanguage}
            aria-label="Programming language"
            className="rounded border border-white/15 bg-[#2A3042] px-2 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-70"
            title={lockLanguage ? "This exercise uses a fixed language" : "Language"}
          >
            {langOptions.map((c) => (
              <option key={c} value={c}>
                {labelForCode(c)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() =>
            setEditorTheme((t) => (t === "mb-dark" ? "mb-light" : "mb-dark"))
          }
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-white/5 hover:text-foreground"
        >
          {editorTheme === "mb-dark" ? (
            <>
              <Sun className="h-3.5 w-3.5" /> Light Mode
            </>
          ) : (
            <>
              <Moon className="h-3.5 w-3.5" /> Dark Mode
            </>
          )}
        </button>
      </div>

      {/* Monaco */}
      <div className="min-h-0 w-full min-w-0 flex-1" style={{ background: EDITOR_BG }}>
        <Editor
          language={monacoLanguage}
          theme={editorTheme}
          value={code}
          onChange={(v) => {
            const next = v ?? "";
            setCode(next);
            // Any divergence from the seeded stub/starter is a learner edit.
            if (next !== currentStubRef.current) dirtyRef.current = true;
          }}
          beforeMount={(monaco) => {
            monaco.editor.defineTheme("mb-dark", {
              base: "vs-dark",
              inherit: true,
              rules: [],
              colors: {
                "editor.background": EDITOR_BG,
                "editorGutter.background": EDITOR_BG,
                "minimap.background": EDITOR_BG,
                "editorWidget.background": EDITOR_BG,
              },
            });
            monaco.editor.defineTheme("mb-light", {
              base: "vs",
              inherit: true,
              rules: [],
              colors: { "editor.background": "#ffffff" },
            });
          }}
          onMount={(ed) => {
            editorRef.current = ed;
            ed.updateOptions({
              fontSize: 14,
              fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace",
              lineHeight: 1.6,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              padding: { top: 12 },
            });
          }}
        />
      </div>

      {/* Editor footer controls — no top border, blends with editor */}
      <div
        className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 px-3 py-2"
        style={{ background: EDITOR_BG }}
      >
        {!outputOpen ? (
          <button
            type="button"
            onClick={() => setOutputOpen(true)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-200"
          >
            <Terminal className="h-3.5 w-3.5" /> Show output
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={reset}
            className="h-9 w-9 border-border bg-transparent text-slate-300 hover:text-foreground"
            title="Reset code"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={run}
            disabled={running || submitting}
            className="h-9 border-border bg-transparent text-slate-200 hover:text-foreground"
          >
            {running ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-1.5 h-4 w-4" />
            )}
            Run Code
          </Button>
          <Button
            onClick={submit}
            disabled={running || submitting || exhausted}
            className="h-9 bg-gradient-to-br from-primary to-[#2BB8D8] font-bold text-[#06222b] hover:brightness-110"
          >
            {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Submit Answer
          </Button>
          {exhausted && (
            <span className="text-[11px] text-muted-foreground">
              Max attempts reached. Try again in {formatCountdown(attemptsResetAt)}.
            </span>
          )}
          {(passed || exhausted) && (
            <Button
              onClick={() => _onContinue?.()}
              className="h-9 bg-emerald-500 font-bold text-white hover:bg-emerald-600"
            >
              Continue →
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const outputPanel = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md bg-[#10131d]">
      <div className="flex flex-shrink-0 items-center justify-between bg-[#171B26] px-3 py-2">
        <div className="flex items-center gap-5">
          {(["Output", "Input", "Tests"] as OutTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setOutTab(t)}
              className={`text-xs transition-colors ${
                outTab === t
                  ? "font-semibold text-slate-100"
                  : "font-medium text-slate-500 hover:text-slate-300"
              }`}
            >
              {t === "Tests" && tests.length
                ? `Tests (${tests.filter((x) => x.passed).length}/${tests.length})`
                : t === "Input"
                  ? stdin.trim()
                    ? "Input •"
                    : "Input"
                  : t}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOutputOpen(false)}
          className="text-slate-400 hover:text-slate-200"
          title="Close output"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-[12px] leading-relaxed text-slate-300">
        {outTab === "Output" ? (
          <>
            {/* F4 — live phase status line (visible while a run is in flight) */}
            {phaseStatus != null && (
              <div
                data-testid="exercise-phase-status"
                className="mb-2 flex items-center gap-2 text-[11px] text-slate-400"
              >
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{phaseStatus}</span>
              </div>
            )}
            {/* F4 — progressive per-check stdout blocks */}
            {streamChecks.map((c) => (
              <div key={c.index} className="mb-3">
                <div className="mb-1 text-[11px] font-semibold text-slate-400">
                  Check {c.index + 1} — {c.name}
                </div>
                <pre className="whitespace-pre-wrap text-slate-300">{c.stdout}</pre>
              </div>
            ))}
            {/* Final / static output (set by finish()) */}
            {output ? (
              <pre className="whitespace-pre-wrap">{output}</pre>
            ) : !phaseStatus && streamChecks.length === 0 ? (
              <span className="text-slate-500">
                Run your code to see the output here.
              </span>
            ) : null}
          </>
        ) : outTab === "Input" ? (
          <div className="flex h-full flex-col">
            <label
              htmlFor="exercise-stdin"
              className="mb-2 block text-[11px] font-medium text-slate-400"
            >
              Standard input (stdin) — piped to your program when you Run.
            </label>
            <textarea
              id="exercise-stdin"
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              spellCheck={false}
              placeholder="Type input for your program (stdin), one value per line"
              className="min-h-0 w-full flex-1 resize-none rounded-md border border-white/10 bg-[#171B26] p-3 font-mono text-[12px] leading-relaxed text-slate-200 placeholder:text-slate-600 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/60"
            />
          </div>
        ) : tests.length ? (
          <ul className="space-y-1.5">
            {tests.map((t, i) => (
              <li key={i} className="flex items-center gap-2">
                {t.passed ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#5fb0b0]" />
                ) : (
                  <XCircle className="h-4 w-4 flex-shrink-0 text-[#EB5757]" />
                )}
                <span className="text-slate-300">
                  {t.description ?? `Test ${i + 1}`}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-slate-500">Submit to run the tests.</span>
        )}
      </div>
    </div>
  );

  const instructions = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-border bg-card">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-muted/30 px-4 py-2.5">
        <span className="text-sm font-semibold">Exercise</span>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="text-muted-foreground hover:text-foreground"
          title="Collapse"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="flex items-start gap-2">
          <h1 className="flex-1 text-lg font-bold leading-snug">
            {exercise?.title ?? step.title}
          </h1>
          {passed && (
            <span className="mt-0.5 flex-shrink-0 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 ring-1 ring-emerald-500/40">
              Passed ✓{bestScore != null ? ` ${bestScore}%` : ""}
            </span>
          )}
        </div>
        {exercise?.description && (
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            {exercise.description}
          </p>
        )}

        {/* Separator between description and instructions */}
        <div className="my-5 h-px bg-border" />

        <div className="rounded-lg border border-border">
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              Instructions
            </span>
            {points != null && (
              <span className="rounded-full bg-[#F2C94C] px-2 py-0.5 text-[10px] font-extrabold text-[#3d2e00]">
                {points} XP
              </span>
            )}
          </div>
          <div className="p-3">
            {instructionsHtml ? (
              <div
                className="text-[13px] leading-relaxed text-foreground [&_li]:ml-4 [&_li]:list-disc [&_li]:py-0.5 [&_ol]:space-y-1 [&_ul]:space-y-1 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[12px]"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(instructionsHtml) }}
              />
            ) : (
              <p className="text-[13px] text-muted-foreground">
                Complete the code, then submit.
              </p>
            )}
          </div>
        </div>

        {hintHtml && (
          <div className="mt-4">
            {showHint ? (
              <div
                className="rounded-lg border border-[#F2C94C]/40 bg-[#F2C94C]/10 p-3 text-[13px] leading-relaxed text-foreground"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(hintHtml) }}
              />
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={hintLoading}
                onClick={async () => {
                  // If already paid (persisted or this session), just reveal.
                  if (hintTaken) {
                    setShowHint(true);
                    return;
                  }
                  setHintLoading(true);
                  try {
                    const r = await store.takeExerciseHint(exerciseId);
                    if (r && "error" in r && r.error === "INSUFFICIENT") {
                      setInsufficientModal({ open: true, shortfall: r.shortfall });
                    } else if (r && "points" in r) {
                      setShowHint(true);
                      setHintTaken(true);
                      store.syncUserSnapshot({
                        points: r.points,
                        level: currentUser?.level ?? 0,
                      });
                    }
                  } finally {
                    setHintLoading(false);
                  }
                }}
                className="gap-1.5"
              >
                {hintLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Lightbulb className="h-3.5 w-3.5 text-[#caa000]" />
                )}
                {hintTaken ? "Show Hint" : `Take Hint`}
                {!hintTaken && (
                  <span className="font-bold text-[#a87900]">−{hintCost} MB</span>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full min-h-0 w-full p-2">
      <ResizablePanelGroup
        // Remount when orientation or pane count changes — required by the lib.
        key={`${narrow ? "v" : "h"}-${collapsed ? "c" : "o"}`}
        orientation={narrow ? "vertical" : "horizontal"}
        className="h-full"
      >
        {/* Instructions — left on wide screens, top on narrow ones */}
        {!collapsed && (
          <>
            <ResizablePanel
              defaultSize={narrow ? "30" : "34"}
              minSize={narrow ? "14" : "22"}
              maxSize={narrow ? "60" : "48"}
              className="min-h-0"
            >
              {instructions}
            </ResizablePanel>
            <Handle vertical={narrow} />
          </>
        )}

        {/* Editor (+ output stacked below it) */}
        <ResizablePanel
          defaultSize={collapsed ? "100" : narrow ? "70" : "66"}
          className="min-h-0"
        >
          {outputOpen ? (
            <ResizablePanelGroup orientation="vertical" className="h-full">
              <ResizablePanel defaultSize="62" minSize="25" className="min-h-0">
                {editor}
              </ResizablePanel>
              <Handle vertical />
              <ResizablePanel defaultSize="38" minSize="12" className="min-h-0">
                {outputPanel}
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            editor
          )}
        </ResizablePanel>
      </ResizablePanelGroup>

      <InsufficientMbModal
        open={insufficientModal.open}
        shortfall={insufficientModal.shortfall}
        onClose={() => setInsufficientModal((s) => ({ ...s, open: false }))}
      />
    </div>
  );
}
