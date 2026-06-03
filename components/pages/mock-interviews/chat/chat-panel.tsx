"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  ChatMessageBubble,
  TypingIndicator,
  StreamingMessage,
} from "./chat-message";
import { ChatInput } from "./chat-input";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import type { ChatMessage } from "@/lib/store";

interface ChatPanelProps {
  messages: ChatMessage[];
  streamingContent: string;
  isAITyping: boolean;
  currentQuestionIndex: number;
  totalQuestions: number;
  onSend: (content: string) => void;
  disabled?: boolean;
  isComplete?: boolean;
  centered?: boolean;
  sessionId?: string;
}

export function ChatPanel({
  messages,
  streamingContent,
  isAITyping,
  currentQuestionIndex,
  totalQuestions,
  onSend,
  disabled,
  isComplete,
  centered,
  sessionId,
}: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, streamingContent, isAITyping]);

  const userResponseCount = messages.filter((m) => m.role === "user").length;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain"
        role="log"
        aria-label="Interview conversation"
        aria-live="polite"
        aria-relevant="additions"
        aria-busy={isAITyping}
      >
        <div className={cn("py-3", centered && "max-w-3xl mx-auto w-full")}>
          {messages.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-8 px-4">
              Your conversation with Kap will appear here.
            </p>
          )}
          {messages.map((message) => (
            <ChatMessageBubble key={message.id} message={message} />
          ))}
          {streamingContent && !isAITyping && (
            <StreamingMessage content={streamingContent} />
          )}
          {isAITyping && !streamingContent && <TypingIndicator />}
          <div ref={bottomRef} aria-hidden="true" />
        </div>
      </div>

      {/* Completion banner */}
      {isComplete && (
        <div
          className="flex-shrink-0 px-4 sm:px-5 py-3 bg-emerald-500/10 border-t border-emerald-500/20"
          role="status"
          aria-live="polite"
        >
          <div
            className={cn(
              "flex items-center justify-between gap-3",
              centered && "max-w-3xl mx-auto",
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Trophy
                className="w-4 h-4 text-emerald-500 flex-shrink-0"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  Interview Complete!
                </p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 truncate">
                  Your report is being generated…
                </p>
              </div>
            </div>
            {sessionId && (
              <Button
                size="sm"
                className="flex-shrink-0 h-8 px-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() =>
                  (window.location.href = `/mock-interviews/${sessionId}/results`)
                }
                aria-label="View your interview results"
              >
                View Results
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Footer: response counter + input */}
      <div className={cn("flex-shrink-0 border-t border-border")}>
        <div className={cn(centered && "max-w-3xl mx-auto w-full")}>
          {!isComplete && (
            <div
              className="px-4 sm:px-5 pt-2 pb-0"
              aria-live="polite"
              aria-atomic="true"
            >
              <p
                className="text-xs text-muted-foreground"
                aria-label={`${userResponseCount} of ${totalQuestions} responses submitted`}
              >
                {userResponseCount} / {totalQuestions} Responses
              </p>
            </div>
          )}
          <ChatInput
            onSend={onSend}
            disabled={
              disabled || isAITyping || !!streamingContent || isComplete
            }
            placeholder={
              isComplete
                ? "Interview complete"
                : isAITyping || streamingContent
                  ? "Kap is responding…"
                  : "Enter response here"
            }
          />
        </div>
      </div>
    </div>
  );
}
