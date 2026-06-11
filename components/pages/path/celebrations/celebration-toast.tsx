"use client";

import type React from "react";
import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// Auto-dismiss after `ms`, with a manual `dismiss()` for buttons. onDone fires
// exactly once (whichever happens first). The timer clears on unmount.
export function useCelebrationDismiss(onDone: () => void, ms = 4500) {
  const doneRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    onDone();
  }, [onDone]);

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, ms);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dismiss, ms]);

  return dismiss;
}

// Shared bottom-right, non-blocking shell for path celebration pops. The
// outer layer is pointer-events-none so it never blocks the lesson; the card
// itself re-enables pointer events for its buttons. Slides in from the
// bottom-right corner; reduced-motion users get a plain fade.
export function CelebrationToast({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className="pointer-events-none fixed bottom-6 right-6 z-[60] flex max-w-[calc(100vw-3rem)] justify-end"
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "pointer-events-auto w-80 max-w-full overflow-hidden rounded-2xl border border-border bg-card shadow-2xl",
          "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:slide-in-from-right-4 motion-safe:duration-300",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
