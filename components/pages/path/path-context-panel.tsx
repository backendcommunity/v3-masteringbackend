"use client";
import { useEffect, useRef, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { toast } from "sonner";
import { Lightbulb, Send, Sparkles } from "lucide-react";
import { PathSessionStep } from "@/lib/path-types";
import { useAppStore } from "@/lib/store";
import { useVideoTime } from "@/lib/video-time-store";
import { fetchVideoCaption } from "@/lib/courses";

type Tab = "Overview" | "Transcript";

interface PanelItem {
  description?: string;
  summary?: string;
  body?: string;
  content?: string;
  title?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  video?: any; // Vimeo numeric id for VIDEO items
}

interface CaptionCue {
  start: number;
  end: number;
  text: string;
}

function vttTimeToSec(t: string): number {
  const parts = t.split(":").map(parseFloat);
  return parts.length === 3
    ? parts[0] * 3600 + parts[1] * 60 + parts[2]
    : parts[0] * 60 + parts[1];
}

function parseVTT(vtt: string): CaptionCue[] {
  const cues: CaptionCue[] = [];
  const blocks = vtt.split(/\n{2,}/);
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    const tsIdx = lines.findIndex((l) => l?.includes("-->"));
    if (tsIdx === -1) continue;
    const [startStr, endStr] = lines[tsIdx].split("-->").map((s) => s.trim());
    const text = lines
      .slice(tsIdx + 1)
      .join(" ")
      .trim();
    if (!text) continue;
    cues.push({
      start: vttTimeToSec(startStr),
      end: vttTimeToSec(endStr),
      text,
    });
  }
  return cues;
}

function stripHtml(raw: string): string {
  const clean = DOMPurify.sanitize(raw, { ALLOWED_TAGS: [] });
  return clean.replace(/\s+/g, " ").trim();
}

export function PathContextPanel({ step }: { step?: PathSessionStep }) {
  const store = useAppStore();
  const videoTime = useVideoTime((s) => s.videoTime);
  const [tab, setTab] = useState<Tab>("Overview");
  const [item, setItem] = useState<PanelItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [captions, setCaptions] = useState<CaptionCue[]>([]);
  const captionListRef = useRef<HTMLDivElement>(null);

  // Fetch the step's item (description for Overview + the Vimeo id for captions).
  useEffect(() => {
    if (!step) {
      setItem(null);
      setCaptions([]);
      return;
    }
    let active = true;
    setLoading(true);
    setItem(null);
    setCaptions([]);
    (async () => {
      try {
        const data = await store.getPathItem(step.payloadRef.endpoint);
        if (active) setItem(data);
      } catch {
        if (active) setItem(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id]);

  // Fetch + parse captions once we know the Vimeo id.
  useEffect(() => {
    if (!item?.video) {
      setCaptions([]);
      return;
    }
    let active = true;
    fetchVideoCaption(Number(item.video))
      .then((vtt) => active && setCaptions(vtt ? parseVTT(vtt) : []))
      .catch(() => active && setCaptions([]));
    return () => {
      active = false;
    };
  }, [item?.video]);

  // Keep the active caption scrolled into view.
  useEffect(() => {
    if (tab !== "Transcript" || !captionListRef.current) return;
    const active = captionListRef.current.querySelector("[data-active='true']");
    active?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [videoTime, tab]);

  const rawDesc =
    item?.description ?? item?.summary ?? item?.body ?? item?.content ?? "";
  const description = rawDesc ? stripHtml(rawDesc) : "";

  const tabs: Tab[] = ["Overview", "Transcript"];

  return (
    <aside className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_6px_20px_-8px_rgba(0,0,0,0.5)]">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 py-3 border-b border-border bg-muted/20 flex-shrink-0">
        {tabs.map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              {t === "Overview" && <Sparkles className="h-3.5 w-3.5" />}
              {t}
            </button>
          );
        })}
      </div>

      {/* Tab body */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {tab === "Overview" && (
          <div className="animate-in fade-in duration-200 p-5">
            {step ? (
              <>
                <h3 className="mb-3 text-[15px] font-bold leading-snug">
                  {step.title}
                </h3>
                {loading ? (
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    Loading lesson details…
                  </p>
                ) : description ? (
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                ) : (
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    This {step.type.replace("_", " ").toLowerCase()} is part of
                    your learning path. Work through it, then mark it complete to
                    move on.
                  </p>
                )}
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs text-foreground">
                    <Lightbulb className="h-3.5 w-3.5 text-primary" /> Key
                    takeaways
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs text-foreground">
                    <Lightbulb className="h-3.5 w-3.5 text-primary" /> Real-world
                    use
                  </span>
                </div>
              </>
            ) : (
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Select a step to see its overview.
              </p>
            )}
          </div>
        )}

        {tab === "Transcript" && (
          <div
            ref={captionListRef}
            className="animate-in fade-in duration-200 p-2 space-y-0.5"
          >
            {captions.length > 0 ? (
              captions.map((cue, i) => {
                const isActive =
                  videoTime >= cue.start && videoTime < cue.end;
                return (
                  <div
                    key={i}
                    data-active={isActive ? "true" : undefined}
                    className={`flex gap-2.5 rounded-md p-2 transition-colors ${
                      isActive
                        ? "bg-primary/10 text-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <span className="shrink-0 w-10 pt-0.5 text-right text-[11px] tabular-nums">
                      {new Date(cue.start * 1000)
                        .toISOString()
                        .substring(14, 19)}
                    </span>
                    <span className="text-[13px] leading-relaxed">
                      {cue.text}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="p-3 text-[13px] leading-relaxed text-muted-foreground">
                {item?.video
                  ? "No transcript is available for this video yet."
                  : "A transcript is available for video lessons."}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Ask bar (stub) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          toast("AI assistant coming soon");
        }}
        className="flex-shrink-0 m-5 mt-0 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-3"
      >
        <input
          placeholder="Ask anything about this lesson…"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          aria-label="Send"
          className="grid h-[30px] w-[30px] place-items-center rounded-lg bg-gradient-brand text-[#06222b]"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </aside>
  );
}
