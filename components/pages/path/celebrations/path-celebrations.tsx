"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PathStepRibbon } from "@/components/pages/path/celebrations/path-step-ribbon";
import { PathMilestoneModal } from "@/components/pages/path/celebrations/path-milestone-modal";
import { PathAchievementModal } from "@/components/pages/path/celebrations/path-achievement-modal";
import { CelebrationEvent } from "@/lib/path-types";

interface PathCelebrationsProps {
  queue: CelebrationEvent[];
  /** Called once when a `certUnlocked` event is reached. The queue is terminal after this. */
  onCertUnlocked: () => void;
  /** Called once when the queue has been fully played. */
  onAllDone: () => void;
}

/**
 * Plays an ordered queue of celebration events one at a time, dispatching each
 * to the correct child component. Sequential — only one celebration is visible
 * at a time. When the queue is exhausted it signals the parent so it can advance
 * to the next step (or, for `certUnlocked`, open the certificate).
 */
export function PathCelebrations({
  queue,
  onCertUnlocked,
  onAllDone,
}: PathCelebrationsProps) {
  const [index, setIndex] = useState(0);

  // Stable so children's auto-dismiss timers (which depend on onDone) aren't
  // reset on every re-render — otherwise the toast would never close.
  const advance = useCallback(() => setIndex((prev) => prev + 1), []);

  // Latches guard against double-firing the terminal callbacks.
  const allDoneFired = useRef(false);
  const certFired = useRef(false);

  // Track the queue identity so a fresh, non-empty queue replays from the start.
  const queueRef = useRef<CelebrationEvent[]>(queue);

  // Reset when a NEW non-empty queue arrives (different identity). An empty
  // queue is ignored so it can never loop the reset.
  useEffect(() => {
    if (queue === queueRef.current) return;
    queueRef.current = queue;
    if (queue.length === 0) return;
    allDoneFired.current = false;
    certFired.current = false;
    setIndex(0);
  }, [queue]);

  const current = index < queue.length ? queue[index] : null;

  // Terminal signals run in an effect so we never call parent setters mid-render.
  useEffect(() => {
    if (queue.length === 0) return;

    if (current === null) {
      if (!allDoneFired.current) {
        allDoneFired.current = true;
        onAllDone();
      }
      return;
    }

    if (current.kind === "certUnlocked" && !certFired.current) {
      certFired.current = true;
      onCertUnlocked();
    }
  }, [current, queue.length, onAllDone, onCertUnlocked]);

  if (queue.length === 0 || current === null) return null;

  // `key={index}` forces a fresh instance per queued pop. Without it React
  // reuses the same component across same-type events (e.g. percent → topic),
  // carrying over the dismissed-latch + spent timer so the next pop can't close.
  switch (current.kind) {
    case "stepUnlocked":
      return (
        <PathStepRibbon
          key={index}
          nextTitle={current.nextTitle}
          onDone={advance}
        />
      );
    case "percent":
    case "topicCompleted":
      return <PathMilestoneModal key={index} event={current} onDone={advance} />;
    case "achievement":
    case "levelUp":
      return (
        <PathAchievementModal key={index} event={current} onDone={advance} />
      );
    case "certUnlocked":
      // Terminal: handled by the effect above; render nothing and stop.
      return null;
    default: {
      // Exhaustiveness guard — unreachable if the union is fully handled.
      const _exhaustive: never = current;
      return _exhaustive;
    }
  }
}
