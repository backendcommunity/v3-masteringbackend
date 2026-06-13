"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
  useMemo,
} from "react";
import {
  useTranscriptions,
  useLocalParticipant,
} from "@livekit/components-react";
import { cn } from "@/lib/utils";
import { Bot, User, ChevronDown, MessageSquare, Code2, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TranscriptEntry {
  id: string;
  speaker: "interviewer" | "candidate";
  speakerName: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
  // Locally-injected shares (code / whiteboard) render as rich bubbles.
  kind?: "text" | "code" | "whiteboard";
  language?: string;
}

interface InterviewTranscriptPanelProps {
  className?: string;
  transcriptRef: React.RefObject<TranscriptEntry[] | null>;
  // Locally-injected entries (e.g. code / whiteboard the candidate shared)
  // merged into the live transcript by timestamp.
  injected?: TranscriptEntry[];
}

export function InterviewTranscriptPanel({
  className,
  transcriptRef,
  injected,
}: InterviewTranscriptPanelProps) {
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isScrollingProgrammaticallyRef = useRef(false);

  // Use refs to track processed data without causing re-renders
  const processedIdsRef = useRef<Set<string>>(new Set());
  const entriesMapRef = useRef<Map<string, TranscriptEntry>>(new Map());

  const transcriptions = useTranscriptions();
  const { localParticipant } = useLocalParticipant();

  // Store local participant identity in a ref to avoid dependency issues
  const localIdentityRef = useRef<string | undefined>(undefined);
  localIdentityRef.current = localParticipant?.identity;

  // Process transcriptions
  useEffect(() => {

    if (!transcriptions || transcriptions.length === 0) return;

    let hasNewEntries = false;
    const currentMap = entriesMapRef.current;

    for (const segment of transcriptions) {
      // Generate stable ID
      const segmentId =
        segment.streamInfo?.id ||
        `${segment.participantInfo?.identity}-${Date.now()}`;

      // Skip if already processed as final
      if (processedIdsRef.current.has(segmentId)) {
        continue;
      }

      const isFinal =
        segment.streamInfo?.attributes?.["lk.transcription_final"] === "true";

      const existing = currentMap.get(segmentId);

      // Skip if text hasn't changed and already exists
      if (
        existing &&
        existing.text === segment.text &&
        existing.isFinal === isFinal
      ) {
        continue;
      }

      // Determine speaker type
      const identity = segment.participantInfo?.identity || "";
      const isAI = /agent|kap|ai|interviewer/i.test(identity);
      const isLocal = identity === localIdentityRef.current;

      const entry: TranscriptEntry = {
        id: segmentId,
        speaker: isAI ? "interviewer" : "candidate",
        speakerName: isAI
          ? "Kap AI"
          : isLocal
            ? "You"
            : identity || "Participant",
        text: segment.text,
        timestamp: segment.streamInfo?.timestamp || Date.now(),
        isFinal,
      };

      currentMap.set(segmentId, entry);
      hasNewEntries = true;

      // Mark as fully processed if final
      if (isFinal) {
        processedIdsRef.current.add(segmentId);
      }
    }

    // Only update state if we have changes
    if (hasNewEntries) {
      const sortedEntries = Array.from(currentMap.values()).sort(
        (a, b) => a.timestamp - b.timestamp,
      );
      setEntries(sortedEntries);

      // Update the external ref that parent can access
      if (transcriptRef && "current" in transcriptRef) {
        (transcriptRef as React.MutableRefObject<TranscriptEntry[]>).current =
          sortedEntries;
      }
    }
  }, [transcriptions, transcriptRef]);

  // Live transcript merged with locally-injected shares, ordered by time.
  const allEntries = useMemo(() => {
    const merged =
      injected && injected.length ? [...entries, ...injected] : entries;
    return [...merged].sort((a, b) => a.timestamp - b.timestamp);
  }, [entries, injected]);

  // Scroll to bottom function
  const scrollToBottom = useCallback((smooth = true) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    isScrollingProgrammaticallyRef.current = true;

    const targetScroll = container.scrollHeight - container.clientHeight;

    if (smooth) {
      container.scrollTo({
        top: targetScroll,
        behavior: "smooth",
      });
      setTimeout(() => {
        isScrollingProgrammaticallyRef.current = false;
      }, 500);
    } else {
      container.scrollTop = targetScroll;
      isScrollingProgrammaticallyRef.current = false;
    }
  }, []);

  // Auto-scroll to the bottom whenever a new entry (live or injected) arrives.
  useLayoutEffect(() => {
    if (!shouldAutoScroll || allEntries.length === 0) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    queueMicrotask(() => {
      scrollToBottom(false);
    });
  }, [allEntries, shouldAutoScroll, scrollToBottom]);

  // Handle manual scroll - detect if user scrolled away from bottom
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (isScrollingProgrammaticallyRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isAtBottom = distanceFromBottom < 50;

    setShouldAutoScroll(isAtBottom);
  }, []);

  const handleScrollToBottomClick = useCallback(() => {
    setShouldAutoScroll(true);
    scrollToBottom(true);
  }, [scrollToBottom]);

  return (
    <div
      className={cn(
        "flex flex-col bg-card rounded-xl border border-border relative",
        "h-full max-h-full overflow-hidden",
        className,
      )}
      style={{ minHeight: 0 }}
    >
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Live Transcript</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">
            {allEntries.length > 0
              ? `${allEntries.length} messages`
              : "Recording"}
          </span>
        </div>
      </div>

      {/* Scrollable content area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ minHeight: 0 }}
        onScroll={handleScroll}
      >
        <div ref={contentRef} className="px-4 py-4 space-y-4">
          {allEntries.length === 0 ? (
            <EmptyState />
          ) : (
            allEntries.map((entry, idx) => (
              <Message
                key={entry.id}
                entry={entry}
                showHeader={
                  idx === 0 || entry.speaker !== allEntries[idx - 1]?.speaker
                }
              />
            ))
          )}
        </div>
      </div>

      {/* Scroll to bottom button */}
      {!shouldAutoScroll && allEntries.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleScrollToBottomClick}
            className="shadow-lg"
          >
            <ChevronDown className="w-4 h-4 mr-1" />
            New messages
          </Button>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
        <MessageSquare className="w-6 h-6 text-primary" />
      </div>
      <p className="text-sm text-muted-foreground">
        Transcript will appear here as you speak
      </p>
    </div>
  );
}

