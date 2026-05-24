"use client";

import { useEffect, useRef, useState } from "react";
import Player from "@vimeo/player";
import { Video } from "@/lib/data";

interface VimeoPlayerProps {
  video: Partial<Video>;
  initialTime?: number;
  onEnded?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onComplete?: () => void;
  onTimeUpdate?: (seconds: number) => void;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
const SPEED_KEY = "mb-playback-speed";

const VimeoPlayer = ({
  video,
  initialTime = 0,
  onEnded,
  onPlay,
  onPause,
  onComplete,
  onTimeUpdate,
}: VimeoPlayerProps) => {
  const playerRef = useRef<HTMLDivElement | null>(null);
  const completedRef = useRef(false);
  const playerInstanceRef = useRef<Player | null>(null);
  const [speed, setSpeed] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    return parseFloat(localStorage.getItem(SPEED_KEY) ?? "1") || 1;
  });
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  useEffect(() => {
    if (!playerRef.current) return;

    const videoId = Number(video.video);
    if (!video.video || isNaN(videoId)) return;

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

    playerInstanceRef.current = player;

    player.ready().then(() => {
      if (initialTime > 0) {
        player.setCurrentTime(initialTime).catch(() => {});
      }
      player.setPlaybackRate(speed).catch(() => {});
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
      playerInstanceRef.current = null;
      try {
        player.destroy();
      } catch {
        // Vimeo SDK throws AbortError when destroying mid-operation — safe to ignore
      }
    };
  }, [video]);

  const handleSpeedChange = (s: number) => {
    setSpeed(s);
    localStorage.setItem(SPEED_KEY, String(s));
    setShowSpeedMenu(false);
    playerInstanceRef.current?.setPlaybackRate(s).catch(() => {});
  };

  return (
    <div className="relative">
      <div ref={playerRef}></div>

      {/* Speed selector */}
      <div className="absolute bottom-12 right-3 z-10">
        {showSpeedMenu && (
          <div className="mb-1 flex flex-col items-end gap-0.5">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                className={`text-xs px-2 py-0.5 rounded bg-black/70 text-white hover:bg-black/90 transition ${
                  s === speed ? "ring-1 ring-white font-bold" : ""
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setShowSpeedMenu((v) => !v)}
          className="text-xs px-2 py-0.5 rounded bg-black/60 text-white hover:bg-black/80 transition font-medium"
        >
          {speed}x
        </button>
      </div>
    </div>
  );
};

export { VimeoPlayer };
