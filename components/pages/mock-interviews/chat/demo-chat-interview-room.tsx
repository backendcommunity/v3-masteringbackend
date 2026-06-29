"use client";

import { useImperativeHandle, useMemo, useState } from "react";
import type { MutableRefObject } from "react";
import { ChatInterviewHeader } from "./chat-interview-header";
import { ChatPanel } from "./chat-panel";
import type { ChatInterviewSession, ChatMessage } from "@/lib/store";
import type { ReportData } from "./result-card";
import type { DemoControls } from "@/lib/mock-interview-tour";
import {
  DEMO_TEMPLATE,
  DEMO_TURNS,
  DEMO_REPORT,
  buildDemoMessage,
} from "@/lib/mock-interview-demo-script";
import { Badge } from "@/components/ui/badge";

/**
 * Backend-free, deterministic mock-interview room for the walkthrough demo.
 * Reuses the production presentational panels (header + chat panel) but holds
 * all state locally -- no store, no SSE, no network. The tour drives it through
 * `controlsRef` (playNextTurn / revealResult).
 */
export function DemoChatInterviewRoom({
  controlsRef,
}: {
  controlsRef: MutableRefObject<DemoControls | null>;
}) {
  // Start with the first AI question already on screen (count=1).
  const [count, setCount] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [resultsData, setResultsData] = useState<ReportData | null>(null);

  const messages: ChatMessage[] = useMemo(
    () => DEMO_TURNS.slice(0, count).map((t, i) => buildDemoMessage(t, i)),
    [count],
  );

  const session: ChatInterviewSession = useMemo(
    () => ({
      sessionId: "demo-session",
      sessionMode: "CHAT",
      interviewType: "Technical",
      chatMessages: messages,
      currentQuestionIndex: Math.floor(count / 2),
      codeArtifact: null,
      codeLanguage: null,
      whiteboardArtifact: null,
      status: isComplete ? "COMPLETED" : "IN_PROGRESS",
      startedAt: new Date(0).toISOString(),
      endedAt: isComplete ? new Date(0).toISOString() : null,
      template: DEMO_TEMPLATE,
    }),
    [messages, count, isComplete],
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
    }),
    [],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="relative">
        <ChatInterviewHeader
          template={DEMO_TEMPLATE}
          onEndInterview={() => {
            setIsComplete(true);
            setResultsData(DEMO_REPORT);
          }}
          isComplete={isComplete}
          resultsReady={!!resultsData}
          startedAt={new Date(0).toISOString()}
        />
        <Badge
          variant="secondary"
          className="absolute right-3 top-3 z-10 bg-primary/15 text-primary"
        >
          Demo
        </Badge>
      </div>

      <div className="min-h-0 flex-1">
        <ChatPanel
          messages={messages}
          session={session}
          isComplete={isComplete}
          isStreaming={false}
          onSend={() => setCount((c) => Math.min(c + 1, DEMO_TURNS.length))}
          resultsData={resultsData}
          isLoadingResults={false}
          resultsProgress={null}
          resultsError={null}
          onGetResults={() => {
            setIsComplete(true);
            setResultsData(DEMO_REPORT);
          }}
          questionAnalysis={[]}
          resultsRevealed={!!resultsData}
          userName="You"
          userAvatar={null}
        />
      </div>
    </div>
  );
}
