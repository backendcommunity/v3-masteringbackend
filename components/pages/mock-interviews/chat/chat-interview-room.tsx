"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  useAppStore,
  ChatMessage,
  ChatInterviewSession,
  ChatArtifactRef,
} from "@/lib/store";
import { ChatInterviewHeader } from "./chat-interview-header";
import { ChatPanel } from "./chat-panel";
import { CodeEditorPanel } from "./code-editor-panel";
import { WhiteboardPanel } from "./whiteboard-panel";
import { ReportData } from "./result-card";
import { Loader2, Code2, PenTool } from "lucide-react";
import { useRouter } from "next/navigation";
import { InterviewCompletionDialog } from "./interview-completion-dialog";
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
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>("code");
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [initErrorCode, setInitErrorCode] = useState<string | null>(null);
  const [resultsRevealed, setResultsRevealed] = useState(false);
  const [insufficientAnswers, setInsufficientAnswers] = useState(false);
  const [questionAnalysis, setQuestionAnalysis] = useState<
    Array<{ score: number; feedback: string }>
  >([]);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [showAccessDeniedDialog, setShowAccessDeniedDialog] = useState(false);

  const router = useRouter();

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
        const alreadyDone =
          data.status === "COMPLETED" || data.status === "ENDED";
        setIsComplete(alreadyDone);
        sessionIdRef.current = data.sessionId;

        if (alreadyDone) {
          // Session was already complete before this mount — fetch stored report
          // directly from DB/cache without triggering AI generation.
          autoResultFiredRef.current = true; // prevent useEffect from also firing
          try {
            const report = await store.getChatSessionReport(data.sessionId);
            if (cancelled) return;
            if (report) {
              setResultsData(report);
              if (report.questionAnalysis?.length) {
                setQuestionAnalysis(
                  report.questionAnalysis.map((q: any) => ({
                    score: q.score,
                    feedback: q.feedback,
                  })),
                );
                setResultsRevealed(true);
              }
            } else {
              // Report not yet generated — let useEffect trigger generation
              autoResultFiredRef.current = false;
            }
          } catch {
            // Report doesn't exist yet — fall through to generation via useEffect
            autoResultFiredRef.current = false;
          }
        }
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

  const handleRestart = useCallback(async () => {
    // Check access BEFORE resetting any state so the user's current results
    // are preserved if they've hit their limit.
    setIsCheckingAccess(true);
    try {
      const access = await store.getInterviewAccess();
      if (!access?.hasAccess) {
        setShowAccessDeniedDialog(true);
        return;
      }
    } catch {
      // Access check network failure — let the restart attempt surface the error
    } finally {
      setIsCheckingAccess(false);
    }

    // Access confirmed — reset state and start new session
    setIsInitializing(true);
    setMessages([]);
    setIsComplete(false);
    setResultsData(null);
    setIsLoadingResults(false);
    setResultsError(null);
    setResultsProgress(null);
    setShowCompletionDialog(false);
    setResultsRevealed(false);
    setInsufficientAnswers(false);
    setQuestionAnalysis([]);
    autoResultFiredRef.current = false;

    try {
      const data = await store.startChatInterview(userInterviewId);
      setSession(data);
      setMessages(data.chatMessages ?? []);
      const alreadyDone = data.status === "COMPLETED" || data.status === "ENDED";
      setIsComplete(alreadyDone);
      // Set ref only after the session is confirmed — prevents null-ref race
      sessionIdRef.current = data.sessionId;
    } catch (err: any) {
      const code = err?.response?.data?.code ?? null;
      if (code === "TRIAL_EXHAUSTED" || code === "SESSION_LIMIT_REACHED") {
        // Show dialog — never replace the screen for limit errors
        setShowAccessDeniedDialog(true);
      } else {
        setInitErrorCode(code);
        setInitError(err?.message ?? "Failed to restart interview. Please try again.");
      }
    } finally {
      setIsInitializing(false);
    }
  }, [store, userInterviewId]);

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
            if (event.type === "token") {
              // streaming in progress — cycling timer handles UX
            } else if (event.type === "progress") {
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
      setResultsError(
        err?.message ?? "Failed to generate report. Please try again.",
      );
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

  // Load user profile for avatar/initials
  useEffect(() => {
    store
      .getUser()
      .then((u: any) => {
        if (u?.name) setUserName(u.name);
        if (u?.avatar || u?.image) setUserAvatar(u.avatar || u.image || null);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-generate results when interview completes (skip if < 3 user answers)
  useEffect(() => {
    if (isComplete) {
      if (!autoResultFiredRef.current) {
        const userAnswerCount = messagesRef.current.filter((m) => m.role === "user").length;
        if (userAnswerCount >= 3) {
          autoResultFiredRef.current = true;
          handleGetResults().catch(() => {
            // Allow retry if generation fails
            autoResultFiredRef.current = false;
          });
        } else {
          autoResultFiredRef.current = true;
          setInsufficientAnswers(true);
        }
      }
    }
  }, [isComplete, handleGetResults]);

  // Auto-cycle progress messages while results are loading
  useEffect(() => {
    if (!isLoadingResults) return;
    const cycleMessages = [
      "Analyzing your responses…",
      "Evaluating technical depth…",
      "Building your performance report…",
      "Finalizing scores and feedback…",
      "Almost ready…",
    ];
    let idx = 0;
    setResultsProgress(cycleMessages[0]);
    const timer = setInterval(() => {
      idx = (idx + 1) % cycleMessages.length;
      setResultsProgress(cycleMessages[idx]);
    }, 3000);
    return () => clearInterval(timer);
  }, [isLoadingResults]);

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
      initErrorCode === "TRIAL_EXHAUSTED" ||
      initErrorCode === "SESSION_LIMIT_REACHED";

    if (isUpgradePrompt) {
      return (
        <div className="h-screen bg-background">
          <InterviewCompletionDialog
            open={true}
            onClose={() => router.push("/mock-interviews")}
            currentTemplateId={undefined}
            currentCategory={undefined}
            overallScore={null}
          />
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
        onExitRoom={() => setShowCompletionDialog(true)}
        isComplete={isComplete}
        resultsReady={!!resultsData || insufficientAnswers}
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
            insufficientAnswers={insufficientAnswers}
            userName={userName}
            userAvatar={userAvatar}
            onExit={() => setShowCompletionDialog(true)}
            onRestart={handleRestart}
            isRestartLoading={isCheckingAccess}
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

      <InterviewCompletionDialog
        open={showCompletionDialog}
        onClose={() => setShowCompletionDialog(false)}
        currentTemplateId={session.template?.id}
        currentCategory={session.template?.category}
        overallScore={resultsData?.overallScore ?? null}
      />

      {/* Blocking upgrade dialog — shown when restart limit is hit */}
      <InterviewCompletionDialog
        open={showAccessDeniedDialog}
        onClose={() => setShowAccessDeniedDialog(false)}
        currentTemplateId={session?.template?.id}
        currentCategory={session?.template?.category}
        overallScore={resultsData?.overallScore ?? null}
      />
    </div>
  );
}
