"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { readSSE } from "@/lib/sse";
import { ChatInterviewHeader, useCountdown } from "./chat-interview-header";
import { useInterviewTimer } from "@/lib/interview-timer-store";
import { ChatPanel } from "./chat-panel";
import { CodeEditorPanel } from "./code-editor-panel";
import { WhiteboardPanel } from "./whiteboard-panel";
import { ReportData } from "./result-card";
import { Loader2, Code2, PenTool, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { InterviewCompletionDialog } from "./interview-completion-dialog";
import { Button } from "@/components/ui/button";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useGuidedTour } from "@/hooks/use-guided-tour";
import { MOCK_INTERVIEW_GUIDE_STEPS, mockInterviewGuideControls } from "@/lib/mock-interview-tour";

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
  // a side panel on desktop, and via a bottom tab switcher (Chat ↔ Workspace)
  // on mobile/tablet — never both at once (avoids two Monaco instances).
  const [lgUp, setLgUp] = useState(true);
  const [mobileTab, setMobileTab] = useState<"chat" | "workspace">("chat");
  // Staged attachments — at most one code + one diagram per outgoing message.
  // Sending a new one of the same kind replaces the previous.
  const [pendingCode, setPendingCode] = useState<ChatArtifactRef | null>(null);
  const [pendingDiagram, setPendingDiagram] = useState<ChatArtifactRef | null>(
    null,
  );

  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setLgUp(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Reset to the chat tab when returning to the desktop layout.
  useEffect(() => {
    if (lgUp) setMobileTab("chat");
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

  // System-design interviews are whiteboard-first — default the work panel to
  // the whiteboard once the template loads. Runs once so it never overrides a
  // user's manual tab switch afterwards.
  const panelDefaultedRef = useRef(false);
  useEffect(() => {
    if (panelDefaultedRef.current) return;
    const tmpl = session?.template ?? preview?.template;
    if (!tmpl) return;
    panelDefaultedRef.current = true;
    const isSystemDesign = [tmpl.style, tmpl.category].some(
      (v) => !!v && v.toLowerCase().includes("system design"),
    );
    if (isSystemDesign) setActivePanel("whiteboard");
  }, [session, preview]);

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
      // Fast path: a "Start Now" navigation primed the preview from the create
      // response, so render the welcome screen immediately — no round-trip.
      // Mirrors the fetch path below, including the completed-session redirect.
      const primed = store.consumeChatPreview(userInterviewId);
      if (primed) {
        setPreview(primed);
        if (
          primed.sessionStatus === "COMPLETED" ||
          primed.sessionStatus === "ENDED"
        ) {
          beginInterview(); // keeps the spinner, lands on results
        } else {
          setIsInitializing(false);
        }
        return;
      }
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
    async (content: string, artifacts: ChatArtifactRef[] = []) => {
      const sessionId = sessionIdRef.current;
      if (!sessionId || isStreaming || isComplete) return;

      const userMsgId = `user-${Date.now()}`;
      const aiMsgId = `ai-${Date.now() + 1}`;

      if (artifacts.length === 0) {
        const questionNum = messagesRef.current.filter((m) => m.role === "user").length + 1;
        analytics.track("chat_interview_message_sent", {
          template_id: sessionRef.current?.template?.id,
          question_number: questionNum,
        });
      }

      // Build the displayed artifacts for the optimistic user message:
      // whiteboard renders via `svg`, code renders via `code`.
      const displayArtifacts: NonNullable<ChatMessage["artifacts"]> =
        artifacts.map((a) =>
          a.type === "whiteboard"
            ? { type: "whiteboard", svg: a.svg }
            : { type: "code", language: a.language, code: a.data },
        );

      const userMsg: ChatMessage = {
        id: userMsgId,
        role: "user",
        content,
        timestamp: new Date().toISOString(),
        questionIndex: messagesRef.current.filter((m) => m.role === "user")
          .length,
        artifacts: displayArtifacts,
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
        reader = await store.streamChatMessage(sessionId, content, artifacts);
        await readSSE(reader, (parsed) => {
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
        });
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
      // The `result` event carries the full report and routinely spans multiple
      // read() boundaries; readSSE buffers across chunks so it isn't dropped.
      await readSSE(reader, (event) => {
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
      });
    } catch (err: any) {
      setResultsError(
        err?.message ?? "Failed to generate report. Please try again.",
      );
    } finally {
      if (reader) reader.cancel().catch(() => {});
      setIsLoadingResults(false);
    }
  }, [store]);

  // Stage a diagram as a pending attachment (replaces any existing one).
  // The learner then composes a caption and sends from the chat input.
  const handleWhiteboardSend = useCallback(
    (diagramJSON: string, svg?: string) => {
      analytics.track("chat_interview_whiteboard_submitted", {
        template_id: sessionRef.current?.template?.id,
      });
      setPendingDiagram({ type: "whiteboard", data: diagramJSON, svg });
    },
    [],
  );

  // Stage code as a pending attachment (replaces any existing one).
  const handleCodeSend = useCallback(
    (code: string, language: string) => {
      analytics.track("chat_interview_code_submitted", {
        template_id: sessionRef.current?.template?.id,
        language,
      });
      setPendingCode({ type: "code", data: code, language });
    },
    [],
  );

  // Compose-and-send used by the chat input's send button: combines the typed
  // text with any staged attachments, supplies a default caption when empty,
  // then clears the staged attachments.
  const sendComposed = useCallback(
    (text: string) => {
      const artifacts = [pendingCode, pendingDiagram].filter(
        Boolean,
      ) as ChatArtifactRef[];
      if (!text.trim() && artifacts.length === 0) return;

      let content = text.trim();
      if (!content) {
        if (pendingCode && pendingDiagram)
          content = "Here's my code solution and diagram:";
        else if (pendingCode) content = "Here's my code solution:";
        else content = "Here's my diagram:";
      }

      handleSend(content, artifacts);
      setPendingCode(null);
      setPendingDiagram(null);
    },
    [handleSend, pendingCode, pendingDiagram],
  );

  // Chips shown above the chat input for the currently staged attachments.
  const inputAttachments = [
    pendingCode && { type: "code" as const, language: pendingCode.language },
    pendingDiagram && { type: "whiteboard" as const, svg: pendingDiagram.svg },
  ].filter(Boolean) as Array<{
    type: "code" | "whiteboard";
    language?: string;
    svg?: string;
  }>;

  const handleRemoveAttachment = useCallback((type: "code" | "whiteboard") => {
    if (type === "code") setPendingCode(null);
    else setPendingDiagram(null);
  }, []);

  // First-interview onboarding: auto-run the highlight guide ONCE per user, when
  // their first real interview starts (i.e. once `hasStarted` flips after the
  // user clicks "Start Interview"). Persisted in localStorage so returning users
  // go straight to practice; the welcome "How it works" button replays it anytime.
  const [autoGuide, setAutoGuide] = useState(false);
  useEffect(() => {
    try {
      setAutoGuide(window.localStorage.getItem("mb_mi_guide_seen") !== "1");
    } catch {
      setAutoGuide(false);
    }
  }, []);

  const guideControls = useMemo(
    () =>
      mockInterviewGuideControls({
        showCode: () => { setActivePanel("code"); setMobileTab("workspace"); },
        showWhiteboard: () => { setActivePanel("whiteboard"); setMobileTab("workspace"); },
      }),
    [],
  );

  const { relaunch: relaunchGuide } = useGuidedTour({
    ready: hasStarted && !isInitializing,
    theme: "light",
    track: (event, extra) => {
      analytics.track(event, extra);
      // Mark the guide as seen the moment it starts, so it never auto-runs again
      // even if the user dismisses it midway. Replays via the button are fine.
      if (event.endsWith("_tour_started")) {
        try {
          window.localStorage.setItem("mb_mi_guide_seen", "1");
        } catch {
          /* private mode — the guide simply auto-runs again next time */
        }
      }
    },
    steps: MOCK_INTERVIEW_GUIDE_STEPS,
    eventPrefix: "mock_interview",
    // Auto-start only on the user's first real interview; the button still
    // replays on demand regardless (relaunch ignores shouldOffer/autoStart).
    autoStart: autoGuide,
    alwaysOffer: autoGuide,
    ...guideControls,
  });

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
          onHowItWorks={relaunchGuide}
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
              onSend={sendComposed}
              attachments={inputAttachments}
              onRemoveAttachment={handleRemoveAttachment}
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
        // Mobile/tablet: a bottom tab switcher flips between Chat and Workspace.
        // Both sections stay mounted (toggled with `hidden`) so chat + editor
        // state survive switches; only this branch renders below lg, so the
        // panels mount exactly once.
        <div className="flex flex-1 min-h-0 flex-col">
          {/* CHAT section */}
          <div
            className={cn(
              "min-h-0 flex-1 flex-col",
              mobileTab === "chat" ? "flex" : "hidden",
            )}
          >
            <ChatPanel
              messages={messages}
              session={session}
              isComplete={isComplete}
              isStreaming={isStreaming}
              onSend={sendComposed}
              attachments={inputAttachments}
              onRemoveAttachment={handleRemoveAttachment}
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

          {/* WORKSPACE section (code editor / whiteboard) */}
          <div
            className={cn(
              "min-h-0 flex-1 flex-col",
              mobileTab === "workspace" ? "flex" : "hidden",
            )}
          >
            {rightPanelBody}
          </div>

          {/* Bottom tab switcher */}
          <div className="flex flex-shrink-0 gap-1 border-t border-border bg-card p-1.5">
            <button
              type="button"
              aria-selected={mobileTab === "chat"}
              onClick={() => setMobileTab("chat")}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[11px] font-semibold transition-colors",
                mobileTab === "chat"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50",
              )}
            >
              <MessageSquare className="h-[18px] w-[18px]" />
              Interview
            </button>
            <button
              type="button"
              aria-selected={mobileTab === "workspace"}
              onClick={() => setMobileTab("workspace")}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[11px] font-semibold transition-colors",
                mobileTab === "workspace"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50",
              )}
            >
              <Code2 className="h-[18px] w-[18px]" />
              Workspace
            </button>
          </div>
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
