import { pgGit, type PgCtx } from "@/lib/playground-client";

/**
 * Project Playground autosave / conflict engine.
 *
 * GitHub is the source of truth. This module orchestrates the autosave cadence
 * (idle / run / close) and conflict resolution, talking ONLY to `pgGit` from the
 * transport layer. It is deliberately pure (no React) so it can be unit-tested
 * with fake timers and a mocked `pgGit`.
 *
 * Key behaviours:
 *  - `nudgeSave()` is a trailing debounce: rapid calls collapse into a single
 *    autosave after `debounceMs` of quiet.
 *  - `saveNow()` is single-in-flight with coalescing: a save requested while one
 *    is running sets a `pending` flag, and exactly one follow-up runs afterwards.
 *  - A push conflict is returned by `pgGit` as DATA (`{ conflict, remoteSha }`),
 *    not thrown — we surface it via `onConflict` and leave `lastSha` untouched.
 */

export type SyncState = "synced" | "syncing" | "conflict" | "error";

export interface PlaygroundSyncOpts {
  ctx: PgCtx;
  owner: string;
  repo: string;
  installationId: string | number;
  getLastSha: () => string | null;
  setLastSha: (sha: string | null) => void;
  onStatus: (state: SyncState, at?: number) => void;
  onConflict: (remoteSha: string) => void;
  onReloaded?: () => void; // after a resetToRemote so the UI can reload the tree
  now?: () => number; // injectable clock (default Date.now) for tests
  debounceMs?: number; // default 2500
}

export interface PlaygroundSync {
  hydrate(): Promise<{ empty: boolean; sha: string | null } | null>;
  nudgeSave(): void; // debounced autosave
  saveNow(reason: "idle" | "run" | "close" | "manual"): Promise<void>;
  flushOnClose(): void; // best-effort final save
  resolveReload(): Promise<void>; // discard local → reset to remote
  resolveOverwrite(): Promise<void>; // force remote to match local
  dispose(): void; // clear timers
}

const DEFAULT_DEBOUNCE_MS = 2500;

export function createPlaygroundSync(opts: PlaygroundSyncOpts): PlaygroundSync {
  const now = opts.now ?? Date.now;
  const debounceMs = opts.debounceMs ?? DEFAULT_DEBOUNCE_MS;

  // Shared GitHub repo identity for every git op.
  const repoArgs = {
    owner: opts.owner,
    repo: opts.repo,
    installationId: opts.installationId,
  };

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;
  let pending = false;

  function msgFor(reason: "idle" | "run" | "close" | "manual"): string {
    switch (reason) {
      case "idle": {
        const d = new Date(now());
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        return `autosave ${hh}:${mm}`;
      }
      case "run":
        return "checkpoint before run";
      case "close":
        return "autosave (leaving)";
      case "manual":
        return "manual save";
    }
  }

  function clearDebounce(): void {
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  }

  async function hydrate(): Promise<{
    empty: boolean;
    sha: string | null;
  } | null> {
    try {
      const r = await pgGit(opts.ctx, { op: "hydrate", ...repoArgs });
      opts.setLastSha(r.sha ?? null);
      opts.onStatus("synced", now());
      return { empty: !!r.empty, sha: r.sha ?? null };
    } catch {
      opts.onStatus("error");
      return null;
    }
  }

  function nudgeSave(): void {
    // Trailing debounce: each call restarts the quiet window.
    clearDebounce();
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      void saveNow("idle");
    }, debounceMs);
  }

  async function saveNow(
    reason: "idle" | "run" | "close" | "manual",
  ): Promise<void> {
    // Single-in-flight: a save requested while one is running coalesces.
    if (inFlight) {
      pending = true;
      return;
    }
    inFlight = true;

    try {
      opts.onStatus("syncing");
      const r = await pgGit(opts.ctx, {
        op: "push",
        ...repoArgs,
        baseSha: opts.getLastSha(),
        message: msgFor(reason),
      });

      if (r.conflict) {
        // Conflict is data, not an error — surface it, keep lastSha as-is.
        opts.onStatus("conflict");
        opts.onConflict(r.remoteSha);
      } else {
        if (r.sha) opts.setLastSha(r.sha);
        opts.onStatus("synced", now());
      }
    } catch {
      opts.onStatus("error");
    } finally {
      inFlight = false;
      if (pending) {
        pending = false;
        // Exactly one coalesced follow-up; always an idle autosave.
        void saveNow("idle");
      }
    }
  }

  function flushOnClose(): void {
    // Best-effort: fire-and-forget, don't await.
    void saveNow("close");
  }

  async function resolveReload(): Promise<void> {
    try {
      opts.onStatus("syncing");
      const r = await pgGit(opts.ctx, { op: "resetToRemote", ...repoArgs });
      opts.setLastSha(r.sha ?? null);
      opts.onReloaded?.();
      opts.onStatus("synced", now());
    } catch {
      opts.onStatus("error");
    }
  }

  async function resolveOverwrite(): Promise<void> {
    try {
      opts.onStatus("syncing");
      const r = await pgGit(opts.ctx, {
        op: "pushForce",
        ...repoArgs,
        message: "overwrite from playground",
      });
      opts.setLastSha(r.sha ?? null);
      opts.onStatus("synced", now());
    } catch {
      opts.onStatus("error");
    }
  }

  function dispose(): void {
    clearDebounce();
  }

  return {
    hydrate,
    nudgeSave,
    saveNow,
    flushOnClose,
    resolveReload,
    resolveOverwrite,
    dispose,
  };
}
