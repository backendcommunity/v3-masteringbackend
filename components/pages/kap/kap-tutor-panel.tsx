"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { marked } from "marked";
import { sanitizeHtml } from "@/lib/sanitize";
import { Send, Sparkles } from "lucide-react";
import { useAppStore, KapTutorMessage } from "@/lib/store";
import { useUser } from "@/hooks/use-user";
import { readSSE } from "@/lib/sse";
import { cn } from "@/lib/utils";

marked.setOptions({ gfm: true, breaks: true });
function mdToHtml(raw: string): string {
  if (!raw) return "";
  return sanitizeHtml(marked.parse(raw, { async: false }) as string);
}

function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

interface KapTutorPanelProps {
  scope: "video" | "project";
  videoId?: string;
  projectId?: string;
  taskId?: string;
  title?: string;
  intro?: string;
  /** Suppress the opening greeting bubble (intro + lesson title). */
  hideIntro?: boolean;
  starterPrompts?: string[];
  className?: string;
  header?: ReactNode;
  /** Called after the user dispatches a message (no message text — analytics use only). */
  onMessageSent?: () => void;
}

interface Msg extends KapTutorMessage {
  id: string;
}

const DEFAULT_VIDEO_INTRO =
  "Hi — I'm Kap, your tutor for this lesson. Ask me anything about what you're watching.";

export function KapTutorPanel({
  scope,
  videoId,
  projectId,
  taskId,
  title,
  intro,
  hideIntro,
  starterPrompts,
  className,
  header,
  onMessageSent,
}: KapTutorPanelProps) {
  const streamKapTutor = useAppStore((s) => s.streamKapTutor);
  const getKapHistory = useAppStore((s) => s.getKapHistory);
  const user = useUser();
  const refId = scope === "video" ? videoId : projectId;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  // Load history when the ref changes; abort any in-flight stream first so a
  // switch (video/project/tab) never interleaves the old stream into the new thread.
  useEffect(() => {
    let active = true;
    abortRef.current?.abort();
    setMessages([]);
    if (!refId) return;
    (async () => {
      const history = await getKapHistory(scope, refId);
      if (!active || !mountedRef.current) return;
      setMessages(history.map((m, i) => ({ ...m, id: `h-${i}-${m.ts ?? i}` })));
    })();
    return () => {
      active = false;
    };
  }, [scope, refId, getKapHistory]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || isStreaming || !refId) return;
      setNotice(null);
      setInput("");
      onMessageSent?.();

      const safeSet = (u: Parameters<typeof setMessages>[0]) => {
        if (mountedRef.current) setMessages(u);
      };
      const userMsgId = `u-${uid()}`;
      const aiId = `a-${uid()}`;
      safeSet((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: message },
        { id: aiId, role: "ai", content: "" },
      ]);
      setIsStreaming(true);
      setStreamingId(aiId);

      const controller = new AbortController();
      abortRef.current = controller;
      let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
      let errored = false;

      try {
        reader = await streamKapTutor(
          { scope, videoId, projectId, taskId, message },
          controller.signal,
        );
        await readSSE(reader, (parsed) => {
          if (parsed.type === "token" && parsed.content) {
            safeSet((prev) =>
              prev.map((m) =>
                m.id === aiId ? { ...m, content: m.content + parsed.content } : m,
              ),
            );
          } else if (parsed.type === "error") {
            errored = true;
            if (mountedRef.current) setNotice(parsed.message || "Kap had a problem.");
          }
        });
        if (errored) safeSet((prev) => prev.filter((m) => m.id !== aiId));
      } catch (e: any) {
        if (e?.name === "AbortError") return; // switched/unmounted — silent
        safeSet((prev) => prev.filter((m) => m.id !== aiId));
        if (mountedRef.current)
          setNotice(e?.message || "Kap is unavailable right now. Try again.");
      } finally {
        if (reader) reader.cancel().catch(() => {});
        if (mountedRef.current) {
          setIsStreaming(false);
          setStreamingId(null);
        }
      }
    },
    [isStreaming, refId, scope, videoId, projectId, taskId, streamKapTutor, onMessageSent],
  );

  const introText = intro ?? DEFAULT_VIDEO_INTRO;
  const userInitial = (user?.name || "Y").charAt(0).toUpperCase();

  return (
    <div className={cn("flex flex-col h-full min-h-0", className)}>
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto space-y-4 p-3"
      >
        {header}
        {messages.length === 0 && !hideIntro && (
          <div className="flex gap-2">
            <div className="shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary grid place-items-center text-xs font-bold">
              K
            </div>
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-2xl rounded-tl-sm px-3 py-2">
              {introText}
              {title ? (
                <span className="block mt-1 text-xs opacity-70">
                  {scope === "project" ? "Project" : "Lesson"}: {title}
                </span>
              ) : null}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex gap-2", m.role === "user" && "flex-row-reverse")}
          >
            <div
              className={cn(
                "shrink-0 w-7 h-7 rounded-full grid place-items-center text-xs font-bold",
                m.role === "ai"
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-foreground",
              )}
            >
              {m.role === "ai" ? "K" : userInitial}
            </div>
            <div
              className={cn(
                "max-w-[85%] text-sm rounded-2xl px-3 py-2",
                m.role === "ai"
                  ? "bg-muted/50 rounded-tl-sm"
                  : "bg-primary/10 rounded-tr-sm",
              )}
            >
              {m.role === "ai" ? (
                m.content ? (
                  m.id === streamingId ? (
                    // While streaming, render raw text + cursor — re-parsing
                    // markdown on every token is O(n²) over a long answer.
                    <span className="whitespace-pre-wrap" role="status" aria-live="polite">
                      {m.content}
                      <span className="inline-block w-0.5 h-3.5 bg-foreground/60 ml-0.5 align-middle animate-pulse" />
                    </span>
                  ) : (
                    <div
                      className="kap-prose prose-sm max-w-none [&_pre]:bg-foreground/5 [&_pre]:rounded-lg [&_pre]:p-2 [&_pre]:overflow-x-auto [&_code]:text-xs [&_p]:my-1 [&_ul]:my-1 [&_ul]:pl-4 [&_ul]:list-disc"
                      dangerouslySetInnerHTML={{ __html: mdToHtml(m.content) }}
                    />
                  )
                ) : (
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:0.3s]" />
                  </span>
                )
              ) : (
                <span className="whitespace-pre-wrap">{m.content}</span>
              )}
            </div>
          </div>
        ))}

        {notice && (
          <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
            {notice}
          </div>
        )}
      </div>

      {!!starterPrompts?.length && messages.length === 0 && (
        <div className="flex flex-wrap gap-2 px-2.5 pb-2 pt-1">
          {starterPrompts.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={isStreaming}
              className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-border p-2.5"
      >
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming || !refId}
          aria-label="Ask Kap"
          placeholder={
            scope === "video"
              ? "Ask anything about this lesson…"
              : "Ask about the task, an error, or what's failing…"
          }
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim() || !refId}
          className="shrink-0 w-8 h-8 grid place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
