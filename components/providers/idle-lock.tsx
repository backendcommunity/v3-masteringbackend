"use client";

import { markActivity } from "@/lib/activity";

interface IdleLockProps {
  onResume: () => void;
}

/**
 * Full-screen resume-in-place overlay. The session is NOT touched — no server
 * call, no cookie clear. Any interaction marks activity, refreshes the token,
 * and dismisses. This is the "idle page" — distinct from logout.
 */
export function IdleLock({ onResume }: IdleLockProps) {
  const handleResume = () => {
    markActivity();
    onResume();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Session paused due to inactivity"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-background/95 backdrop-blur-sm"
      onClick={handleResume}
      onKeyDown={handleResume}
      tabIndex={0}
    >
      <div className="flex flex-col items-center gap-3 text-center px-6">
        <h2 className="text-2xl font-semibold">You&apos;ve been away for a while</h2>
        <p className="text-muted-foreground max-w-sm">
          We paused things to keep your account safe. You&apos;re still signed in —
          pick up right where you left off.
        </p>
        <button
          onClick={handleResume}
          className="mt-2 rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:opacity-90 transition"
        >
          Resume
        </button>
      </div>
    </div>
  );
}

export default IdleLock;
