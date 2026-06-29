"use client";

import {
  Clock,
  BarChart3,
  Sparkles,
  Tag,
  MessageSquare,
  Code2,
  Lightbulb,
  FileBarChart,
  Loader2,
  ArrowLeft,
  Mic,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChatInterviewTemplate } from "@/lib/store";

interface ChatInterviewWelcomeProps {
  template: ChatInterviewTemplate;
  // Already has an in-progress session — CTA becomes "Resume".
  resuming?: boolean;
  starting?: boolean;
  onStart: () => void;
  // Standalone only — render a Back action. Omitted in the embedded Path step.
  onBack?: () => void;
  // Optional: replay the highlight-only guided tour on demand.
  onHowItWorks?: () => void;
}

type Mode = "chat" | "audio" | "video";

function resolveMode(format?: string | null): Mode {
  const f = (format ?? "").toLowerCase();
  if (f.includes("video")) return "video";
  if (f.includes("audio") || f.includes("voice")) return "audio";
  return "chat";
}

const CHAT_STEPS = [
  {
    icon: MessageSquare,
    t: "Meet your interviewer",
    d: "Kap — your AI interviewer — greets you and asks questions like a real screen.",
  },
  {
    icon: Code2,
    t: "Answer in chat",
    d: "Type your answer, or use the Code Editor and Whiteboard to show your work.",
  },
  {
    icon: Lightbulb,
    t: "Think out loud",
    d: "Explain your reasoning. Kap probes deeper based on how you respond.",
  },
  {
    icon: FileBarChart,
    t: "Get your report",
    d: "Finish or run out of time, and we score technical depth, communication & problem-solving.",
  },
];

function voiceSteps(mode: Mode) {
  return [
    {
      icon: MessageSquare,
      t: "Meet your interviewer",
      d: "Kap — your AI interviewer — greets you by voice and asks questions like a real screen.",
    },
    {
      icon: mode === "video" ? Video : Mic,
      t: "Answer out loud",
      d:
        mode === "video"
          ? "Speak your answers with your camera on, just like a live remote interview."
          : "Speak your answers naturally — no typing, just talk it through.",
    },
    {
      icon: Lightbulb,
      t: "Think out loud",
      d: "Walk through your reasoning. Kap listens and probes deeper based on your answers.",
    },
    {
      icon: FileBarChart,
      t: "Get your report",
      d: "Finish or run out of time, and we score technical depth, communication & problem-solving.",
    },
  ];
}

export function ChatInterviewWelcome({
  template,
  resuming = false,
  starting = false,
  onStart,
  onBack,
  onHowItWorks,
}: ChatInterviewWelcomeProps) {
  const title = template.name || template.position || "Mock Interview";
  const subtitle = [template.position, template.company]
    .filter(Boolean)
    .join(" · ");
  const level = template.seniority || template.difficulty || "All levels";
  const mode = resolveMode(template.format);
  const steps = mode === "chat" ? CHAT_STEPS : voiceSteps(mode);
  const modeLabel =
    mode === "video"
      ? "Video interview"
      : mode === "audio"
        ? "Audio interview"
        : "Mock Interview";
  const tip =
    mode === "chat"
      ? "Tip: the clock starts when you begin. Find a quiet 30 minutes and treat it like the real thing."
      : `Tip: the clock starts when you begin. Allow ${
          mode === "video" ? "camera and microphone" : "microphone"
        } access when prompted, and find a quiet spot.`;

  return (
    <div className="flex-1 min-h-0 overflow-auto bg-background bg-[radial-gradient(900px_400px_at_50%_-10%,rgba(19,174,206,0.10),transparent_60%)]">
      <div className="mx-auto w-full max-w-[620px] px-7 pb-12 pt-12 animate-in fade-in slide-in-from-bottom-3 duration-500">
        {/* eyebrow */}
        <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          <span className="grid h-[22px] w-[22px] place-items-center rounded-[7px] border border-primary/35 bg-primary/15 font-extrabold text-primary">
            K
          </span>
          {modeLabel} · {template.category || "Backend"}
        </div>

        <h1 className="mt-3.5 mb-2 text-[30px] font-extrabold leading-tight tracking-[-0.01em] text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="m-0 text-sm font-medium text-muted-foreground">
            {subtitle}
          </p>
        )}
        {template.description && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {template.description}
          </p>
        )}

        {/* meta chips */}
        <div className="mt-[18px] mb-2.5 flex flex-wrap gap-2">
          <Chip icon={<Clock className="h-3.5 w-3.5 text-[#5fb0b0]" />}>
            ~{template.duration || 30} min
          </Chip>
          <Chip icon={<BarChart3 className="h-3.5 w-3.5 text-[#5fb0b0]" />}>
            {level}
          </Chip>
          {template.format && (
            <Chip icon={<Tag className="h-3.5 w-3.5 text-[#5fb0b0]" />}>
              {template.format}
            </Chip>
          )}
          {template.questions ? (
            <Chip icon={<MessageSquare className="h-3.5 w-3.5 text-[#5fb0b0]" />}>
              {template.questions} questions
            </Chip>
          ) : null}
        </div>

        {/* topic tags */}
        {template.topics && template.topics.length > 0 && (
          <div className="mb-7 flex flex-wrap gap-1.5">
            {template.topics.map((t) => (
              <span
                key={t}
                className="rounded-md border border-[#5fb0b0]/25 bg-[#5fb0b0]/10 px-2 py-[3px] font-mono text-[11px] text-[#347474] dark:text-[#5fb0b0]"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* how it works */}
        <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          How it works
        </h4>
        <div className="mb-7 flex flex-col gap-2.5">
          {steps.map((s, i) => (
            <div
              key={i}
              className="flex items-start gap-3.5 rounded-xl border border-border bg-card p-3.5 shadow-[0_1px_2px_rgba(2,6,23,0.04)]"
            >
              <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-lg bg-gradient-to-br from-primary to-[#2bb8d8] text-[#06222b]">
                <s.icon className="h-[15px] w-[15px]" />
              </span>
              <div>
                <b className="mb-0.5 block text-[13.5px] font-semibold text-foreground">
                  {s.t}
                </b>
                <span className="text-[12.5px] leading-snug text-muted-foreground">
                  {s.d}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={onStart}
            disabled={starting}
            className="h-[42px] gap-2 rounded-[11px] px-6 text-sm font-semibold shadow-[0_8px_22px_-6px_rgba(19,174,206,0.5)]"
          >
            {starting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {resuming ? "Resuming…" : "Starting…"}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {resuming ? "Resume interview" : "Start interview"}
              </>
            )}
          </Button>
          {onBack && (
            <Button
              variant="outline"
              onClick={onBack}
              disabled={starting}
              className="h-[42px] gap-2 rounded-[11px] px-5 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          {onHowItWorks && (
            <button
              type="button"
              onClick={onHowItWorks}
              className="text-sm font-medium text-primary hover:underline"
            >
              How it works
            </button>
          )}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">{tip}</p>
      </div>
    </div>
  );
}

function Chip({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-[5px] text-xs text-foreground",
      )}
    >
      {icon}
      {children}
    </span>
  );
}
