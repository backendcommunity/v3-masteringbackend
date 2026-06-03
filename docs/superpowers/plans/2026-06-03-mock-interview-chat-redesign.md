# Mock Interview Chat Interface Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix component interface mismatches, add resizable panels, starter code templates, and per-response score badges to the chat-based mock interview UI.

**Architecture:** Four frontend files are changed; backend is untouched. `chat-panel.tsx` is rewritten to match the interface `chat-interview-room.tsx` already uses. Missing exports (`TypingIndicator`, `StreamingMessage`) are added to `chat-message.tsx`. A drag-resizable divider is added to the room. The code editor gains language-specific starter templates.

**Tech Stack:** Next.js 15, React, TypeScript, Tailwind CSS, Monaco Editor, Excalidraw, Zustand store

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `components/pages/mock-interviews/chat/chat-message.tsx` | Modify | Message bubbles, TypingIndicator, StreamingMessage, score pill badge |
| `components/pages/mock-interviews/chat/chat-panel.tsx` | Rewrite | Chat list + input + inline results display |
| `components/pages/mock-interviews/chat/chat-interview-room.tsx` | Modify | Main container + resizable divider |
| `components/pages/mock-interviews/chat/code-editor-panel.tsx` | Modify | Monaco editor + starter templates |

---

### Task 1: Add missing exports to `chat-message.tsx` + score pill badge

**Files:**
- Modify: `components/pages/mock-interviews/chat/chat-message.tsx`

- [ ] **Step 1.1: Replace the full file with the updated version**

```tsx
"use client";

import DOMPurify from "isomorphic-dompurify";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/lib/store";

interface ChatMessageProps {
  message: ChatMessage;
  analysis?: { score: number; feedback: string } | null;
  isStreaming?: boolean;
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Average";
  return "Below Average";
}

function getScorePillClass(score: number): string {
  if (score >= 70)
    return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
  if (score >= 50)
    return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
  return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
}

export function ChatMessageBubble({ message, analysis, isStreaming }: ChatMessageProps) {
  const isAI = message.role === "ai";

  return (
    <div className={cn("flex gap-2 w-full px-4 py-1.5", isAI ? "justify-start" : "justify-end")}>
      {/* AI avatar */}
      {isAI && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center mt-0.5">
          <span className="text-[11px] font-bold text-primary-foreground">K</span>
        </div>
      )}

      <div className={cn("flex flex-col gap-1 max-w-[80%]", isAI ? "items-start" : "items-end")}>
        {/* Message bubble */}
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
            isAI
              ? "bg-transparent text-foreground"
              : cn(
                  "bg-muted text-foreground",
                  analysis && !isAI && analysis.score < 50
                    ? "ring-1 ring-red-400/50"
                    : analysis && !isAI && analysis.score < 70
                      ? "ring-1 ring-amber-400/50"
                      : "",
                ),
          )}
        >
          {/* Whiteboard artifact */}
          {message.artifactRef?.type === "whiteboard" && (
            <div className="mb-2">
              {message.artifactRef.svg ? (
                <div
                  className="max-h-[200px] overflow-auto rounded-lg border border-border bg-white p-2"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(message.artifactRef.svg, {
                      USE_PROFILES: { svg: true, svgFilters: true },
                    }),
                  }}
                />
              ) : (
                <span className="inline-flex items-center gap-1 text-xs bg-muted/60 rounded-full px-2.5 py-1 text-muted-foreground">
                  🎨 Diagram submitted
                </span>
              )}
            </div>
          )}

          {/* Code artifact */}
          {message.artifactRef?.type === "code" && (
            <div className="mb-2">
              {message.artifactRef.code ? (
                <div className="rounded-lg overflow-hidden border border-border">
                  <div className="flex items-center px-3 py-1.5 bg-[#1e1e1e] border-b border-border/50">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {message.artifactRef.language || "code"}
                    </span>
                  </div>
                  <pre className="bg-[#1e1e1e] text-[11px] font-mono text-gray-200 px-3 py-2 overflow-x-auto leading-relaxed">
                    {message.artifactRef.code.split("\n").slice(0, 8).join("\n")}
                    {message.artifactRef.code.split("\n").length > 8 && (
                      <span className="text-muted-foreground">
                        {"\n"}… {message.artifactRef.code.split("\n").length - 8} more lines
                      </span>
                    )}
                  </pre>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs bg-muted/60 rounded-full px-2.5 py-1 text-muted-foreground">
                  💻 Code submitted
                </span>
              )}
            </div>
          )}

          {/* Message text — streaming cursor for AI */}
          <span className="whitespace-pre-wrap">
            {message.content}
            {isAI && isStreaming && message.content && (
              <span className="inline-block w-0.5 h-3.5 bg-foreground/60 ml-0.5 align-middle animate-pulse" />
            )}
          </span>
        </div>

        {/* Score pill badge — shown on user messages after results revealed */}
        {!isAI && analysis && (
          <span
            className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
              getScorePillClass(analysis.score),
            )}
          >
            {getScoreLabel(analysis.score)}
          </span>
        )}

        {/* Per-answer feedback tip */}
        {!isAI && analysis?.feedback && (
          <p className="text-[11px] text-muted-foreground max-w-[90%] text-right px-1">
            💡 {analysis.feedback}
          </p>
        )}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-2 px-4 py-1.5">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center mt-0.5">
        <span className="text-[11px] font-bold text-primary-foreground">K</span>
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl bg-muted px-3.5 py-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/70 animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/70 animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/70 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

export function StreamingMessage({ content }: { content: string }) {
  return (
    <div className="flex gap-2 px-4 py-1.5">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center mt-0.5">
        <span className="text-[11px] font-bold text-primary-foreground">K</span>
      </div>
      <div className="max-w-[80%] text-sm text-foreground leading-relaxed whitespace-pre-wrap">
        {content}
        <span className="inline-block w-0.5 h-3.5 bg-foreground/60 ml-0.5 align-middle animate-pulse" />
      </div>
    </div>
  );
}
```

