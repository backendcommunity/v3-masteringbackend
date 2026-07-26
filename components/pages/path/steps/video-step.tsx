"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { VimeoPlayer } from "@/components/ui/vimeo-player";
import { PathSessionStep } from "@/lib/path-types";
import { StepFrame } from "../step-frame";
import { useAppStore } from "@/lib/store";
import { useVideoTime } from "@/lib/video-time-store";
import { StepSkeleton } from "@/components/pages/path/step-skeleton";
import { Video } from "@/lib/data";

const COUNTDOWN_FROM = 3;

export function VideoStep({
  pathId,
  step,
  onComplete,
  onReachComplete,
  updateProgress,
}: {
  pathId: string;
  step: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, unknown>) => void;
  // Fired at 90% watched: mark the step complete + award, WITHOUT advancing.
  // The auto-advance happens separately at 100% (onComplete above, via the overlay).
  onReachComplete?: (stepId: string, payload?: Record<string, unknown>) => void;
  // Heartbeat sink. Defaults to the path endpoint; the course route routes it
  // to the course progress endpoint.
  updateProgress?: (
    id: string,
    stepId: string,
    payload: { duration: number },
  ) => Promise<unknown>;
}) {
  const store = useAppStore();
  const updateProgressFn = updateProgress ?? store.updatePathStepProgress;
  const setVideoTime = useVideoTime((s) => s.setVideoTime);
  const [video, setVideo] = useState<Partial<Video> | null>(null);
  const [loading, setLoading] = useState(true);
  // null = no overlay; otherwise the seconds remaining before auto-advance.
  const [countdown, setCountdown] = useState<number | null>(null);
  const firedRef = useRef(false); // 100% advance fired
  const markedRef = useRef(false); // 90% "watched" mark fired

  useEffect(() => {
    setVideoTime(0); // reset transcript sync for the new step
    setCountdown(null); // reset the end-of-video overlay
    firedRef.current = false;
    markedRef.current = false;
    (async () => {
      try {
        const data = await store.getPathItem(step.payloadRef.endpoint);
        setVideo(data);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id]);

  const finish = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    onComplete(step.id);
  }, [onComplete, step.id]);

  // Tick the end-of-video countdown, then auto-advance at zero.
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      finish();
      return;
    }
    const t = setTimeout(
      () => setCountdown((c) => (c === null ? null : c - 1)),
      1000,
    );
    return () => clearTimeout(t);
  }, [countdown, finish]);

  // 90% watched → mark the step complete + award points, but DO NOT advance.
  // (The learner keeps watching the last stretch; advance is driven at 100%.)
  const handleReachComplete = useCallback(() => {
    if (markedRef.current) return;
    markedRef.current = true;
    onReachComplete?.(step.id, { watched: true });
  }, [onReachComplete, step.id]);

  // 100% finished → show the skip / auto-advance overlay.
  const handleVideoEnd = () => {
    if (countdown === null && !firedRef.current) setCountdown(COUNTDOWN_FROM);
  };

  return (
    <StepFrame step={step} onComplete={() => onComplete(step.id)}>
      <div>
        {loading ? (
          <StepSkeleton />
        ) : video ? (
          <div className="relative mx-auto w-full max-w-[min(1200px,calc((100vh-15rem)*1.7778))] rounded-2xl overflow-hidden border border-border bg-[#0d1019] shadow-[0_10px_30px_-15px_rgba(0,0,0,0.35)]">
            <VimeoPlayer
              video={video}
              onComplete={handleReachComplete}
              onEnded={handleVideoEnd}
              onTimeUpdate={(secs) => {
                setVideoTime(secs); // feed the sidebar transcript
                if (Math.floor(secs) % 15 === 0) {
                  updateProgressFn(pathId, step.id, { duration: secs }).catch(
                    () => {},
                  );
                }
              }}
            />

            {/* End-of-video auto-advance overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/75 backdrop-blur-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/25 text-3xl font-bold tabular-nums text-white">
                  {Math.max(0, countdown)}
                </div>
                <p className="text-sm text-white/75">
                  Up next in {Math.max(0, countdown)}s…
                </p>
                <button
                  type="button"
                  onClick={finish}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  Skip <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">Video unavailable.</p>
        )}
      </div>
    </StepFrame>
  );
}
