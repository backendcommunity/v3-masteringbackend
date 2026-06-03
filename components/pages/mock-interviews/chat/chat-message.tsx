"use client";

import DOMPurify from "isomorphic-dompurify";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/lib/store";

interface ChatMessageProps {
  message: ChatMessage;
  analysis?: { score: number; feedback: string } | null;
}

export function ChatMessageBubble({ message, analysis }: ChatMessageProps) {
  const isAI = message.role === "ai";

  return (
    <div
      className={cn(
        "flex gap-2 w-full",
        isAI ? "justify-start" : "justify-end",
      )}
    >
      {/* AI avatar */}
      {isAI && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center mt-0.5">
          <span className="text-[11px] font-bold text-primary-foreground">
            K
          </span>
        </div>
      )}

      <div
        className={cn(
          "flex flex-col gap-1 max-w-[80%]",
          isAI ? "items-start" : "items-end",
        )}
      >
        {/* Message bubble */}
        <div className="flex items-start gap-2">
          {/* Score bar for user messages with analysis */}
          {!isAI && analysis && (
            <div className="flex flex-col items-center self-stretch justify-center gap-1 mr-1">
              <div className="w-1 flex-1 rounded-full bg-muted overflow-hidden min-h-[32px]">
                <div
                  className={cn(
                    "w-full rounded-full transition-all",
                    analysis.score >= 70
                      ? "bg-green-400"
                      : analysis.score >= 50
                        ? "bg-amber-400"
                        : "bg-red-400",
                  )}
                  style={{
                    height: `${Math.min(100, Math.max(0, analysis.score))}%`,
                  }}
                />
              </div>
              <span
                className={cn(
                  "text-[9px] font-semibold tabular-nums",
                  analysis.score >= 70
                    ? "text-green-500"
                    : analysis.score >= 50
                      ? "text-amber-500"
                      : "text-red-500",
                )}
              >
                {Math.round(analysis.score / 10)}/10
              </span>
            </div>
          )}

          <div
            className={cn(
              "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
              isAI
                ? "bg-transparent text-foreground prose prose-sm max-w-none"
                : "bg-muted text-foreground",
            )}
          >
            {/* Artifact: whiteboard */}
            {message.artifactRef?.type === "whiteboard" && (
              <div className="mb-2">
                {message.artifactRef.svg ? (
                  <div
                    className="max-h-[200px] overflow-auto rounded-lg border border-border bg-white p-2"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(message.artifactRef.svg, {
                        USE_PROFILES: { svg: true, svgFilters: true },
                      }),
                    }}
                  />
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs bg-muted/60 rounded-full px-2.5 py-1 text-muted-foreground">
                    🎨 Diagram submitted
                  </span>
                )}
              </div>
            )}

            {/* Artifact: code */}
            {message.artifactRef?.type === "code" && (
              <div className="mb-2">
                {message.artifactRef.code ? (
                  <div className="rounded-lg overflow-hidden border border-border">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-[#1e1e1e] border-b border-border/50">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {message.artifactRef.language || "code"}
                      </span>
                    </div>
                    <pre className="bg-[#1e1e1e] text-[11px] font-mono text-gray-200 px-3 py-2 overflow-x-auto leading-relaxed">
                      {message.artifactRef.code
                        .split("\n")
                        .slice(0, 8)
                        .join("\n")}
                      {message.artifactRef.code.split("\n").length > 8 && (
                        <span className="text-muted-foreground">
                          {"\n"}…{" "}
                          {message.artifactRef.code.split("\n").length - 8} more
                          lines
                        </span>
                      )}
                    </pre>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs bg-muted/60 rounded-full px-2.5 py-1 text-muted-foreground">
                    💻 Code submitted
                  </span>
                )}
              </div>
            )}

            {/* Message text */}
            <span className="whitespace-pre-wrap">{message.content}</span>
          </div>
        </div>

        {/* Per-answer feedback tip */}
        {!isAI && analysis?.feedback && (
          <p className="text-[11px] text-muted-foreground max-w-[90%] text-right px-1">
            💡 {analysis.feedback}
          </p>
        )}
      </div>
    </div>
  );
}
