"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useAppStore, ChatMessage, ChatInterviewSession, ChatArtifactRef } from "@/lib/store";
import { ChatInterviewHeader } from "./chat-interview-header";
import { ChatPanel } from "./chat-panel";
import { CodeEditorPanel } from "./code-editor-panel";
import { WhiteboardPanel } from "./whiteboard-panel";
import { ReportData } from "./result-card";
import { Loader2, Code2, PenTool, Lock, Sparkles, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

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
  const [resultsProgress, setResultsProgress] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>("code");
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [initErrorCode, setInitErrorCode] = useState<string | null>(null);
  const [resultsRevealed, setResultsRevealed] = useState(false);
  const [questionAnalysis, setQuestionAnalysis] = useState<
    Array<{ score: number; feedback: string }>
  >([]);

  const sessionIdRef = useRef<string | null>(null);
  const messagesRef = useRef(messages);
  const autoResultFiredRef = useRef(false);
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
          const code = err?.response?.data?.code ?? null;
          setInitErrorCode(code);
          setInitError(
            err?.message ?? "Failed to start interview. Please try again.",
          );
        }
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInterviewId]);

  const handleSend = useCallback(
    async (
      content: string,
      artifactRef?: ChatArtifactRef,
      displayArtifact?: ChatMessage["artifactRef"],
    ) => {
      const sessionId = sessionIdRef.current;
      if (!sessionId || isStreaming || isComplete) return;

      const userMsgId = `user-${Date.now()}`;
      const aiMsgId = `ai-${Date.now() + 1}`;

      const userMsg: ChatMessage = {
        id: userMsgId,
        role: "user",
        content,
        timestamp: new Date().toISOString(),
        questionIndex: messagesRef.current.filter((m) => m.role === "user")
          .length,
        artifactRef: displayArtifact ?? null,
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
        reader = await store.streamChatMessage(sessionId, content, artifactRef);
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
                    m.id === aiMsgId
                      ? { ...m, content: m.content + parsed.content }
                      : m,
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
    setResultsProgress(null);

    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    try {
      reader = await store.streamSessionReport(sessionId);
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr) continue;
          try {
            const event = JSON.parse(jsonStr);
            if (event.type === "progress") {
              setResultsProgress(event.message);
            } else if (event.type === "result") {
              const report = event.data;
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
              setResultsProgress(null);
            } else if (event.type === "error") {
              setResultsError(event.message ?? "Failed to generate report.");
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch (err: any) {
      setResultsError(err?.message ?? "Failed to generate report. Please try again.");
    } finally {
      if (reader) reader.cancel().catch(() => {});
      setIsLoadingResults(false);
    }
  }, [store]);

  const handleWhiteboardSend = useCallback(
    (diagramJSON: string) => {
      handleSend(
        "Here's my diagram:",
        { type: "whiteboard", data: diagramJSON },
        { type: "whiteboard" },
      );
    },
    [handleSend],
  );

  const handleCodeSend = useCallback(
    (code: string, language: string) => {
      handleSend(
        "Here's my code solution:",
        { type: "code", data: code, language },
        { type: "code", language, code },
      );
    },
    [handleSend],
  );

  // Auto-generate results when interview completes
  useEffect(() => {
    if (isComplete && !autoResultFiredRef.current) {
      autoResultFiredRef.current = true;
      handleGetResults();
    }
  }, [isComplete, handleGetResults]);

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
    const isUpgradePrompt =
      initErrorCode === "TRIAL_EXHAUSTED" || initErrorCode === "SESSION_LIMIT_REACHED";

    if (isUpgradePrompt) {
      return (
        <div className="flex h-screen items-center justify-center bg-background px-4">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="relative w-14 h-14">
                <Image src="/blue-icon-logo.png" alt="Mastering Backend" fill className="object-contain" />
              </div>
            </div>

            {/* Icon badge */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Lock className="w-7 h-7 text-primary" />
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                {initErrorCode === "TRIAL_EXHAUSTED"
                  ? "Free Trial Complete"
                  : "Monthly Limit Reached"}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {initError}
              </p>
            </div>

            {/* Pro features */}
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-left space-y-2">
              {[
                "Unlimited mock interviews",
                "AI-powered detailed feedback",
                "Code editor & whiteboard",
                "Performance analytics",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-foreground">
                  <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="space-y-2">
              <Link href="/pricing" className="block">
                <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2">
                  Upgrade to Pro
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/mock-interviews" className="block">
                <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                  Back to interviews
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-3 px-4">
          <p className="text-sm font-semibold text-foreground">
            Unable to start interview
          </p>
          <p className="text-xs text-muted-foreground">{initError}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.reload()}
          >
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
      <ResizablePanelGroup
        orientation="horizontal"
        className="flex-1 min-h-0 overflow-hidden"
      >
        {/* Chat panel */}
        <ResizablePanel
          defaultSize="55"
          minSize="25"
          maxSize="75"
          className="flex flex-col min-h-0"
        >
          <ChatPanel
            messages={messages}
            session={session}
            isComplete={isComplete}
            isStreaming={isStreaming}
            onSend={handleSend}
            resultsData={resultsData}
            isLoadingResults={isLoadingResults}
            resultsProgress={resultsProgress}
            resultsError={resultsError}
            onGetResults={handleGetResults}
            questionAnalysis={questionAnalysis}
            resultsRevealed={resultsRevealed}
          />
        </ResizablePanel>

        {/* Resize handle (desktop only) */}
        <ResizableHandle withHandle className="hidden lg:flex" />

        {/* Right panels (desktop only) */}
        <ResizablePanel
          defaultSize="45"
          minSize="25"
          maxSize="75"
          className="hidden lg:flex flex-col min-h-0"
        >
          {/* Tab switcher */}
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
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
