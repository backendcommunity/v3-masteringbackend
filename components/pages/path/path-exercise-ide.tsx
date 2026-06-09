"use client";

import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import DOMPurify from "isomorphic-dompurify";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useAppStore } from "@/lib/store";
import { PathSessionStep } from "@/lib/path-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Exercise = any;

const EXT: Record<string, string> = {
  python: "py",
  javascript: "js",
  node: "js",
  typescript: "ts",
  java: "java",
  go: "go",
  ruby: "rb",
  php: "php",
  c: "c",
  cpp: "cpp",
  csharp: "cs",
};

type OutTab = "Output" | "Tests";

interface TestResult {
  description?: string;
  passed: boolean;
}

export function PathExerciseIde({
  step,
  exercise,
  onComplete,
}: {
  step: PathSessionStep;
  exercise: Exercise;
  onComplete: (stepId: string) => void;
}) {
  const store = useAppStore();
  const { theme } = useTheme();
  const editorRef = useRef<unknown>(null);

  const [code, setCode] = useState<string>("");
  const [collapsed, setCollapsed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [outTab, setOutTab] = useState<OutTab>("Output");
  const [output, setOutput] = useState<string>("");
  const [tests, setTests] = useState<TestResult[]>([]);

  const language: string = exercise?.language ?? "python";
  const filename = `script.${EXT[language] ?? "txt"}`;
  const points: number | undefined = exercise?.points;
  const hintHtml: string = exercise?.hint ?? exercise?.hints?.[0] ?? "";

  useEffect(() => {
    setCode(exercise?.starterCode ?? "");
    setOutput("");
    setTests([]);
    setShowHint(false);
  }, [exercise]);

  const run = async () => {
    setRunning(true);
    setOutTab("Output");
    try {
      const data = await store.executeCode({ language, code: btoa(code) });
      const out =
        data?.stdout || data?.stderr || data?.output || "Code ran with no output.";
      setOutput(typeof out === "string" ? out : JSON.stringify(out, null, 2));
      const cases: { description?: string }[] = exercise?.testCases ?? [];
      if (cases.length) {
        const ok = !data?.stderr;
        setTests(cases.map((c) => ({ description: c.description, passed: ok })));
      }
    } catch {
      setOutput("Failed to reach the execution service. Try again.");
    } finally {
      setRunning(false);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    setOutTab("Tests");
    try {
      const data = await store.executeCode({ language, code: btoa(code) });
      const ok = !data?.stderr;
      const cases: { description?: string }[] = exercise?.testCases ?? [];
      setTests(
        cases.length
          ? cases.map((c) => ({ description: c.description, passed: ok }))
          : [{ description: "Solution accepted", passed: ok }],
      );
      setOutput(data?.stdout || data?.stderr || "");
      if (ok) {
        toast.success("Nice work — answer accepted!");
        onComplete(step.id);
      } else {
        toast.error("Your code has errors. Check the output and try again.");
      }
    } catch {
      toast.error("Could not submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setCode(exercise?.starterCode ?? "");
    setOutput("");
    setTests([]);
  };

  const instructionsHtml = exercise?.instructions
    ? DOMPurify.sanitize(String(exercise.instructions))
    : "";

  return (
    <div className="h-full min-h-0 w-full p-3">
      <div className="h-full min-h-0 overflow-hidden rounded-2xl border border-border">
        <ResizablePanelGroup orientation="horizontal" className="h-full">
          {/* LEFT — instructions */}
          {!collapsed && (
            <>
              <ResizablePanel
                defaultSize="34"
                minSize="22"
                maxSize="48"
                className="min-h-0"
              >
                <div className="flex h-full min-h-0 flex-col bg-card">
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

                  <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                    <h1 className="text-lg font-bold leading-snug">
                      {exercise?.title ?? step.title}
                    </h1>
                    {exercise?.description && (
                      <p className="text-[13px] leading-relaxed text-muted-foreground">
                        {exercise.description}
                      </p>
                    )}

                    <div className="rounded-lg border border-border">
                      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                          Instructions
                        </span>
                        {points != null && (
                          <span className="rounded-full bg-[#F2C94C]/15 px-2 py-0.5 text-[10px] font-bold text-[#caa42f]">
                            {points} XP
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        {instructionsHtml ? (
                          <div
                            className="text-[13px] leading-relaxed text-foreground [&_li]:ml-4 [&_li]:list-disc [&_li]:py-0.5 [&_ol]:space-y-1 [&_ul]:space-y-1 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[12px]"
                            dangerouslySetInnerHTML={{ __html: instructionsHtml }}
                          />
                        ) : (
                          <p className="text-[13px] text-muted-foreground">
                            Complete the code on the right, then submit.
                          </p>
                        )}
                      </div>
                    </div>

                    {hintHtml && (
                      <div>
                        {showHint ? (
                          <div
                            className="rounded-lg border border-[#F2C94C]/30 bg-[#F2C94C]/10 p-3 text-[13px] leading-relaxed text-foreground"
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(hintHtml),
                            }}
                          />
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowHint(true)}
                            className="gap-1.5"
                          >
                            <Lightbulb className="h-3.5 w-3.5" /> Take Hint
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}

          {/* RIGHT — editor + output */}
          <ResizablePanel defaultSize={collapsed ? "100" : "66"} className="min-h-0">
            <ResizablePanelGroup orientation="vertical" className="h-full">
              {/* Editor */}
              <ResizablePanel defaultSize="62" minSize="30" className="min-h-0">
                <div className="flex h-full min-h-0 flex-col bg-[#1E2330]">
                  <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-[#171B26] px-3 py-2">
                    <div className="flex items-center gap-2">
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
                      <span className="text-xs font-medium text-slate-300">
                        {filename}
                      </span>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1">
                    <Editor
                      language={language === "node" ? "javascript" : language}
                      theme={theme === "light" ? "light" : "vs-dark"}
                      value={code}
                      onChange={(v) => setCode(v ?? "")}
                      onMount={(ed) => {
                        editorRef.current = ed;
                        ed.updateOptions({
                          fontSize: 14,
                          fontFamily:
                            "'JetBrains Mono','Fira Code',Consolas,monospace",
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

                  <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-border bg-[#171B26] px-3 py-2.5">
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
                      disabled={running}
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
                      disabled={submitting}
                      className="h-9 bg-gradient-to-br from-[#13AECE] to-[#2BB8D8] font-bold text-[#06222b] hover:brightness-110"
                    >
                      {submitting && (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      )}
                      Submit Answer
                    </Button>
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle />

              {/* Output / Tests */}
              <ResizablePanel defaultSize="38" minSize="0" className="min-h-0">
                <div className="flex h-full min-h-0 flex-col bg-[#10131d]">
                  <div className="flex flex-shrink-0 items-center gap-1 border-b border-border bg-[#171B26] px-3 py-1.5">
                    {(["Output", "Tests"] as OutTab[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setOutTab(t)}
                        className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                          outTab === t
                            ? "bg-primary/15 text-primary"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {t === "Tests" && tests.length
                          ? `Tests (${tests.filter((x) => x.passed).length}/${tests.length})`
                          : t}
                      </button>
                    ))}
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-[12px] leading-relaxed text-slate-300">
                    {outTab === "Output" ? (
                      output ? (
                        <pre className="whitespace-pre-wrap">{output}</pre>
                      ) : (
                        <span className="text-slate-500">
                          Run your code to see the output here.
                        </span>
                      )
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
                      <span className="text-slate-500">
                        Submit to run the tests.
                      </span>
                    )}
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
