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
      <div className="p-6">
        {loading ? (
          <Loader isFull={false} />
        ) : video ? (
          <div className="rounded-2xl overflow-hidden border border-border bg-black glow-subtle">
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
