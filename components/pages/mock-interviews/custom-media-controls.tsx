"use client";

import { useState, useCallback, useEffect } from "react";
import { useRoomContext, useLocalParticipant } from "@livekit/components-react";
import { cn } from "@/lib/utils";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Settings,
  Volume2,
  VolumeX,
  MoreVertical,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CustomMediaControlsProps {
  onEndInterview: () => void;
  className?: string;
}

export function CustomMediaControls({
  onEndInterview,
  className,
}: CustomMediaControlsProps) {
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } =
    useLocalParticipant();

  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);

  const toggleMicrophone = useCallback(async () => {
    if (localParticipant) {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    }
  }, [localParticipant, isMicrophoneEnabled]);

  const toggleCamera = useCallback(async () => {
    if (localParticipant) {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    }
  }, [localParticipant, isCameraEnabled]);

  // Mute/unmute all remote audio tracks
  const toggleSpeaker = useCallback(() => {
    const newMutedState = !isSpeakerMuted;
    setIsSpeakerMuted(newMutedState);

    // Mute/unmute audio elements rendered by RoomAudioRenderer
    const audioElements = document.querySelectorAll("audio");
    audioElements.forEach((audio) => {
      audio.muted = newMutedState;
    });
  }, [isSpeakerMuted, room]);

  // Apply mute state when new participants join
  useEffect(() => {
    if (!isSpeakerMuted) return;

    const handleTrackSubscribed = () => {
      const audioElements = document.querySelectorAll("audio");
      audioElements.forEach((audio) => {
        audio.muted = true;
      });
    };

    room.on("trackSubscribed", handleTrackSubscribed);
    return () => {
      room.off("trackSubscribed", handleTrackSubscribed);
    };
  }, [isSpeakerMuted, room]);

  const handleDisconnect = useCallback(() => {
    room.disconnect();
    onEndInterview();
  }, [room, onEndInterview]);

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          "flex items-center justify-center gap-2 p-3 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/50 shadow-xl",
          className
        )}
      >
        {/* Microphone Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMicrophone}
              className={cn(
                "w-12 h-12 rounded-xl transition-all duration-200",
                isMicrophoneEnabled
                  ? "bg-secondary hover:bg-secondary/80 text-foreground"
                  : "bg-destructive/20 hover:bg-destructive/30 text-destructive"
              )}
            >
              {isMicrophoneEnabled ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-card border-border">
            <p>
              {isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"}
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Camera Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCamera}
              className={cn(
                "w-12 h-12 rounded-xl transition-all duration-200",
                isCameraEnabled
                  ? "bg-secondary hover:bg-secondary/80 text-foreground"
                  : "bg-destructive/20 hover:bg-destructive/30 text-destructive"
              )}
            >
              {isCameraEnabled ? (
                <Video className="w-5 h-5" />
              ) : (
                <VideoOff className="w-5 h-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-card border-border">
            <p>{isCameraEnabled ? "Turn off camera" : "Turn on camera"}</p>
          </TooltipContent>
        </Tooltip>

        {/* Speaker Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSpeaker}
              className={cn(
                "w-12 h-12 rounded-xl transition-all duration-200",
                !isSpeakerMuted
                  ? "bg-secondary hover:bg-secondary/80 text-foreground"
                  : "bg-destructive/20 hover:bg-destructive/30 text-destructive"
              )}
            >
              {!isSpeakerMuted ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-card border-border">
            <p>{!isSpeakerMuted ? "Mute speaker" : "Unmute speaker"}</p>
          </TooltipContent>
        </Tooltip>

        {/* Divider */}
        <div className="w-px h-8 bg-border/50 mx-1" />

        {/* More Options */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-12 h-12 rounded-xl bg-secondary hover:bg-secondary/80"
                >
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-card border-border">
              <p>More options</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent
            align="center"
            className="w-48 bg-card border-border"
          >
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Maximize2 className="w-4 h-4 mr-2" />
              Fullscreen
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={handleDisconnect}
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              Leave Interview
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Divider */}
        <div className="w-px h-8 bg-border/50 mx-1" />

        {/* End Interview Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              onClick={handleDisconnect}
              className="w-12 h-12 rounded-xl bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/20"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-card border-border">
            <p>End interview</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
