"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  LiveKitRoom,
  useVoiceAssistant,
  BarVisualizer,
  RoomAudioRenderer,
  useConnectionState,
  useTracks,
  useParticipants,
  useLocalParticipant,
  useRoomContext,
  VideoTrack,
  AudioTrack,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { ConnectionState, Track } from "livekit-client";
import { useUser } from "@/hooks/use-user";
import { useAppStore } from "@/lib/store";
import { useInterviewTimer } from "@/lib/interview-timer-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// UI Components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { CodeEditorPanel } from "./mock-interviews/chat/code-editor-panel";
import { WhiteboardPanel } from "./mock-interviews/chat/whiteboard-panel";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  Loader2,
  Bot,
  User,
  Wifi,
  WifiOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Code2,
  PenTool,
} from "lucide-react";

// Custom Components
import {
  InterviewTranscriptPanel,
  TranscriptEntry,
} from "./mock-interviews/interview-transcript-panel";
import { InterviewHeader } from "./mock-interviews/interview-header";

// Types
interface InterviewSession {
  id: string;
  title?: string;
  status: string;
  scheduledTime?: string;
  duration?: number;
  template?: {
    id: string;
    name: string;
    difficulty: string;
    duration: string;
    topics?: string[];
    description?: string;
  };
  questions?: InterviewQuestion[];
  interviewConfig?: {
    difficulty?: string;
    topics?: string[];
    duration?: number;
  };
}

interface InterviewQuestion {
  id: string;
  question: string;
  type: string;
  difficulty: string;
  timeLimit: number;
}

interface MockInterviewSessionProps {
  sessionId: string;
  onNavigate: (path: string) => void;
  // When embedded (e.g. inside a learning-path step) the room fills its parent
  // (h-full) instead of the viewport (h-screen). Default false = standalone.
  embedded?: boolean;
}

