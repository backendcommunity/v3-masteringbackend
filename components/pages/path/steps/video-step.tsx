"use client";
import { useEffect, useState } from "react";
import { VimeoPlayer } from "@/components/ui/vimeo-player";
import { PathSessionStep } from "@/lib/path-types";
import { StepFrame } from "../step-frame";
import { useAppStore } from "@/lib/store";
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
  const [video, setVideo] = useState<Partial<Video> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          <div className="mx-auto w-full max-w-[min(1040px,calc((100vh-17rem)*1.7778))] rounded-2xl overflow-hidden border border-border bg-[#0d1019] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]">
            <VimeoPlayer
              video={video}
              onComplete={() => onComplete(step.id)}
              onTimeUpdate={(secs) => {
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
