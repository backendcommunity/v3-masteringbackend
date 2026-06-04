"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAppStore, ChatMessage, ChatInterviewSession } from "@/lib/store";
import { ResultCard, ReportData } from "./result-card";
import { ChatMessageBubble } from "./chat-message";
import { CodeEditorPanel } from "./code-editor-panel";
import { WhiteboardPanel } from "./whiteboard-panel";
import { Button } from "@/components/ui/button";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Loader2,
  ArrowLeft,
  Code2,
  PenTool,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface ChatInterviewReplayRoomProps {
  sessionId: string;
}

type ActivePanel = "code" | "whiteboard";

function ScorePill({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-green-100 text-green-700 border-green-200"
      : score >= 50
        ? "bg-amber-100 text-amber-700 border-amber-200"
        : "bg-red-100 text-red-700 border-red-200";
  return (
    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", color)}>
      {score}%
    </span>
  );
}

export function ChatInterviewReplayRoom({ sessionId }: ChatInterviewReplayRoomProps) {
  const router = useRouter();
  const store = useAppStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [session, setSession] = useState<ChatInterviewSession | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>("code");
  const [userName, setUserName] = useState<string>("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [sessionData, reportData] = await Promise.allSettled([
          store.getChatInterviewSession(sessionId),
          store.getChatSessionReport(sessionId),
        ]);

        if (cancelled) return;

        if (sessionData.status === "fulfilled") {
          setSession(sessionData.value);
        } else {
          throw new Error("Failed to load session");
        }

        if (reportData.status === "fulfilled" && reportData.value) {
          setReport(reportData.value);
        }
      } catch (err: any) {
        if (!cancelled) setLoadError(err?.message ?? "Failed to load interview");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    store.getUser().then((u: any) => {
      if (u?.name) setUserName(u.name);
      if (u?.avatar || u?.image) setUserAvatar(u.avatar || u.image || null);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.chatMessages?.length, report]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading interview…</p>
        </div>
      </div>
    );
  }

  if (loadError || !session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-3 px-4">
          <p className="text-sm font-semibold text-foreground">Unable to load interview</p>
          <p className="text-xs text-muted-foreground">{loadError}</p>
          <Button size="sm" variant="outline" onClick={() => router.push("/mock-interviews")}>
            Back to interviews
          </Button>
        </div>
      </div>
    );
  }

  const { template, chatMessages, codeArtifact, codeLanguage, whiteboardArtifact, endedAt } = session;
  const userMessages = chatMessages.filter((m) => m.role === "user");
  const questionAnalysis = report?.questionAnalysis ?? [];

  const savedDiagram =
    whiteboardArtifact && typeof whiteboardArtifact === "object"
      ? (whiteboardArtifact as object)
      : undefined;

  const getUserAnalysis = (msg: ChatMessage) => {
    if (msg.role !== "user") return null;
    const idx = userMessages.indexOf(msg);
    return questionAnalysis[idx] ?? null;
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 flex-shrink-0">
        {/* Left */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden">
            <Image src="/blue-icon-logo.png" alt="Mastering Backend" width={26} height={26} className="object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">
              {template.name || template.position || "Mock Interview"}
            </p>
            {(template.position || template.company) && (
              <p className="text-[11px] text-muted-foreground truncate leading-tight">
                {[template.position, template.company].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>

        {/* Center: status */}
        <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-xs font-medium text-muted-foreground">Session Complete</span>
          {report?.overallScore != null && <ScorePill score={report.overallScore} />}
          {endedAt && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              {new Date(endedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Right */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs px-3 gap-1.5 flex-shrink-0"
          onClick={() => router.push("/mock-interviews")}
        >
          <ArrowLeft className="w-3 h-3" />
          Back
        </Button>
      </header>

      {/* Main content */}
      <ResizablePanelGroup orientation="horizontal" className="flex-1 min-h-0 overflow-hidden">
        {/* Chat panel — read-only */}
        <ResizablePanel defaultSize="55" minSize="25" maxSize="75" className="flex flex-col min-h-0">
          <div className="flex flex-col h-full bg-background overflow-hidden">
            <div
              className="flex-1 overflow-y-auto overscroll-contain"
              role="log"
              aria-label="Interview conversation"
            >
              <div className="max-w-3xl mx-auto px-4 sm:px-5 py-4 space-y-1">
                {chatMessages.map((msg) => {
                  const analysis = getUserAnalysis(msg);
                  return (
                    <ChatMessageBubble
                      key={msg.id}
                      message={msg}
                      isStreaming={false}
                      analysis={analysis}
                      userName={userName}
                      userAvatar={userAvatar}
                    />
                  );
                })}

                {/* Result card */}
                {report && (
                  <div className="pt-2">
                    <ResultCard data={report} />
                  </div>
                )}

                <div ref={bottomRef} aria-hidden="true" />
              </div>
            </div>

            {/* Read-only footer */}
            <div className="flex-shrink-0 border-t border-border bg-muted/10 px-4 py-3">
              <p className="text-xs text-muted-foreground text-center">
                {userMessages.length} response{userMessages.length !== 1 ? "s" : ""} · Read-only replay
              </p>
            </div>
          </div>
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

          {/* Active panel — always disabled (view only) */}
          <div className="flex-1 min-h-0">
            {activePanel === "code" ? (
              <CodeEditorPanel
                onSendToKap={() => {}}
                disabled={true}
                savedCode={codeArtifact}
                savedLanguage={codeLanguage}
              />
            ) : (
              <WhiteboardPanel
                onSendToKap={() => {}}
                disabled={true}
                savedDiagram={savedDiagram}
              />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