function Message({
  entry,
  showHeader,
}: {
  entry: TranscriptEntry;
  showHeader: boolean;
}) {
  const isAI = entry.speaker === "interviewer";
  const time = new Date(entry.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={cn("flex gap-3", isAI ? "flex-row" : "flex-row-reverse")}>
      {showHeader && (
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            isAI
              ? "bg-primary/20 text-primary"
              : "bg-secondary text-foreground",
          )}
        >
          {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>
      )}

      <div
        className={cn(
          "flex flex-col max-w-[80%]",
          isAI ? "items-start" : "items-end",
          !showHeader && (isAI ? "ml-11" : "mr-11"),
        )}
      >
        {showHeader && (
          <div
            className={cn(
              "flex items-center gap-2 mb-1",
              !isAI && "flex-row-reverse",
            )}
          >
            <span className="text-xs font-medium">{entry.speakerName}</span>
            <span className="text-xs text-muted-foreground">{time}</span>
          </div>
        )}
        {entry.kind === "code" ? (
          <div className="max-w-full overflow-hidden rounded-xl border border-border bg-[#0d1019] rounded-tr-none">
            <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-1.5 text-[11px] font-medium text-slate-400">
              <Code2 className="w-3.5 h-3.5" />
              Shared code{entry.language ? ` · ${entry.language}` : ""}
            </div>
            <pre className="max-h-48 overflow-auto px-3 py-2.5 font-mono text-[12px] leading-relaxed text-slate-200">
              {entry.text}
            </pre>
          </div>
        ) : entry.kind === "whiteboard" ? (
          <div className="flex items-center gap-2 rounded-xl rounded-tr-none border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
            <PenTool className="h-4 w-4 text-primary" />
            Shared a whiteboard diagram
          </div>
        ) : (
          <div
            className={cn(
              "px-3 py-2 rounded-xl text-sm",
              isAI
                ? "bg-secondary text-foreground rounded-tl-none"
                : "bg-primary text-primary-foreground rounded-tr-none",
              !entry.isFinal && "opacity-70",
            )}
          >
            <p className="leading-relaxed">
              {entry.text}
              {!entry.isFinal && (
                <span className="inline-flex ml-1 gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-current animate-bounce" />
                  <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:0.1s]" />
                  <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
