"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

interface CodeEditorPanelProps {
  onSendToKap: (code: string, language: string) => void;
  disabled?: boolean;
  savedCode?: string | null;
  savedLanguage?: string | null;
}

const LANGUAGES = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "Go",
  "Rust",
  "C++",
  "SQL",
];

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-[#1e1e1e]">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  ),
});

export function CodeEditorPanel({
  onSendToKap,
  disabled,
  savedCode,
  savedLanguage,
}: CodeEditorPanelProps) {
  const [language, setLanguage] = useState(savedLanguage || "JavaScript");
  const [code, setCode] = useState(savedCode || "");

  const monacoLanguage = language.toLowerCase().replace("c++", "cpp").replace("sql", "sql");

  const handleSend = () => {
    if (disabled) return;
    onSendToKap(code, language);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Language selector */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-[#1e1e1e]">
        <span className="text-xs text-muted-foreground">Language:</span>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={disabled}
          className="text-xs bg-[#2d2d2d] text-foreground border border-border rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="calc(100% - 0px)"
          language={monacoLanguage}
          value={code}
          theme="vs-dark"
          onChange={(val) => setCode(val ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            wordWrap: "on",
            readOnly: disabled,
            scrollBeyondLastLine: false,
            padding: { top: 8 },
          }}
        />
      </div>

      {/* Send button */}
      {!disabled && (
        <div className="flex items-center justify-end px-3 py-2 border-t border-border bg-background">
          <Button
            size="sm"
            onClick={handleSend}
            disabled={disabled || !code.trim()}
            className="gap-1.5 text-xs h-8"
          >
            <Send className="w-3.5 h-3.5" />
            Send to Kap
          </Button>
        </div>
      )}
    </div>
  );
}
