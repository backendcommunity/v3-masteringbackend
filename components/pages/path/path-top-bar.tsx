"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Menu,
  MessageSquareText,
  MoreVertical,
  Zap,
  Clock,
  PhoneOff,
  Play,
  Square,
  Eye,
} from "lucide-react";
import { useInterviewTimer } from "@/lib/interview-timer-store";
import { usePlaygroundControls } from "@/lib/playground-controls-store";
import { Button } from "@/components/ui/button";
import { PathSessionStep } from "@/lib/path-types";
import { PathHelpSheet } from "./path-help-sheet";
import { PathFeedbackDialog } from "./path-feedback-dialog";
import { PathCodeSheet } from "./path-code-sheet";
import { PathResourceSheet } from "./path-resource-sheet";

export interface Crumb {
  label?: string;
  href?: string;
}

/**
 * Run / Stop / Preview for an embedded project playground. The playground (whose
 * own header is hidden in path steps) publishes its handlers + state into
 * `usePlaygroundControls`; this renders them in the path top bar so start/stop
 * and preview are reachable on the primary learning surface. Renders nothing
 * when no playground is mounted.
 */
function PlaygroundControls({ compact = false }: { compact?: boolean }) {
  const {
    active,
    isRunning,
    isStopping,
    sandboxLive,
    previewVisible,
    runServer,
    stopServer,
    togglePreview,
  } = usePlaygroundControls();
  if (!active) return null;

  return (
    <div className={compact ? "flex items-center gap-1" : "flex items-center gap-1.5"}>
      {sandboxLive ? (
        <Button
          size="sm"
          variant="destructive"
          className="h-8 gap-1.5 px-3 text-xs"
          disabled={isStopping}
          onClick={() => stopServer?.()}
        >
          <Square className="w-3.5 h-3.5" />
          {isStopping ? "Stopping…" : "Stop"}
        </Button>
      ) : (
        <Button
          size="sm"
          className="h-8 gap-1.5 px-3 text-xs"
          disabled={isRunning}
          onClick={() => runServer?.()}
        >
          <Play className="w-3.5 h-3.5" />
          {isRunning ? "Running…" : "Run"}
        </Button>
      )}
      <Button
        size="sm"
        variant={previewVisible ? "secondary" : "ghost"}
        className="h-8 gap-1.5 px-3 text-xs"
        onClick={() => togglePreview?.()}
        aria-pressed={previewVisible}
      >
        <Eye className="w-3.5 h-3.5" />
        Preview
      </Button>
    </div>
  );
}

export interface PathTopBarProps {
  crumbs: Crumb[];
  position: number;
  total: number;
  earnedPoints: number;
  masteryPct: number;
  step?: PathSessionStep;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onOpenOutline: () => void;
  onNavigate: (path: string) => void;
  projectActions?: React.ReactNode;
}

