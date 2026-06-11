// Single source of truth for "is the user active?" — shared by the idle lock,
// the proactive refresh timer, DOM listeners, the axios request interceptor, and
// the video player. Idle = no signal for IDLE_TIMEOUT_MS AND no long-lived source
// (video) currently held.

export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

let lastActivity = Date.now();
let activeSources = 0;

export const markActivity = (): void => {
  lastActivity = Date.now();
};

export const getLastActivity = (): number => lastActivity;

/** Hold a long-lived activity source (e.g. video playing). Returns a release fn. */
export const registerActivitySource = (): (() => void) => {
  activeSources += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeSources = Math.max(0, activeSources - 1);
    // NB: release does NOT mark activity — idle status falls back to the real
    // lastActivity clock. A released source (e.g. video ended/paused) must not
    // fabricate fresh activity, otherwise a user who walked away mid-video would
    // never be detected as idle.
  };
};

export const isIdle = (): boolean => {
  if (activeSources > 0) return false;
  return Date.now() - lastActivity >= IDLE_TIMEOUT_MS;
};

// test-only
export const __setLastActivityForTests = (t: number): void => {
  lastActivity = t;
};