- [ ] **Step 1.2: Verify TypeScript compiles with no errors**

```bash
cd /Users/kap/Downloads/workspace/v3-masteringbackend
npx tsc --noEmit --project tsconfig.json 2>&1 | grep "chat-message" | head -20
```

Expected: no output (no errors in chat-message.tsx)

- [ ] **Step 1.3: Commit**

```bash
cd /Users/kap/Downloads/workspace/v3-masteringbackend
git add components/pages/mock-interviews/chat/chat-message.tsx
git commit -m "feat(mock-interview): add TypingIndicator, StreamingMessage exports + score pill badge"
```

---

### Task 2: Rewrite `chat-panel.tsx` with correct interface

**Files:**
- Rewrite: `components/pages/mock-interviews/chat/chat-panel.tsx`

- [ ] **Step 2.1: Replace the full file**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ChatMessageBubble, TypingIndicator } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ResultCard, ReportData } from "./result-card";
import { Button } from "@/components/ui/button";
import { Trophy, Loader2, AlertCircle, BarChart2 } from "lucide-react";
import type { ChatMessage, ChatInterviewSession } from "@/lib/store";

interface ChatPanelProps {
  messages: ChatMessage[];
  session: ChatInterviewSession;
  isComplete: boolean;
  isStreaming: boolean;
  onSend: (content: string) => void;
  resultsData: ReportData | null;
  isLoadingResults: boolean;
  resultsError: string | null;
  onGetResults: () => void;
  questionAnalysis: Array<{ score: number; feedback: string }>;
  resultsRevealed: boolean;
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
}: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isStreaming, resultsData]);

  const userMessages = messages.filter((m) => m.role === "user");
  const totalQuestions = session.template.questions || 10;

  // Determine if the last AI message is an empty streaming placeholder
  const lastMsg = messages.at(-1);
  const showTypingIndicator =
    isStreaming && lastMsg?.role === "ai" && !lastMsg.content;

  // Map user message index → analysis entry
  const getUserAnalysis = (msg: ChatMessage) => {
    if (!resultsRevealed || msg.role !== "user") return null;
    const userIdx = userMessages.indexOf(msg);
    return questionAnalysis[userIdx] ?? null;
  };

  // Which message is currently streaming (last AI with content)
  const streamingMsgId =
    isStreaming && lastMsg?.role === "ai" && lastMsg.content ? lastMsg.id : null;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Messages list */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain"
        role="log"
        aria-label="Interview conversation"
        aria-live="polite"
        aria-relevant="additions"
        aria-busy={isStreaming}
      >
        <div className="py-3">
          {messages.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-8 px-4">
              Your conversation with Kap will appear here.
            </p>
          )}

          {messages.map((message) => (
            <ChatMessageBubble
              key={message.id}
              message={message}
              analysis={getUserAnalysis(message)}
              isStreaming={message.id === streamingMsgId}
            />
          ))}

          {showTypingIndicator && <TypingIndicator />}

          {/* Inline results after interview completes */}
          {isComplete && (
            <div className="px-4 pt-2 pb-3">
              {resultsData ? (
                <ResultCard data={resultsData} />
              ) : isLoadingResults ? (
                <div className="flex items-center gap-2 p-4 rounded-xl border border-border bg-muted/30">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Generating your feedback report…
                  </p>
                </div>
              ) : resultsError ? (
                <div className="flex flex-col gap-2 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                    <p className="text-sm text-destructive">{resultsError}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={onGetResults} className="self-start h-7 text-xs">
                    Try again
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 p-5 rounded-xl border border-primary/20 bg-primary/5 text-center">
                  <BarChart2 className="w-6 h-6 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Interview Complete!
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your report is ready to generate.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={onGetResults}
                    disabled={isLoadingResults}
                    className="h-8 px-5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Get your feedback
                  </Button>
                </div>
              )}
            </div>
          )}

          <div ref={bottomRef} aria-hidden="true" />
        </div>
      </div>

      {/* Footer: counter + input */}
      <div className="flex-shrink-0 border-t border-border">
        {!isComplete && (
          <div className="px-4 sm:px-5 pt-2 pb-0" aria-live="polite" aria-atomic="true">
            <p
              className="text-xs text-muted-foreground"
              aria-label={`${userMessages.length} of ${totalQuestions} responses submitted`}
            >
              {userMessages.length} / {totalQuestions} Responses
            </p>
          </div>
        )}
        <ChatInput
          onSend={onSend}
          disabled={isStreaming || isComplete}
          placeholder={
            isComplete
              ? "Interview complete"
              : isStreaming
                ? "Kap is responding…"
                : "Enter response here"
          }
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2.2: Verify TypeScript compiles with no errors in chat-panel**