export function PathTopBar({
  crumbs,
  earnedPoints,
  step,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onOpenOutline,
  onNavigate,
  projectActions,
}: PathTopBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const interviewSeconds = useInterviewTimer((s) => s.seconds);
  const interviewOnEnd = useInterviewTimer((s) => s.onEnd);

  const fmtTimer = (s: number) => {
    const m = Math.floor(Math.max(0, s) / 60);
    const sec = Math.max(0, s) % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };
  const timerColor =
    interviewSeconds != null && interviewSeconds <= 60
      ? "text-red-500"
      : interviewSeconds != null && interviewSeconds <= 300
        ? "text-amber-500"
        : "text-foreground";
  const logoSrc = "/main-logo.png";

  // crumbs = [ Learn, pathTitle, groupTitle, stepTitle ]
  const items = crumbs.filter((c) => c?.label);
  const stepTitle = items[items.length - 1]?.label ?? "Learning Path";
  const context = items.slice(0, -1); // [ Context, pathTitle, courseName ]

  const outlineButton = (
    <Button
      variant="outline"
      size="sm"
      className="h-8 px-2.5 text-xs gap-1.5 min-w-0 max-w-[55vw] sm:max-w-[420px]"
      onClick={onOpenOutline}
      title="Open outline"
    >
      <Menu className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="truncate font-medium text-foreground">{stepTitle}</span>
    </Button>
  );

  return (
    <header className="flex items-center justify-between gap-2 px-4 py-3 sm:px-6 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
      {/* Left: brand + (desktop) breadcrumb / (mobile) outline */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => onNavigate("/")}
          title="Go to dashboard"
          aria-label="Go to dashboard"
          className="flex-shrink-0 w-9 h-9 rounded-full bg-[#0E1F33] flex items-center justify-center overflow-hidden transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Image
            src={logoSrc}
            alt="Mastering Backend"
            width={36}
            height={36}
            className="h-full w-full object-cover"
          />
        </button>
        <nav className="hidden md:flex min-w-0 items-center gap-1.5 text-sm">
          {context.map((c, i) => {
            const last = i === context.length - 1;
            const base = `truncate ${
              last ? "font-semibold text-foreground" : "text-muted-foreground"
            }`;
            return (
              <span key={i} className="flex items-center gap-1.5 min-w-0">
                {c.href ? (
                  <button
                    type="button"
                    onClick={() => onNavigate(c.href!)}
                    className={`${base} underline-offset-2 hover:text-foreground hover:underline`}
                  >
                    {c.label}
                  </button>
                ) : (
                  <span className={base}>{c.label}</span>
                )}
                {!last && <span className="text-muted-foreground/50">/</span>}
              </span>
            );
          })}
        </nav>
        {/* Mobile: prev / outline / next sit inline next to the logo */}
        <div className="flex md:hidden min-w-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={onPrev}
            disabled={!hasPrev}
            title="Previous"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Previous</span>
          </Button>
          {outlineButton}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={onNext}
            disabled={!hasNext}
            title="Next"
          >
            <ArrowRight className="h-4 w-4" />
            <span className="sr-only">Next</span>
          </Button>
        </div>
      </div>

      {/* Center: step-title pagination (desktop only) */}
      <div className="hidden md:flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2 max-w-[50vw]">
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 flex-shrink-0"
          onClick={onPrev}
          disabled={!hasPrev}
          title="Previous"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="sr-only">Previous</span>
        </Button>
        {outlineButton}
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 flex-shrink-0"
          onClick={onNext}
          disabled={!hasNext}
          title="Next"
        >
          <ArrowRight className="w-4 h-4" />
          <span className="sr-only">Next</span>
        </Button>
      </div>

      {/* Right: full cluster on desktop, collapsed menu on mobile */}
      <div className="hidden md:flex items-center gap-3">
        <PlaygroundControls />
        {projectActions}
        {interviewOnEnd && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => interviewOnEnd()}
            className="h-8 gap-1.5 px-3 text-xs"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            End Interview
          </Button>
        )}
        {interviewSeconds != null && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1.5 text-xs font-bold tabular-nums ${timerColor} ${
              interviewSeconds <= 60 ? "animate-pulse" : ""
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {fmtTimer(interviewSeconds)}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-bold">
          <Zap className="w-3.5 h-3.5" />
          {earnedPoints} MB
        </span>
        <div className="flex items-center gap-0.5">
          {/* Exercise steps already are a code editor — hide the slide-in one. */}
          {step?.type !== "EXERCISE" && <PathCodeSheet step={step} />}
          <PathResourceSheet step={step} />
          <PathHelpSheet />
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={() => setFeedbackOpen(true)}
          >
            <MessageSquareText className="w-4 h-4" />
            <span className="sr-only">Feedback</span>
          </Button>
        </div>
      </div>

      {/* Mobile: everything else behind a single menu */}
      <div className="relative md:hidden flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9"
          onClick={() => setMobileOpen((v) => !v)}
          title="More"
          aria-expanded={mobileOpen}
        >
          <MoreVertical className="w-5 h-5" />
          <span className="sr-only">More</span>
        </Button>
        {mobileOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-popover p-2 shadow-lg">
              <PlaygroundControls compact />
              {interviewSeconds != null && (
                <div className="flex items-center justify-between rounded-lg px-2 py-2">
                  <span className="text-xs text-muted-foreground">Time left</span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold tabular-nums ${timerColor}`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {fmtTimer(interviewSeconds)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg px-2 py-2">
                <span className="text-xs text-muted-foreground">MB</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-bold">
                  <Zap className="w-3.5 h-3.5" />
                  {earnedPoints} MB
                </span>
              </div>
              {interviewOnEnd && (
                <button
                  type="button"
                  onClick={() => {
                    interviewOnEnd();
                    setMobileOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10"
                >
                  <PhoneOff className="w-4 h-4" /> End Interview
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onPrev();
                  setMobileOpen(false);
                }}
                disabled={!hasPrev}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
              <button
                type="button"
                onClick={() => {
                  onNext();
                  setMobileOpen(false);
                }}
                disabled={!hasNext}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
              >
                <ArrowRight className="w-4 h-4" /> Next
              </button>
              <div className="my-1 h-px bg-border" />
              <div className="flex items-center justify-around px-1 py-1">
                {step?.type !== "EXERCISE" && <PathCodeSheet step={step} />}
                <PathResourceSheet step={step} />
                <PathHelpSheet />
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => {
                    setFeedbackOpen(true);
                    setMobileOpen(false);
                  }}
                >
                  <MessageSquareText className="w-4 h-4" />
                  <span className="sr-only">Feedback</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
      {/* Rendered once at the top level regardless of viewport — Radix mounts
          DialogContent into a body-level portal, so keeping a copy inside the
          `hidden md:flex` desktop cluster AND the `{mobileOpen && ...}` mobile
          menu would open two overlapping dialogs off one `feedbackOpen` flag. */}
      <PathFeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        source="path-lesson"
        context={{ lessonSlug: step?.itemId }}
        trigger={<span className="sr-only" aria-hidden />}
      />
    </header>
  );
}
