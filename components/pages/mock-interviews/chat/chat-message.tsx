"use client";

import { useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import { ChatMessage, useAppStore } from "@/lib/store";

interface ChatMessageProps {
  message: ChatMessage;
  analysis?: { score: number; feedback: string } | null;
  isStreaming?: boolean;
  sessionId?: string;
  userName?: string;
  userAvatar?: string | null;
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Average";
  return "Below Average";
}

function getScorePillClass(score: number): string {
  if (score >= 70)
    return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
  if (score >= 50)
    return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
  return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function ChatMessageBubble({ message, analysis, isStreaming, sessionId, userName, userAvatar }: ChatMessageProps) {
  const store = useAppStore();
  const isAI = message.role === "ai";
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [codeExpanded, setCodeExpanded] = useState(false);
  const [whiteboardExpanded, setWhiteboardExpanded] = useState(false);

  const handleCopy = () => {
    const text = message.artifactRef?.type === "code" && message.artifactRef.code
      ? message.artifactRef.code
      : message.content;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVote = async (v: "up" | "down") => {
    const newVote = vote === v ? null : v;
    setVote(newVote);
    if (newVote && sessionId) {
      store.submitMessageFeedback(sessionId, message.id, newVote, message.content).catch(() => {});
    }
  };

  return (
    <div className={cn("flex gap-2 w-full px-4 py-1.5 group", isAI ? "justify-start" : "justify-end")}>
      {/* AI avatar — K circle */}
      {isAI && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center mt-0.5">
          <span className="text-[11px] font-bold text-primary-foreground">K</span>
        </div>
      )}

      <div className={cn("flex flex-col gap-1 max-w-[80%]", isAI ? "items-start" : "items-end")}>
        {/* Message bubble */}
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
            isAI
              ? "bg-transparent text-foreground"
              : cn(
                  "bg-muted text-foreground",
                  analysis && analysis.score < 50
                    ? "ring-1 ring-red-400/50"
                    : analysis && analysis.score < 70
                      ? "ring-1 ring-amber-400/50"
                      : "",
                ),
          )}
        >
          {/* Whiteboard artifact */}
          {message.artifactRef?.type === "whiteboard" && (
            <div className="mb-2">
              {message.artifactRef.svg ? (
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-muted/60 border-b border-border/50">
                    <span className="text-[10px] text-muted-foreground font-medium">🎨 Diagram</span>
                    <button
                      onClick={() => setWhiteboardExpanded((v) => !v)}
                      className="text-[10px] text-primary hover:underline transition-colors"
                    >
                      {whiteboardExpanded ? "Collapse" : "Expand"}
                    </button>
                  </div>
                  <div
                    className={cn(
                      "overflow-auto bg-white p-2 transition-all duration-200",
                      whiteboardExpanded ? "" : "max-h-[200px]",
                    )}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(message.artifactRef.svg, {
                        USE_PROFILES: { svg: true, svgFilters: true },
                      }),
                    }}
                  />
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs bg-muted/60 rounded-full px-2.5 py-1 text-muted-foreground">
                  🎨 Diagram submitted
                </span>
              )}
            </div>
          )}

          {/* Code artifact */}
          {message.artifactRef?.type === "code" && (
            <div className="mb-2">
              {message.artifactRef.code ? (() => {
                const lines = message.artifactRef.code.split("\n");
                const truncated = lines.length > 8;
                return (
                  <div className="rounded-lg overflow-hidden border border-border">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-[#1e1e1e] border-b border-border/50">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {message.artifactRef.language || "code"}
                      </span>
                      {truncated && (
                        <button
                          onClick={() => setCodeExpanded((v) => !v)}
                          className="text-[10px] text-primary hover:text-blue-300 transition-colors"
                        >
                          {codeExpanded ? "Collapse" : `Expand (${lines.length} lines)`}
                        </button>
                      )}
                    </div>
                    <pre className="bg-[#1e1e1e] text-[11px] font-mono text-gray-200 px-3 py-2 overflow-x-auto leading-relaxed">
                      {codeExpanded ? message.artifactRef.code : lines.slice(0, 8).join("\n")}
                      {!codeExpanded && truncated && (
                        <span className="text-muted-foreground/70">
                          {"\n"}… {lines.length - 8} more lines
                        </span>
                      )}
                    </pre>
                  </div>
                );
              })() : (
                <span className="inline-flex items-center gap-1 text-xs bg-muted/60 rounded-full px-2.5 py-1 text-muted-foreground">
                  💻 Code submitted
                </span>
              )}
            </div>
          )}

          {/* Message text */}
          <span className="whitespace-pre-wrap">
            {message.content}
            {isAI && isStreaming && message.content && (
              <span className="inline-block w-0.5 h-3.5 bg-foreground/60 ml-0.5 align-middle animate-pulse" />
            )}
          </span>
        </div>

        {/* Score pill */}
        {!isAI && analysis && (
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", getScorePillClass(analysis.score))}>
            {getScoreLabel(analysis.score)}
          </span>
        )}

        {/* Per-answer feedback tip */}
        {!isAI && analysis?.feedback && (
          <p className="text-[11px] text-muted-foreground max-w-[90%] text-right px-1">
            💡 {analysis.feedback}
          </p>
        )}

        {/* Action bar — copy + vote (AI messages only for training) */}
        {message.content && !isStreaming && (
          <div className={cn(
            "flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
            isAI ? "justify-start" : "justify-end",
          )}>
            <button
              onClick={handleCopy}
              title="Copy message"
              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            </button>
            {isAI && (
              <>
                <button
                  onClick={() => handleVote("up")}
                  title="Good response (helps train the AI)"
                  className={cn(
                    "p-1 rounded hover:bg-muted transition-colors",
                    vote === "up" ? "text-green-500" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <ThumbsUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleVote("down")}
                  title="Poor response (helps train the AI)"
                  className={cn(
                    "p-1 rounded hover:bg-muted transition-colors",
                    vote === "down" ? "text-red-500" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <ThumbsDown className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* User avatar — photo or initials */}
      {!isAI && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full mt-0.5 overflow-hidden flex items-center justify-center bg-primary text-primary-foreground text-[11px] font-bold flex-shrink-0">
          {userAvatar ? (
            <Image src={userAvatar} alt={userName || "You"} width={32} height={32} className="object-cover" />
          ) : (
            <span>{userName ? getInitials(userName) : "U"}</span>
          )}
        </div>
      )}
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-2 px-4 py-1.5">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center mt-0.5">
        <span className="text-[11px] font-bold text-primary-foreground">K</span>
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl bg-muted px-3.5 py-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/70 animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/70 animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/70 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

export function StreamingMessage({ content }: { content: string }) {
  return (
    <div className="flex gap-2 px-4 py-1.5">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center mt-0.5">
        <span className="text-[11px] font-bold text-primary-foreground">K</span>
      </div>
      <div className="max-w-[80%] text-sm text-foreground leading-relaxed whitespace-pre-wrap">
        {content}
        <span className="inline-block w-0.5 h-3.5 bg-foreground/60 ml-0.5 align-middle animate-pulse" />
      </div>
    </div>
  );
}
