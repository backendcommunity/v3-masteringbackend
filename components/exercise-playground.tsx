"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Editor } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { CheckCircle, XCircle, Loader2, Play } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { languages as ALL_LANGUAGES } from "@/lib/languages";
import { analytics } from "@/lib/analytics";
import { getExerciseSocket } from "@/lib/exercise-socket";
import {
  allowedLanguages,
  defaultLanguage,
  monacoLang,
} from "@/lib/exercise-playground";
import type { Exercise, SubmissionResult } from "@/lib/data";

interface Props {
  exerciseId: string;
  onPassed?: (result: SubmissionResult) => void;
}

export function ExercisePlayground({ exerciseId, onPassed }: Props) {
  const store = useAppStore();
  const { theme } = useTheme();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [language, setLanguage] = useState<string>("node");
  const [code, setCode] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const pendingId = useRef<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load exercise + initial editor state.
  useEffect(() => {
    let active = true;
    (async () => {
      const ex: Exercise = await store.getExercise(exerciseId);
      if (!active || !ex) return;
      setExercise(ex);
      const lang = defaultLanguage(ex.language, ex.languages ?? [], ALL_LANGUAGES as any);
      setLanguage(lang);
      setCode(ex.starterCode ?? "");
    })();
    return () => {
      active = false;
    };
  }, [exerciseId]);

  const langOptions = useMemo(
    () => allowedLanguages(exercise?.languages ?? [], ALL_LANGUAGES as any),
    [exercise],
  );

  // Socket subscription.
  useEffect(() => {
    const socket = getExerciseSocket();

    const onQueued = (p: { submissionId: string }) => {
      pendingId.current = p.submissionId;
      // Poll fallback if the result socket event is lost.
      pollTimer.current = setTimeout(() => pollOnce(p.submissionId), 8000);
    };
    const onResult = (r: SubmissionResult) => {
      if (r.submissionId !== pendingId.current) return;
      finish(r);
    };
    const onErr = (e: { message: string }) => {
      // Clear the poll fallback so it can't overwrite this error ~8s later.
      if (pollTimer.current) clearTimeout(pollTimer.current);
      pendingId.current = null;
      setIsRunning(false);
      setResult({
        submissionId: pendingId.current ?? "",
        status: "ERROR",
        score: 0,
        passedCount: 0,
        totalCount: 0,
        caseResults: [],
        error: e.message,
      });
    };

    socket.on("submission:queued", onQueued);
    socket.on("submission:result", onResult);
    socket.on("submission:error", onErr);
    return () => {
      socket.off("submission:queued", onQueued);
      socket.off("submission:result", onResult);
      socket.off("submission:error", onErr);
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
        timeMs: sub.timeMs ?? undefined,
      });
    }
  }

  function finish(r: SubmissionResult) {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    pendingId.current = null;
    setResult(r);
    setIsRunning(false);
    if (r.status === "PASSED") onPassed?.(r);
  }

  function handleSubmit() {
    if (!exercise || isRunning) return;
    setIsRunning(true);
    setResult(null);
    analytics.track("exercise_submitted", { exerciseId, language });
    getExerciseSocket().emit("exercise:submit", { exerciseId, language, code });
  }

  if (!exercise) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <select
          className="rounded-md border bg-background px-2 py-1 text-sm"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          {langOptions.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleSubmit}
          disabled={isRunning}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {isRunning ? "Grading…" : "Run & Submit"}
        </button>
      </div>

      {/* Editor */}
      <div className="min-h-[320px] flex-1 overflow-hidden rounded-lg border">
        <Editor
          height="100%"
          language={monacoLang(language)}
          theme={theme?.includes("dark") ? "vs-dark" : "light"}
          value={code}
          onChange={(v) => setCode(v ?? "")}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>

      {/* Results */}
      {result && (
        <div className="rounded-lg border p-3">
          <div className="mb-2 flex items-center gap-2 font-medium">
            {result.status === "PASSED" ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <span>
              {result.status === "ERROR"
                ? "Execution error"
                : `${result.status} — ${result.score}% (${result.passedCount}/${result.totalCount})`}
            </span>
          </div>

          {result.error && <p className="text-sm text-red-600">{result.error}</p>}

          <div className="space-y-1">
            {(result.caseResults ?? []).map((c, i) => (
              <div key={`${c.name}-${i}`} className="flex items-center gap-2 text-sm">
                {c.passed ? (
                  <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-red-600" />
                )}
                <span>{c.name}</span>
                {c.timedOut && <span className="text-xs text-amber-600">(timed out)</span>}
                {!c.passed && c.gotPreview != null && (
                  <span className="text-xs text-muted-foreground">got: {c.gotPreview}</span>
                )}
              </div>
            ))}
          </div>

          {result.stderr && (
            <pre className="mt-2 max-h-32 overflow-auto rounded bg-muted p-2 text-xs text-red-600">
              {result.stderr}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
