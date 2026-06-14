"use client";

import { useEffect, useRef, useState } from "react";
import Player from "@vimeo/player";
import { Video } from "@/lib/data";
import { registerActivitySource } from "@/lib/activity";

interface VimeoPlayerProps {
  video: Partial<Video>;
  initialTime?: number;
  onEnded?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onComplete?: () => void;
  onTimeUpdate?: (seconds: number) => void;
  onError?: (error: unknown) => void;
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
  onError,
}: VimeoPlayerProps) => {
  const playerRef = useRef<HTMLDivElement | null>(null);
  const completedRef = useRef(false); // 90% "watched" event already fired
  const endedRef = useRef(false); // 100% "finished" event already fired
  const durationRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerInstanceRef = useRef<Player | null>(null);
  const releaseActivityRef = useRef<(() => void) | null>(null);

  // Keep the latest callbacks in a ref so the video-keyed effect never invokes a
  // stale closure if the parent re-renders with new handler identities.
  const cbRef = useRef({ onEnded, onPlay, onPause, onComplete, onTimeUpdate, onError });
  cbRef.current = { onEnded, onPlay, onPause, onComplete, onTimeUpdate, onError };

  const [speed, setSpeed] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    return parseFloat(localStorage.getItem(SPEED_KEY) ?? "1") || 1;
  });
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  useEffect(() => {
    if (!playerRef.current) return;

    const videoId = Number(video.video);
    if (!video.video || isNaN(videoId)) return;

    // Per-video latches: each event fires exactly once for this video.
    completedRef.current = false;
    endedRef.current = false;
    durationRef.current = 0;

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

    // Two distinct, fire-once events:
    //   onComplete → the 90% "watched" signal (mark done / award / progress).
    //   onEnded    → the 100% "finished" signal (drives the skip/auto-advance overlay).
    // Both are reached from THREE independent sources — the `timeupdate` stream,
    // the native `ended`/`pause` events, and a 1s currentTime poll — so a dropped
    // Vimeo event can never lose them. The latches guarantee single delivery.
    const fireComplete = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      cbRef.current.onComplete?.();
    };
    const fireEnded = () => {
      if (endedRef.current) return;
      endedRef.current = true;
      cbRef.current.onEnded?.();
    };
    // 90% → watched. ~100% (or within 0.75s of the end) → watched + finished.
    const handleProgress = (pct: number, seconds: number) => {
      if (pct >= 0.9) fireComplete();
      const dur = durationRef.current;
      if (pct >= 0.995 || (dur > 0 && dur - seconds <= 0.75)) {
        fireComplete();
        fireEnded();
      }
    };

    const stopPoll = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    // Backstop poll: while playing, sample currentTime every second and apply the
    // same thresholds. Guarantees the 90%/100% events fire even if Vimeo silently
    // drops `timeupdate` or `ended` (backgrounded tab, throttling, SDK quirk).
    const startPoll = () => {
      if (pollRef.current) return;
      pollRef.current = setInterval(() => {
        player
          .getCurrentTime()
          .then((s) => {
            const dur = durationRef.current;
            handleProgress(dur > 0 ? s / dur : 0, s);
            if (endedRef.current) stopPoll();
          })
          .catch(() => {});
      }, 1000);
    };

    player
      .ready()
      .then(() => {
        player
          .getDuration()
          .then((d) => {
            durationRef.current = d || 0;
          })
          .catch(() => {});

        player.on("play", () => {
          if (!releaseActivityRef.current) {
            releaseActivityRef.current = registerActivitySource();
          }
          startPoll();
          cbRef.current.onPlay?.();
        });

        if (initialTime > 0) {
          player.setCurrentTime(initialTime).catch(() => {});
        }
        player.setPlaybackRate(speed).catch(() => {});

        player.on("ended", () => {
          releaseActivityRef.current?.();
          releaseActivityRef.current = null;
          stopPoll();
          fireComplete();
          fireEnded();
        });

        player.on("pause", () => {
          releaseActivityRef.current?.();
          releaseActivityRef.current = null;
          stopPoll();
          cbRef.current.onPause?.();
          // Vimeo sometimes emits `pause` at the very end instead of `ended` —
          // treat a pause near the end as a finish.
          player
            .getCurrentTime()
            .then((s) => {
              const dur = durationRef.current;
              handleProgress(dur > 0 ? s / dur : 0, s);
            })
            .catch(() => {});
        });

        player.on(
          "timeupdate",
          (data: { seconds: number; percent: number; duration: number }) => {
            if (data.duration) durationRef.current = data.duration;
            cbRef.current.onTimeUpdate?.(data.seconds);
            handleProgress(data.percent, data.seconds);
          },
        );

        // Fired by the Vimeo SDK on embed/playback errors (private video, domain
        // restriction, removed video). Without this the player fails invisibly.
        player.on("error", (err: unknown) => {
          console.error("[VimeoPlayer] player error:", err);
          cbRef.current.onError?.(err);
        });
      })
      .catch((err) => {
        // ready() rejects when the embed is blocked (e.g. Vimeo privacy / 403).
        // Surface it instead of dying silently — no event ever fires otherwise.
        console.error("[VimeoPlayer] failed to initialise embed:", err);
        cbRef.current.onError?.(err);
      });

    // Autoplay-with-sound is blocked by most browsers; the rejection is benign
    // (user just presses play). A privacy/embed failure is caught by ready() above.
    player.play().catch(() => {});

    return () => {
      stopPoll();
      releaseActivityRef.current?.();
      releaseActivityRef.current = null;
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
