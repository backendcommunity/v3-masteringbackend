"use client";

import { Play } from "lucide-react";
import { PathSessionStep } from "@/lib/path-types";

// Fallback stage content for a gated step, shown BEHIND the paywall.
//
// Normally the workspace never routes a learner into a step they can't open —
// it holds their position and raises the wall over the lesson they already had
// (see PathWorkspace.selectStep). This component covers the case where there is
// no such lesson: a path whose every step is premium, or a cold deep link from
// a learner with no completed work. Without it the stage falls through to
// "Select a step to begin", which is wrong — the learner is somewhere, and the
// page should say where.
//
// Everything rendered comes from metadata ALREADY on the client for a locked
// step (title, chapterTitle, type, maxPoints — see PathSessionStep). The
// premium payload lives behind `step.payloadRef` and is deliberately never
// fetched or resolved here: no live step component mounts, no network, no
// autoplay, no progress writes. Adding a field that isn't already in the
// session payload would mean shipping paid content to an unentitled client.
//
// Rendered sharp, not blurred — the paywall's 45% scrim does all the veiling,
// so the title stays legible through it. That legibility IS the point.
export function LockedStepSkeleton({ step }: { step: PathSessionStep }) {
  return (
    <div aria-hidden className="pointer-events-none select-none">
      {renderByType(step)}
    </div>
  );
}

/** Chapter eyebrow + real step title, positioned where each renderer puts it. */
function StepHeading({
  step,
  size = "lg",
}: {
  step: PathSessionStep;
  size?: "lg" | "md";
}) {
  return (
    <div className="space-y-1.5">
      {step.chapterTitle && (
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {step.chapterTitle}
        </p>
      )}
      <h2
        className={
          size === "lg"
            ? "text-2xl font-semibold tracking-tight text-foreground"
            : "text-xl font-semibold tracking-tight text-foreground"
        }
      >
        {step.title}
      </h2>
    </div>
  );
}

function bar(w: string, h = "h-4") {
  return `${h} ${w} rounded bg-muted`;
}

function renderByType(step: PathSessionStep) {
  switch (step.type) {
    case "EXERCISE":
      // Code editor: the real title names the tab, as the live editor does.
      return (
        <div className="flex h-full min-h-[420px] flex-col p-6">
          <div className="mb-4">
            <StepHeading step={step} size="md" />
          </div>
          <div className="mb-3 flex gap-2">
            <div className="flex h-8 max-w-[16rem] items-center truncate rounded-t-md bg-muted px-3 text-xs font-medium text-foreground">
              {step.title}
            </div>
            <div className="h-8 w-24 rounded-t-md bg-muted/60" />
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
      return (
        <div className="mx-auto max-w-2xl p-6">
          <div className="mb-6">
            <StepHeading step={step} size="md" />
            {step.maxPoints > 0 && (
              <p className="mt-1.5 text-sm text-muted-foreground">
                {step.maxPoints} point{step.maxPoints !== 1 ? "s" : ""}
              </p>
            )}
          </div>
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
      return (
        <div className="mx-auto max-w-2xl p-6">
          <div className="mb-6">
            <StepHeading step={step} size="md" />
          </div>
          <div className="space-y-4">
            {[
              { me: false, w: "w-3/5" },
              { me: true, w: "w-2/5" },
              { me: false, w: "w-4/5" },
              { me: true, w: "w-1/2" },
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
        </div>
      );

    case "PROJECT":
      return (
        <div className="mx-auto max-w-3xl p-6">
          <div className="mb-6">
            <StepHeading step={step} />
            {step.maxPoints > 0 && (
              <p className="mt-1.5 text-sm text-muted-foreground">
                {step.maxPoints} point{step.maxPoints !== 1 ? "s" : ""}
              </p>
            )}
          </div>
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

    case "ARTICLE":
      return (
        <div className="mx-auto max-w-3xl space-y-6 p-6">
          <StepHeading step={step} />
          <div className="space-y-3">
            {["w-full", "w-11/12", "w-full", "w-5/6", "w-full", "w-4/6"].map((w, i) => (
              <div key={i} className={bar(w, "h-3.5")} />
            ))}
          </div>
        </div>
      );

    case "VIDEO":
    case "RESOURCE":
    case "BOOTCAMP":
    default:
      // Player poster carrying the real lesson title — the same recognition cue
      // the reference design uses behind its paywall.
      return (
        <div className="space-y-4 p-6">
          <StepHeading step={step} />
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-[#0e1f33]">
            <div className="px-8 text-center">
              <h3 className="text-2xl font-semibold tracking-tight text-white/90 sm:text-3xl">
                {step.title}
              </h3>
              {step.chapterTitle && (
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-white/40">
                  {step.chapterTitle}
                </p>
              )}
            </div>
            <span className="absolute flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <Play className="h-7 w-7 translate-x-0.5 fill-white/70 text-white/70" />
            </span>
          </div>
        </div>
      );
  }
}
