"use client";

import { useEffect, useRef, useState } from "react";
import { fetchVideoCaption } from "@/lib/courses";

// Exact transcript logic extracted from course-watch.tsx so it can be reused
// (here, in the path watch sidebar). Do NOT reimplement — this is the working one.
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
    cues.push({ start: vttTimeToSec(startStr), end: vttTimeToSec(endStr), text });
  }
  return cues;
}

export function VideoTranscript({
  vimeoId,
  currentTime,
}: {
  vimeoId?: number | string | null;
  currentTime: number;
}) {
  const [captions, setCaptions] = useState<CaptionCue[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!vimeoId) {
      setCaptions([]);
      return;
    }
    let active = true;
    fetchVideoCaption(Number(vimeoId))
      .then((vtt) => active && setCaptions(vtt ? parseVTT(vtt) : []))
      .catch(() => active && setCaptions([]));
    return () => {
      active = false;
    };
  }, [vimeoId]);

  // Keep the active caption vertically centered in the transcript panel so the
  // user reads at eye level instead of chasing it toward the bottom. Scroll only
  // the nearest scrollable ancestor (never the page).
  useEffect(() => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>("[data-active='true']");
    if (!list || !active) return;

    let scroller: HTMLElement | null = list;
    while (scroller && scroller.scrollHeight <= scroller.clientHeight) {
      scroller = scroller.parentElement;
    }
    if (!scroller) return;

    const scRect = scroller.getBoundingClientRect();
    const aRect = active.getBoundingClientRect();
    const delta =
      aRect.top - scRect.top - (scroller.clientHeight / 2 - aRect.height / 2);
    scroller.scrollBy({ top: delta, behavior: "smooth" });
  }, [currentTime]);

  if (!vimeoId)
    return (
      <p className="p-3 text-[13px] leading-relaxed text-muted-foreground">
        A transcript is available for video lessons.
      </p>
    );

  if (!captions.length)
    return (
      <p className="p-3 text-[13px] leading-relaxed text-muted-foreground">
        No transcript is available for this video yet.
      </p>
    );

  return (
    <div ref={listRef} className="p-2 space-y-0.5">
      {captions.map((cue, i) => {
        const isActive = currentTime >= cue.start && currentTime < cue.end;
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
              {new Date(cue.start * 1000).toISOString().substring(14, 19)}
            </span>
            <span className="text-[13px] leading-relaxed">{cue.text}</span>
          </div>
        );
      })}
    </div>
  );
}
