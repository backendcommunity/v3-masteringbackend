"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Play, Loader2, Terminal, ChevronDown, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

const EDITOR_BG = "#0d1019";

const EXT: Record<string, string> = {
  python: "py",
  javascript: "js",
  typescript: "ts",
  java: "java",
  go: "go",
  rust: "rs",
  cpp: "cpp",
  sql: "sql",
};

// A compact, runnable code block embedded inside an article — a mini version of
// the exercise IDE for "try it" moments mid-lesson.
export function InlinePlayground({
  language = "python",
  code = "",
  title,
}: {
  language?: string;
  code?: string;
  title?: string;
}) {
  const store = useAppStore();
  const [value, setValue] = useState(code);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [open, setOpen] = useState(false);

  const monacoLanguage =
    language.toLowerCase() === "c++" ? "cpp" : language.toLowerCase();
  const filename = title ?? `main.${EXT[monacoLanguage] ?? "txt"}`;
  const lines = value.split("\n").length;
  const height = Math.min(320, Math.max(96, lines * 21 + 22));

  const run = async () => {
    setRunning(true);
    setOpen(true);
    try {
      const data = await store.executeCode({
        language: monacoLanguage,
        code: btoa(value),
      });
      const out =
        data?.stdout || data?.stderr || data?.output || "Ran with no output.";
      setOutput(typeof out === "string" ? out : JSON.stringify(out, null, 2));
    } catch {
      setOutput("Failed to reach the execution service. Try again.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div
      className="my-6 overflow-hidden rounded-xl border border-border"
      style={{ background: EDITOR_BG }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="flex items-center gap-2 text-[12px] font-medium text-slate-300">
          <Code2 className="h-3.5 w-3.5 text-slate-400" />
          {filename}
        </span>
        <span className="text-[11px] capitalize text-slate-500">{language}</span>
      </div>

      {/* Editor */}
      <Editor
        height={height}
        language={monacoLanguage}
        theme="mb-inline-dark"
        value={value}
        onChange={(v) => setValue(v ?? "")}
        beforeMount={(monaco) =>
          monaco.editor.defineTheme("mb-inline-dark", {
            base: "vs-dark",
            inherit: true,
            rules: [],
            colors: {
              "editor.background": EDITOR_BG,
              "editorGutter.background": EDITOR_BG,
            },
          })
        }
        onMount={(ed) =>
          ed.updateOptions({
            fontSize: 13,
            fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace",
            lineHeight: 1.55,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            padding: { top: 10, bottom: 10 },
            lineNumbersMinChars: 3,
            overviewRulerLanes: 0,
            scrollbar: { vertical: "auto", horizontalScrollbarSize: 8 },
          })
        }
      />

      {/* Run bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        {open ? (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-200"
          >
            <ChevronDown className="h-3.5 w-3.5" /> Hide output
          </button>
        ) : (
          <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Terminal className="h-3.5 w-3.5" /> Try it
          </span>
        )}
        <Button
          onClick={run}
          disabled={running}
          className="h-8 gap-1.5 rounded-lg bg-gradient-to-br from-[#13AECE] to-[#2BB8D8] px-4 text-[12px] font-bold text-[#06222b] hover:brightness-110"
        >
          {running ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          Run
        </Button>
      </div>

      {/* Output */}
      {open && (
        <div className="border-t border-white/10 bg-[#080a10] px-3 py-3">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Output
          </span>
          {output ? (
            <pre className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-slate-200">
              {output}
            </pre>
          ) : (
            <span className="text-[12px] text-slate-500">
              Run the code to see the output.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
