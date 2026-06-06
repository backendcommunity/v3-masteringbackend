"use client";

import { useEffect, useRef } from "react";
import { ChatMessageBubble, TypingIndicator } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ResultCard, ReportData } from "./result-card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  AlertCircle,
  BarChart2,
  LogOut,
  MessageSquareOff,
  RotateCcw,
} from "lucide-react";
import type { ChatMessage, ChatInterviewSession } from "@/lib/store";

interface ChatPanelProps {
  messages: ChatMessage[];
  session: ChatInterviewSession;
  isComplete: boolean;
  isStreaming: boolean;
  onSend: (content: string) => void;
  resultsData: ReportData | null;
  isLoadingResults: boolean;
  isResultsStreaming: boolean;
  resultsProgress: string | null;
  resultsError: string | null;
  onGetResults: () => void;
  onExit?: () => void;
  onRestart?: () => void;
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
  resultsData,
  isLoadingResults,
  isResultsStreaming,
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
}: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isStreaming, resultsData]);

  const userMessages = messages.filter((m) => m.role === "user");
  const totalQuestions = session.template.questions || 10;

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

          {messages.map((message) => (
            <ChatMessageBubble
              key={message.id}
              message={message}
              analysis={getUserAnalysis(message)}
              isStreaming={message.id === streamingMsgId}
              sessionId={session.sessionId}
              userName={userName}
              userAvatar={userAvatar}
            />
          ))}

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
                        onClick={onRestart}
                        className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restart Interview
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onExit}
                      className="h-8 text-xs gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Exit room
                    </Button>
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
                        onClick={onRestart}
                        className="h-8 text-xs gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restart
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onExit}
                      className="h-8 text-xs gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Exit room
                    </Button>
                  </div>
                </>
              ) : isLoadingResults ? (
                isResultsStreaming ? (
                  <div className="px-1">
                    <TypingIndicator />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/30">
                    <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      {resultsProgress ?? "Generating your feedback report…"}
                    </p>
                  </div>
                )
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
              ) : (
                <div className="flex flex-col items-center gap-3 p-5 rounded-xl border border-primary/20 bg-primary/5 text-center">
                  <BarChart2 className="w-6 h-6 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Interview Complete!
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your performance report is ready to generate.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={onGetResults}
                    disabled={isLoadingResults}
                    className="h-8 px-5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Get your Result
                  </Button>
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