```bash
cd /Users/kap/Downloads/workspace/v3-masteringbackend
npx tsc --noEmit 2>&1 | grep "chat-panel" | head -20
```

Expected: no output

- [ ] **Step 2.3: Commit**

```bash
cd /Users/kap/Downloads/workspace/v3-masteringbackend
git add components/pages/mock-interviews/chat/chat-panel.tsx
git commit -m "feat(mock-interview): rewrite chat-panel with correct interface + inline ResultCard"
```

---

### Task 3: Add resizable divider to `chat-interview-room.tsx`

**Files:**
- Modify: `components/pages/mock-interviews/chat/chat-interview-room.tsx`

- [ ] **Step 3.1: Replace the full file with the resizable version**

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useAppStore, ChatMessage, ChatInterviewSession } from "@/lib/store";
import { ChatInterviewHeader } from "./chat-interview-header";
import { ChatPanel } from "./chat-panel";
import { CodeEditorPanel } from "./code-editor-panel";
import { WhiteboardPanel } from "./whiteboard-panel";
import { ReportData } from "./result-card";
import { Loader2, Code2, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInterviewRoomProps {
  userInterviewId: string;
}

type ActivePanel = "code" | "whiteboard";

export function ChatInterviewRoom({ userInterviewId }: ChatInterviewRoomProps) {
  const store = useAppStore();

  const [session, setSession] = useState<ChatInterviewSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [resultsData, setResultsData] = useState<ReportData | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>("code");
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [resultsRevealed, setResultsRevealed] = useState(false);
  const [questionAnalysis, setQuestionAnalysis] = useState<
    Array<{ score: number; feedback: string }>
  >([]);

  // Resizable panel state
  const [leftWidth, setLeftWidth] = useState(45);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; w: number } | null>(null);

  const sessionIdRef = useRef<string | null>(null);
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Initialize session on mount
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const data = await store.startChatInterview(userInterviewId);
        if (cancelled) return;
        setSession(data);
        setMessages(data.chatMessages ?? []);
        setIsComplete(data.status === "COMPLETED" || data.status === "ENDED");
        sessionIdRef.current = data.sessionId;
      } catch (err: any) {
        if (!cancelled) {
          setInitError(err?.message ?? "Failed to start interview. Please try again.");
        }
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    }
    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInterviewId]);

  // Drag-resize handlers
  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, w: leftWidth };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !dragStartRef.current || !containerRef.current) return;
      const parentWidth = containerRef.current.offsetWidth;
      const delta = e.clientX - dragStartRef.current.x;
      const newWidth = dragStartRef.current.w + (delta / parentWidth) * 100;
      setLeftWidth(Math.max(25, Math.min(75, newWidth)));
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      dragStartRef.current = null;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [leftWidth]);

  const handleSend = useCallback(
    async (content: string) => {
      const sessionId = sessionIdRef.current;
      if (!sessionId || isStreaming || isComplete) return;

      const userMsgId = `user-${Date.now()}`;
      const aiMsgId = `ai-${Date.now() + 1}`;

      const userMsg: ChatMessage = {
        id: userMsgId,
        role: "user",
        content,
        timestamp: new Date().toISOString(),
        questionIndex: messagesRef.current.filter((m) => m.role === "user").length,
      };

      const aiMsg: ChatMessage = {
        id: aiMsgId,
        role: "ai",
        content: "",
        timestamp: new Date().toISOString(),
        questionIndex: -1,
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setIsStreaming(true);

      let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
      try {
        reader = await store.streamChatMessage(sessionId, content);
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const jsonStr = line.slice(5).trim();
            if (!jsonStr) continue;

            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.type === "token" && parsed.content) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMsgId ? { ...m, content: m.content + parsed.content } : m,
                  ),
                );
              } else if (parsed.type === "done") {
                if (parsed.isComplete) setIsComplete(true);
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== aiMsgId));
      } finally {
        if (reader) reader.cancel().catch(() => {});
        setIsStreaming(false);
      }
    },
    [isStreaming, isComplete, store],
  );

  const handleSendArtifact = useCallback(
    async (type: "code" | "whiteboard", data: string, language?: string) => {
      const sessionId = sessionIdRef.current;
      if (!sessionId) return;
      try {
        await store.saveChatArtifact(sessionId, type, data, language);
      } catch {
        // Silently ignore artifact save errors
      }
    },
    [store],
  );

  const handleEndInterview = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;
    try {
      await store.endChatInterviewSession(sessionId);
    } catch {
      // Treat as ended even if API call fails
    }
    setIsComplete(true);
  }, [store]);

  const handleGetResults = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;
    setIsLoadingResults(true);
    setResultsError(null);
    try {
      const report = await store.getSessionReport(sessionId);
      if (report?.status === "PENDING" || report?.status === "PROCESSING") {
        // Still generating — retry after 3 seconds
        setTimeout(handleGetResults, 3000);
        return;
      }
      setResultsData(report);
      if (report?.questionAnalysis) {
        setQuestionAnalysis(
          report.questionAnalysis.map((q: any) => ({
            score: q.score,
            feedback: q.feedback,
          })),
        );
        setResultsRevealed(true);
      }
    } catch (err: any) {
      setResultsError(err?.message ?? "Failed to generate report. Please try again.");
    } finally {
      setIsLoadingResults(false);
    }
  }, []);

  const handleWhiteboardSend = useCallback(
    (diagramJSON: string) => {
      handleSendArtifact("whiteboard", diagramJSON);
    },
    [handleSendArtifact],
  );

  const handleCodeSend = useCallback(
    (code: string, language: string) => {
      handleSendArtifact("code", code, language);
    },
    [handleSendArtifact],
  );

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Starting interview…</p>
        </div>
      </div>
    );
  }

  if (initError || !session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-3 px-4">
          <p className="text-sm font-semibold text-foreground">Unable to start interview</p>
          <p className="text-xs text-muted-foreground">{initError}</p>
          <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const savedDiagram =
    session.whiteboardArtifact && typeof session.whiteboardArtifact === "object"
      ? session.whiteboardArtifact
      : undefined;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <ChatInterviewHeader
        template={session.template}
        onEndInterview={handleEndInterview}
        isComplete={isComplete}
        startedAt={session.startedAt}
      />

      {/* Main content */}
      <div ref={containerRef} className="flex flex-1 min-h-0 overflow-hidden select-none">
        {/* Chat panel — variable width on desktop */}
        <div
          className="flex flex-col min-h-0 border-r border-border lg:flex-shrink-0"
          style={{ width: `${leftWidth}%` }}
        >
          <ChatPanel
            messages={messages}
            session={session}
            isComplete={isComplete}
            isStreaming={isStreaming}
            onSend={handleSend}
            resultsData={resultsData}
            isLoadingResults={isLoadingResults}
            resultsError={resultsError}
            onGetResults={handleGetResults}
            questionAnalysis={questionAnalysis}
            resultsRevealed={resultsRevealed}
          />
        </div>

        {/* Drag-resize divider (desktop only) */}
        <div
          className={cn(
            "hidden lg:flex items-center justify-center w-1 flex-shrink-0 cursor-col-resize",
            "bg-border hover:bg-primary/40 active:bg-primary/60 transition-colors group",
          )}
          onMouseDown={handleDividerMouseDown}
          role="separator"
          aria-label="Resize panels"
        >
          <div className="w-0.5 h-8 rounded-full bg-muted-foreground/30 group-hover:bg-primary/60 transition-colors" />
        </div>

        {/* Right panels (desktop only) */}
        <div className="hidden lg:flex flex-col flex-1 min-h-0">
          {/* Panel tab switcher */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-muted/20 flex-shrink-0">
            <button
              onClick={() => setActivePanel("code")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                activePanel === "code"
                  ? "bg-background text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50",
              )}
            >
              <Code2 className="w-3.5 h-3.5" />
              Code Editor
            </button>
            <button
              onClick={() => setActivePanel("whiteboard")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                activePanel === "whiteboard"
                  ? "bg-background text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50",
              )}
            >
              <PenTool className="w-3.5 h-3.5" />
              Whiteboard
            </button>
          </div>

          {/* Active panel */}
          <div className="flex-1 min-h-0">
            {activePanel === "code" ? (
              <CodeEditorPanel
                onSendToKap={handleCodeSend}
                disabled={isComplete}
                savedCode={session.codeArtifact}
                savedLanguage={session.codeLanguage}
              />
            ) : (
              <WhiteboardPanel
                onSendToKap={handleWhiteboardSend}
                disabled={isComplete}
                savedDiagram={savedDiagram}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3.2: Verify no TypeScript errors in the room file**

```bash
cd /Users/kap/Downloads/workspace/v3-masteringbackend
npx tsc --noEmit 2>&1 | grep "chat-interview-room" | head -20
```

Expected: no output

- [ ] **Step 3.3: Commit**

```bash
cd /Users/kap/Downloads/workspace/v3-masteringbackend
git add components/pages/mock-interviews/chat/chat-interview-room.tsx
git commit -m "feat(mock-interview): add resizable panel divider (25-75% drag)"
```

---

### Task 4: Add starter code templates to `code-editor-panel.tsx`

**Files:**
- Modify: `components/pages/mock-interviews/chat/code-editor-panel.tsx`

- [ ] **Step 4.1: Replace the full file**

```tsx
"use client";

import { useState, useEffect } from "react";
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

const STARTER_TEMPLATES: Record<string, string> = {
  JavaScript: `/**
 * @param {number[]} nums
 * @return {number}
 */
function solution(nums) {
  // Write your solution here
  
  return 0;
}

// Test your solution
console.log(solution([1, 2, 3]));`,
  TypeScript: `function solution(nums: number[]): number {
  // Write your solution here
  
  return 0;
}

// Test your solution
console.log(solution([1, 2, 3]));`,
  Python: `def solution(nums: list[int]) -> int:
    """Write your solution here."""
    
    return 0


# Test your solution
print(solution([1, 2, 3]))`,
  Java: `import java.util.*;

public class Solution {
    public int solution(int[] nums) {
        // Write your solution here
        
        return 0;
    }
    
    public static void main(String[] args) {
        Solution s = new Solution();
        System.out.println(s.solution(new int[]{1, 2, 3}));
    }
}`,
  Go: `package main

import "fmt"

func solution(nums []int) int {
\t// Write your solution here
\t
\treturn 0
}

func main() {
\tfmt.Println(solution([]int{1, 2, 3}))
}`,
  Rust: `fn solution(nums: Vec<i32>) -> i32 {
    // Write your solution here
    
    0
}

fn main() {
    println!("{}", solution(vec![1, 2, 3]));
}`,
  "C++": `#include <iostream>
#include <vector>
using namespace std;

int solution(vector<int>& nums) {
    // Write your solution here
    
    return 0;
}

int main() {
    vector<int> nums = {1, 2, 3};
    cout << solution(nums) << endl;
    return 0;
}`,
  SQL: `-- Write your SQL query here
SELECT
    id,
    name,
    created_at
FROM users
WHERE active = true
ORDER BY created_at DESC
LIMIT 10;`,
};

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
  const [code, setCode] = useState<string>(
    savedCode ?? STARTER_TEMPLATES["JavaScript"],
  );

  // When language changes, reset to starter template only if no saved code
  // and the current code matches a starter template (user hasn't edited)
  const handleLanguageChange = (newLang: string) => {
    const currentIsTemplate = Object.values(STARTER_TEMPLATES).includes(code);
    setLanguage(newLang);
    if (!savedCode && currentIsTemplate) {
      setCode(STARTER_TEMPLATES[newLang] ?? "");
    }
  };

  const monacoLanguage = language
    .toLowerCase()
    .replace("c++", "cpp")
    .replace("typescript", "typescript")
    .replace("javascript", "javascript");

  const handleSend = () => {
    if (disabled) return;
    onSendToKap(code, language);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-[#1e1e1e]">
        <span className="text-xs text-muted-foreground">Language:</span>
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
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
          height="100%"
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
            padding: { top: 8, bottom: 8 },
            lineNumbers: "on",
            folding: false,
            glyphMargin: false,
            lineDecorationsWidth: 8,
          }}
        />
      </div>

      {/* Send footer */}
      {!disabled && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-background">
          <span className="text-[10px] text-muted-foreground">
            Share your solution with Kap
          </span>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={disabled || !code.trim()}
            className="gap-1.5 text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Send className="w-3.5 h-3.5" />
            Send to Kap
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4.2: Verify no TypeScript errors**

```bash
cd /Users/kap/Downloads/workspace/v3-masteringbackend
npx tsc --noEmit 2>&1 | grep "code-editor-panel" | head -20
```

Expected: no output

- [ ] **Step 4.3: Commit**

```bash
cd /Users/kap/Downloads/workspace/v3-masteringbackend
git add components/pages/mock-interviews/chat/code-editor-panel.tsx
git commit -m "feat(mock-interview): add per-language starter templates in code editor"
```

---

### Task 5: Full TypeScript compile check + spec doc commit

**Files:**
- No code changes — verification only

- [ ] **Step 5.1: Run full TypeScript check**

```bash
cd /Users/kap/Downloads/workspace/v3-masteringbackend
npx tsc --noEmit 2>&1 | head -40
```

Expected: zero errors related to mock-interview chat components. (Pre-existing unrelated errors in other files are acceptable if they were there before this feature.)

- [ ] **Step 5.2: Run lint on changed files**

```bash
cd /Users/kap/Downloads/workspace/v3-masteringbackend
npx next lint -- --file components/pages/mock-interviews/chat/chat-message.tsx \
  --file components/pages/mock-interviews/chat/chat-panel.tsx \
  --file components/pages/mock-interviews/chat/chat-interview-room.tsx \
  --file components/pages/mock-interviews/chat/code-editor-panel.tsx
```

Expected: no errors (warnings acceptable)

- [ ] **Step 5.3: Commit spec + plan docs**

```bash
cd /Users/kap/Downloads/workspace/v3-masteringbackend
git add docs/superpowers/specs/2026-06-03-mock-interview-chat-redesign.md \
        docs/superpowers/plans/2026-06-03-mock-interview-chat-redesign.md
git commit -m "docs: add mock-interview chat redesign spec and implementation plan"
```

---

## Self-Review

| Spec Requirement | Task |
|---|---|
| Chat box with streaming AI responses | Task 2 (panel renders streaming messages), Task 3 (room streams SSE) |
| Whiteboard — draw + send to Kap | Unchanged (whiteboard-panel.tsx already works) |
| Code editor — code + share with Kap | Task 4 (starter templates), Task 3 (handleCodeSend) |
| Results inline after interview | Task 2 (ResultCard in chat-panel) |
| Per-response analysis after results revealed | Task 1 (score pill badge), Task 2 (getUserAnalysis) |
| Resizable panels | Task 3 (drag divider) |
| Starter code in editor | Task 4 |
| TypingIndicator / StreamingMessage exports | Task 1 |
| Interface mismatch fix | Task 2 |
| Streaming cursor on active AI message | Task 1 (isStreaming prop on bubble) |

**Placeholder scan:** None found.  
**Type consistency:** `ReportData` imported from `./result-card` in Task 2 matches its definition in `result-card.tsx`. `ChatMessage`, `ChatInterviewSession` from `@/lib/store` used consistently. `handleGetResults` self-references in Task 3 — this is a `useCallback` with no deps array; must add `// eslint-disable-next-line` or pass store as dep if needed (safe to leave empty since `store` is stable Zustand ref).
