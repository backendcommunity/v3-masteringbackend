"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  useAppStore,
  ChatMessage,
  ChatInterviewSession,
  ChatInterviewTemplate,
  ChatArtifactRef,
} from "@/lib/store";
import { ChatInterviewWelcome } from "./chat-interview-welcome";
import { analytics } from "@/lib/analytics";
import { ChatInterviewHeader, useCountdown } from "./chat-interview-header";
import { useInterviewTimer } from "@/lib/interview-timer-store";
import { ChatPanel } from "./chat-panel";
import { CodeEditorPanel } from "./code-editor-panel";
import { WhiteboardPanel } from "./whiteboard-panel";
import { ReportData } from "./result-card";
import { Loader2, Code2, PenTool, X } from "lucide-react";
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
  // Fired once when the interview reaches a completed state — lets an embedder
  // (e.g. a learning-path step) mark itself complete and advance.
  onComplete?: () => void;
  // Embedded in a Path step: hide the room's own header; the Path top bar shows
  // the timer + End Interview and the Path help slide-in shows the tips.
  embedded?: boolean;
}

type ActivePanel = "code" | "whiteboard";

export function ChatInterviewRoom({
  userInterviewId,
  onComplete,
  embedded = false,
}: ChatInterviewRoomProps) {
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
  // Pre-join welcome screen — shown before the session (and clock) starts.
  const [preview, setPreview] = useState<{
    template: ChatInterviewTemplate;
    sessionStatus: string | null;
  } | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isStartingSession, setIsStartingSession] = useState(false);
  // Tracks viewport ≥1024px so the work tools (code/whiteboard) are rendered as
  // a side panel on desktop and as a full-screen overlay (opened via FAB) on
  // mobile/tablet — never both at once (avoids two Monaco instances).
  const [lgUp, setLgUp] = useState(true);
  const [showWorkTools, setShowWorkTools] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setLgUp(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Crossing into desktop closes the mobile overlay so the panel never mounts
  // in two places simultaneously.
  useEffect(() => {
    if (lgUp) setShowWorkTools(false);
  }, [lgUp]);

  const sessionIdRef = useRef<string | null>(null);
  const sessionRef = useRef<ChatInterviewSession | null>(null);
  const endedManuallyRef = useRef(false);
  const messagesRef = useRef(messages);
  const autoResultFiredRef = useRef(false);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Notify an embedder once the interview completes (path-step integration).
  const completeFiredRef = useRef(false);
  useEffect(() => {
    if (isComplete && !completeFiredRef.current) {
      completeFiredRef.current = true;
      onComplete?.();
    }
  }, [isComplete, onComplete]);

  // Start (or resume) the session. Called from the welcome screen CTA, or
  // automatically when an already-completed session is reopened. This is the
  // ONLY place the clock starts and an access slot is consumed.
  const beginInterview = useCallback(async () => {
    setIsStartingSession(true);
    setInitError(null);
    setInitErrorCode(null);
    try {
      const data = await store.startChatInterview(userInterviewId);
      setSession(data);
      setMessages(data.chatMessages ?? []);
      const alreadyDone =
        data.status === "COMPLETED" || data.status === "ENDED";
      setIsComplete(alreadyDone);
      sessionIdRef.current = data.sessionId;
      setHasStarted(true);
      analytics.track("chat_interview_session_started", {
        template_id: data.template?.id,
        position: data.template?.position,
        company: data.template?.company,
        difficulty: data.template?.difficulty,
        duration: data.template?.duration,
        category: data.template?.category,
        session_id: data.sessionId,
        is_resuming: alreadyDone,
      });

      if (alreadyDone) {
        // Session was already complete before this mount — fetch stored report
        // directly from DB/cache without triggering AI generation.
        autoResultFiredRef.current = true; // prevent useEffect from also firing
        try {
          const report = await store.getChatSessionReport(data.sessionId);
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
      const code = err?.response?.data?.code ?? null;
      setInitErrorCode(code);
      setInitError(
        err?.message ?? "Failed to start interview. Please try again.",
      );
      analytics.track("chat_interview_session_start_failed", {
        error_code: code,
        error_message: err?.message,
      });
    } finally {
      setIsStartingSession(false);
      setIsInitializing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, userInterviewId]);

  // On mount, fetch a lightweight preview (template + session status) WITHOUT
  // starting anything, so we can show the welcome screen first. An already
  // completed/ended session skips the welcome and jumps straight to results.
  useEffect(() => {
    let cancelled = false;
    async function loadPreview() {
      try {
        const data = await store.getChatInterviewPreview(userInterviewId);
        if (cancelled) return;
        setPreview(data);
        if (
          data?.sessionStatus === "COMPLETED" ||
          data?.sessionStatus === "ENDED"
        ) {
          beginInterview(); // keeps the full-screen spinner, lands on results
        } else {
          setIsInitializing(false);
        }
      } catch {
        if (cancelled) return;
        // Preview failed — fall back to legacy behavior (start immediately).
        beginInterview();
      }
    }
    loadPreview();
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

      if (!artifactRef) {
        const questionNum = messagesRef.current.filter((m) => m.role === "user").length + 1;
        analytics.track("chat_interview_message_sent", {
          template_id: sessionRef.current?.template?.id,
          question_number: questionNum,
        });
      }

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
              // note: completion funnel tracked in the isComplete useEffect below
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
    endedManuallyRef.current = true;
    analytics.track("chat_interview_ended_manually", {
      template_id: sessionRef.current?.template?.id,
      user_answers_given: messagesRef.current.filter((m) => m.role === "user").length,
    });
    try {
      await store.endChatInterviewSession(sessionId);
    } catch {
      // Treat as ended even if API call fails
    }
    setIsComplete(true);
  }, [store]);

  const handleTimerExpired = useCallback(() => {
    analytics.track("chat_interview_timer_expired", {
      template_id: sessionRef.current?.template?.id,
      user_answers_given: messagesRef.current.filter((m) => m.role === "user").length,
    });
    handleEndInterview();
  }, [handleEndInterview]);

  // Embedded mode runs the countdown here (the header that normally owns it is
  // hidden) and publishes the timer + end handler to the Path top bar.
  const { secondsLeft } = useCountdown(
    session?.template?.duration || 30,
    session?.startedAt,
    embedded ? handleTimerExpired : () => {},
  );
  const setTimerSeconds = useInterviewTimer((s) => s.setSeconds);
  const setTimerOnEnd = useInterviewTimer((s) => s.setOnEnd);
  useEffect(() => {
    if (!embedded || !session || isComplete) {
      setTimerSeconds(null);
      setTimerOnEnd(null);
      return;
    }
    setTimerSeconds(secondsLeft);
    setTimerOnEnd(handleEndInterview);
    return () => {
      setTimerSeconds(null);
      setTimerOnEnd(null);
    };
  }, [
    embedded,
    session,
    isComplete,
    secondsLeft,
    handleEndInterview,
    setTimerSeconds,
    setTimerOnEnd,
  ]);

  const handleRestart = useCallback(async () => {
    // Check access BEFORE resetting any state so the user's current results
    // are preserved if they've hit their limit.
    setIsCheckingAccess(true);
    try {
      const access = await store.getInterviewAccess();
      if (!access?.hasAccess) {
        analytics.track("chat_interview_restart_blocked", {
          template_id: sessionRef.current?.template?.id,
          tier: access?.tier,
        });
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
      endedManuallyRef.current = false;
      autoResultFiredRef.current = false;
      analytics.track("chat_interview_restarted", {
        template_id: data.template?.id,
        session_id: data.sessionId,
      });
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
    analytics.track("chat_interview_results_requested", {
      template_id: sessionRef.current?.template?.id,
      session_id: sessionId,
    });

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
              analytics.track("chat_interview_results_generated", {
                template_id: sessionRef.current?.template?.id,
                overall_score: report?.overallScore,
                result: report?.result,
                technical_score: report?.technicalScore,
                communication_score: report?.communicationScore,
                problem_solving_score: report?.problemSolvingScore,
                triggered_by: endedManuallyRef.current ? "manual" : "ai",
              });
            } else if (event.type === "error") {
              const errMsg = event.message ?? "Failed to generate report.";
              setResultsError(errMsg);
              analytics.track("chat_interview_results_failed", {
                template_id: sessionRef.current?.template?.id,
                error_message: errMsg,
              });
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
    (diagramJSON: string, svg?: string) => {
      analytics.track("chat_interview_whiteboard_submitted", {
        template_id: sessionRef.current?.template?.id,
      });
      handleSend(
        "Here's my diagram:",
        { type: "whiteboard", data: diagramJSON },
        { type: "whiteboard", svg },
      );
    },
    [handleSend],
  );

  const handleCodeSend = useCallback(
    (code: string, language: string) => {
      analytics.track("chat_interview_code_submitted", {
        template_id: sessionRef.current?.template?.id,
        language,
      });
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
        analytics.track("chat_interview_completed", {
          template_id: sessionRef.current?.template?.id,
          user_answers_given: userAnswerCount,
          triggered_by: endedManuallyRef.current ? "manual" : "ai",
        });
        if (userAnswerCount >= 3) {
          autoResultFiredRef.current = true;
          handleGetResults().catch(() => {
            // Allow retry if generation fails
            autoResultFiredRef.current = false;
          });
        } else {
          autoResultFiredRef.current = true;
          analytics.track("chat_interview_insufficient_answers", {
            template_id: sessionRef.current?.template?.id,
            user_answers_given: userAnswerCount,
          });
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
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading interview…</p>
        </div>
      </div>
    );
  }

  // Pre-join welcome screen — shown until the learner starts (or resumes).
  if (!hasStarted && !initError && preview?.template) {
    return (
      <div className="flex h-full flex-col bg-background">
        <ChatInterviewWelcome
          template={preview.template}
          resuming={preview.sessionStatus === "IN_PROGRESS"}
          starting={isStartingSession}
          onStart={beginInterview}
          onBack={embedded ? undefined : () => router.push("/mock-interviews")}
        />
      </div>
    );
  }

  if (initError || !session) {
    const isUpgradePrompt =
      initErrorCode === "TRIAL_EXHAUSTED" ||
      initErrorCode === "SESSION_LIMIT_REACHED";

    if (isUpgradePrompt) {
      return (
        <div className="h-full bg-background">
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
      <div className="flex h-full items-center justify-center">
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

  // Tab switcher for the work tools (Code Editor / Whiteboard). Shared by the
  // desktop side panel and the mobile overlay so they stay in sync.
  const workToolsTabs = (
    <>
      <button
        onClick={() => {
          setActivePanel("code");
          analytics.track("chat_interview_panel_switched", {
            panel: "code",
            template_id: session.template?.id,
          });
        }}
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
        onClick={() => {
          setActivePanel("whiteboard");
          analytics.track("chat_interview_panel_switched", {
            panel: "whiteboard",
            template_id: session.template?.id,
          });
        }}
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
    </>
  );

  // The active work-tool panel itself. Mounted in EXACTLY ONE place at a time
  // (desktop side panel OR mobile overlay) so we never have two Monaco editors.
  const activeWorkPanel =
    activePanel === "code" ? (
      <CodeEditorPanel
        key={messages.filter((m) => m.role === "user").length}
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
    );

  // Full body of the work tools (tabs + active panel) — reused on desktop and
  // inside the mobile overlay.
  const rightPanelBody = (
    <>
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-muted/20 flex-shrink-0">
        {workToolsTabs}
      </div>
      <div className="flex-1 min-h-0">{activeWorkPanel}</div>
    </>
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header — hidden in the Path embed (top bar owns timer + End). */}
      {!embedded && (
        <ChatInterviewHeader
          template={session.template}
          onEndInterview={handleEndInterview}
          onTimerExpired={handleTimerExpired}
          onExitRoom={() => setShowCompletionDialog(true)}
          isComplete={isComplete}
          resultsReady={!!resultsData || insufficientAnswers}
          startedAt={session.startedAt}
        />
      )}

      {/* Main content */}
      {lgUp ? (
        // Desktop: chat + resizable work-tools side panel.
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
              onExit={embedded ? undefined : () => setShowCompletionDialog(true)}
              onRestart={handleRestart}
              isRestartLoading={isCheckingAccess}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right panels */}
          <ResizablePanel
            defaultSize="45"
            minSize="25"
            maxSize="75"
            className="flex flex-col min-h-0"
          >
            {rightPanelBody}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        // Mobile/tablet: chat fills the screen; work tools open in an overlay.
        <div className="flex-1 min-h-0 flex flex-col">
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
            onExit={embedded ? undefined : () => setShowCompletionDialog(true)}
            onRestart={handleRestart}
            isRestartLoading={isCheckingAccess}
          />
        </div>
      )}

      {/* Mobile FAB — opens the code editor / whiteboard work tools. */}
      {!lgUp && !showWorkTools && (
        <button
          type="button"
          onClick={() => setShowWorkTools(true)}
          aria-label="Open code editor and whiteboard"
          className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#13AECE] to-[#2BB8D8] text-white shadow-lg shadow-[#13AECE]/30 transition-transform active:scale-95"
        >
          <Code2 className="h-6 w-6" />
        </button>
      )}

      {/* Mobile work-tools overlay — full screen, single panel instance. */}
      {!lgUp && showWorkTools && (
        <div className="fixed inset-0 z-40 flex flex-col bg-background">
          <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-muted/20 flex-shrink-0">
            {workToolsTabs}
            <button
              type="button"
              onClick={() => setShowWorkTools(false)}
              aria-label="Close work tools"
              className="ml-auto flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 min-h-0">{activeWorkPanel}</div>
        </div>
      )}

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
