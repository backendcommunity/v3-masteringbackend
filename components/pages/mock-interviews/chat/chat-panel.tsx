"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { ChatMessage, ChatInterviewSession } from "@/lib/store";
import { ChatMessageBubble } from "./chat-message";
import { ResultCard, ReportData } from "./result-card";

interface ChatPanelProps {
  messages: ChatMessage[];
  session: ChatInterviewSession | null;
  isComplete: boolean;
  isStreaming: boolean;
  onSend: (content: string) => void;
  resultsData?: ReportData | null;
  isLoadingResults?: boolean;
  resultsError?: string | null;
  onGetResults?: () => void;
  questionAnalysis?: Array<{ score: number; feedback: string }>;
  resultsRevealed?: boolean;
  centered?: boolean;
}

export function ChatPanel({
  messages,
  session,
  isComplete,
  isStreaming,
  onSend,
  resultsData,
  isLoadingResults,
  resultsError,
  onGetResults,
  questionAnalysis,
  resultsRevealed,
  centered,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Build a map of questionIndex → analysis for fast lookup
  const analysisMap = useMemo(() => {
    const map = new Map<number, { score: number; feedback: string }>();
    if (questionAnalysis) {
      questionAnalysis.forEach((a, i) => {
        map.set(i, a);
      });
    }
    return map;
  }, [questionAnalysis]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isComplete || isStreaming) return;
    setInput("");
    onSend(trimmed);
  };

  return (
    <div className={cn("flex flex-col h-full", centered && "max-w-2xl mx-auto w-full")}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => {
          const analysis =
            resultsRevealed && msg.role === "user"
              ? (analysisMap.get(msg.questionIndex) ?? null)
              : null;
          return (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              analysis={analysis}
            />
          );
        })}

        {/* Completion banner */}
        {isComplete && (
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-4 text-center space-y-3">
            <p className="text-sm font-semibold text-foreground">
              Interview complete
            </p>
            <p className="text-[12px] text-muted-foreground">
              Great work! Your session has ended.
            </p>

            {resultsData ? (
              <ResultCard data={resultsData} />
            ) : resultsError ? (
              <p className="text-xs text-red-500">{resultsError}</p>
            ) : (
              <Button
                size="sm"
                onClick={onGetResults}
                disabled={isLoadingResults}
                className="gap-1.5"
              >
                {isLoadingResults ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating…
                  </>
                ) : (
                  "Get your feedback"
                )}
              </Button>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border px-4 py-3 bg-background">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isComplete || isStreaming}
            placeholder={
              isComplete
                ? "Interview ended"
                : isStreaming
                  ? "Kap is responding…"
                  : "Type your answer…"
            }
            rows={1}
            className={cn(
              "flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              "min-h-[40px] max-h-[120px] overflow-y-auto leading-relaxed"
            )}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isComplete || isStreaming || !input.trim()}
            className="h-10 w-10 flex-shrink-0"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        {!isComplete && (
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            Press Enter to send · Shift+Enter for new line
          </p>
        )}
      </div>
    </div>
  );
}
