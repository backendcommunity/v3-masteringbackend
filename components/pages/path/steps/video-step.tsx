"use client";
import { useEffect, useState } from "react";
import { VimeoPlayer } from "@/components/ui/vimeo-player";
import { PathSessionStep } from "@/lib/path-types";
import { StepFrame } from "../step-frame";
import { useAppStore } from "@/lib/store";
import { useVideoTime } from "@/lib/video-time-store";
import { Loader } from "@/components/ui/loader";
import { Video } from "@/lib/data";

export function VideoStep({
  pathId,
  step,
  onComplete,
}: {
  pathId: string;
  step: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, unknown>) => void;
}) {
  const store = useAppStore();
  const setVideoTime = useVideoTime((s) => s.setVideoTime);
  const [video, setVideo] = useState<Partial<Video> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setVideoTime(0); // reset transcript sync for the new step
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

  return (
    <StepFrame step={step} onComplete={() => onComplete(step.id)}>
      <div>
        {loading ? (
          <Loader isFull={false} />
        ) : video ? (
          <div className="mx-auto w-full max-w-[min(1200px,calc((100vh-15rem)*1.7778))] rounded-2xl overflow-hidden border border-border bg-[#0d1019] shadow-[0_10px_30px_-15px_rgba(0,0,0,0.35)]">
            <VimeoPlayer
              video={video}
              onComplete={() => onComplete(step.id)}
              onTimeUpdate={(secs) => {
                setVideoTime(secs); // feed the sidebar transcript
                if (Math.floor(secs) % 15 === 0) {
                  store
                    .updatePathStepProgress(pathId, step.id, { duration: secs })
                    .catch(() => {});
                }
              }}
            />
          </div>
        ) : (
          <p className="text-muted-foreground">Video unavailable.</p>
        )}
      </div>
    </StepFrame>
  );
}
