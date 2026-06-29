"use client";

import { useEffect, useImperativeHandle, useMemo, useState } from "react";
import type { MutableRefObject } from "react";
import { cn } from "@/lib/utils";
import { ChatInterviewHeader } from "./chat-interview-header";
import { ChatPanel } from "./chat-panel";
import { CodeEditorPanel } from "./code-editor-panel";
import { WhiteboardPanel } from "./whiteboard-panel";
import type { ChatInterviewSession, ChatMessage } from "@/lib/store";
import type { ReportData } from "./result-card";
import type { DemoControls } from "@/lib/mock-interview-tour";
import {
  DEMO_TEMPLATE,
  DEMO_TURNS,
  DEMO_REPORT,
  buildDemoMessage,
} from "@/lib/mock-interview-demo-script";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Code2, PenTool, MessageSquare, Sparkles } from "lucide-react";

// Seeded code sample shown in the code editor on the demo workspace panel.
const DEMO_CODE =
  "function rateLimiter(key) {\n  // token bucket per API key in Redis\n  return bucket.take(key);\n}";

/**
 * Backend-free, deterministic mock-interview room for the walkthrough demo.
 * Reuses the production presentational panels (header + chat panel + workspace)
 * but holds all state locally -- no store, no SSE, no network. The tour drives
 * it through `controlsRef` (playNextTurn / revealResult / showWorkspace).
 */
export function DemoChatInterviewRoom({
  controlsRef,
}: {
  controlsRef: MutableRefObject<DemoControls | null>;
}) {
  // Capture the real wall-clock start time so the countdown begins from ~30 min
  // rather than epoch 1970 (which would make secondsLeft=0 on first render and
  // immediately fire onEndInterview, defeating the scripted tour).
  const [startedAt] = useState(() => new Date().toISOString());
  // Start with the first AI question already on screen (count=1).
  const [count, setCount] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [resultsData, setResultsData] = useState<ReportData | null>(null);

  // Workspace panel state — mirrors the real ChatInterviewRoom pattern.
  const [activePanel, setActivePanel] = useState<"code" | "whiteboard">("code");
  const [mobileTab, setMobileTab] = useState<"chat" | "workspace">("chat");
  const [lgUp, setLgUp] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setLgUp(mq.matches);
    const handler = (e: MediaQueryListEvent) => setLgUp(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const messages: ChatMessage[] = useMemo(
    () => DEMO_TURNS.slice(0, count).map((t, i) => buildDemoMessage(t, i)),
    [count],
  );

  const session: ChatInterviewSession = useMemo(
    () => ({
      // Empty string keeps the handleVote guard (`if (newVote && sessionId)`)
      // false in demo mode — no feedback POST fires against the real backend.
      sessionId: "",
      sessionMode: "CHAT",
      interviewType: "Technical",
      chatMessages: messages,
      currentQuestionIndex: Math.floor(count / 2),
      codeArtifact: null,
      codeLanguage: null,
      whiteboardArtifact: null,
      status: isComplete ? "COMPLETED" : "IN_PROGRESS",
      startedAt,
      endedAt: isComplete ? new Date().toISOString() : null,
      template: DEMO_TEMPLATE,
    }),
    // startedAt is a stable lazy-init constant; listed to keep exhaustive-deps happy.
    [messages, count, isComplete, startedAt],
  );

  // Imperative controls the tour calls on the matching steps.
  useImperativeHandle(
    controlsRef,
    () => ({
      playNextTurn: () => setCount((c) => Math.min(c + 1, DEMO_TURNS.length)),
      revealResult: () => {
        setCount(DEMO_TURNS.length);
        setIsComplete(true);
        setResultsData(DEMO_REPORT);
      },
      showWorkspace: () => {
        setActivePanel("code");
        setMobileTab("workspace");
      },
    }),
    [],
  );

  // Tab switcher for the work tools (Code Editor / Whiteboard).
  const workToolsTabs = (
    <>
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
    </>
  );

  // The active work-tool panel.
  const activeWorkPanel =
    activePanel === "code" ? (
      <CodeEditorPanel
        onSendToKap={() => {}}
        disabled={isComplete}
        savedCode={DEMO_CODE}
        savedLanguage="JavaScript"
      />
    ) : (
      <WhiteboardPanel
        onSendToKap={() => {}}
        disabled={isComplete}
      />
    );

  // Full body of the work tools (tabs + active panel).
  const rightPanelBody = (
    <>
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-muted/20 flex-shrink-0">
        {workToolsTabs}
      </div>
      <div className="flex-1 min-h-0">{activeWorkPanel}</div>
    </>
  );

  // Shared ChatPanel props — kept DRY for both desktop and mobile branches.
  const chatPanelProps = {
    messages,
    session,
    isComplete,
    isStreaming: false,
    onSend: () => setCount((c) => Math.min(c + 1, DEMO_TURNS.length)),
    resultsData,
    isLoadingResults: false,
    resultsProgress: null,
    resultsError: null,
    onGetResults: () => {
      setIsComplete(true);
      setResultsData(DEMO_REPORT);
    },
    questionAnalysis: [] as [],
    resultsRevealed: !!resultsData,
    userName: "You",
    userAvatar: null,
  } as const;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-center gap-1.5 border-b border-primary/20 bg-primary/10 py-1 text-[11px] font-semibold text-primary">
        <Sparkles className="h-3 w-3" aria-hidden="true" />
        Demo - a guided walkthrough
      </div>
      <ChatInterviewHeader
        template={DEMO_TEMPLATE}
        onEndInterview={() => {
          setIsComplete(true);
          setResultsData(DEMO_REPORT);
        }}
        isComplete={isComplete}
        resultsReady={!!resultsData}
        startedAt={startedAt}
      />

      {lgUp ? (
        // Desktop: chat + resizable workspace side panel.
        <ResizablePanelGroup
          orientation="horizontal"
          className="flex-1 min-h-0 overflow-hidden"
        >
          <ResizablePanel
            defaultSize="55"
            minSize="25"
            maxSize="75"
            className="flex flex-col min-h-0"
          >
            <ChatPanel {...chatPanelProps} />
          </ResizablePanel>

          <ResizableHandle withHandle />

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
        // Mobile: chat and workspace both mounted (toggled hidden) + bottom tab switcher.
        <div className="flex flex-1 min-h-0 flex-col">
          {/* CHAT section */}
          <div
            className={cn(
              "min-h-0 flex-1 flex-col",
              mobileTab === "chat" ? "flex" : "hidden",
            )}
          >
            <ChatPanel {...chatPanelProps} />
          </div>

          {/* WORKSPACE section */}
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
    </div>
  );
}
