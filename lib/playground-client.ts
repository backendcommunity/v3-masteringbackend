import { api } from "./api";

/**
 * Project Playground transport layer.
 *
 * The FE talks DIRECTLY to a Cloudflare `playground-worker` (file/run/terminal),
 * NOT through academy's socket.io. Academy mints a short-lived (15 min) worker JWT
 * scoped to a project; the worker verifies it.
 *
 * Two distinct origins are involved:
 *  - Academy (`api` from ./api): used ONLY to fetch the worker token. Sends the
 *    HTTP-only cookie; baseURL is NEXT_PUBLIC_API_URL.
 *  - Worker (WORKER_BASE): reached with raw `fetch` (cross-origin, no cookie),
 *    carrying `Authorization: Bearer <token>`.
 *
 * Token model: fetch on demand, cache in memory per project slug, refetch ONLY on
 * a 401 from the worker (no background timer, no proactive pre-expiry refresh).
 */

export const WORKER_BASE =
  process.env.NEXT_PUBLIC_PLAYGROUND_WORKER_URL ?? "http://localhost:8787";

/**
 * Per-call context. The academy token is fetched and cached by `slug` (the route
 * param), but each worker request body must carry the auth user id, the project's
 * DB id (NOT the slug — it must match the token's `pid` claim) and the project name.
 */
export interface PgCtx {
  slug: string; // academy route param — used to fetch/cache the token
  userId: string; // === token `sub`
  projectId: string; // project DB id === token `pid` (worker body field)
  projectName: string;
}

// Small skew margin so we never send a token we already know is on the edge of expiry.
const EXPIRY_SKEW_MS = 5000;

// Module-level token cache keyed by slug.
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

/**
 * Fetch (or return cached) a worker JWT for this slug.
 * `force: true` bypasses the cache (used by the 401 retry path).
 */
export async function getWorkerToken(
  slug: string,
  opts?: { force?: boolean },
): Promise<string> {
  if (!opts?.force) {
    const cached = tokenCache.get(slug);
    if (cached && Date.now() < cached.expiresAt - EXPIRY_SKEW_MS) {
      return cached.token;
    }
  }

  // Academy wraps responses in { success, data }; the token payload is in data.data.
  const { data } = await api.get(`/projects/${slug}/playground-token`);
  const payload = data?.data ?? {};
  const token: string = payload.token;
  if (!token) throw new Error("playground token endpoint returned no token");
  const expiresAt = Date.parse(payload.expiresAt);

  tokenCache.set(slug, { token, expiresAt });
  return token;
}

/**
 * Clear the in-memory token cache. Call on logout / project switch.
 */
export function clearWorkerTokens(): void {
  tokenCache.clear();
}

/**
 * The single place that performs a worker fetch. Handles the 401 refetch+retry.
 */
