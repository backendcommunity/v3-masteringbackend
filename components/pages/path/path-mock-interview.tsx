"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Mic, Video, ArrowRight, Loader2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore, ChatInterviewTemplate } from "@/lib/store";
import { PathSessionStep } from "@/lib/path-types";
import { Loader } from "@/components/ui/loader";
import { ChatInterviewRoom } from "@/components/pages/mock-interviews/chat/chat-interview-room";
import { ChatInterviewWelcome } from "@/components/pages/mock-interviews/chat/chat-interview-welcome";
import { MockInterviewSessionPage } from "@/components/pages/mock-interview-session";
import { AvResults } from "@/components/pages/mock-interviews/av-results";

// Modality comes from the template's `format` — the learner doesn't choose it.
// Everything (room + results) happens inside the path step; advancing only
// happens when the learner explicitly clicks Continue after the interview ends.
function isChatFormat(format?: string | null): boolean {
  const f = (format ?? "").toLowerCase().trim();
  return !f || f === "chat" || f === "text";
}

function ContinueBar({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex flex-shrink-0 items-center justify-center border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
      <Button
        onClick={onClick}
        className="h-11 gap-1.5 rounded-xl bg-gradient-to-br from-[#13AECE] to-[#2BB8D8] px-7 font-extrabold text-[#06222b] shadow-[0_6px_20px_-4px_rgba(19,174,206,0.5)] hover:brightness-110"
      >
        Continue <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function PathMockInterview({
  step,
  onComplete,
  onNavigate,
}: {
  step: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, unknown>) => void;
  onNavigate: (path: string) => void;
}) {
  const store = useAppStore();
  const [userInterviewId, setUserInterviewId] = useState<string | null>(null);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(
    null,
  );
  const [format, setFormat] = useState<string | null>(null);
  const [template, setTemplate] = useState<ChatInterviewTemplate | null>(null);
  const [avSessionId, setAvSessionId] = useState<string | null>(null);
  // Audio/video pre-join gate: the LiveKit room (and clock) only starts after
  // the learner hits "Start interview" on the welcome screen.
  const [avStarted, setAvStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const advance = () => onComplete(step.id, { completed: true });

  // Ensure (or resume) the user's interview instance for this template.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await store.ensurePathMockInterview(step.itemId);
        if (!active) return;
        const interview = res?.interview;
        if (!interview?.id) throw new Error("no interview");
        setUserInterviewId(interview.id);
        setFormat(interview.template?.format ?? null);
        setTemplate((interview.template ?? null) as ChatInterviewTemplate | null);
        setCompletedSessionId(interview.completedSessionId ?? null);
        // Returning to an already-finished interview → show its results.
        if (interview.status === "COMPLETED" || step.status === "DONE") {
          setFinished(true);
        }
      } catch (e: any) {
        if (active)
          setError(
            e?.response?.data?.message ??
              "Could not start this interview. Try again.",
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id]);

  // Audio/video: create the LiveKit room once the learner starts, then embed
  // it (no redirect). Gated on avStarted so the welcome screen shows first.
  const enteredRef = useRef(false);
  useEffect(() => {
    if (loading || error || finished || !userInterviewId) return;
    if (isChatFormat(format)) return; // chat embeds directly (own welcome)
    if (!avStarted) return; // wait for the welcome-screen CTA
    if (avSessionId || enteredRef.current) return;
    enteredRef.current = true;
    (async () => {
      try {
        const result = await store.createMockInterviewRoom(userInterviewId);
        const sessionId = result?.session?.id;
        if (sessionId) setAvSessionId(sessionId);
        else {
          enteredRef.current = false;
          toast.error("Failed to start the interview session.");
        }
      } catch {
        enteredRef.current = false;
        toast.error("Failed to start the interview session.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, error, finished, userInterviewId, format, avSessionId, avStarted]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader isFull={false} />
      </div>
    );
  }

  if (error || !userInterviewId) {
    return (
      <div className="flex h-full w-full items-center justify-center px-4">
        <div className="max-w-sm rounded-2xl border border-border bg-card p-8 text-center">
          <h2 className="text-lg font-bold">Interview unavailable</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {error ?? "Could not load this interview."}
          </p>
        </div>
      </div>
    );
  }

  // ── Chat: embed the chat room; show a Continue overlay once it completes ──
  if (isChatFormat(format)) {
    return (
      <div className="relative h-full w-full">
        <ChatInterviewRoom
          userInterviewId={userInterviewId}
          embedded
          onComplete={() => setFinished(true)}
        />
        {finished && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center">
            <Button
              onClick={advance}
              className="pointer-events-auto h-11 gap-1.5 rounded-xl bg-gradient-to-br from-[#13AECE] to-[#2BB8D8] px-7 font-extrabold text-[#06222b] shadow-[0_8px_24px_-6px_rgba(19,174,206,0.6)] hover:brightness-110"
            >
              Continue path <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── Audio / video ────────────────────────────────────────────────────────
  const isVideo = (format ?? "").toLowerCase().includes("video");
  const ModeIcon = isVideo ? Video : Mic;

  // Finished → show the results (same ResultCard as chat) in-path, + Continue.
  // AvResults has no header of its own, so there's no extra top nav.
  if (finished) {
    const resultsSessionId = avSessionId ?? completedSessionId;
    if (resultsSessionId) {
      return (
        <div className="flex h-full w-full flex-col">
          <div className="min-h-0 flex-1">
            <AvResults sessionId={resultsSessionId} embedded />
          </div>
          <ContinueBar onClick={advance} />
        </div>
      );
    }
    return (
      <div className="flex h-full w-full items-center justify-center px-4">
        <div className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-border bg-card text-center shadow-[0_10px_40px_-20px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-center gap-3 px-6 py-8">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-[#347474]/15 text-[#5fb0b0]">
              <Trophy className="h-8 w-8" />
            </span>
            <h1 className="text-lg font-bold">Interview complete</h1>
            <p className="text-sm text-muted-foreground">
              You finished the {isVideo ? "video" : "audio"} interview for this
              milestone.
            </p>
            <Button
              onClick={advance}
              className="mt-1 h-11 gap-1.5 rounded-xl bg-gradient-to-br from-[#13AECE] to-[#2BB8D8] px-7 font-extrabold text-[#06222b] hover:brightness-110"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Pre-join welcome screen — shown before the live room (and clock) starts.
  if (!avStarted) {
    return (
      <div className="flex h-full w-full flex-col">
        {template ? (
          <ChatInterviewWelcome
            template={template}
            starting={false}
            onStart={() => setAvStarted(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Loader isFull={false} />
          </div>
        )}
      </div>
    );
  }

  // Live room is ready → embed it. On end it routes to "/results", which we
  // intercept to show the replay in-path instead of leaving.
  if (avSessionId) {
    return (
      <MockInterviewSessionPage
        sessionId={avSessionId}
        embedded
        onNavigate={(path) => {
          if (path.includes("/results")) {
            setFinished(true);
            return;
          }
          onNavigate(path);
        }}
      />
    );
  }

  // Creating the room.
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-4 text-center">
      <span
        className="relative grid h-16 w-16 place-items-center rounded-2xl text-primary"
        style={{
          backgroundColor: "#13AECE1f",
          boxShadow: "inset 0 0 0 1px #13AECE40",
        }}
      >
        <ModeIcon className="h-7 w-7" />
        <Loader2 className="absolute -bottom-1 -right-1 h-5 w-5 animate-spin text-primary" />
      </span>
      <div>
        <p className="text-sm font-semibold">
          Starting your {isVideo ? "video" : "audio"} interview…
        </p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Allow {isVideo ? "camera and microphone" : "microphone"} access when
          prompted.
        </p>
      </div>
    </div>
  );
}
