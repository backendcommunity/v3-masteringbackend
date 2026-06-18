"use client";

import { PathStepType } from "@/lib/path-types";

// Purely presentational teaser shown BEHIND the StepPaywall for a locked step.
// It must never mount a live step component (no network, no autoplay, no
// progress writes) — it only hints at the shape of what's gated, per step type.
export function LockedStepSkeleton({ type }: { type: PathStepType }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none select-none blur-md opacity-60"
    >
      {renderByType(type)}
    </div>
  );
}

function bar(w: string, h = "h-4") {
  return `${h} ${w} rounded bg-muted`;
}

function renderByType(type: PathStepType) {
  switch (type) {
    case "EXERCISE":
      // Code editor: file tabs + a column of mono "code" lines.
      return (
        <div className="flex h-full min-h-[420px] flex-col p-4">
          <div className="mb-3 flex gap-2">
            <div className="h-7 w-28 rounded-t-md bg-muted" />
            <div className="h-7 w-24 rounded-t-md bg-muted/60" />
            <div className="h-7 w-20 rounded-t-md bg-muted/60" />
          </div>
          <div className="flex-1 rounded-lg bg-muted/30 p-4">
            <div className="space-y-2.5 font-mono">
              {["w-1/3", "w-2/3", "w-1/2", "w-3/4", "w-2/5", "w-3/5", "w-1/2", "w-4/5"].map(
                (w, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-3 w-5 rounded bg-muted/50" />
                    <div className={bar(w, "h-3")} />
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      );

    case "QUIZ":
      // Question card + multiple-choice option rows.
      return (
        <div className="mx-auto max-w-2xl p-6">
          <div className="mb-2 h-3 w-24 rounded bg-muted/60" />
          <div className={`${bar("w-3/4", "h-6")} mb-6`} />
          <div className="space-y-3">
            {["w-5/6", "w-2/3", "w-4/5", "w-1/2"].map((w, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-border p-4"
              >
                <div className="h-5 w-5 shrink-0 rounded-full bg-muted" />
                <div className={bar(w)} />
              </div>
            ))}
          </div>
        </div>
      );

    case "MOCK_INTERVIEW":
      // Chat transcript: alternating interviewer / candidate bubbles.
      return (
        <div className="mx-auto max-w-2xl space-y-4 p-6">
          {[
            { me: false, w: "w-3/5" },
            { me: true, w: "w-2/5" },
            { me: false, w: "w-4/5" },
            { me: true, w: "w-1/2" },
            { me: false, w: "w-3/4" },
          ].map((m, i) => (
            <div
              key={i}
              className={`flex ${m.me ? "justify-end" : "justify-start"} gap-2`}
            >
              {!m.me && <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />}
              <div
                className={`${m.w} rounded-2xl p-4 ${m.me ? "bg-primary/15" : "bg-muted/40"}`}
              >
                <div className="mb-2 h-3 w-full rounded bg-muted/60" />
                <div className="h-3 w-2/3 rounded bg-muted/60" />
              </div>
            </div>
          ))}
        </div>
      );

    case "PROJECT":
      // Task checklist / build brief.
      return (
        <div className="mx-auto max-w-3xl p-6">
          <div className={`${bar("w-1/2", "h-7")} mb-6`} />
          <div className="space-y-3">
            {["w-3/4", "w-2/3", "w-5/6", "w-1/2", "w-4/5"].map((w, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <div className="h-5 w-5 shrink-0 rounded-md bg-muted" />
                <div className={bar(w)} />
              </div>
            ))}
          </div>
        </div>
      );

    case "VIDEO":
    case "ARTICLE":
    case "RESOURCE":
    case "BOOTCAMP":
    default:
      // Lesson: title + player/hero + paragraph lines.
      return (
        <div className="p-6 space-y-4">
          <div className={bar("w-2/3", "h-8")} />
          <div className="aspect-video w-full rounded-xl bg-muted" />
          <div className={bar("w-full")} />
          <div className={bar("w-5/6")} />
          <div className={bar("w-4/6")} />
        </div>
      );
  }
}
