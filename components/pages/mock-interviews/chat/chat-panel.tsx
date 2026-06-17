"use client";

import { useEffect, useRef } from "react";
import { ChatMessageBubble, TypingIndicator } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ResultCard, ReportData } from "./result-card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  AlertCircle,
  LogOut,
  MessageSquareOff,
  RotateCcw,
} from "lucide-react";
import type { ChatMessage, ChatInterviewSession } from "@/lib/store";
import { analytics } from "@/lib/analytics";

interface ChatPanelProps {
  messages: ChatMessage[];
  session: ChatInterviewSession;
  isComplete: boolean;
  isStreaming: boolean;
  onSend: (content: string) => void;
  attachments?: Array<{
    type: "code" | "whiteboard";
    language?: string;
    svg?: string;
  }>;
  onRemoveAttachment?: (type: "code" | "whiteboard") => void;
  resultsData: ReportData | null;
  isLoadingResults: boolean;
  resultsProgress: string | null;
  resultsError: string | null;
  onGetResults: () => void;
  onExit?: () => void;
  onRestart?: () => void;
  isRestartLoading?: boolean;
  questionAnalysis: Array<{ score: number; feedback: string }>;
  resultsRevealed: boolean;
  insufficientAnswers?: boolean;
  userName?: string;
  userAvatar?: string | null;
}

export function ChatPanel({
  messages,
  session,
  isComplete,
  isStreaming,
  onSend,
  attachments,
  onRemoveAttachment,
  resultsData,
  isLoadingResults,
  resultsProgress,
  resultsError,
  onGetResults,
  questionAnalysis,
  resultsRevealed,
  insufficientAnswers,
  userName,
  userAvatar,
  onExit,
  onRestart,
  isRestartLoading,
}: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isStreaming, resultsData]);

  const userMessages = messages.filter((m) => m.role === "user");
  // Must match the backend's completion count (chat-engine: template.questions || 5).
  // A different fallback here showed e.g. "5 / 10" then completed at 5 — the
  // "confusing question count before result" bug.
  const totalQuestions = session.template.questions || 5;

  // Show typing indicator when AI placeholder message has no content yet
  const lastMsg = messages.at(-1);
  const showTypingIndicator =
    isStreaming && lastMsg?.role === "ai" && !lastMsg.content;

  // ID of the message currently being streamed (last AI with growing content)
  const streamingMsgId =
    isStreaming && lastMsg?.role === "ai" && lastMsg.content
      ? lastMsg.id
      : null;

  // Map user message → analysis entry by insertion order
  const getUserAnalysis = (msg: ChatMessage) => {
    if (!resultsRevealed || msg.role !== "user") return null;
    const userIdx = userMessages.indexOf(msg);
    return questionAnalysis[userIdx] ?? null;
  };

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
        <div className="py-3 max-w-3xl mx-auto w-full">
          {messages.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-8 px-4">
              Your conversation with Kap will appear here.
            </p>
          )}

          {messages.map((message, idx) => {
            // Skip the empty AI placeholder — TypingIndicator renders in its place
            if (showTypingIndicator && idx === messages.length - 1) return null;
            return (
              <ChatMessageBubble
                key={message.id}
                message={message}
                analysis={getUserAnalysis(message)}
                isStreaming={message.id === streamingMsgId}
                sessionId={session.sessionId}
                userName={userName}
                userAvatar={userAvatar}
              />
            );
          })}

          {showTypingIndicator && <TypingIndicator />}

          {/* Inline results section — appears after interview completes */}
          {isComplete && (
            <div className="px-4 pt-3 pb-3">
              {insufficientAnswers ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquareOff className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                      Not enough responses
                    </p>
                  </div>
                  <p className="text-sm text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                    You need to answer at least 3 questions to generate a
                    performance report. Start a new interview and complete at
                    least 3 questions to receive Kap's feedback.
                  </p>
                  <div className="flex items-center gap-2">
                    {onRestart && (
                      <Button
                        size="sm"
                        onClick={() => { analytics.track("chat_interview_restart_clicked"); onRestart(); }}
                        disabled={isRestartLoading}
                        className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {isRestartLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                        {isRestartLoading ? "Checking…" : "Restart Interview"}
                      </Button>
                    )}
                    {onExit && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { analytics.track("chat_interview_exit_clicked", { context: "insufficient_answers" }); onExit(); }}
                        className="h-8 text-xs gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Exit room
                      </Button>
                    )}
                  </div>
                </div>
              ) : resultsData ? (
                <>
                  <ResultCard data={resultsData} />
                  <div className="mt-3 flex items-center justify-end gap-2">
                    {onRestart && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { analytics.track("chat_interview_restart_clicked"); onRestart(); }}
                        disabled={isRestartLoading}
                        className="h-8 text-xs gap-1.5"
                      >
                        {isRestartLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                        {isRestartLoading ? "Checking…" : "Restart"}
                      </Button>
                    )}
                    {onExit && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { analytics.track("chat_interview_exit_clicked", { context: "post_results" }); onExit(); }}
                        className="h-8 text-xs gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Exit room
                      </Button>
                    )}
                  </div>
                </>
              ) : isLoadingResults ? (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/30">
                  <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {resultsProgress ?? "Analyzing your responses…"}
                  </p>
                </div>
              ) : resultsError ? (
                <div className="flex flex-col gap-2 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                    <p className="text-sm text-destructive">{resultsError}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onGetResults}
                    className="self-start h-7 text-xs"
                  >
                    Try again
                  </Button>
                </div>
              ) : insufficientAnswers ? (
                <div className="flex flex-col items-center gap-3 p-5 rounded-xl border border-border bg-muted/30 text-center">
                  <MessageSquareOff className="w-6 h-6 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Interview ended
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Not enough responses to generate a report.
                    </p>
                  </div>
                </div>
              ) : (
                // Results auto-generate on completion (chat-interview-room);
                // no manual button — just reflect that generation is underway.
                <div className="flex flex-col items-center gap-3 p-5 rounded-xl border border-primary/20 bg-primary/5 text-center">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Interview Complete!
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Generating your performance report…
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div ref={bottomRef} aria-hidden="true" />
        </div>
      </div>

      {/* Footer: response counter + input */}
      <div className="flex-shrink-0 border-t border-border bg-muted/10">
        {!isComplete && (
          <div
            className="max-w-3xl mx-auto px-4 sm:px-5 pt-2 pb-0"
            aria-live="polite"
            aria-atomic="true"
          >
            <p
              className="text-xs text-muted-foreground"
              aria-label={`${userMessages.length} of ${totalQuestions} responses submitted`}
            >
              {userMessages.length} / {totalQuestions} Responses
            </p>
          </div>
        )}
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSend={onSend}
            attachments={attachments}
            onRemoveAttachment={onRemoveAttachment}
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
    </div>
  );
}
