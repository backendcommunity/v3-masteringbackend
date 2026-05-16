"use client";

import { useEffect, useRef } from "react";
import Player from "@vimeo/player";
import { Card } from "./card";
import { Video } from "@/lib/data";
import { Play } from "lucide-react";

interface VimeoPlayerProps {
  video: Partial<Video>;
  onEnded?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onComplete?: () => void;
  onTimeUpdate?: (seconds: number) => void;
}

const VimeoPlayer = ({
  video,
  onEnded,
  onPlay,
  onPause,
  onComplete,
  onTimeUpdate,
}: VimeoPlayerProps) => {
  const playerRef = useRef<HTMLDivElement | null>(null);
  const completedRef = useRef(false);
  useEffect(() => {
    if (!playerRef.current) return;

    // Guard: Vimeo SDK throws if id is missing/NaN
    const videoId = Number(video.video);
    if (!video.video || isNaN(videoId)) return;

    // Reset per-video completion flag — useRef persists across renders
    // so without this reset, subsequent videos never fire onComplete
    completedRef.current = false;

    const player = new Player(playerRef.current, {
      autoplay: true,
      id: videoId,
      byline: false,
      title: false,
      responsive: true,
      muted: false,
      portrait: false,
    });

    player.play();

    player.on("ended", () => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
      onEnded?.();
    });

    player.on("play", () => {
      onPlay?.();
    });

    player.on("pause", () => {
      onPause?.();
    });

    player.on("timeupdate", (data) => {
      onTimeUpdate?.(data.seconds);
      if (data.percent >= 0.9 && !completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    });

    return () => {
      try {
        player.destroy();
      } catch {
        // Vimeo SDK throws AbortError when destroying mid-operation — safe to ignore
      }
    };
  }, [video]);

  return <div ref={playerRef}></div>;
};

export { VimeoPlayer };