async function request(
  ctx: PgCtx,
  path: string,
  body: Record<string, unknown>,
): Promise<any> {
  const doFetch = (token: string) =>
    fetch(`${WORKER_BASE}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId: ctx.userId,
        projectId: ctx.projectId,
        projectName: ctx.projectName,
        ...body,
      }),
    });

  let token = await getWorkerToken(ctx.slug);
  let res = await doFetch(token);

  if (res.status === 401) {
    // Token expired/invalid: drop the cached one, fetch fresh, retry ONCE.
    token = await getWorkerToken(ctx.slug, { force: true });
    res = await doFetch(token);
    if (res.status === 401) {
      throw new Error(`worker ${path} unauthorized after token refresh`);
    }
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      json?.error || json?.message || `worker ${path} failed (${res.status})`,
    );
  }
  return json;
}

export function pgFs(
  ctx: PgCtx,
  args: {
    op: "write" | "read" | "delete" | "mkdir" | "list";
    path?: string;
    content?: string;
  },
): Promise<any> {
  return request(ctx, "/fs", args);
}

export function pgRun(
  ctx: PgCtx,
  args: { installCmd?: string; startCmd?: string } = {},
): Promise<any> {
  return request(ctx, "/run", args);
}

export function pgStop(ctx: PgCtx): Promise<any> {
  return request(ctx, "/stop", {});
}

/**
 * Restart the running server process in place (hot-reload after a save). Keeps
 * the exposed preview URL — only the process restarts. No-op if not running.
 */
export function pgReload(
  ctx: PgCtx,
  args: { installCmd?: string; startCmd?: string } = {},
): Promise<any> {
  return request(ctx, "/reload", args);
}

/**
 * True server status from the worker (process liveness), for the FE heartbeat.
 * Returns `{ ok, running, status, exitCode? }`. Cheap; safe to poll.
 */
export function pgStatus(ctx: PgCtx): Promise<{
  ok: boolean;
  running: boolean;
  status: string | null;
  exitCode?: number;
}> {
  return request(ctx, "/status", {});
}

/**
 * Seed the project's workdir so it opens with a runnable baseline.
 *
 * Idempotent on the worker: a non-empty workdir is left untouched. If
 * `baseRepository` is set the worker clones it; otherwise it scaffolds a
 * Node.js starter. The worker also cd's the terminal into the project folder.
 * Best-effort caller — never block the IDE on this.
 */
export function pgSeed(
  ctx: PgCtx,
  args: {
    baseRepository?: string;
    language?: string;
    frontendPreview?: boolean;
    previewDir?: string;
    showcaseSlug?: string;
    showcaseVersion?: number;
  } = {},
): Promise<any> {
  return request(ctx, "/seed", args);
}

/**
 * Download the project as an archive. The worker zips the workdir (excluding
 * node_modules/.git) inside the sandbox and returns it base64-encoded:
 * `{ filename, mime, base64 }`. The caller decodes it into a Blob to download.
 */
export function pgDownload(
  ctx: PgCtx,
): Promise<{ ok: boolean; filename: string; mime: string; base64: string }> {
  return request(ctx, "/download", {});
}

/**
 * Restart the project: DESTRUCTIVE. The worker wipes the workdir + git dir and
 * re-seeds the base template (clone `baseRepository`, else scaffold). The caller
 * then force-pushes the fresh base to the linked GitHub repo so it matches.
 */
export function pgRestart(
  ctx: PgCtx,
  args: {
    baseRepository?: string;
    language?: string;
    frontendPreview?: boolean;
    previewDir?: string;
    showcaseSlug?: string;
    showcaseVersion?: number;
  } = {},
): Promise<any> {
  return request(ctx, "/restart", args);
}

/**
 * Worker `/git` endpoint. The worker dispatches on `op`:
 *  - `hydrate`        — pull the remote into the workdir
 *  - `seedAndPush`    — seed base into the workdir AND push it to an empty repo
 *                       (rule 2, atomic); no-op if the remote already has content
 *  - `push`           — fast-forward push (optimistic-locked on `baseSha`)
 *  - `pushForce`      — overwrite the remote with the workdir
 *  - `resetToRemote`  — discard local changes, reset to the remote head
 *
 * `owner`/`repo`/`installationId` identify the GitHub repo + App installation.
 * `baseSha` (push) guards against clobbering concurrent remote changes;
 * `message` is the commit subject for push/pushForce. The `seedAndPush` fields
 * (baseRepository/language/frontendPreview/previewDir/showcase*) configure the
 * one-shot seed.
 */
/** One-shot seed config for the `seedAndPush` git op (rule 2). */
export type SeedAndPushArgs = {
  baseRepository?: string;
  language?: string;
  frontendPreview?: boolean;
  previewDir?: string;
  showcaseSlug?: string;
  showcaseVersion?: number;
};

export function pgGit(
  ctx: PgCtx,
  args: {
    op: "hydrate" | "seedAndPush" | "push" | "pushForce" | "resetToRemote";
    owner: string;
    repo: string;
    installationId: string | number;
    baseSha?: string | null; // push
    message?: string; // push / pushForce
  } & SeedAndPushArgs,
): Promise<any> {
  return request(ctx, "/git", args);
}

/**
 * Synchronous WebSocket URL builder for the terminal. The caller must fetch the
 * token first because a WebSocket handshake can't send Authorization headers, so
 * the token travels in the query string instead.
 */
export function pgTerminalUrl(
  token: string,
  ctx: PgCtx,
  args?: { cols?: number; rows?: number; jail?: boolean },
): string {
  const wsBase = WORKER_BASE.replace(/^http(s?):\/\//, (_m, s) =>
    s ? "wss://" : "ws://",
  );
  const params = new URLSearchParams({
    token,
    userId: ctx.userId,
    projectId: ctx.projectId,
    projectName: ctx.projectName,
    cols: String(args?.cols ?? 80),
    rows: String(args?.rows ?? 24),
  });
  // The worker defaults the terminal jail ON; we only signal the OFF case.
  // Omitting the param entirely lets the worker keep its safe default.
  if (args?.jail === false) params.set("jail", "false");
  return `${wsBase}/terminal?${params.toString()}`;
}

/**
 * Public URL for a project's published frontend-preview showcase bundle.
 * The worker serves the static bundle (published to R2 at submit/restart time)
 * under `/showcase/<slug>/__app/`.
 */
export function showcaseUrl(slug: string): string {
  return `${WORKER_BASE}/showcase/${slug}/__app/`;
}