// =============================================================================
// VOICE ASSISTANT STAGE - Handles AI Agent Audio/Video
// =============================================================================
function VoiceAssistantStage() {
  const { state, audioTrack, agentTranscriptions } = useVoiceAssistant();

  return (
    <div className="flex flex-col items-center justify-center h-full">
      {/* AI Avatar with Audio Visualizer */}
      <div className="relative">
        {/* Outer glow rings */}
        <div className="absolute inset-0 -m-12">
          <div
            className={cn(
              "w-48 h-48 rounded-full border-2 border-primary/20",
              state === "speaking" && "animate-ping",
            )}
            style={{ animationDuration: "2s" }}
          />
        </div>
        <div className="absolute inset-0 -m-6">
          <div
            className={cn(
              "w-36 h-36 rounded-full border border-primary/30",
              state !== "disconnected" && "animate-pulse",
            )}
          />
        </div>

        {/* Main avatar with visualizer */}
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-[hsl(190,83%,34%)] p-[3px]">
          <div className="w-full h-full rounded-full bg-[hsl(222,25%,16%)] flex items-center justify-center overflow-hidden">
            {audioTrack ? (
              <BarVisualizer
                state={state}
                trackRef={audioTrack}
                barCount={5}
                className="w-16 h-16"
              />
            ) : (
              <Bot className="w-12 h-12 text-primary" />
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div
          className={cn(
            "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-[hsl(222,25%,16%)] flex items-center justify-center",
            state === "speaking"
              ? "bg-green-500"
              : state === "listening"
                ? "bg-blue-500"
                : state === "connecting"
                  ? "bg-yellow-500"
                  : "bg-gray-500",
          )}
        >
          <div
            className={cn(
              "w-2 h-2 rounded-full bg-white",
              state !== "disconnected" && "animate-pulse",
            )}
          />
        </div>
      </div>

      {/* Status Text */}
      <div className="mt-6 text-center">
        <h3 className="text-xl font-semibold text-white">Kap AI Interviewer</h3>
        <p className="text-sm text-muted-foreground mt-1 capitalize">
          {state === "speaking"
            ? "Speaking..."
            : state === "listening"
              ? "Listening to you..."
              : state === "thinking"
                ? "Processing..."
                : state === "connecting"
                  ? "Connecting..."
                  : "Ready"}
        </p>
      </div>

      {/* Voice Activity Bars */}
      <div className="flex items-center gap-1 mt-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-1 rounded-full transition-all duration-150",
              state === "speaking"
                ? "bg-green-500 animate-[audioWave_0.5s_ease-in-out_infinite]"
                : state === "listening"
                  ? "bg-blue-500 animate-pulse"
                  : "bg-primary/30",
            )}
            style={{
              height: state === "speaking" ? `${12 + i * 4}px` : "8px",
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// INTERVIEW STAGE - Main Video/Audio Stage
// =============================================================================
function InterviewStage({ className }: { className?: string }) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const connectionState = useConnectionState();
  const isConnected = connectionState === ConnectionState.Connected;

  // Get all tracks
  const tracks = useTracks(
    [Track.Source.Camera, Track.Source.Microphone, Track.Source.ScreenShare],
    { onlySubscribed: true },
  );

  // Find local video track
  const localVideoTrack = tracks.find(
    (t) =>
      t.participant.identity === localParticipant?.identity &&
      t.source === Track.Source.Camera,
  );

  // Find remote participant (AI agent)
  const remoteParticipant = participants.find(
    (p) => p.identity !== localParticipant?.identity,
  );

  // Find remote tracks
  const remoteVideoTrack = tracks.find(
    (t) =>
      t.participant.identity !== localParticipant?.identity &&
      t.source === Track.Source.Camera,
  );

  const remoteAudioTrack = tracks.find(
    (t) =>
      t.participant.identity !== localParticipant?.identity &&
      t.source === Track.Source.Microphone,
  );

  return (
    <div className={cn("relative w-full h-full", className)}>
      {/* Main Area - AI Interviewer */}
      <div className="block lg:absolute inset-0 bg-gradient-to-br from-[hsl(222,30%,12%)] to-[hsl(222,25%,8%)] rounded-2xl overflow-hidden">
        {/* CRITICAL: Render AudioTrack for remote audio playback */}
        {remoteAudioTrack && (
          <AudioTrack trackRef={remoteAudioTrack} volume={1} />
        )}

        {/* Video or Avatar Placeholder */}
        {remoteVideoTrack ? (
          <VideoTrack
            trackRef={remoteVideoTrack}
            className="w-full h-full object-cover"
          />
        ) : (
          <VoiceAssistantStage />
        )}

        {/* AI Label */}
        <div className="absolute top-4 left-4 z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-white">
              {remoteParticipant?.identity || "Kap AI"}
            </span>
            <Bot className="w-4 h-4 text-primary" />
          </div>
        </div>

        {/* Connection Status */}
        <div className="absolute top-4 right-4 z-10 hidden md:block">
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm border",
              isConnected
                ? "bg-green-500/20 border-green-500/30"
                : "bg-yellow-500/20 border-yellow-500/30",
            )}
          >
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-xs font-medium text-green-400">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-medium text-yellow-400">
                  Connecting...
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Local Video - Picture in Picture */}
      <div className="absolute top-5 md:top-12 lg:top-auto lg:bottom-4 right-4 lg:w-48 lg:h-36 w-20 h-20 rounded-xl overflow-hidden border-2 border-primary/30 shadow-lg shadow-primary/20 bg-[hsl(222,25%,16%)] z-10">
        {localVideoTrack ? (
          <div className="relative w-full h-full">
            <VideoTrack
              trackRef={localVideoTrack}
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
              <User className="w-3 h-3 text-primary" />
              <span className="text-xs font-medium text-white">You</span>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground mt-2">
              Camera off
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MEDIA CONTROLS - Mic, Camera, Speaker, End Call
// =============================================================================
function MediaControls({
  onEndInterview,
  isEnding,
  compact = false,
}: {
  onEndInterview: () => void;
  isEnding?: boolean;
  compact?: boolean;
}) {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } =
    useLocalParticipant();
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);

  const toggleMicrophone = useCallback(async () => {
    await localParticipant?.setMicrophoneEnabled(!isMicrophoneEnabled);
  }, [localParticipant, isMicrophoneEnabled]);

  const toggleCamera = useCallback(async () => {
    await localParticipant?.setCameraEnabled(!isCameraEnabled);
  }, [localParticipant, isCameraEnabled]);

  const toggleSpeaker = useCallback(() => {
    const newMuted = !isSpeakerMuted;
    setIsSpeakerMuted(newMuted);

    // Mute all audio elements on the page
    document.querySelectorAll("audio").forEach((audio) => {
      audio.muted = newMuted;
      if (!newMuted) audio.volume = 1;
    });
  }, [isSpeakerMuted]);

  const btn = compact ? "w-9 h-9 rounded-lg" : "w-12 h-12 rounded-xl";
  const ic = compact ? "w-[17px] h-[17px]" : "w-5 h-5";

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          "flex items-center justify-center gap-2 p-3 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/50 shadow-xl",
          compact && "gap-1 p-1.5 rounded-xl shadow-lg",
        )}
      >
        {/* Microphone */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMicrophone}
              className={cn(
                btn,
                "transition-all",
                isMicrophoneEnabled
                  ? "bg-secondary hover:bg-secondary/80"
                  : "bg-destructive/20 hover:bg-destructive/30 text-destructive",
              )}
            >
              {isMicrophoneEnabled ? (
                <Mic className={ic} />
              ) : (
                <MicOff className={ic} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isMicrophoneEnabled ? "Mute" : "Unmute"}
          </TooltipContent>
        </Tooltip>

        {/* Camera */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCamera}
              className={cn(
                btn,
                "transition-all",
                isCameraEnabled
                  ? "bg-secondary hover:bg-secondary/80"
                  : "bg-destructive/20 hover:bg-destructive/30 text-destructive",
              )}
            >
              {isCameraEnabled ? (
                <Video className={ic} />
              ) : (
                <VideoOff className={ic} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isCameraEnabled ? "Stop Video" : "Start Video"}
          </TooltipContent>
        </Tooltip>

        {/* Speaker */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSpeaker}
              className={cn(
                btn,
                "transition-all",
                !isSpeakerMuted
                  ? "bg-secondary hover:bg-secondary/80"
                  : "bg-destructive/20 hover:bg-destructive/30 text-destructive",
              )}
            >
              {!isSpeakerMuted ? (
                <Volume2 className={ic} />
              ) : (
                <VolumeX className={ic} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {!isSpeakerMuted ? "Mute Speaker" : "Unmute Speaker"}
          </TooltipContent>
        </Tooltip>

        <div className={cn("w-px bg-border/50 mx-1", compact ? "h-6" : "h-8")} />

        {/* End Interview */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              onClick={onEndInterview}
              disabled={isEnding}
              className={cn(btn, "shadow-lg shadow-destructive/20")}
            >
              {isEnding ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <PhoneOff className={ic} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isEnding ? "Ending..." : "End Interview"}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

// =============================================================================
// INTERVIEW ROOM - Main Room Component Inside LiveKitRoom
// =============================================================================
function InterviewRoom({
  sessionId,
  session,
  questions,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  initialTimeRemaining,
  onNavigate,
  onTimeUpdate,
  embedded = false,
}: {
  sessionId: string;
  session: InterviewSession;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number | ((prev: number) => number)) => void;
  initialTimeRemaining: number;
  onNavigate: (path: string) => void;
  onTimeUpdate?: (time: number) => void;
  embedded?: boolean;
}) {
  const store = useAppStore();
  const connectionState = useConnectionState();
  const isConnected = connectionState === ConnectionState.Connected;
  const connectionStatus: "connected" | "connecting" | "failed" =
    connectionState === ConnectionState.Connected
      ? "connected"
      : connectionState === ConnectionState.Disconnected
        ? "failed"
        : "connecting";
  const currentQuestion = questions[currentQuestionIndex];

  // Ref that the transcript panel will update directly
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const room = useRoomContext();
  const [isEnding, setIsEnding] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining);
  const hasEndedRef = useRef(false);
  const [activePanel, setActivePanel] = useState<"code" | "whiteboard">("code");
  // Locally-injected transcript bubbles for shared code / diagrams.
  const [sharedEntries, setSharedEntries] = useState<TranscriptEntry[]>([]);
  // Viewport ≥1024px → side-by-side desktop layout; below → stacked mobile
  // layout with a bottom tab switcher between the interview and the work tools.
  // Gating on lgUp means the heavy panels mount in exactly one layout.
  const [lgUp, setLgUp] = useState(true);
  const [mobileTab, setMobileTab] = useState<"interview" | "workspace">(
    "interview",
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setLgUp(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (lgUp) setMobileTab("interview");
  }, [lgUp]);

  // Best-effort: deliver a chat message to the live Kap agent over LiveKit's
  // text stream (the `lk.chat` topic agents listen on). Falls back to a raw
  // data packet for older clients. Never throws.
  const sendToAgent = useCallback(
    async (text: string) => {
      try {
        const lp: any = room?.localParticipant;
        if (!lp) return;
        if (typeof lp.sendText === "function") {
          await lp.sendText(text, { topic: "lk.chat" });
        } else if (typeof lp.publishData === "function") {
          const payload = new TextEncoder().encode(text);
          await lp.publishData(payload, { reliable: true, topic: "lk.chat" });
        }
      } catch {
        // agent may not consume chat data — artifact is still saved for grading
      }
    },
    [room],
  );

  // "Send to Kap" from the code / whiteboard panels: persist for grading AND
  // hand it to the live agent so Kap can react to it during the interview.
  const saveCode = (code: string, language: string) => {
    store.saveChatArtifact(sessionId, "code", code, language).catch(() => {});
    sendToAgent(
      `I'm sharing my code (${language || "plaintext"}):\n\n\`\`\`${
        language || ""
      }\n${code}\n\`\`\``,
    );
    const ts = Date.now();
    setSharedEntries((prev) => [
      ...prev,
      {
        id: `code-${ts}`,
        speaker: "candidate",
        speakerName: "You",
        text: code,
        kind: "code",
        language,
        timestamp: ts,
        isFinal: true,
      },
    ]);
    toast.success("Code shared with Kap");
  };
  const saveWhiteboard = (diagramJSON: string) => {
    store.saveChatArtifact(sessionId, "whiteboard", diagramJSON).catch(() => {});
    sendToAgent(
      "I've drawn a diagram on the whiteboard to explain my approach. Please take a look and ask me about it.",
    );
    const ts = Date.now();
    setSharedEntries((prev) => [
      ...prev,
      {
        id: `wb-${ts}`,
        speaker: "candidate",
        speakerName: "You",
        text: "Shared a whiteboard diagram",
        kind: "whiteboard",
        timestamp: ts,
        isFinal: true,
      },
    ]);
    toast.success("Whiteboard shared with Kap");
  };

  const handleEndInterview = useCallback(async () => {
    // Prevent multiple end calls
    if (isEnding || hasEndedRef.current) return;
    hasEndedRef.current = true;
    setIsEnding(true);

    // Read directly from ref - the panel updates this ref whenever transcript changes
    const allTranscript = transcriptRef.current || [];
    const finalTranscript = allTranscript.filter((t) => t.isFinal);

    console.log("=== END INTERVIEW ===");
    console.log("Total transcript entries:", allTranscript.length);
    console.log("Final transcript entries:", allTranscript);
    console.log("Transcript data:", JSON.stringify(allTranscript, null, 2));

    try {
      // End session and submit transcript
      await store.endInterviewSession(
        sessionId,
        allTranscript.map((t) => ({
          speaker: t.speaker,
          text: t.text,
          timestamp: t.timestamp,
        })),
      );

      // Navigate to results
      onNavigate(`/mock-interviews/${sessionId}/results`);
    } catch (error) {
      console.error("Failed to end interview:", error);
      // Navigate anyway - transcript may already be saved incrementally
      onNavigate(`/mock-interviews/${sessionId}/results`);
    }
  }, [isEnding, store, sessionId, onNavigate]);

  // Timer countdown - ends interview when time expires
  useEffect(() => {
    if (timeRemaining <= 0 || hasEndedRef.current) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        // Notify parent of time updates for header display
        onTimeUpdate?.(newTime);

        if (newTime <= 0) {
          // Timer expired - end interview properly with transcript submission
          handleEndInterview();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, handleEndInterview, onTimeUpdate]);

  const handleBack = () => {
    onNavigate("/mock-interviews");
  };

  const interviewTitle =
    session?.template?.name || session?.title || "Mock Interview";
  const interviewType =
    session?.template?.difficulty ||
    session?.interviewConfig?.difficulty ||
    "Technical Interview";

  const sessionAny = session as unknown as {
    codeArtifact?: string | null;
    codeLanguage?: string | null;
    whiteboardArtifact?: unknown;
  };
  const savedDiagram =
    sessionAny.whiteboardArtifact &&
    typeof sessionAny.whiteboardArtifact === "object"
      ? (sessionAny.whiteboardArtifact as object)
      : undefined;

  const tabBtn = (active: boolean) =>
    cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
      active
        ? "bg-background text-foreground shadow-sm border border-border"
        : "text-muted-foreground hover:text-foreground hover:bg-background/50",
    );

  const fmtTime = (s: number) => {
    const safe = Math.max(0, s);
    const m = Math.floor(safe / 60);
    const sec = safe % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Tab switcher for the work tools — shared by desktop panel + mobile overlay.
  const workToolsTabs = (
    <>
      <button
        onClick={() => setActivePanel("code")}
        className={tabBtn(activePanel === "code")}
      >
        <Code2 className="w-3.5 h-3.5" />
        Code Editor
      </button>
      <button
        onClick={() => setActivePanel("whiteboard")}
        className={tabBtn(activePanel === "whiteboard")}
      >
        <PenTool className="w-3.5 h-3.5" />
        Whiteboard
      </button>
    </>
  );

  // The active work-tool panel — mounted in EXACTLY ONE place at a time
  // (desktop side panel OR mobile overlay) so we never run two Monaco editors.
  const activeWorkPanel =
    activePanel === "code" ? (
      <CodeEditorPanel
        onSendToKap={saveCode}
        disabled={isEnding}
        savedCode={sessionAny.codeArtifact}
        savedLanguage={sessionAny.codeLanguage}
      />
    ) : (
      <WhiteboardPanel
        onSendToKap={saveWhiteboard}
        disabled={isEnding}
        savedDiagram={savedDiagram}
      />
    );

  return (
    <div
      className={`${embedded ? "h-full" : "h-screen"} flex flex-col bg-background`}
    >
      {/* Header — standalone only. In the Path embed the path top bar owns
          the timer/points and the path help slide-in owns the tips. */}
      {!embedded && (
        <InterviewHeader
          interviewTitle={interviewTitle}
          interviewType={interviewType}
          timeRemaining={timeRemaining}
          onBack={handleBack}
          onEndInterview={handleEndInterview}
          help={<InterviewTips questionType={currentQuestion?.type} />}
        />
      )}

      {lgUp ? (
        /* Desktop: chat-style split — video + transcript left, tools right. */
        <ResizablePanelGroup
          orientation="horizontal"
          className="flex-1 min-h-0 overflow-hidden"
        >
          {/* Left: focused video (top) + live transcript chat (below) */}
          <ResizablePanel
            defaultSize="55"
            minSize="30"
            maxSize="75"
            className="flex flex-col min-h-0"
          >
            <ResizablePanelGroup
              orientation="vertical"
              className="mx-auto h-full min-h-0 w-full max-w-[900px]"
            >
              {/* Video stage */}
              <ResizablePanel defaultSize="58" minSize="30" className="min-h-0">
                <div className="relative h-full min-h-0 p-3 sm:p-4">
                  <InterviewStage className="h-full w-full" />
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                    <MediaControls
                      onEndInterview={handleEndInterview}
                      isEnding={isEnding}
                    />
                  </div>
                </div>
              </ResizablePanel>

              {/* Same look as the video ↔ code/whiteboard divider */}
              <ResizableHandle orientation="vertical" withHandle />

              {/* Live transcript — scrollable, auto-scrolls, captures for grading */}
              <ResizablePanel
                defaultSize="42"
                minSize="18"
                className="min-h-0 p-3 pt-0 sm:p-4 sm:pt-0"
              >
                <InterviewTranscriptPanel
                  className="h-full"
                  transcriptRef={transcriptRef}
                  injected={sharedEntries}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right: code editor / whiteboard */}
          <ResizablePanel
            defaultSize="45"
            minSize="25"
            maxSize="70"
            className="flex flex-col min-h-0"
          >
            <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-muted/20 flex-shrink-0">
              {workToolsTabs}
            </div>
            <div className="flex-1 min-h-0">{activeWorkPanel}</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        /* Mobile: a bottom tab switcher flips between the interview and the
           work tools. Both sections stay mounted (toggled with `hidden`) so the
           editor/whiteboard keep their state across switches; only this mobile
           branch renders (desktop is gated off), so panels mount exactly once. */
        <div className="flex flex-1 min-h-0 flex-col">
          {/* INTERVIEW section */}
          <div
            className={cn(
              "min-h-0 flex-1 flex-col",
              mobileTab === "interview" ? "flex" : "hidden",
            )}
          >
            {/* Video stage + compact controls below it */}
            <div className="flex-shrink-0 p-3 pb-1.5">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black/40">
                <InterviewStage className="h-full w-full" />
                <span
                  className="absolute left-3 top-3 z-20 rounded-lg bg-black/55 px-2 py-1 text-xs font-semibold tabular-nums text-white backdrop-blur"
                  aria-label="Time remaining"
                >
                  {fmtTime(timeRemaining)}
                </span>
              </div>
              <div className="mt-2 flex flex-shrink-0 justify-center">
                <MediaControls
                  compact
                  onEndInterview={handleEndInterview}
                  isEnding={isEnding}
                />
              </div>
            </div>
            {/* Transcript fills the remaining space */}
            <div className="min-h-0 flex-1 px-3 pb-2">
              <InterviewTranscriptPanel
                className="h-full"
                transcriptRef={transcriptRef}
                injected={sharedEntries}
              />
            </div>
          </div>

          {/* WORKSPACE section (code editor / whiteboard) */}
          <div
            className={cn(
              "min-h-0 flex-1 flex-col",
              mobileTab === "workspace" ? "flex" : "hidden",
            )}
          >
            <div className="flex flex-shrink-0 items-center gap-1 border-b border-border bg-muted/20 px-3 py-2">
              {workToolsTabs}
            </div>
            <div className="min-h-0 flex-1">{activeWorkPanel}</div>
          </div>

          {/* Bottom tab switcher */}
          <div className="flex flex-shrink-0 gap-1 border-t border-border bg-card p-1.5">
            <button
              type="button"
              aria-selected={mobileTab === "interview"}
              onClick={() => setMobileTab("interview")}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[11px] font-semibold transition-colors",
                mobileTab === "interview"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50",
              )}
            >
              <Video className="h-[18px] w-[18px]" />
              Interview
            </button>
            <button
              type="button"
              aria-selected={mobileTab === "workspace"}
              onClick={() => setMobileTab("workspace")}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[11px] font-semibold transition-colors",
                mobileTab === "workspace"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50",
              )}
            >
              <Code2 className="h-[18px] w-[18px]" />
              Workspace
            </button>
          </div>
        </div>
      )}

      {/* CRITICAL: RoomAudioRenderer handles all remote audio playback */}
      <RoomAudioRenderer />
    </div>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================
export function MockInterviewSessionPage({
  sessionId,
  onNavigate,
  embedded = false,
}: MockInterviewSessionProps) {
  const user = useUser();
  const fill = embedded ? "h-full" : "h-screen";
  const store = useAppStore();

  // Session state
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(2700);

  // LiveKit state
  const [token, setToken] = useState<string>("");
  const [serverUrl, setServerUrl] = useState<string>("");

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize session
  const initializeSession = useCallback(async () => {
    if (!sessionId || !user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch session details
      const sessionData = await store.getInterviewSession(sessionId);
      if (!sessionData) throw new Error("Interview session not found");

      setSession(sessionData);

      // Set questions
      if (sessionData.questions?.length > 0) {
        setQuestions(sessionData.questions);
      } else {
        setQuestions([
          {
            id: "dynamic-1",
            question:
              "The AI interviewer will guide you through the questions.",
            type: sessionData.template?.topics?.[0] || "Technical",
            difficulty: sessionData.template?.difficulty || "Intermediate",
            timeLimit: 10,
          },
        ]);
      }

      // Set duration
      const durationMinutes =
        sessionData.duration ||
        sessionData.interviewConfig?.duration ||
        parseInt(sessionData.template?.duration || "45");
      setTimeRemaining(durationMinutes * 60);

      // Get LiveKit token
      const tokenData = await store.getMockInterviewSessionToken(sessionId);
      if (!tokenData?.token) throw new Error("Failed to get session token");

      setToken(tokenData.token);
      setServerUrl(
        tokenData.wsUrl || "wss://mock-interview-up2y2ttf.livekit.cloud",
      );
    } catch (err: any) {
      console.error("Failed to initialize session:", err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to initialize interview session.",
      );
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, user?.id]);

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  // Time update handler - receives updates from InterviewRoom timer
  const handleTimeUpdate = useCallback((newTime: number) => {
    setTimeRemaining(newTime);
  }, []);

  // When embedded in a Path step, publish the countdown to the shared store so
  // the Path top bar can show it next to the points. Clear it on unmount.
  const setInterviewSeconds = useInterviewTimer((s) => s.setSeconds);
  useEffect(() => {
    if (!embedded) return;
    setInterviewSeconds(session ? timeRemaining : null);
    return () => setInterviewSeconds(null);
  }, [embedded, session, timeRemaining, setInterviewSeconds]);

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`${fill} flex flex-col items-center justify-center bg-background`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Loader2 className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">
              Preparing your interview...
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Connecting to Kap AI Interviewer
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`${fill} flex flex-col items-center justify-center bg-background p-4`}
      >
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Connection Failed</h2>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <div className="flex gap-3 mt-2">
                <Button
                  variant="outline"
                  onClick={() => onNavigate("/mock-interviews")}
                >
                  Go Back
                </Button>
                <Button onClick={initializeSession}>Try Again</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Session not found
  if (!session) {
    return (
      <div
        className={`${fill} flex flex-col items-center justify-center bg-background p-4`}
      >
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Interview Not Found</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  The interview session doesn't exist or has expired.
                </p>
              </div>
              <Button onClick={() => onNavigate("/mock-interviews")}>
                Back to Interviews
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main interview room with LiveKit
  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={!!token && !!serverUrl}
      audio={true}
      video={true}
      options={{
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          simulcast: false,
          audioPreset: { maxBitrate: 48000 },
        },
      }}
      data-lk-theme="default"
      className={fill}
      onConnected={() => console.log("✅ Connected to LiveKit room")}
      onDisconnected={() => console.log("❌ Disconnected from LiveKit room")}
      onError={(err) => {
        // Surfaced in the header connection pill via useConnectionState — don't
        // escalate to a full-screen error here.
        console.error("LiveKit error:", err?.message ?? err);
      }}
    >
      <InterviewRoom
        sessionId={sessionId}
        session={session}
        questions={questions}
        currentQuestionIndex={currentQuestionIndex}
        setCurrentQuestionIndex={setCurrentQuestionIndex}
        initialTimeRemaining={timeRemaining}
        onNavigate={onNavigate}
        onTimeUpdate={handleTimeUpdate}
        embedded={embedded}
      />
    </LiveKitRoom>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================
function InterviewTips({ questionType }: { questionType?: string }) {
  const tips: Record<string, { title: string; tips: string[] }> = {
    Conceptual: {
      title: "Conceptual Question Tips",
      tips: [
        "Start with a clear, concise definition",
        "Use examples to illustrate your understanding",
        "Mention real-world use cases",
        "Compare and contrast with related concepts",
      ],
    },
    Technical: {
      title: "Technical Question Tips",
      tips: [
        "Think out loud as you work through the problem",
        "Ask clarifying questions if needed",
        "Discuss trade-offs of different approaches",
        "Consider edge cases and error handling",
      ],
    },
    "System Design": {
      title: "System Design Tips",
      tips: [
        "Start by clarifying requirements and constraints",
        "Begin with a high-level architecture",
        "Discuss scalability and bottlenecks",
        "Consider data storage and retrieval patterns",
      ],
    },
    Coding: {
      title: "Coding Question Tips",
      tips: [
        "Understand the problem before coding",
        "Start with a brute force solution",
        "Optimize step by step",
        "Test with example inputs",
      ],
    },
    Behavioral: {
      title: "Behavioral Question Tips",
      tips: [
        "Use the STAR method (Situation, Task, Action, Result)",
        "Be specific with examples",
        "Focus on your contributions",
        "Show what you learned from the experience",
      ],
    },
  };

  const currentTips = tips[questionType || "Technical"] || tips.Technical;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">{currentTips.title}</h3>
      <ul className="space-y-2">
        {currentTips.tips.map((tip, index) => (
          <li
            key={index}
            className="flex items-start gap-2 text-sm text-muted-foreground"
          >
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-medium">
              {index + 1}
            </span>
            {tip}
          </li>
        ))}
      </ul>
      <div className="pt-4 border-t border-border">
        <h4 className="font-medium text-sm mb-2">General Tips</h4>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li>• Speak clearly and at a moderate pace</li>
          <li>• Take a moment to gather your thoughts</li>
          <li>• It's okay to ask for clarification</li>
          <li>• Stay calm and confident</li>
        </ul>
      </div>
    </div>
  );
}

export default MockInterviewSessionPage;
