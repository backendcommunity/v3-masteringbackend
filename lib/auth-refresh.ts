import { api } from "@/lib/api";

// One shared in-flight refresh. Rotation makes concurrent /auth/refresh calls
// fatal (the 2nd replays a just-rotated token → family revoked), so every caller
// — the 401 interceptor, the proactive timer, the tab-focus handler, the idle
// lock — MUST funnel through this single promise.
let inFlight: Promise<void> | null = null;

export const refreshSession = (): Promise<void> => {
  if (inFlight) return inFlight;

  inFlight = api
    .post("/auth/refresh")
    .then(() => undefined)
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
};

// test-only hook to clear module state between cases
export const __resetRefreshForTests = (): void => {
  inFlight = null;
};
