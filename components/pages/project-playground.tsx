"use client";

import type React from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  AlertTriangle,
  Play,
  Check,
  ListChecks,
  FolderClosed,
  Sparkles,
  Github,
} from "lucide-react";
import { getUser, Project, updateUser } from "@/lib/data";
import Editor, { OnChange } from "@monaco-editor/react";
import Image from "next/image";
import { PathFeedbackDialog } from "./path/path-feedback-dialog";
import { GithubConnect } from "./playground/github-connect";
import { Loader } from "@/components/ui/loader";
import { useAppStore } from "@/lib/store";
import { usePlaygroundControls } from "@/lib/playground-controls-store";
import { languages } from "@/lib/languages";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { toast } from "sonner";
import ConfettiCelebration from "../confetti-celebration";
import {
  pgFs,
  pgRun,
  pgStop,
  pgStatus,
  pgReload,
  pgSeed,
  pgDownload,
  pgRestart,
  pgExec,
  type PgCtx,
} from "@/lib/playground-client";
import {
  createPlaygroundSync,
  type PlaygroundSync,
  type SyncState,
} from "@/lib/playground-sync";
import { cn, getLanguageFromFileName, terminalSample } from "@/lib/utils";
import { useTheme } from "next-themes";
import { ContextMenu } from "./../ContextMenu";
import { Input } from "../ui/input";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useUser } from "@/hooks/use-user";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { PaymentDialog } from "../payment-dialog";
import { Terminal, type TerminalRunHandle } from "../atoms/Terminal";
import { KapTutorPanel } from "@/components/pages/kap/kap-tutor-panel";
import { usePathname, useSearchParams } from "next/navigation";
import { fetchUser } from "@/lib/auth";
import { openPopupOrWarn, withReturn } from "@/lib/github-popup";
import { Label } from "../ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import { analytics } from "@/lib/analytics";
import { PLAYGROUND_EVENTS, TOUR_EVENTS } from "@/lib/analytics-events";
import { makeEditDebouncer } from "@/lib/playground-track";
import { usePlaygroundTour } from "@/hooks/use-playground-tour";
import type { TourAction } from "@/lib/playground-tour";
import { getPlaygroundMode, isDemoMode } from "@/lib/playground-mode";
import { createDemoPgCtx } from "@/lib/playground-demo-executor";
import { DEMO_TASKS, DEMO_FRONTEND_HTML } from "@/lib/playground-demo-script";

interface ProjectPlaygroundPageProps {
  slug: string;
  onNavigate: Function;
  /** When true, hide the playground's own top bar — the host (path workspace) owns it. */
  embedded?: boolean;
  /** Called after a task is marked complete (used by the path step to advance). */
  onComplete?: () => void;
}

interface FileNode {
  name: string;
  type: "file" | "folder";
  icon: string;
  folder?: string;
  path: string;
  children?: FileNode[];
  content?: string;
  isOpen?: boolean;
  language?: string;
  isBlocked?: boolean;
}

// The executor's file tree returns paths like `/<projectName>/src/app.js`, but
// its file/folder handlers resolve against BASE_DIR/<userId> and reject an
// absolute leading "/". Convert tree paths to project-relative before emitting.
const toRel = (p?: string) => (p || "").replace(/^\/+/, "");

// Safely wrap a string for interpolation into a POSIX shell command as a
// single-quoted token — mirrors academy's `probe-terminal.ts` helper so an
// entrypoint containing a single quote (or any other shell metacharacter)
// can't break the `node '<entrypoint>'` / `pkill -f '<entrypoint>'` strings
// built for the terminal-mode Run flow.
const escapeSingleQuoted = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;

// ── worker `/fs list` shape (Cloudflare SDK `listFiles`) ──
// `pgFs(ctx,{op:"list"})` returns `{ ok, files }` where `files` is the SDK
// `ListFilesResult`: { success, path, files: FileInfo[], count, timestamp }.
// Each FileInfo is FLAT (relativePath, type:'file'|'directory', name); the worker
// lists a single directory level (NON-recursive), so nested folders come back as
// `directory` entries with no children until the worker exposes sub-path listing.
interface WorkerFileInfo {
  name: string;
  relativePath: string;
  type: "file" | "directory" | "symlink" | "other";
}
interface WorkerListResult {
  files?: WorkerFileInfo[];
}

// Adapt the SDK list shape into the nested FileNode[] the renderer expects.
// The renderer assumes `fileTree[0]` is a single root folder whose `children`
// are the project's entries (see lines using `fileTree[0]` / `depth === 0`), so
// we wrap everything under one synthetic root keyed off the project slug.
//
// `result` is the unwrapped SDK ListFilesResult (i.e. `r.files`, NOT `r`).
// We split each `relativePath` on "/" so the adapter also builds a real nested
// tree if the worker ever returns a recursive listing — today it's top-level only.
const toFileTree = (
  result: WorkerListResult | undefined | null,
  rootName: string,
): FileNode[] => {
  const root: FileNode = {
    name: rootName,
    type: "folder",
    icon: "",
    path: "",
    isOpen: true,
    children: [],
  };

  const entries = result?.files ?? [];
  for (const entry of entries) {
    const rel = (entry.relativePath || entry.name || "").replace(/^\/+/, "");
    if (!rel) continue;
    const segments = rel.split("/").filter(Boolean);
    let cursor = root;
    segments.forEach((seg, i) => {
      const isLeaf = i === segments.length - 1;
      const segPath = segments.slice(0, i + 1).join("/");
      const children = (cursor.children ??= []);
      let node = children.find((c) => c.name === seg);
      if (!node) {
        const isFolder = isLeaf ? entry.type === "directory" : true;
        node = {
          name: seg,
          type: isFolder ? "folder" : "file",
          icon: isFolder ? "" : "📄",
          path: segPath,
          ...(isFolder
            ? { isOpen: false, children: [] }
            : { language: getLanguageFromFileName(seg) }),
        };
        children.push(node);
      }
      cursor = node;
    });
  }

  // Folders first, then files; each group alphabetical — stable, predictable tree.
  const sortTree = (nodes: FileNode[]): FileNode[] => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const n of nodes) if (n.children) sortTree(n.children);
    return nodes;
  };
  sortTree(root.children!);

  return [root];
};

// Relative time for the sync chip ("just now", "2 min ago"). Native Intl —
// no date-fns. `at` is an epoch ms; falsy → "just now".
const relTime = (at?: number): string => {
  if (!at) return "just now";
  const diffMs = Date.now() - at;
  const sec = Math.round(diffMs / 1000);
  if (sec < 10) return "just now";
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (sec < 60) return rtf.format(-sec, "second");
  const min = Math.round(sec / 60);
  if (min < 60) return rtf.format(-min, "minute");
  const hr = Math.round(min / 60);
  return rtf.format(-hr, "hour");
};

// Render a task description. Rich-editor (Quill) tasks arrive as HTML — sanitize
// and render it as markup. Legacy plain-text tasks fall back to turning
// `backtick` spans into <code>, with newlines preserved via white-space:pre-wrap.
const fmtInstr = (raw?: string) => {
  const s = (raw || "").trim();
  if (!s) return "No description yet.";
  if (/<\/?[a-z][\s\S]*>/i.test(s)) {
    return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(s) }} />;
  }
  return s
    .split("`")
    .map((seg, i) =>
      i % 2 === 1 ? <code key={i}>{seg}</code> : <span key={i}>{seg}</span>,
    );
};

export function ProjectPlaygroundPage({
  slug,
  onNavigate,
  embedded = false,
  onComplete,
}: ProjectPlaygroundPageProps) {
  const lastAutoCommit = useRef(0);
  const idleTimer = useRef(null);
  // Latest run/preview handlers — published to the path top bar when embedded.
  const runServerRef = useRef<() => void>(() => {});
  const stopServerRef = useRef<() => void>(() => {});
  const togglePreviewRef = useRef<() => void>(() => {});
  const setPgControls = usePlaygroundControls((s) => s.setControls);
  const store = useAppStore();
  const user = useUser();
  const mobile = useIsMobile();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [project, setProject] = useState<Project>();
  const [activeFile, setActiveFile] = useState("");
  const [showProgress, setShowProgress] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<any[]>([]);
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [fontSize, setFontSize] = useState(14);
  // Editor-only theme (independent of the app theme), toggled from the ⋮ menu.
  const [editorTheme, setEditorTheme] = useState<"mb-dark" | "mb-light">(
    "mb-dark",
  );
  const [progressText, setProgressText] = useState("");
  const [previewUrl, setPreviewUrl] = useState(
    process.env.NEXT_PUBLIC_EXECUTOR_URL ?? "http://localhost:3000",
  );
  // Bumped by the preview Refresh button; appended to the iframe URL to force a
  // real reload (the iframe src is derived from baseURL, not previewUrl).
  const [previewNonce, setPreviewNonce] = useState(0);
  const playgroundMode = getPlaygroundMode(project ?? {});
  const isTerminalMode = playgroundMode === "terminal";
  const frontendEnabled =
    !isTerminalMode && !!(project as any)?.playgroundConfig?.frontendPreview;
  const [previewMode, setPreviewMode] = useState<"app" | "api">("api");
  useEffect(() => {
    if (frontendEnabled) setPreviewMode("app");
  }, [frontendEnabled]);
  const [showTerminal, setShowTerminal] = useState(false); // collapsed to header by default
  useEffect(() => {
    if (isTerminalMode) setShowTerminal(true);
  }, [isTerminalMode]);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [markAsCompleted, setMarkAsCompleted] = useState(false);
  const [activeTask, setActiveTask] = useState<any>();
  const [testRun, setTestRun] = useState<{
    status: "idle" | "running" | "pass" | "fail";
    checks: { label: string; ok: boolean }[];
  }>({ status: "idle", checks: [] });
  // Terminal-mode task drawer: the learner's editable copy of the required
  // stdin inputs, pre-filled from activeTask.terminalSpec.stdin. Reset
  // whenever a different task's drawer opens (see openTaskDrawer).
  const [testStdin, setTestStdin] = useState<string[]>([]);
  const [celebration, setCelebration] = useState(false);
  const [showTask, setShowTask] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [deleteFile, setDeleteFile] = useState<FileNode | null>();
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(false);
  // Mobile (≤900px): one full-width pane at a time, switched by the bottom bar.
  const [mobilePane, setMobilePane] = useState<"rail" | "editor" | "right">(
    "editor",
  );
  const [railTab, setRailTab] = useState<"tasks" | "explorer" | "kap">("tasks");
  const [rightTab, setRightTab] = useState<"preview" | "tests">("preview");
  useEffect(() => {
    if (isTerminalMode) setRightTab("tests");
  }, [isTerminalMode]);
  const [code, setCode] = useState(fileTree?.[0]?.children?.[0]?.content || "");
  const [currentLanguage, setCurrentLanguage] = useState("javascript");
  const [showPayment, setShowPayment] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  // In-flight guards so a double-click / two-tab can't fire overlapping
  // run/stop requests (which race the sandbox into an indeterminate state).
  const runInFlightRef = useRef(false);
  const stopInFlightRef = useRef(false);
  const [connected, setConnected] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [restart, setRestart] = useState(false);
  // Welcome/start page: technology tags collapse past the first 8.
  const [tagsExpanded, setTagsExpanded] = useState(false);
  // Apply playgroundConfig.showPreviewOnLoad exactly once, when the project loads.
  const previewDefaultApplied = useRef(false);
  // Auto-open the first file once when the learner has already started — so a
  // returning learner lands straight in the editor (no start page at all).
  const autoOpenedRef = useRef(false);
  const [fileMenu, setFileMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
  });
  const [editorContextMenu, setEditorContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
  });
  const [progressValue, setProgressValue] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [baseURL, setBaseURL] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const editorRef = useRef<any>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const editorMenuRef = useRef<HTMLDivElement>(null);
  // ── refs for the mock's flex-basis drag resizers (rail / right / terminal) ──
  const railRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const terminalRunRef = useRef<TerminalRunHandle | null>(null);
  const lastTermH = useRef("150px"); // remembers expanded height across collapse
  // Per-path debounce timers for autosave. MUST be a ref: a plain `{}` in the
  // component body is recreated every render, so clearTimeout never finds the
  // previous timer → the debounce never coalesces → a write per keystroke
  // (write storm + out-of-order writes → content loss).
  const fileBufferRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  // Debounces hot-reload (/reload) after edits while the server is running.
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Live mirror of `baseURL` so timer callbacks read the current value (not a
  // stale closure) when deciding whether to hot-reload.
  const baseURLRef = useRef("");
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    target: null as FileNode | null,
  });
  const [creatingItem, setCreatingItem] = useState<{
    parentPath?: string;
    exists?: boolean;
    type?: "file" | "folder";
  } | null>(null);
  const [renamingItem, setRenamingItem] = useState<{
    parentPath?: string;
    name?: string;
    exists?: boolean;
    type?: "file" | "folder";
  } | null>(null);

  const AUTO_COMMIT_INTERVAL = 1 * 60 * 1000; // 2 minutes

  // Demo mode detection for interactive playground demo
  const searchParamsObj =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const isDemo = isDemoMode(slug, searchParamsObj);

  // Per-call worker context — built once project + user are known. Every worker
  // call is guarded by `if (!pgCtx) return;`. `projectName = project.slug` (it's
  // worker-safe `[A-Za-z0-9_-]{1,64}` and becomes the sandbox workdir name).
  // In demo mode, use the mock executor instead of the real one.
  const pgCtx: PgCtx | null = useMemo(() => {
    if (isDemo) {
      return createDemoPgCtx();
    }
    if (!project?.id || !user?.id) return null;
    return {
      slug: project.slug,
      userId: user.id,
      projectId: project.id,
      projectName: project.slug,
    };
  }, [project?.id, project?.slug, user?.id, isDemo]);

  // ── GitHub autosync wiring ──────────────────────────────────────────────
  // GitHub is the source of truth ONLY when the project has a linked repo AND
  // the user installed the App. Until then the sandbox is ephemeral (unchanged
  // pre-existing behaviour) — no engine, no autosave, no indicator.
  const repoFullName: string | undefined =
    project?.userProject?.githubRepoFullName ?? undefined;
  const installationId = user?.githubInstallationId ?? undefined;
  const ghConnected = !!repoFullName && !!installationId;
  const [owner, repo] = repoFullName
    ? repoFullName.split("/")
    : [undefined, undefined];
  // Surfaced by GithubConnect only when there's an actionable problem. Drives the
  // error-only banner — there is no persistent "connect GitHub" nudge.
  const [ghError, setGhError] = useState<{
    message: string;
    retry: () => void;
    actionLabel?: string;
  } | null>(null);
  // Persistent "App not installed at all" banner — full-width strip between
  // the top nav and the workspace, red per the hard-block philosophy (Run is
  // blocked while this shows). Reported up from GithubConnect; see its
  // `onNotInstalled` prop.
  const [ghNotInstalled, setGhNotInstalled] = useState<{
    connect: () => void;
  } | null>(null);
  // Hard-gate modal for Run when GitHub isn't connected (fresh check at click
  // time — see `handleRunProject`). No bypass.
  const [showGithubRequiredModal, setShowGithubRequiredModal] = useState(false);

  // The sync engine instance (rebuilt when the connection identity changes).
  const syncRef = useRef<PlaygroundSync | null>(null);
  // Latest `refreshTree` (defined below, after the early returns) — the engine's
  // onReloaded callback reaches it via this ref so the effect can live up here
  // with the other hooks without a TDZ / stale-closure hazard.
  const refreshTreeRef = useRef<() => Promise<void> | void>(() => {});
  // `lastSha` mirrored into a ref so the engine reads the latest value without
  // being torn down/rebuilt on every commit.
  const [lastSha, setLastSha] = useState<string | null>(
    project?.userProject?.lastSyncedSha ?? null,
  );
  const lastShaRef = useRef<string | null>(lastSha);
  useEffect(() => {
    lastShaRef.current = lastSha;
  }, [lastSha]);
  // Keep the seed from the freshly-loaded project in sync (e.g. after a refetch).
  useEffect(() => {
    const seeded = project?.userProject?.lastSyncedSha ?? null;
    setLastSha(seeded);
    lastShaRef.current = seeded;
  }, [project?.userProject?.lastSyncedSha]);

  const [syncStatus, setSyncStatus] = useState<{
    state: SyncState;
    at?: number;
  } | null>(null);
  const [conflict, setConflict] = useState<{
    open: boolean;
    remoteSha?: string;
  }>({ open: false });
  // Resolving-in-progress guard so the conflict dialog buttons can't double-fire.
  const [resolvingConflict, setResolvingConflict] = useState(false);

  const track = useCallback(
    (event: string, extra?: Record<string, any>) =>
      analytics.track(event, {
        project_slug: slug,
        project_title: project?.title,
        is_sample: !!project?.isSample,
        ...extra,
      }),
    [slug, project?.title, project?.isSample],
  );
  const trackEdit = useMemo(
    () => makeEditDebouncer((e) => track(PLAYGROUND_EVENTS.fileEdited, e)),
    [track],
  );

  // ── Guided tour ──
  // Auto-starts once on first visit via ?tour=offer; the top-bar "Take a tour"
  // button re-launches it anytime. Readiness = "all loaders done" so the tour
  // only appears once the playground (and its data-tour anchors) is rendered —
  // never over the "Loading your project…" screen. It does NOT wait on baseURL
  // (sandbox boot), since the welcome/file/editor steps don't need a server.
  const tourReady = !loading && !loadingFiles && (!!project?.id || isDemo);
  const tourTheme = editorTheme === "mb-light" ? "light" : "dark";

  // The real demo actions (create file, run server, …) need handlers defined
  // lower in this component, so they're wired into tourActionsRef below. The
  // tour reads them through this stable delegating map. Populated only for demo
  // mode (isDemo) — the demo never mutates a real user's project.
  const tourActionsRef = useRef<Record<string, TourAction>>({});
  const tourActions = useMemo<Record<string, TourAction>>(() => {
    if (isDemo) {
      // Demo mode: actions trigger state changes + log emission
      return {
        "file-tree": () => {
          tourRevealsRef.current["file-tree"]?.();
          tourActionsRef.current["file-tree"]?.();
        },
        "run-server": async () => {
          tourActionsRef.current["run-server"]?.();
          // Emit "run-server" logs to terminal
          const { DEMO_TERMINAL_LOGS } =
            await import("@/lib/playground-demo-script");
          const logsForStep = DEMO_TERMINAL_LOGS.filter(
            (l) => l.step === "run-server",
          );
          for (const log of logsForStep) {
            await new Promise((r) => setTimeout(r, log.delay));
            terminalRunRef.current?.write(log.log);
          }
        },
        "run-test": async () => {
          // Open drawer, show logs, run test all at once (no delays)
          tourRevealsRef.current["run-test"]?.();

          // Show test logs immediately without delays
          const { DEMO_TERMINAL_LOGS } =
            await import("@/lib/playground-demo-script");
          const logsForStep = DEMO_TERMINAL_LOGS.filter(
            (l) => l.step === "run-test",
          );
          for (const log of logsForStep) {
            terminalRunRef.current?.write(log.log);
          }

          // Show test passed immediately
          tourActionsRef.current["run-test"]?.();
        },
        "github-sync": () => {
          // Show syncing status immediately
          setSyncStatus({ state: "syncing", at: Date.now() });
          // Then show synced after a quick moment
          setTimeout(() => {
            setSyncStatus({ state: "synced", at: Date.now() });
          }, 100);
        },
        kap: () => {
          // Open Kap tutor panel (demo messages shown automatically)
          tourRevealsRef.current.kap?.();
        },
      };
    }

    // Non-demo path (keep existing code)
    const ids = ["file-tree", "run-server", "run-test", "github-sync", "kap"];
    const map: Record<string, TourAction> = {};
    for (const id of ids) map[id] = () => tourActionsRef.current[id]?.();
    return map;
  }, [isDemo]);
  // Reveals open each step's panel/tab/drawer BEFORE it is highlighted, so every
  // step shows on its real target even when that panel isn't open by default.
  // Always provided (opening a panel is safe on any project); only the real
  // mutating ACTIONS are gated to the sample.
  const tourRevealsRef = useRef<Record<string, () => void>>({});
  const tourReveals = useMemo<Record<string, () => void>>(() => {
    const ids = ["file-tree", "kap", "terminal", "run-test", "preview"];
    const map: Record<string, () => void> = {};
    for (const id of ids) map[id] = () => tourRevealsRef.current[id]?.();
    return map;
  }, []);
  const { shouldOffer, relaunch } = usePlaygroundTour({
    ready: tourReady,
    theme: tourTheme,
    track,
    autoStart: true,
    actions: tourActions,
    reveals: tourReveals,
    alwaysOffer: isDemo,
  });
  useEffect(() => {
    if (shouldOffer) track(TOUR_EVENTS.offered);
  }, [shouldOffer, track]);

  const findFile = (nodes: FileNode[], filePath: string): FileNode | null => {
    for (const node of nodes) {
      if (node.path === filePath && node.type === "file") {
        return node;
      }
      if (node.children) {
        const found = findFile(node.children, filePath);
        if (found) return found;
      }
    }
    return null;
  };

  // Load the project. Keyed on `slug` ONLY. Connecting GitHub mid-session flips
  // user.github / user.githubInstallationId — if those were deps here, this effect
  // would re-run, setLoading(true), and tear down the whole playground (editor +
  // sandbox), which reads as a jarring full-page refresh. handleGhConnected already
  // refetches the project (without setLoading) so connected state still updates.
  // For demo mode, use a fake project object instead of database lookup.
  useEffect(() => {
    // setLoading(true);
    async function findProject(slug: string) {
      try {
        let project;
        if (isDemo) {
          // Mock project for demo mode
          project = {
            id: "demo-project-id",
            slug: "playground-demo",
            title: "Playground Demo",
            summary: "Build a real backend, right here — in 60 seconds.",
            description:
              "A guided, interactive demo of the Mastering Backend playground. Create a file, run a test, and preview a live Hello API — all in your browser. No setup, no install — just the real playground.",
            level: "Beginner",
            skills: ["http", "api", "nodejs"],
            technologies: ["Node.js"],
            prerequisites: [],
            industries: ["Web"],
            duration: 1,
            isPremium: false,
            isSample: true,
            isWaiting: false,
            enrolled: true,
            userProject: { enrolled: true },
            playgroundConfig: {
              frontendPreview: true,
              previewDir: "public",
            },
            projectTasks: [
              {
                id: "demo-task-group-1",
                title: "Getting Started",
                tasks: DEMO_TASKS.slice(0, 3).map((t: any) => ({
                  id: t.id,
                  title: t.title,
                  description: t.description,
                  required: t.required,
                  mb: t.mb,
                  apiSpec: t.apiSpec,
                  userTask: { isCompleted: false },
                })),
              },
              {
                id: "demo-task-group-2",
                title: "Advanced",
                tasks: DEMO_TASKS.slice(3).map((t: any) => ({
                  id: t.id,
                  title: t.title,
                  description: t.description,
                  required: t.required,
                  mb: t.mb,
                  apiSpec: t.apiSpec,
                  userTask: { isCompleted: false },
                })),
              },
            ],
          } as any;
        } else {
          project = await store.getProject(slug);
        }
        setProject(project);
        const source =
          new URLSearchParams(window.location.search).get("tour") === "offer"
            ? "try_playground"
            : "direct";
        analytics.track(PLAYGROUND_EVENTS.opened, {
          project_slug: slug,
          project_title: project?.title,
          is_sample: !!project?.isSample,
          source,
        });
      } catch (err) {
        // API error or timeout — log and keep loading state to show error UI
        console.error("Failed to load project:", err);
      } finally {
        setLoading(false);
      }
    }
    findProject(slug);
  }, [slug, isDemo]);

  // Track GitHub-connected state separately — a cheap flag update with no loading
  // churn, so it can react to user changes without remounting the page.
  useEffect(() => {
    setConnected(!!user?.githubInstallationId || !!user?.github);
  }, [user?.github, user?.githubInstallationId]);

  // Embedded in a path step → publish Run/Preview state + handlers so the path
  // top bar can render them (this component's own header is hidden).
  useEffect(() => {
    if (!embedded) return;
    setPgControls({
      active: true,
      connected,
      isRunning,
      isStopping,
      sandboxLive: !!baseURL,
      previewVisible: isRightPanelVisible,
      runServer: () => runServerRef.current?.(),
      stopServer: () => stopServerRef.current?.(),
      togglePreview: () => togglePreviewRef.current?.(),
    });
  }, [
    embedded,
    connected,
    isRunning,
    isStopping,
    baseURL,
    isRightPanelVisible,
    setPgControls,
  ]);

  useEffect(() => {
    return () => {
      if (embedded) usePlaygroundControls.getState().reset();
    };
  }, [embedded]);

  useEffect(() => {
    const load = async () => {
      const { data } = await fetchUser();
      setConnected(!!data.githubInstallationId || !!data.github);
      updateUser(data);
    };

    const searchTerm = searchParams?.get("ref");
    if (searchTerm?.includes("githubapp")) load();
  }, []);

  // Closes this window automatically when it's the GitHub-connect popup
  // landing back on our own return URL (window.opener is only set when this
  // page was opened via window.open, e.g. by lib/github-popup.ts).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isGithubReturn =
      new URLSearchParams(window.location.search).get("ref") === "githubapp";
    if (isGithubReturn && window.opener) {
      window.close();
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (treeRef.current && !treeRef.current.contains(event.target as Node)) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }

      if (
        fileMenuRef.current &&
        !fileMenuRef.current.contains(event.target as Node)
      ) {
        setFileMenu((prev) => ({ ...prev, visible: false }));
      }

      if (
        editorMenuRef.current &&
        !editorMenuRef.current.contains(event.target as Node)
      ) {
        setEditorContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Single definition of the autosync engine factory, shared by the engine
  // effect (mount / repo-identity change) and `handleGhConnected` (connect
  // mid-session). `pgCtx` and the various setters/refs are read from closure;
  // the caller supplies the repo identity so the connect handler can build the
  // engine inline before the project refetch propagates into the effect.
  const buildSyncEngine = useCallback(
    (o: string, r: string, instId: string | number): PlaygroundSync => {
      if (!pgCtx)
        throw new Error("buildSyncEngine called without a worker ctx");
      return createPlaygroundSync({
        ctx: pgCtx,
        owner: o,
        repo: r,
        installationId: instId,
        getLastSha: () => lastShaRef.current,
        setLastSha: (s) => {
          lastShaRef.current = s;
          setLastSha(s);
        },
        onStatus: (state, at) => setSyncStatus({ state, at }),
        onConflict: (remoteSha) => {
          track(PLAYGROUND_EVENTS.githubConflict);
          setConflict({ open: true, remoteSha });
        },
        onReconnectRequired: () => {
          setGhError({
            message: "Your GitHub connection expired. Reconnect to continue.",
            actionLabel: "Reconnect",
            retry: async () => {
              // Skip for demo mode (no real GitHub)
              if (isDemo) return;
              // Re-fetch project-scoped GitHub status — it computes the same
              // reconnect_required state get-project-github.ts already exposes,
              // which carries the OAuth-authorize installUrl to pop open.
              try {
                // Tell academy the installation actually died (this detection
                // came from the worker's mid-session sync, bypassing academy's
                // normal proxy) — otherwise the status re-fetch below can
                // still return a dead-end "install" URL instead of the
                // correct self-healing "reconnect" URL. Best-effort: a
                // failure here shouldn't block the reconnect UI.
                await store.markGithubInstallationInvalid(slug).catch(() => {});
                const s = await store.getProjectGithub(slug);
                if (s?.installUrl) {
                  openPopupOrWarn(withReturn(s.installUrl), () => {
                    setGhError(null);
                  });
                }
              } catch {
                toast.error("Couldn't start reconnect. Please try again.");
              }
            },
          });
        },
        onReloaded: () => {
          void refreshTreeRef.current?.();
        },
      });
    },
    [pgCtx, slug, store],
  );

  // Build (and tear down) the GitHub autosync engine when the project is linked
  // to a repo and the user has the App installed. Rebuilt only when the repo
  // identity changes — the engine reads the latest sha through `lastShaRef`, so
  // a per-commit sha update never re-creates it.
  //
  // IMPORTANT: this effect MUST be declared ABOVE the seed-on-open effect so it
  // runs first within a commit (React flushes sibling effects in declaration
  // order). That guarantees `syncRef.current` is populated before the seed
  // effect's first `await`, so a connected user's repo is hydrated on first
  // open instead of silently falling back to the ephemeral seed path.
  useEffect(() => {
    if (!pgCtx || !ghConnected || !owner || !repo || !installationId) {
      syncRef.current?.dispose();
      syncRef.current = null;
      return;
    }
    // Dispose any engine built ahead of this effect (e.g. inline by
    // handleGhConnected) so we never double-build / leak before reassigning.
    syncRef.current?.dispose();
    const engine = buildSyncEngine(owner, repo, installationId);
    syncRef.current = engine;
    return () => {
      engine.dispose();
      if (syncRef.current === engine) syncRef.current = null;
    };
  }, [pgCtx, ghConnected, owner, repo, installationId, buildSyncEngine]);

  // Initial tree load + best-effort seed (replaces the socket folder:read +
  // project:start/clone flow). Runs once the worker ctx is ready.
  // Skip for demo mode (uses separate demo file tree loading effect).
  useEffect(() => {
    if (!pgCtx || isDemo) return;
    let cancelled = false;

    // The first worker call on a cold sandbox can transiently fail while the
    // container boots. Retry the listing a few times with backoff so a boot blip
    // never surfaces as "Failed to load project files".
    const listWithRetry = async () => {
      let lastErr: unknown;
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          return await pgFs(pgCtx, { op: "list" });
        } catch (e) {
          lastErr = e;
          await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
        }
      }
      throw lastErr;
    };

    const loadTree = async () => {
      setLoadingFiles(true);
      try {
        // CONNECTED → GitHub is the source of truth: hydrate the repo into the
        // sandbox. If the repo is empty (first connect), seed the starter then
        // push it as the initial commit so the repo isn't left blank. A hydrate
        // failure falls back to the ephemeral seed path (best-effort) so the IDE
        // still opens with something runnable.
        // The engine effect above is declared first, so it flushes earlier in
        // the same commit and `syncRef.current` is populated before this first
        // `await`. We still guard on it and fall back if it isn't ready.
        if (ghConnected && syncRef.current) {
          try {
            const r = await syncRef.current.hydrate();
            if (cancelled) return;
            if (r?.empty) {
              // Empty repo (first connect): seed the base AND push it to the
              // user's repo in ONE atomic worker call (rule 2). A single request
              // either initialises the repo or no-ops — it can't leave the repo
              // empty the way a separate seed-then-push could if the push was
              // missed (tab closed, network drop).
              await syncRef.current.seedAndPush({
                baseRepository: project?.baseRepository,
                language: project?.languages?.[0],
                frontendPreview: !!(project as any)?.playgroundConfig
                  ?.frontendPreview,
                previewDir: (project as any)?.playgroundConfig?.previewDir,
                showcaseSlug: slug,
                showcaseVersion: project?.updatedAt
                  ? Math.floor(new Date(project.updatedAt).getTime() / 1000)
                  : undefined,
              });
              if (cancelled) return;
            } else if (!!(project as any)?.playgroundConfig?.frontendPreview) {
              // Non-empty connected repo: the learner's repo carries no preview
              // folder, so the predefined frontend (<workdir>.frontend) is missing
              // and /__app/ would 404. Seed is idempotent for a populated workspace
              // — it leaves the backend untouched and only rebuilds .frontend from
              // the base repo's previewDir. Best-effort; must not block the IDE.
              try {
                await pgSeed(pgCtx, {
                  baseRepository: project?.baseRepository,
                  language: project?.languages?.[0],
                  frontendPreview: true,
                  previewDir: (project as any)?.playgroundConfig?.previewDir,
                  showcaseSlug: slug,
                  showcaseVersion: project?.updatedAt
                    ? Math.floor(new Date(project.updatedAt).getTime() / 1000)
                    : undefined,
                });
              } catch {
                /* frontend-preview rebuild failed — IDE still opens normally */
              }
              if (cancelled) return;
            }
            const list = await listWithRetry();
            if (cancelled) return;
            setFileTree(toFileTree(list?.files, project?.title || slug));
            return;
          } catch {
            // Hydrate FAILED for a connected project. Do NOT seed the base
            // template (that would overwrite the learner's repo on the next
            // autosave) and BLOCK autosave entirely — pushing from an
            // un-hydrated sandbox could clobber their GitHub repo. Show what's
            // already in the sandbox; the engine rebuilds + retries on reopen.
            if (!cancelled) {
              toast.error(
                "Couldn't sync from GitHub. Reopen to retry — your work on GitHub is safe.",
              );
              try {
                syncRef.current?.dispose();
              } catch {
                /* ignore */
              }
              syncRef.current = null;
              try {
                const list = await listWithRetry();
                if (!cancelled)
                  setFileTree(toFileTree(list?.files, project?.title || slug));
              } catch {
                /* leave tree as-is */
              }
            }
            return; // never fall through to seed-base for a connected project
          }
        }

        // NOT CONNECTED — ephemeral path:
        // Best-effort seed: ask the worker for a runnable baseline. The worker is
        // idempotent (skips a non-empty workdir), clones `baseRepository` when set,
        // else scaffolds a Node.js starter. Strictly best-effort — must NOT block
        // the IDE — so it's wrapped in its own try/catch.
        try {
          await pgSeed(pgCtx, {
            baseRepository: project?.baseRepository,
            language: project?.languages?.[0],
            frontendPreview: !!(project as any)?.playgroundConfig
              ?.frontendPreview,
            previewDir: (project as any)?.playgroundConfig?.previewDir,
            showcaseSlug: slug,
            showcaseVersion: project?.updatedAt
              ? Math.floor(new Date(project.updatedAt).getTime() / 1000)
              : undefined,
          });
        } catch {
          // Seed unavailable — start with an empty tree, learner codes.
        }

        // Re-list so the freshly-seeded files show in the tree.
        const r = await listWithRetry();
        if (cancelled) return;
        // Do NOT auto-open a file — land on the welcome/get-started card (matches
        // the design). The user opens a file from Files or starts a task.
        setFileTree(toFileTree(r?.files, project?.title || slug));
      } catch {
        if (!cancelled) toast.error("Failed to load project files");
      } finally {
        if (!cancelled) setLoadingFiles(false);
      }
    };

    loadTree();
    return () => {
      cancelled = true;
    };
    // NOTE: ghConnected is deliberately NOT a dep. Re-running this effect on a
    // mid-session connect flips `loadingFiles` → the full-screen <Loader> →
    // the whole playground unmounts/remounts (reads as a page reload). The
    // connect path is handled by `handleGhConnected` instead, which hydrates +
    // refreshes the tree in place without the loading teardown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pgCtx,
    isDemo,
    project?.baseRepository,
    // Depend on the primitive, not the array reference. store.getProject()
    // returns a fresh `languages` array on every refetch (e.g. after GitHub
    // connect), and a new reference here would re-run this effect → flip
    // loadingFiles → tear the whole playground down into the loader, which
    // reads as a full page reload. The actual language value is what matters.
    project?.languages?.[0],
    project?.title,
    slug,
  ]);

  // Load demo file tree when in demo mode
  useEffect(() => {
    if (!isDemo || loading) return;

    import("@/lib/playground-demo-script").then(({ DEMO_STARTER_FILES }) => {
      const demoTree = toFileTree(
        {
          files: DEMO_STARTER_FILES.map((f) => ({
            name: f.name,
            relativePath: f.name,
            type: "file" as const,
          })),
        },
        slug,
      );
      setFileTree(demoTree);
      setLoadingFiles(false);
    });
  }, [isDemo, slug, loading]);

  // Best-effort final save when the tab/window closes (connected only — the
  // guard lives in the engine ref being null when not connected).
  useEffect(() => {
    const onBeforeUnload = () => {
      syncRef.current?.flushOnClose();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // When there's nothing to load (project resolved but not enrolled, or no
  // worker ctx), clear the file-loading state so the early-return reaches the
  // "Not enrolled" card instead of spinning forever.
  useEffect(() => {
    if (loading) return; // project still resolving
    if (!pgCtx) setLoadingFiles(false);
  }, [loading, pgCtx]);

  // Item 12: the preview pane's initial visibility is controlled per-project by
  // playgroundConfig.showPreviewOnLoad (default false). Applied once on first
  // project load so it never fights the user's later manual toggles.
  useEffect(() => {
    if (!project || previewDefaultApplied.current) return;
    previewDefaultApplied.current = true;
    setIsRightPanelVisible(
      !!(project as any)?.playgroundConfig?.showPreviewOnLoad,
    );
  }, [project]);

  // Item 10: a returning learner (started ≥1 task OR synced to GitHub) skips the
  // start page entirely — auto-open the first file so they land in the editor.
  // The `loading || loadingFiles` guard runs FIRST so this never touches
  // `openFile` on a render that early-returned before it's defined.
  useEffect(() => {
    if (loading || loadingFiles) return;
    if (autoOpenedRef.current || openFiles.length > 0) return;
    const startedNow =
      (project?.projectTasks?.flatMap((p: any) => p.tasks) ?? []).filter(
        (t: any) => t?.userTask?.isCompleted,
      ).length > 0 || lastSha != null;
    if (!startedNow) return;
    const first =
      fileTree[0]?.children?.find((f) => f.type === "file" && !f.isBlocked) ||
      fileTree.find((f) => f.type === "file");
    if (first) {
      autoOpenedRef.current = true;
      openFile(first);
      setRailTab("explorer");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, loadingFiles, fileTree, openFiles.length, project, lastSha]);

  useEffect(() => {
    const file = findFile(fileTree, activeFile);
    if (file) {
      setCurrentLanguage(file.language || getLanguageFromFileName(file.name));
    }
  }, [activeFile, fileTree]);

  // Drag-resize for rail / right pane / terminal (ported from the mock).
  // MUST stay above the early returns below — hooks run unconditionally.
  const startResize = useCallback(
    (kind: "rail" | "right" | "term") => (e: React.MouseEvent) => {
      e.preventDefault();
      const target =
        kind === "rail"
          ? railRef.current
          : kind === "right"
            ? rightRef.current
            : termRef.current;
      if (!target) return;
      const sx = e.clientX;
      const sy = e.clientY;
      const start = kind === "term" ? target.offsetHeight : target.offsetWidth;
      document.body.style.cursor =
        kind === "term" ? "row-resize" : "col-resize";
      document.body.style.userSelect = "none";

      const move = (ev: MouseEvent) => {
        if (kind === "term") {
          let h = start - (ev.clientY - sy);
          h = Math.max(40, Math.min(window.innerHeight - 160, h));
          target.style.flexBasis = h + "px";
        } else {
          let w = start + (ev.clientX - sx) * (kind === "right" ? -1 : 1);
          w = Math.max(160, Math.min(680, w));
          target.style.flexBasis = w + "px";
        }
      };
      const up = () => {
        document.removeEventListener("mousemove", move, true);
        document.removeEventListener("mouseup", up, true);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
      // capture phase — xterm stops propagation, so listen on capture
      document.addEventListener("mousemove", move, true);
      document.addEventListener("mouseup", up, true);
    },
    [],
  );

  // Heartbeat: while we believe the server is up, confirm with the worker so the
  // UI can't keep showing "live" after the sandbox slept (10-min idle) or the
  // process died. On a real stop, clear the URL and tell the learner to re-Run.
  // (Declared before the early returns below to satisfy rules-of-hooks.)
  useEffect(() => {
    if (!pgCtx || !baseURL) return;
    let cancelled = false;
    const id = setInterval(async () => {
      if (cancelled || runInFlightRef.current || stopInFlightRef.current)
        return;
      try {
        const s = await pgStatus(pgCtx);
        if (!cancelled && s?.ok && !s.running) {
          setBaseURL("");
          toast.message(
            "Server stopped (sandbox went idle). Click Run to restart.",
          );
        }
      } catch {
        /* transient worker hiccup — keep current state */
      }
    }, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pgCtx, baseURL]);

  if (loading || loadingFiles || (!isDemo && !project?.id)) {
    // Boot progress derived purely from existing values — no new logic/state.
    const bootSteps = [
      {
        key: "fetch",
        label: "Fetching project",
        active: loading,
        done: !loading,
      },
      {
        key: "boot",
        label: "Booting workspace",
        active: !loading && !pgCtx,
        done: !loading && !!pgCtx,
      },
      {
        key: "files",
        label: "Loading files",
        active: !loading && !!pgCtx && loadingFiles,
        done: false,
      },
    ];
    return (
      <Loader
        label={
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm font-medium text-foreground">
              {project?.title
                ? `Setting up ${project.title}`
                : "Setting up your workspace"}
            </p>
            <ul className="flex flex-col gap-1.5">
              {bootSteps.map((s) => (
                <li key={s.key} className="flex items-center gap-2 text-xs">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      s.done
                        ? "bg-primary"
                        : s.active
                          ? "bg-primary motion-safe:animate-pulse"
                          : "bg-muted-foreground/30"
                    }`}
                  />
                  <span
                    className={
                      s.active
                        ? "text-foreground"
                        : s.done
                          ? "text-muted-foreground"
                          : "text-muted-foreground/50"
                    }
                  >
                    {s.label}
                    {s.active ? "…" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        }
      />
    );
  }

  const tasks = project?.projectTasks?.flatMap((p: any) => p.tasks);

  // ── derived task metrics (mock parity: numbering, badges, points, spinner) ──
  const doneCount =
    tasks?.filter((t: any) => t?.userTask?.isCompleted).length ?? 0;
  const totalCount = tasks?.length ?? 0;
  const earnedPts =
    tasks
      ?.filter((t: any) => t?.userTask?.isCompleted)
      .reduce((s: number, t: any) => s + (t?.mb ?? 0), 0) ?? 0;
  const totalPts =
    tasks?.reduce((s: number, t: any) => s + (t?.mb ?? 0), 0) ?? 0;
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
  // The first not-yet-completed task is the "in progress" one (spinner ring).
  const currentTaskId = tasks?.find((t: any) => !t?.userTask?.isCompleted)?.id;

  // Item 10: "has the learner started this project?" — completed ≥1 task OR
  // pushed work to GitHub (lastSyncedSha). When true, the big start/welcome page
  // is skipped; the learner lands straight in the workspace.
  const hasStarted = doneCount > 0 || lastSha != null;
  // The big start page shows only before they've started AND with no file open.
  // Terminal-mode projects have no concept of "opening a file" — the terminal
  // IS the workspace, so this must never gate its mount for that mode (a
  // fresh terminal-mode learner's first "Run" click would silently no-op
  // against a null terminalRunRef otherwise).
  const onStartPage = !isTerminalMode && openFiles.length === 0 && !hasStarted;

  // Item 2: "Start building"/"Continue building" opens the first editable file AND
  // switches the left rail to the Files tab, so the learner lands in the editor
  // with the file tree visible.
  const startBuilding = () => {
    const firstFile =
      fileTree[0]?.children?.find((f) => f.type === "file" && !f.isBlocked) ||
      fileTree.find((f) => f.type === "file");
    if (firstFile) openFile(firstFile);
    setRailTab("explorer");
    // // Kick off the guided highlight tour. On a real project this is the entry
    // // point (no mutations — actions are sample-only); on the sample it simply
    // // re-runs the walkthrough.
    // relaunch();
  };
  // group-based numbering keyed by task id → "1.1", "2.3" …
  const taskNumber: Record<string, string> = {};
  project?.projectTasks?.forEach((g: any, gi: number) =>
    g.tasks.forEach((t: any, ti: number) => {
      taskNumber[t.id] = `${gi + 1}.${ti + 1}`;
    }),
  );
  const methClass = (m?: string) =>
    (
      ({
        GET: "m-get",
        POST: "m-post",
        PUT: "m-put",
        PATCH: "m-put",
        DELETE: "m-del",
      }) as Record<string, string>
    )[(m || "").toUpperCase()] || "m-post";

  // ====================================
  // Project (re)setup: best-effort hydrate the template into the sandbox, then
  // re-list the tree. Replaces the socket project:start/clone:progress/clone:done
  // flow. Hydrate is Phase 5 (no owner/repo on the project yet) → best-effort.
  const handleProjectSetup = async () => {
    if (!pgCtx) return;
    setShowProgress(true);
    setProgressText("Setting up your project");
    setProgressValue(40);
    try {
      // When linked to GitHub, hydrate from the repo via the sync engine so the
      // reset pulls the canonical remote. Otherwise proceed with whatever the
      // worker seeded into the sandbox (ephemeral path).
      if (ghConnected && syncRef.current) {
        try {
          await syncRef.current.hydrate();
        } catch {
          // Hydrate unavailable — proceed with whatever is in the sandbox.
        }
      }
      const r = await pgFs(pgCtx, { op: "list" });
      setFileTree(toFileTree(r?.files, project?.title || slug));
      setProgressText("Project ready");
      setProgressValue(100);
      setRestart(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to set up project");
      setProgressValue(100);
    }
  };

  const handleEnrollNow = async () => {
    try {
      if (!user?.isPremium && project?.isPremium && !project.enrolled) {
        setShowPayment(!showPayment);
        return;
      }

      handleProjectSetup();
    } catch (error: any) {
      const e = error?.response?.message ?? error?.message;
      toast.error(e ?? "An error occurred");
    }
  };
  // =====================================

  const toggleFolder = (targetPath: string) => {
    const updateTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.map((node) => {
        // If this is the target folder, toggle it

        if (node.name === targetPath && node.type === "folder") {
          return { ...node, isOpen: !node.isOpen };
        }

        // Otherwise, if it has children, recurse
        if (node.children) {
          return { ...node, children: updateTree(node.children) };
        }

        return node;
      });
    };

    // Use functional updater to avoid stale closure issues
    setFileTree((prev) => updateTree(prev));
  };

  // ── explorer toolbar actions (new file / new folder / refresh / collapse) ──
  const refreshTree = async () => {
    if (!pgCtx) return;
    try {
      const r = await pgFs(pgCtx, { op: "list" });
      setFileTree(toFileTree(r?.files, project?.title || slug));
    } catch (error: any) {
      toast.error(error?.message || "Failed to refresh files");
    }
  };
  // Keep the engine's onReloaded callback pointed at the latest refreshTree.
  refreshTreeRef.current = refreshTree;

  // Called by GithubConnect when the project becomes linked mid-session. Refetch
  // the project so `userProject.githubRepoFullName` is populated (which rebuilds
  // the engine via the sibling effect), then hydrate. If the new repo is empty,
  // push the current sandbox work so connecting preserves what they've done.
  const handleGhConnected = async (newRepoFullName: string) => {
    track(PLAYGROUND_EVENTS.githubConnected, { repo: newRepoFullName });
    try {
      const fresh = await store.getProject(slug);
      if (fresh) setProject(fresh);
      toast.success(`Connected ${newRepoFullName}`);

      // Build the engine inline (instead of waiting a microtask for the engine
      // effect to rebuild off the refetched project) so we hydrate
      // deterministically. The effect will re-run when the refetched project's
      // repo identity propagates; it disposes this engine first, so there's no
      // double-build / leak.
      const [newOwner, newRepo] = newRepoFullName.split("/");
      if (!pgCtx || !newOwner || !newRepo || !installationId) return;
      syncRef.current?.dispose();
      const engine = buildSyncEngine(newOwner, newRepo, installationId);
      syncRef.current = engine;
      try {
        const r = await engine.hydrate();
        if (r?.empty) {
          // New empty repo → push what the learner has already built.
          await engine.saveNow("manual");
        }
        await refreshTree();
      } catch {
        toast.error("Connected, but couldn't sync from GitHub yet.");
      }
    } catch {
      toast.error("Couldn't finish connecting GitHub. Try again.");
    }
  };

  const collapseAll = () => {
    const walk = (nodes: FileNode[]): FileNode[] =>
      nodes.map((n) =>
        n.type === "folder"
          ? {
              ...n,
              isOpen: false,
              children: n.children ? walk(n.children) : n.children,
            }
          : n,
      );
    setFileTree((prev) => walk(prev));
  };

  const newRootItem = (type: "file" | "folder") => {
    const root = fileTree[0];
    if (!root) return;
    // The inline create-input renders on the node matching contextMenu.target,
    // so point both the target and the creatingItem parent at the tree root.
    setContextMenu({ visible: false, x: 0, y: 0, target: root });
    setCreatingItem({ parentPath: root.path, type });
  };

  // GitHub commit/persistence is Phase 5; the sandbox is the live store for now —
  // each keystroke is debounced-flushed to the sandbox via pgFs write, so there's
  // nothing extra to persist here. These remain as no-ops so existing idle/manual
  // save triggers keep working without a socket round-trip.
  const autoSaveAndCommit = () => {
    const now = Date.now();
    if (now - lastAutoCommit.current < AUTO_COMMIT_INTERVAL) return;
    lastAutoCommit.current = now;
    // No remote commit — files already live in the sandbox.
  };

  const manualSave = () => {
    clearTimeout(idleTimer?.current!); // cancel pending autosave
    lastAutoCommit.current = Date.now();
    // Files already persist to the sandbox on each debounced flush.
    toast.success("Saved");
  };

  const handleRightClick = (event: React.MouseEvent, node: FileNode) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      target: node,
    });
  };

  const addToTree = (nodes: FileNode[], item: FileNode): FileNode[] =>
    nodes.map((node) => {
      if (node.path === creatingItem?.parentPath) {
        if (creatingItem.type === "folder") item.children = [];

        return {
          ...node,
          children: [...(node.children || []), item],
        };
      }
      if (node.children) {
        return { ...node, children: addToTree(node.children, item) };
      }
      return node;
    });

  const addItem = async (name: string) => {
    // `parentPath` may legitimately be "" (the synthetic root), so guard on
    // undefined — not falsiness — and require a type + a non-empty name.
    if (creatingItem?.parentPath === undefined || !creatingItem.type || !name) {
      setCreatingItem(null);
      return;
    }
    track(PLAYGROUND_EVENTS.fileCreated, {
      kind: creatingItem.type,
      file_ext: name?.includes(".") ? name.split(".").pop() : "",
    });
    if (!pgCtx) {
      setCreatingItem(null);
      return;
    }

    const parentPath = creatingItem.parentPath ?? "";
    const isFolder = creatingItem.type === "folder";
    const language = getLanguageFromFileName(name);
    // `path` is relative to the synthetic root (root.path === ""). Strip the
    // leading slash for the worker, which resolves paths under the workdir.
    const fullPath = [parentPath, name].filter(Boolean).join("/");
    const rel = toRel(fullPath);

    const newItem: FileNode = {
      name,
      type: creatingItem.type,
      icon: isFolder ? "" : "📄",
      path: fullPath,
      ...(isFolder ? { isOpen: false, children: [] } : { language }),
    };

    // Optimistic insert so the tree updates instantly; re-list after the write
    // to reconcile with the sandbox (source of truth).
    setFileTree((prev) => addToTree(prev, newItem));
    setCreatingItem(null);

    try {
      if (isFolder) {
        await pgFs(pgCtx, { op: "mkdir", path: rel });
      } else {
        await pgFs(pgCtx, { op: "write", path: rel, content: "" });
        await openFile(newItem);
      }
      await refreshTree();
    } catch (error: any) {
      toast.error(error?.message || `Failed to create ${creatingItem.type}`);
      // Reconcile back to the real sandbox state.
      await refreshTree();
    }
  };

  const handleMenuAction = (action: string) => {
    if (!contextMenu.target) return;

    const node = contextMenu.target;
    switch (action) {
      case "Open":
        openFile(node);
        break;
      case "New File":
        setCreatingItem({ parentPath: node.path, type: "file" });
        break;
      case "New Folder":
        setCreatingItem({ parentPath: node.path, type: "folder" });
        break;
      case "Delete":
        setDeleteFile(node);
        break;
      case "Rename":
        setRenamingItem({ parentPath: node.path, ...node });
        break;
    }
  };

  const openFile = async (file: FileNode) => {
    track(PLAYGROUND_EVENTS.fileOpened, {
      file_ext: file.name.includes(".") ? file.name.split(".").pop() : "",
    });
    if (!pgCtx) return;
    const filePath = file.path;
    const fileName = file.name;
    // Optimistically focus the tab so the editor responds instantly.
    setActiveFile(filePath);
    setCurrentLanguage(file.language || getLanguageFromFileName(fileName));
    setOpenFiles((prev) =>
      prev.includes(filePath) ? prev : [...prev, filePath],
    );
    try {
      // Demo mode: load from DEMO_STARTER_FILES instead of pgFs
      if (isDemo) {
        const { DEMO_STARTER_FILES } =
          await import("@/lib/playground-demo-script");
        const demoFile = DEMO_STARTER_FILES.find(
          (f) => f.name === fileName || f.name === filePath,
        );
        setCode(demoFile?.content ?? "");
        return;
      }

      const r = await pgFs(pgCtx, { op: "read", path: toRel(filePath) });
      setCode(r?.content ?? "");
    } catch (error: any) {
      toast.error(error?.message || "Failed to open file");
    }
  };

  const getFileName = (fileName: string) => {
    if (!fileName) return;
    const names = fileName.split("/");
    return names[names.length - 1];
  };

  // Recursive search for a node by path
  const findNodeByPath = (
    nodes: FileNode[],
    path: string,
  ): FileNode | undefined => {
    for (const n of nodes) {
      if (n.folder! === path) return n;

      if (n.children) {
        const found = findNodeByPath(n.children, path);
        if (found) return found;
      }
    }
    return undefined;
  };

  const isFileExist = (nodes: FileNode[], node: FileNode, fileName: string) => {
    {
      // Find the target folder in the tree

      const currentFolder = findNodeByPath(fileTree, node?.folder!);

      // Does a file/folder with this name already exist here?
      const exists = currentFolder?.children?.some(
        (child) => child?.name?.toLowerCase() === fileName?.toLowerCase(),
      );

      return exists;
    }
  };

  const isBlocked = findFile(fileTree, activeFile)?.isBlocked;

  const closeFile = (filePath: string) => {
    const newOpenFiles = openFiles.filter((f) => f !== filePath);

    setOpenFiles(newOpenFiles);
    if (activeFile === filePath && newOpenFiles.length > 0) {
      setActiveFile(newOpenFiles[0]);
      const file = findFile(fileTree, newOpenFiles[0]);
      setCode(file?.content!);
      setCurrentLanguage(
        file?.language || getLanguageFromFileName(newOpenFiles[0]),
      );
    }
  };

  // Item 6: download the project as an archive. The worker zips the workdir
  // (excluding node_modules/.git) and returns it base64-encoded; we decode it
  // into a Blob and trigger a browser download.
  const handleDownloadProject = async () => {
    if (!pgCtx) return;
    track(PLAYGROUND_EVENTS.projectDownloaded);
    try {
      toast.message("Preparing your download…");
      const res = await pgDownload(pgCtx);
      const bytes = Uint8Array.from(atob(res.base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: res.mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Couldn't prepare the download. Try again.");
    }
  };

  // Item 7: Restart wipes the sandbox back to the base template (destructive) and
  // force-pushes the fresh base to the linked GitHub repo so the remote matches.
  // Task progress is server-side and is left intact — only the code is reset.
  const handleRestart = async () => {
    if (!pgCtx) return;
    track(PLAYGROUND_EVENTS.projectRestarted);
    setRestart(false);
    setShowLoader(true);
    try {
      if (ghConnected && syncRef.current) {
        // Connected → GitHub is the source of truth. "Restart" = reset the
        // sandbox to the USER's repo (discard local sandbox changes, pull their
        // latest). It must NEVER force-push the base template over their repo —
        // that destroyed the learner's pushed work (the "restart not picking
        // from github" bug). resolveReload() runs the worker `resetToRemote`.
        await syncRef.current.resolveReload();
      } else {
        // Ephemeral (not connected) → wipe back to the base template / scaffold.
        await pgRestart(pgCtx, {
          baseRepository: project?.baseRepository,
          language: project?.languages?.[0],
          frontendPreview: !!(project as any)?.playgroundConfig
            ?.frontendPreview,
          previewDir: (project as any)?.playgroundConfig?.previewDir,
          showcaseSlug: slug,
          showcaseVersion: project?.updatedAt
            ? Math.floor(new Date(project.updatedAt).getTime() / 1000)
            : undefined,
        });
      }
      await refreshTree();
      setOpenFiles([]);
      setActiveFile("");
      toast.success(
        ghConnected
          ? "Reset to your GitHub repo."
          : "Project reset to the base template.",
      );
    } catch {
      toast.error("Couldn't reset the project. Try again.");
    } finally {
      setShowLoader(false);
    }
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    // Configure editor options
    editor.updateOptions({
      fontSize: fontSize,
      fontFamily:
        "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
      fontLigatures: true,
      lineHeight: 1.7,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: "on",
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      padding: { top: 14, bottom: 14 },
      smoothScrolling: true,
      cursorBlinking: "smooth",
      renderLineHighlight: "all",
      renderWhitespace: "selection",
      bracketPairColorization: { enabled: true },
    });
  };

  const handleTyping: OnChange = (value, v) => {
    const path = activeFile;
    trackEdit(path);
    clearTimeout(fileBufferRef.current[path]);

    fileBufferRef.current[path] = setTimeout(async () => {
      if (!pgCtx) return;
      try {
        await pgFs(pgCtx, {
          op: "write",
          path: toRel(path),
          content: value ?? "",
        });
        // Connected → nudge the GitHub autosave (trailing-debounced in the
        // engine, so rapid edits collapse into a single commit on idle).
        syncRef.current?.nudgeSave();
        // Hot-reload: if the server is running, restart it ~1s after the last
        // edit so the change takes effect (debounced; the URL stays the same).
        if (baseURLRef.current) {
          if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
          reloadTimerRef.current = setTimeout(() => {
            if (pgCtx && baseURLRef.current)
              void pgReload(pgCtx).catch(() => {});
          }, 1000);
        }
      } catch (error: any) {
        toast.error(error?.message || "Failed to save changes");
      }
    }, 300); // Wait 300ms after last change

    // clearTimeout(idleTimer?.current!);
    idleTimer.current = setTimeout(
      () => autoSaveAndCommit(),
      AUTO_COMMIT_INTERVAL,
    ) as any;
    setCode(value ?? "");
  };

  const handleDeleteFile = async (file: FileNode) => {
    if (!file || !pgCtx) return;
    track(PLAYGROUND_EVENTS.fileDeleted, {
      file_ext: file?.name?.split(".").pop() ?? "",
    });

    // Recursively remove the deleted file/folder from the tree.
    const removeNode = (nodes: FileNode[], targetPath: string): FileNode[] => {
      return nodes
        .filter((node) => node.path !== targetPath)
        .map((node) =>
          node.children
            ? { ...node, children: removeNode(node.children, targetPath) }
            : node,
        );
    };

    // Optimistic remove + close any open tab for the deleted path.
    setFileTree((prevTree) => removeNode(prevTree, file.path));
    setOpenFiles((prev) => prev.filter((p) => p !== file.path));
    if (activeFile === file.path) setActiveFile("");
    setDeleteFile(null);

    try {
      await pgFs(pgCtx, { op: "delete", path: toRel(file.path) });
      await refreshTree();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete");
      // Reconcile back to the real sandbox state.
      refreshTree();
    }
  };

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node, i) => {
      const pad = 6 + depth * 14;
      const isRenaming =
        renamingItem?.parentPath === contextMenu.target?.path &&
        node.path == contextMenu.target?.path;
      const isCreatingHere =
        creatingItem?.parentPath === contextMenu.target?.path &&
        node.path == contextMenu.target?.path;

      return (
        <span
          key={node.path + i}
          onContextMenu={(e) => handleRightClick(e, node)}
          ref={treeRef}
        >
          {node.type === "folder" ? (
            <div
              className={cn("node folder", node.isOpen && "open")}
              style={{ paddingLeft: pad }}
              onClick={() => toggleFolder(node.name)}
            >
              <span className="chev">{I.chev}</span>
              <span className="ico fi-folder">
                {node.isOpen ? I.folderOpen : I.folderIco}
              </span>
              {isRenaming ? (
                <input
                  className={cn("ren-in", renamingItem?.exists && "ren-err")}
                  value={renamingItem?.name}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const name = e.target.value.trim();
                    const exists = isFileExist(nodes, node, name);
                    setRenamingItem((prev) => ({ ...prev, name, exists }));
                  }}
                  onBlur={() => setRenamingItem({})}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter" && !renamingItem?.exists)
                      addItem((e.target as HTMLInputElement).value);
                  }}
                />
              ) : (
                <span className="nm">{depth === 0 ? slug : node.name}</span>
              )}
              <span className="acts">
                <button
                  aria-label="Rename"
                  title="Rename"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingItem({ parentPath: node.path, ...node });
                  }}
                >
                  {I.pencil}
                </button>
                <button
                  className="del"
                  aria-label="Delete"
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteFile(node);
                  }}
                >
                  {I.trash}
                </button>
              </span>
            </div>
          ) : (
            <div
              className={cn("node", activeFile === node.path && "active")}
              style={{ paddingLeft: pad + 14 }}
              onClick={() => openFile(node)}
            >
              <span className={cn("ico", fileClass(node.name))}>
                {I.fileIco}
              </span>
              {isRenaming ? (
                <input
                  className={cn("ren-in", renamingItem?.exists && "ren-err")}
                  value={renamingItem?.name}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const name = e.target.value.trim();
                    const exists = isFileExist(nodes, node, name);
                    setRenamingItem((prev) => ({ ...prev, name, exists }));
                  }}
                  onBlur={() => setRenamingItem({})}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter" && !renamingItem?.exists)
                      addItem((e.target as HTMLInputElement).value);
                  }}
                />
              ) : (
                <span className={cn("nm", node.isBlocked && "blocked")}>
                  {node.name}
                </span>
              )}
              <span className="acts">
                <button
                  aria-label="Rename"
                  title="Rename"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingItem({ parentPath: node.path, ...node });
                  }}
                >
                  {I.pencil}
                </button>
                <button
                  className="del"
                  aria-label="Delete"
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteFile(node);
                  }}
                >
                  {I.trash}
                </button>
              </span>
            </div>
          )}

          {isCreatingHere && (
            <div
              className="node"
              style={{ paddingLeft: pad + 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="ico fi-default">
                {creatingItem?.type === "folder" ? I.folderIco : I.fileIco}
              </span>
              <input
                className={cn("ren-in", creatingItem?.exists && "ren-err")}
                autoFocus
                onChange={(e) => {
                  const name = e.target.value.trim();
                  const exists = isFileExist(nodes, node, name);
                  setCreatingItem((prev) => ({ ...prev, name, exists }));
                }}
                onBlur={() => setCreatingItem({})}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter" && !creatingItem?.exists)
                    addItem((e.target as HTMLInputElement).value);
                }}
              />
            </div>
          )}

          {node.type === "folder" && node.isOpen && node.children && (
            <div>{renderFileTree(node.children, depth + 1)}</div>
          )}
        </span>
      );
    });
  };

  const handleMarkAsCompleted = async (id: string) => {
    try {
      setMarking(true);
      const completed = await store.markProjectTaskAsCompleted(slug, id);
      track(PLAYGROUND_EVENTS.taskCompleted, {
        task_id: id,
        points: activeTask?.mb,
        via: "manual",
      });

      setProject((prev) => {
        if (!prev) return prev;

        const updatedProjectTasks = prev.projectTasks.map(
          (projectTask: any) => {
            const updatedTasks = projectTask.tasks.map((task: any) => {
              if (task?.id === completed.taskId) {
                return {
                  ...task,
                  userTask: {
                    ...task.userTask,
                    isCompleted: completed.isCompleted,
                  },
                };
              }
              return task;
            });

            return {
              ...projectTask,
              tasks: updatedTasks,
            };
          },
        );

        return {
          ...prev,
          projectTasks: updatedProjectTasks,
        };
      });

      setCelebration(true);
      toast.success("Task completed successfully");
      setMarkAsCompleted(false);
      setShowTask(false);

      // House keeping
      const { data } = await getUser();
      updateUser(data);

      // In embedded (path) mode, let the host advance the step.
      onComplete?.();
    } catch (error) {
      toast.error("An error occurred. Please try again");
    } finally {
      setMarking(false);
    }
  };

  // Build the per-assertion check rows for a task. Uses the task's own
  // assertions when present (Phase 2 apiSpec), else synthesises sensible rows
  // from the contract / a generic verification.
  function synthChecks(t: any): { label: string; ok: boolean }[] {
    if (Array.isArray(t?.checks) && t.checks.length) {
      return t.checks.map((c: any) =>
        Array.isArray(c)
          ? { label: c[0], ok: c[1] === "ok" }
          : { label: c.label, ok: c.ok !== false },
      );
    }
    const sp = t?.apiSpec || t || {};
    const rows: { label: string; ok: boolean }[] = [];
    if (sp.method && sp.url)
      rows.push({
        label: `${String(sp.method).toUpperCase()} ${sp.url} responds`,
        ok: true,
      });
    if (sp.response)
      rows.push({ label: "Response matches the expected output", ok: true });
    if (sp.request && !sp.response)
      rows.push({ label: "Request sent matches the contract", ok: true });
    if (!rows.length)
      rows.push({ label: "Task verified in the sandbox", ok: true });
    return rows;
  }

  // Marks a task complete in local state (project tree + active task reference).
  const markTaskCompleteInState = (taskId: string) => {
    setProject((prev: any) =>
      prev
        ? {
            ...prev,
            projectTasks: prev.projectTasks.map((pt: any) => ({
              ...pt,
              tasks: pt.tasks.map((task: any) =>
                task?.id === taskId
                  ? {
                      ...task,
                      userTask: { ...task.userTask, isCompleted: true },
                    }
                  : task,
              ),
            })),
          }
        : prev,
    );
    setActiveTask((p: any) =>
      p ? { ...p, userTask: { ...p.userTask, isCompleted: true } } : p,
    );
  };

  // Advances the path step once every task in the project is done.
  const maybeAdvance = (t: any) => {
    const allTasks = (project?.projectTasks ?? []).flatMap(
      (pt: any) => pt.tasks ?? [],
    );
    const allDone = allTasks.every(
      (task: any) => task?.userTask?.isCompleted || task?.id === t.id,
    );
    if (allDone) onComplete?.();
  };

  // Run the task's test: for endpoint tasks (apiSpec present) this calls the
  // real backend grader which probes the learner's running server and returns
  // per-assertion verdicts. Non-endpoint tasks use the legacy self-certify path.
  const runTaskTest = async (t: any) => {
    if (!t) return;

    // Demo mode: instant pass with celebration
    if (isDemo) {
      const { DEMO_TEST_RESULT } = await import("@/lib/playground-demo-script");
      setTestRun({
        status: DEMO_TEST_RESULT.pass ? "pass" : "fail",
        checks: [
          {
            label: DEMO_TEST_RESULT.message,
            ok: DEMO_TEST_RESULT.pass,
          },
        ],
      });
      if (DEMO_TEST_RESULT.pass) {
        markTaskCompleteInState(t.id);
        setCelebration(true);
        toast.success(`Passed — +${DEMO_TEST_RESULT.scoreEarned} MB`);
      } else {
        toast.error("Test failed");
      }
      return;
    }

    // Run Test grades endpoint tasks (apiSpec) and terminal tasks (terminalSpec).
    // Non-endpoint, non-terminal tasks complete via "Mark as complete"
    // (markTaskManually) — this path never auto-passes a task.
    if (!t.apiSpec && !t.terminalSpec) return;

    // Endpoint tasks need a live sandbox — catch before the network round-trip
    // so the learner gets instant, clear feedback. Terminal tasks have no
    // server/baseURL to wait for, so this gate is REST-API-specific.
    if (t.apiSpec && !baseURL) {
      toast.error("Start your server first — click Run Server.");
      setTestRun({
        status: "fail",
        checks: [{ label: "Server not running — click Run Server", ok: false }],
      });
      return;
    }

    setTestRun({ status: "running", checks: [] });
    const testStart = Date.now();
    try {
      // Real grading: the backend probes the endpoint (apiSpec) or execs the
      // entrypoint with the learner's typed stdin (terminalSpec) and returns
      // per-assertion results.
      let verdict: Awaited<ReturnType<typeof store.gradeProjectTask>>;
      try {
        verdict = await store.gradeProjectTask(
          slug,
          t.id,
          t.terminalSpec ? testStdin : undefined,
        );
      } catch (e: any) {
        if (e?.response?.status === 409) {
          toast.error("Start your server first — click Run Server.");
          setTestRun({
            status: "fail",
            checks: [
              { label: "Server not running — click Run Server", ok: false },
            ],
          });
          return;
        }
        throw e;
      }

      const checks = Array.isArray(verdict?.checks)
        ? verdict.checks.map((c) => ({
            label: c.detail || c.kind,
            ok: !!c.passed,
          }))
        : [];
      const checksPassed = checks.filter((c) => c.ok).length;
      track(PLAYGROUND_EVENTS.taskTestRun, {
        task_id: t?.id,
        passed: !!verdict?.passed,
        duration_ms: Date.now() - testStart,
        checks_passed: checksPassed,
        checks_total: checks.length,
      });

      if (verdict?.passed) {
        // Fire taskCompleted only on the transition (task was not already complete).
        if (!t.userTask?.isCompleted) {
          track(PLAYGROUND_EVENTS.taskCompleted, {
            task_id: t.id,
            points: t.mb,
            via: "test",
          });
        }
        markTaskCompleteInState(t.id);
        setTestRun({
          status: "pass",
          checks: checks.length
            ? checks
            : [{ label: "All assertions passed", ok: true }],
        });
        setCelebration(true);
        toast.success(
          verdict.pointsAwarded > 0
            ? `Passed — +${verdict.pointsAwarded} MB`
            : "Passed",
        );
        maybeAdvance(t);
      } else {
        setTestRun({
          status: "fail",
          checks: checks.length
            ? checks
            : [
                {
                  label:
                    verdict?.error ||
                    "Endpoint did not match the expected response",
                  ok: false,
                },
              ],
        });
        toast.error("Not passing yet — check the failing assertions.");
      }
    } catch {
      setTestRun({
        status: "fail",
        checks: [{ label: "Could not verify — try again", ok: false }],
      });
      toast.error("Test run failed. Try again.");
    }
  };

  // Manual completion for tasks with no automated test (design/spec tasks).
  // Explicit learner action — NOT framed as a passing test, so it can't read as
  // a false "all assertions passed".
  const markTaskManually = async (t: any) => {
    if (!t || t?.userTask?.isCompleted) return;
    try {
      let completed;
      try {
        completed = await store.markProjectTaskAsCompleted(slug, t.id);
      } catch {
        await store.handleProjectEnrollment(slug);
        completed = await store.markProjectTaskAsCompleted(slug, t.id);
      }
      markTaskCompleteInState(completed?.taskId ?? t.id);
      toast.success("Task marked complete");
      maybeAdvance(t);
    } catch {
      toast.error("Couldn't mark complete. Try again.");
    }
  };

  const openTaskDrawer = (task: any) => {
    track(PLAYGROUND_EVENTS.taskOpened, {
      task_id: task?.id,
      task_title: task?.title,
    });
    setActiveTask(task);
    setShowTask(true);
    setTestRun(
      task?.userTask?.isCompleted
        ? { status: "pass", checks: synthChecks(task) }
        : { status: "idle", checks: [] },
    );
    // Pre-fill the editable stdin fields from this task's terminalSpec (if
    // any) — the learner sees exactly what will run and can edit it.
    setTestStdin(task?.terminalSpec?.stdin ?? []);
  };

  const handleRunProject = async () => {
    if (!pgCtx || runInFlightRef.current) return; // re-entrancy guard

    // Demo mode: mock server response
    if (isDemo) {
      track(PLAYGROUND_EVENTS.runServer);
      runInFlightRef.current = true;
      setIsRunning(true);
      setBaseURL("http://localhost:3000");

      // Simulate server startup logs
      setTimeout(() => {
        setTerminalOutput((prev) => [
          ...prev,
          "$ npm start",
          "> node index.js",
          "",
          "$ Server running at: http://localhost:3000",
          "$ Use this as your base URL in Postman or your frontend.",
        ]);
        setIsRunning(false);
        runInFlightRef.current = false;
      }, 800);
      return;
    }

    // Hard gate: Run requires an active, non-expired GitHub connection. Checked
    // fresh at click time (not the cheaper `ghConnected` derived flag) because
    // that flag doesn't account for a connection GitHub revoked/suspended since
    // page load.
    // Sample projects are a frictionless trial — never gate Run behind GitHub
    // for them. The guided tour runs Run as one of its scripted steps, often
    // before a brand-new user has had any chance to connect GitHub yet, so
    // gating here would silently interrupt the tour with the connect modal.
    if (!isDemo) {
      try {
        const ghStatus = await store.getProjectGithub(slug);
        if (!ghStatus?.connected) {
          setShowGithubRequiredModal(true);
          return;
        }
      } catch {
        setShowGithubRequiredModal(true);
        return;
      }
    }

    if (isTerminalMode) {
      const language = (project as any)?.playgroundConfig?.language ?? "node";
      const entrypoint = (project as any)?.playgroundConfig?.entrypoint;
      if (!entrypoint) {
        toast.error("This project has no entrypoint configured.");
        return;
      }
      track(PLAYGROUND_EVENTS.runServer, { mode: "terminal" });
      setShowTerminal(true);
      const cmd =
        language === "python"
          ? `python3 ${escapeSingleQuoted(entrypoint)}`
          : `node ${escapeSingleQuoted(entrypoint)}`;
      try {
        // Kill any previous run via REST (a PTY Ctrl+C was verified unreliable
        // for this — see Task 0's spike) before typing the fresh command.
        await pgExec(pgCtx, {
          cmd: `pkill -f ${escapeSingleQuoted(entrypoint)}`,
        });
      } catch {
        // Best-effort: pkill on a not-yet-running process is a no-op failure,
        // never block the run because of it.
      }
      const started = terminalRunRef.current?.runCommand(cmd);
      if (started === false) {
        toast.message("Terminal still connecting… try Run again in a moment.");
      }
      return;
    }

    track(PLAYGROUND_EVENTS.runServer);
    runInFlightRef.current = true;
    setIsRunning(true);
    setTerminalOutput(terminalSample);
    try {
      // installCmd/startCmd default on the worker (npm ci / npm run dev) — pass
      // through any project-level overrides if the model ever carries them.
      const r = await pgRun(pgCtx, {});
      // Single message only. Unhealthy is the failure case; healthy-with-url is
      // the deployed case; healthy-without-url is the local case (info, not error).
      if (r?.status !== "healthy") {
        toast.error(r?.error || "Server did not become healthy");
        return;
      }
      // Checkpoint the current work to GitHub on a healthy run (connected only).
      syncRef.current?.saveNow("run");
      if (r?.serverUrl) {
        setBaseURL(r.serverUrl);
        // Surface the URL in the terminal so it's visible + copyable (the `$`
        // prefix renders cyan via the run-log colouriser).
        setTerminalOutput((prev) => [
          ...prev,
          "",
          `$ Server running at: ${r.serverUrl}`,
          "$ Use this as your base URL in Postman or your frontend.",
        ]);
      } else {
        // Locally (wrangler dev) a public URL needs the playground custom domain,
        // so serverUrl can be null — the server still started.
        toast.message(
          "Server started (public URL needs the playground domain)",
        );
      }
    } catch (e: any) {
      toast.error(e?.message || "Run failed");
    } finally {
      setIsRunning(false);
      runInFlightRef.current = false;
    }
  };

  const handleStopProject = async () => {
    if (!pgCtx || stopInFlightRef.current) return; // re-entrancy guard

    // Demo mode: mock stop
    if (isDemo) {
      track(PLAYGROUND_EVENTS.stopServer);
      stopInFlightRef.current = true;
      setIsStopping(true);
      setBaseURL("");
      toast.message("Server stopped");
      setTimeout(() => {
        setIsStopping(false);
        stopInFlightRef.current = false;
      }, 300);
      return;
    }

    track(PLAYGROUND_EVENTS.stopServer);
    stopInFlightRef.current = true;
    setIsStopping(true);
    try {
      await pgStop(pgCtx);
      setBaseURL("");
      toast.message("Server stopped");
    } catch (e: any) {
      toast.error(e?.message || "Failed to stop server");
    } finally {
      setIsStopping(false);
      stopInFlightRef.current = false;
    }
  };

  // Keep the refs the path top bar calls pointed at the live handlers.
  runServerRef.current = handleRunProject;
  stopServerRef.current = handleStopProject;
  togglePreviewRef.current = () => setIsRightPanelVisible((p) => !p);
  baseURLRef.current = baseURL; // live mirror for timer callbacks

  // Build the demo app for the guided walkthrough. Writes (1) an API the test
  // grades and (2) a real HTML frontend into the preview dir, then asks the
  // worker to relocate that dir into <workdir>.frontend so it is served at
  // <baseURL>/__app/ (App-mode preview). Serving the frontend statically via
  // the worker means it renders regardless of the app server's restart state.
  const DEMO_API = `const express = require("express");
const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

// API endpoint (the demo's "Run a test" step grades this)
app.get("/api/hello", (req, res) => {
  res.json({ ok: true, message: "Hello from your API 🎉" });
});

app.get("/", (req, res) => {
  res.json({ ok: true, message: "API is running. Frontend at /__app/" });
});

app.listen(port, () => console.log("Server listening on port " + port));
`;
  const DEMO_FRONTEND = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Hello API</title>
    <style>
      *{box-sizing:border-box} body{margin:0;min-height:100vh;display:grid;place-items:center;
      font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
      background:radial-gradient(1200px 600px at 50% -10%,#e8fbff,#f5f7fa);color:#0a1f2e}
      .card{width:min(520px,92vw);background:#fff;border-radius:18px;padding:32px;text-align:center;
      box-shadow:0 24px 60px rgba(10,107,133,.16),0 0 0 1px rgba(19,174,206,.08)}
      .badge{display:inline-block;padding:4px 12px;border-radius:999px;background:rgba(19,174,206,.12);
      color:#0f8ba8;font-weight:700;font-size:12px;letter-spacing:.04em;text-transform:uppercase}
      h1{margin:14px 0 6px;font-size:26px;letter-spacing:-.02em} p{margin:0 0 18px;color:#475569}
      pre{text-align:left;background:#0e1f33;color:#cdddea;border-radius:12px;padding:16px;overflow:auto;font-size:13px;margin:0}
      .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#13aece;margin-right:6px}
    </style>
  </head>
  <body>
    <main class="card">
      <span class="badge">Live preview</span>
      <h1>🎉 Your app is running</h1>
      <p><span class="dot"></span><span id="status">Calling your API…</span></p>
      <pre id="out">…</pre>
    </main>
    <script>
      fetch("/api/hello").then(function(r){return r.json()}).then(function(d){
        document.getElementById("status").textContent="API responded \\u2713";
        document.getElementById("out").textContent=JSON.stringify(d,null,2);
      }).catch(function(){document.getElementById("status").textContent="API not reachable";});
    </script>
  </body>
</html>
`;
  const demoCreateFile = async () => {
    if (!pgCtx) {
      console.warn(
        "[playground-tour] demoCreateFile skipped: no pgCtx — log in and let the project finish loading.",
      );
      return;
    }
    setRailTab("explorer");

    // Demo mode: skip file system writes, just open editor with demo code
    if (isDemo) {
      const { DEMO_STARTER_FILES } =
        await import("@/lib/playground-demo-script");
      const indexFile = DEMO_STARTER_FILES.find((f) => f.name === "index.js");
      if (indexFile) {
        await openFile({
          name: "index.js",
          type: "file",
          icon: "📄",
          path: "index.js",
          language: getLanguageFromFileName("index.js"),
        });
      }
      return;
    }

    try {
      await pgFs(pgCtx, {
        op: "write",
        path: toRel("index.js"),
        content: DEMO_API,
      });
      await pgFs(pgCtx, {
        op: "write",
        path: toRel("public/index.html"),
        content: DEMO_FRONTEND,
      });
      // Relocate <workdir>/public -> <workdir>.frontend so the worker serves it
      // at /__app/. Best-effort: the API + preview still work without it.
      try {
        await pgSeed(pgCtx, { frontendPreview: true, previewDir: "public" });
      } catch (e) {
        console.warn("[playground-tour] frontend relocate (pgSeed) failed:", e);
      }
      await refreshTree();
      await openFile({
        name: "index.js",
        type: "file",
        icon: "📄",
        path: "index.js",
        language: getLanguageFromFileName("index.js"),
      });
    } catch (e) {
      // Don't break the tour, but surface WHY — usually the playground worker
      // (NEXT_PUBLIC_PLAYGROUND_WORKER_URL) being unreachable.
      console.warn("[playground-tour] demoCreateFile failed:", e);
    }
  };

  const firstGradableTask = () =>
    (project?.projectTasks ?? [])
      .flatMap((p: any) => p.tasks)
      .find((t: any) => t?.apiSpec);

  // REVEALS — always wired. Open each step's panel/tab/drawer so the step is
  // shown on its real target even when that panel isn't open by default. These
  // only change UI state; they never mutate the project, so they run on any
  // project (the highlight-only tour included).
  tourRevealsRef.current = {
    "file-tree": () => setRailTab("explorer"),
    kap: () => setRailTab("kap"),
    terminal: () => {
      setShowTerminal(true);
      if (termRef.current) termRef.current.style.flexBasis = lastTermH.current;
    },
    "run-test": () => {
      const gradable = firstGradableTask();
      if (gradable) openTaskDrawer(gradable);
    },
    preview: () => {
      // Close the Run-test drawer (opened by the run-test step) so the live
      // preview — the finale — is fully visible and unobstructed.
      setShowTask(false);
      setIsRightPanelVisible(true);
      // Terminal-mode projects have no iframe preview (Task 5 hides the
      // Preview tab entirely) — switching to it here would silently reopen a
      // panel that shouldn't exist in this mode.
      if (!isTerminalMode) setRightTab("preview");
      // App mode points the iframe at <baseURL>/__app/, where the worker serves
      // the relocated frontend. Only takes effect when the project enables it
      // (frontendEnabled); harmless otherwise (the toggle is hidden).
      setPreviewMode("app");
    },
  };

  // ACTIONS — the REAL, mutating steps. Sample project only (never mutate a
  // real user's project). Panel-opening lives in reveals above; these do the
  // actual work the demo shows off.
  tourActionsRef.current = isDemo
    ? {
        "file-tree": demoCreateFile,
        "run-server": async () => {
          if (!pgCtx) {
            console.warn("[playground-tour] run-server skipped: no pgCtx");
            return;
          }
          await handleRunProject();
        },
        "run-test": async () => {
          const gradable = firstGradableTask();
          if (!gradable) {
            console.warn(
              "[playground-tour] run-test skipped: no gradable task (apiSpec).",
            );
            return;
          }
          await runTaskTest(gradable);
        },
      }
    : {};

  // Collapse the terminal to just its 32px header (keep it on screen), expand
  // back to the last height. The .term panel is shrunk via flex-basis; its
  // overflow:hidden clips the body so only the header shows.
  const toggleTerminal = () => {
    track(PLAYGROUND_EVENTS.terminalToggled, { open: !showTerminal });
    setShowTerminal((open) => {
      const next = !open;
      if (termRef.current) {
        if (!next) {
          lastTermH.current = termRef.current.style.flexBasis || "150px";
          termRef.current.style.flexBasis = "32px";
        } else {
          termRef.current.style.flexBasis = lastTermH.current;
        }
      }
      return next;
    });
  };

  const editorMenu = () => {
    const menuItems: any = [
      {
        label:
          editorTheme === "mb-dark"
            ? "Switch editor to light"
            : "Switch editor to dark",
        action: () => {
          const nextTheme = editorTheme === "mb-dark" ? "mb-light" : "mb-dark";
          track(PLAYGROUND_EVENTS.editorThemeSwitched, { theme: nextTheme });
          setEditorTheme(nextTheme);
        },
      },
      { label: "separator", action: () => {} },
      {
        label: "Download Project",
        action: () =>
          user?.isPremium ? handleDownloadProject() : setShowPayment(true),
      },
      {
        label: "Restart Project",
        action: () => setRestart(true),
      },
    ];

    const close = () => setEditorContextMenu((p) => ({ ...p, visible: false }));

    if (typeof document === "undefined") return null;

    // Portal to <body> so it escapes Monaco's high-z stacking context and any
    // overflow/transform ancestor — guaranteed above the editor.
    return createPortal(
      <div
        className="fixed z-[9999] min-w-[190px] overflow-hidden rounded-lg border border-border bg-popover py-1 text-popover-foreground shadow-2xl"
        style={{
          top: Math.min(editorContextMenu.y, window.innerHeight - 170),
          left: Math.min(editorContextMenu.x, window.innerWidth - 210),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {menuItems.map((item: any, i: number) =>
          item.label === "separator" ? (
            <div key={i} className="my-1 h-px bg-border" />
          ) : (
            <button
              key={i}
              onClick={() => {
                item.action();
                close();
              }}
              className="flex w-full items-center px-3 py-2 text-left text-[13px] font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            >
              {item.label}
            </button>
          ),
        )}
      </div>,
      document.body,
    );
  };

  const fileTreeMenu = () => {
    const menuItems: any = [
      {
        label: "Download Project",
        action: () =>
          user?.isPremium ? handleDownloadProject() : setShowPayment(true),
      },
      {
        label: "separator",
        action: () => {},
      },
      {
        label: "Import Project",
        action: () => console.log("Open Folder in Terminal"),
      },

      {
        label: "Export Project",
        action: () => console.log("Open Folder in Terminal"),
      },
    ];

    return (
      <div
        className="absolute top-5 left-1 bg-popover text-popover-foreground border border-border shadow-lg rounded-lg py-1 w-44 z-50"
        onClick={(e) => e.stopPropagation()}
      >
        {menuItems?.map((item: any, i: number) => {
          return item.label === "separator" ? (
            <div key={i} className="my-0.5 bg-border h-[1px]"></div>
          ) : (
            <div
              key={i}
              onClick={() => item.action()}
              className="px-3 py-2 text-sm cursor-pointer text-foreground hover:bg-primary hover:text-primary-foreground"
            >
              {item.label}
            </div>
          );
        })}
      </div>
    );
  };

  // ── mock's makeResize: flex-basis drag with capture-phase listeners so the
  // editor/terminal can't swallow the drag; text-selection disabled mid-drag. ──
  // A browser iframe can't load a bind address like 0.0.0.0; map it (and
  // 127.0.0.1) to localhost so the local preview actually renders.
  const browsable = (u: string) =>
    (u || "").replace(/\/\/(0\.0\.0\.0|127\.0\.0\.1)(:|\/|$)/, "//localhost$2");
  const withNonce = (u: string) =>
    !u || !previewNonce
      ? u
      : u + (u.includes("?") ? "&" : "?") + "_t=" + previewNonce;
  const apiBase = browsable(baseURL || previewUrl);
  const resolvedPreviewUrl = withNonce(
    frontendEnabled && previewMode === "app" && baseURL
      ? browsable(baseURL.replace(/\/+$/, "")) + "/__app/"
      : apiBase,
  );

  // ── inline SVG icons ported verbatim from the mock (exact paths) ──
  const I = {
    play: (
      <svg className="i" viewBox="0 0 24 24">
        <path d="M7 5l12 7-12 7z" fill="currentColor" stroke="none" />
      </svg>
    ),
    preview: (
      <svg className="i" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M14 4v16" />
      </svg>
    ),
    link: (
      <svg className="i" viewBox="0 0 24 24">
        <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
        <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
      </svg>
    ),
    tasks: (
      <svg className="i" viewBox="0 0 24 24">
        <path d="m3 8 2 2 3.5-3.5" />
        <path d="m3 17 2 2 3.5-3.5" />
        <path d="M13 7h8" />
        <path d="M13 17h8" />
      </svg>
    ),
    files: (
      <svg className="i" viewBox="0 0 24 24">
        <path d="M4 7a2 2 0 0 1 2-2h3l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      </svg>
    ),
    kap: (
      <svg className="i" viewBox="0 0 24 24">
        <path d="M12 3l1.8 4.9L19 10l-5.2 1.9L12 17l-1.8-5.1L5 10l5.2-2.1z" />
        <path d="M19 14.5l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z" />
      </svg>
    ),
    newfile: (
      <svg className="i" viewBox="0 0 24 24">
        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" />
        <path d="M16 16h6M19 13v6" />
      </svg>
    ),
    newfolder: (
      <svg className="i" viewBox="0 0 24 24">
        <path d="M4 7a2 2 0 0 1 2-2h3l2 2h5a2 2 0 0 1 2 2v3" />
        <path d="M4 7v11a2 2 0 0 0 2 2h6" />
        <path d="M16 16h6M19 13v6" />
      </svg>
    ),
    refresh: (
      <svg className="i" viewBox="0 0 24 24">
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
        <path d="M3 21v-5h5" />
      </svg>
    ),
    collapseAll: (
      <svg className="i" viewBox="0 0 24 24">
        <path d="M7 13l5 5 5-5" />
        <path d="M7 6l5 5 5-5" />
      </svg>
    ),
    chev: (
      <svg className="i" viewBox="0 0 24 24">
        <path d="M9 6l6 6-6 6" />
      </svg>
    ),
    folderIco: (
      <svg className="i" viewBox="0 0 24 24">
        <path d="M4 7a2 2 0 0 1 2-2h3l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      </svg>
    ),
    folderOpen: (
      <svg className="i" viewBox="0 0 24 24">
        <path d="M4 8a2 2 0 0 1 2-2h3l2 2h7a2 2 0 0 1 2 2" />
        <path d="M2.6 12.4 4 19a2 2 0 0 0 2 1.5h11.5a2 2 0 0 0 2-1.5l1.4-6a1 1 0 0 0-1-1.2H3.6a1 1 0 0 0-1 1.2z" />
      </svg>
    ),
    fileIco: (
      <svg className="i" viewBox="0 0 24 24">
        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
        <path d="M5 3h9l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      </svg>
    ),
    pencil: (
      <svg className="i" viewBox="0 0 24 24">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
      </svg>
    ),
    trash: (
      <svg className="i" viewBox="0 0 24 24">
        <path d="M3 6h18" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      </svg>
    ),
    x: (
      <svg className="i" viewBox="0 0 24 24">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    ),
    check: (
      <svg className="i" viewBox="0 0 24 24">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
    clock: (
      <svg className="i" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
    bars: (
      <svg className="i" viewBox="0 0 24 24">
        <path d="M4 20v-5M10 20V9M16 20v-8M22 20V4" />
      </svg>
    ),
    list: (
      <svg className="i" viewBox="0 0 24 24">
        <path d="M9 6h12M9 12h12M9 18h12" />
        <path d="m3 6 1.2 1.2L6.5 5M3 12l1.2 1.2L6.5 11M3 18l1.2 1.2L6.5 17" />
      </svg>
    ),
    spark: (
      <svg className="i" viewBox="0 0 24 24">
        <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      </svg>
    ),
    bolt: (
      <svg className="i" viewBox="0 0 24 24">
        <path d="M13 2 3 14h7l-1 8 10-12h-7z" />
      </svg>
    ),
    monitor: (
      <svg className="i" viewBox="0 0 24 24">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    checkCircle: (
      <svg className="i" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </svg>
    ),
    external: (
      <svg className="i" viewBox="0 0 24 24">
        <path d="M15 3h6v6" />
        <path d="M10 14L21 3" />
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      </svg>
    ),
    copy: (
      <svg className="i" viewBox="0 0 24 24">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    ),
  } as const;

  const railBtns = [
    {
      k: "tasks" as const,
      label: "Tasks",
      icon: <ListChecks className="i" strokeWidth={1.8} />,
    },
    {
      k: "explorer" as const,
      label: "Files",
      icon: <FolderClosed className="i" strokeWidth={1.8} />,
    },
    {
      k: "kap" as const,
      label: "Kap",
      icon: <Sparkles className="i" strokeWidth={1.8} />,
    },
  ];

  const fileClass = (name: string) => {
    if (name.endsWith(".json")) return "fi-json";
    if (name === ".env" || name.endsWith(".env")) return "fi-env";
    if (name.endsWith(".js") || name.endsWith(".ts") || name.endsWith(".mjs"))
      return "fi-js";
    return "fi-default";
  };

  // status pill text/state from baseURL
  const sandboxLive = !!baseURL;

  // Learner's avatar for their Kap chat bubbles: image → initials → "You".
  const userInitials =
    (user?.name || user?.username || "You")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w: string) => w[0])
      .join("")
      .toUpperCase() || "Y";

  // Task API contract → drives the endpoint badge + request/expected forms.
  // Prefer the structured `apiSpec`; fall back to flat fields.
  const tSpec = activeTask?.apiSpec || {};
  const tMethod = tSpec.method || activeTask?.method;
  const tUrl = tSpec.url || activeTask?.url;

  // ── GitHub sync status chip (connected only, or demo mode) ──
  const renderSyncChip = () => {
    if (!ghConnected && !isDemo) return null;
    const state = syncStatus?.state ?? "synced";
    const at = syncStatus?.at;
    const base =
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap";
    if (state === "syncing") {
      return (
        <span
          data-tour="github-sync"
          className={cn(base, "border-border bg-card text-muted-foreground")}
          aria-live="polite"
        >
          <svg
            className="i spin"
            viewBox="0 0 24 24"
            style={{ width: 12, height: 12 }}
          >
            <path d="M21 12a9 9 0 1 1-6.2-8.6" />
          </svg>
          Syncing…
        </span>
      );
    }
    if (state === "conflict") {
      return (
        <button
          data-tour="github-sync"
          type="button"
          onClick={() => setConflict((c) => ({ ...c, open: true }))}
          className={cn(
            base,
            "border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
          )}
          title="Resolve sync conflict"
        >
          <AlertTriangle style={{ width: 12, height: 12 }} />
          Conflict
        </button>
      );
    }
    if (state === "error") {
      return (
        <span
          data-tour="github-sync"
          className={cn(
            base,
            "border-destructive/40 bg-destructive/10 text-destructive",
          )}
          aria-live="polite"
          title="Couldn't reach GitHub — the next change will retry"
        >
          <AlertTriangle style={{ width: 12, height: 12 }} />
          Offline · will retry
        </span>
      );
    }
    // synced
    return (
      <span
        data-tour="github-sync"
        className={cn(base, "border-border bg-card text-muted-foreground")}
        aria-live="polite"
      >
        <Check style={{ width: 12, height: 12 }} className="text-primary" />
        Synced · {relTime(at)}
      </span>
    );
  };

  return (
    <div className="pg-root">
      {/* ── TOP BAR (standalone only — in the path step the controls move to
          the PathTopBar and this header is hidden) ── */}
      {!embedded && (
        <div className="topbar">
          <button
            type="button"
            aria-label="Go to dashboard"
            title="Go to dashboard"
            onClick={() => onNavigate("/")}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0E1F33] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Image
              src="/main-logo.png"
              alt="Mastering Backend"
              width={32}
              height={32}
              className="h-full w-full object-cover"
            />
          </button>
          <div className="crumb">
            <button
              type="button"
              onClick={() => onNavigate("/projects")}
              className="hover:text-foreground hover:underline"
            >
              Build
            </button>
            &nbsp;&nbsp;›&nbsp;&nbsp;
            <button
              type="button"
              onClick={() => onNavigate("/projects/" + slug)}
              className="hover:text-foreground hover:underline"
            >
              <b>{project?.title}</b>
            </button>
          </div>
          <div className="spacer" />
          <div className="status" aria-live="polite">
            <span className={cn("dot", !sandboxLive && "off")} />
            <span>{sandboxLive ? "sandbox live · :3000" : "sandbox idle"}</span>
          </div>
          {sandboxLive ? (
            <button
              data-tour="run-server"
              className="btn stop"
              onClick={handleStopProject}
              disabled={isStopping}
              title="Stop server"
              aria-label="Stop server"
            >
              {I.x} {isStopping ? "Stopping…" : "Stop"}
            </button>
          ) : (
            <button
              data-tour="run-server"
              className="btn run"
              onClick={handleRunProject}
              disabled={isSaving || isRunning}
            >
              {I.play} {isRunning ? "Running…" : "Run server"}
            </button>
          )}
          {isTerminalMode ? (
            <button
              className={cn("btn", isRightPanelVisible && "on")}
              onClick={() => {
                setRightTab("tests");
                setIsRightPanelVisible((p) => !p);
              }}
              title="Toggle tests"
              aria-pressed={isRightPanelVisible}
            >
              {I.checkCircle} Tests
            </button>
          ) : (
            <button
              className={cn("btn", isRightPanelVisible && "on")}
              onClick={() => {
                track(PLAYGROUND_EVENTS.previewToggled, {
                  visible: !isRightPanelVisible,
                });
                setIsRightPanelVisible((p) => !p);
              }}
              title="Toggle preview & tests"
              aria-pressed={isRightPanelVisible}
            >
              {I.preview} Preview
            </button>
          )}
          <button
            className="btn ghost"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <svg className="i" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              <svg className="i" viewBox="0 0 24 24">
                <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
              </svg>
            )}
          </button>
          <span
            aria-hidden
            style={{
              width: 1,
              alignSelf: "stretch",
              margin: "6px 6px",
              background: "var(--border, #e2e8f0)",
              opacity: 0.7,
            }}
          />
          <button
            className="btn ghost"
            onClick={relaunch}
            title="Take a guided tour"
            aria-label="Take a guided tour"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "#13aece",
              border: "none",
              fontWeight: 600,
            }}
          >
            <svg className="i" viewBox="0 0 24 24" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1z" />
            </svg>
            Take a tour
          </button>
          <span
            aria-hidden
            style={{
              width: 1,
              alignSelf: "stretch",
              margin: "6px 6px",
              background: "var(--border, #e2e8f0)",
              opacity: 0.7,
            }}
          />
          <PathFeedbackDialog
            open={feedbackOpen}
            onOpenChange={setFeedbackOpen}
            source="playground"
            context={{ projectSlug: slug }}
          />
          {/* GitHub icon stays in the top nav next to the other icons in every
              state; the sync chip sits alongside it once connected. The tour
              anchors on this always-present button (the sync chip is conditional). */}
          <span data-tour="github-sync" style={{ display: "inline-flex" }}>
            <GithubConnect
              slug={slug}
              projectName={project?.title}
              onConnected={handleGhConnected}
              onError={setGhError}
              onNotInstalled={setGhNotInstalled}
            />
          </span>
          {(ghConnected || isDemo) && renderSyncChip()}
        </div>
      )}

      {/* ── GitHub not-connected banner ──
          Full-width, red — the loudest strip on the page, because Run is hard
          -blocked while this shows (see handleRunProject). No dismiss. */}
      {ghNotInstalled ? (
        <div className="gh-connect-banner" role="status">
          <span className="gh-connect-banner-msg">
            <Github style={{ width: 16, height: 16 }} />
            Connect GitHub to save your work
          </span>
          <button
            className="btn gh-connect-banner-btn"
            onClick={ghNotInstalled.connect}
          >
            Connect GitHub
          </button>
        </div>
      ) : null}

      {/* ── GitHub error strip ──
          No persistent "connect GitHub" nudge — the nav icon + slide-in own all
          the actions and provisioning is automatic. This strip appears ONLY when
          GithubConnect reports an actionable error (load failed, auto-provision
          failed), with a Retry that re-runs the failed step. Hidden in demo mode. */}
      {ghError && !isDemo ? (
        <div className="gh-nudge gh-nudge-error">
          <span className="gh-nudge-msg gh-nudge-msg-error">
            <AlertTriangle style={{ width: 14, height: 14 }} />
            {ghError.message}
          </span>
          <button className="btn ghost gh-retry" onClick={ghError.retry}>
            {ghError.actionLabel ?? "Retry"}
          </button>
        </div>
      ) : null}

      {/* ── WORKSPACE ── */}
      <div className="ws" data-mp={mobilePane}>
        {/* LEFT RAIL */}
        <div
          className="rail col border-r border-border"
          ref={railRef}
          style={{ boxShadow: "inset -1px 0 0 var(--line)" }}
        >
          <div
            className="seg"
            role="tablist"
            aria-label="Sidebar panels"
            style={{ boxShadow: "inset 0 -1px 0 var(--line)" }}
          >
            {railBtns.map(({ k, label, icon }) => (
              <button
                key={k}
                role="tab"
                aria-selected={railTab === k}
                className={cn(railTab === k && "on")}
                onClick={() => setRailTab(k)}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* TASKS rail */}
          {railTab === "tasks" && (
            <div className="railbody">
              {tasks && tasks.length > 0 ? (
                <>
                  {project?.projectTasks?.map((group: any, gi: number) => {
                    const done = group.tasks.filter(
                      (t: any) => t?.userTask?.isCompleted,
                    ).length;
                    return (
                      <div className="ms" key={group.id ?? gi}>
                        <div className="ms-h">
                          <span className="ic">{I.chev}</span>
                          <span className="name">
                            {group.title ?? `Milestone ${gi + 1}`}
                          </span>
                          <span className="frac">
                            {done}/{group.tasks.length}
                          </span>
                        </div>
                        {group.tasks.map((task: any, ti: number) => {
                          const isDone = task?.userTask?.isCompleted;
                          const selected = activeTask?.id === task?.id;
                          const doing = !isDone && task?.id === currentTaskId;
                          return (
                            <div
                              key={task.id + ti}
                              role="button"
                              tabIndex={0}
                              aria-pressed={selected}
                              className={cn("task", selected && "sel")}
                              onClick={() => openTaskDrawer(task)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  openTaskDrawer(task);
                                }
                              }}
                            >
                              <div
                                className={cn(
                                  "st",
                                  isDone && "done",
                                  doing && "doing",
                                )}
                              >
                                {isDone && I.check}
                              </div>
                              <span className="ttl" style={{ flex: 1 }}>
                                <span className="tnum">
                                  {taskNumber[task.id]} ·
                                </span>{" "}
                                {task?.title}
                              </span>
                              {task?.method && (
                                <span
                                  className={cn("meth", methClass(task.method))}
                                >
                                  {task.method}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                  <div className="prog-l" style={{ marginTop: 12 }}>
                    <span>Progress</span>
                    <span>
                      {doneCount}/{totalCount} · {earnedPts} MB
                    </span>
                  </div>
                  <div className="prog">
                    <i style={{ width: `${pct}%` }} />
                  </div>
                </>
              ) : (
                <div className="empty">
                  {I.tasks}
                  <p>No tasks for this project yet.</p>
                </div>
              )}
            </div>
          )}

          {/* FILES rail (explorer) */}
          {railTab === "explorer" && (
            <div data-tour="file-tree" className="explorer-pane">
              <div
                className="exhead border-b border-border"
                ref={fileMenuRef}
                style={{ boxShadow: "inset 0 -1px 0 var(--line)" }}
              >
                <span className="exttl">Explorer</span>
                <div className="exacts">
                  <button
                    className="exact"
                    title="New File"
                    aria-label="New File"
                    onClick={() => newRootItem("file")}
                  >
                    {I.newfile}
                  </button>
                  <button
                    className="exact"
                    title="New Folder"
                    aria-label="New Folder"
                    onClick={() => newRootItem("folder")}
                  >
                    {I.newfolder}
                  </button>
                  <button
                    className="exact"
                    title="Refresh Explorer"
                    aria-label="Refresh Explorer"
                    onClick={refreshTree}
                  >
                    {I.refresh}
                  </button>
                  <button
                    className="exact"
                    title="Collapse Folders"
                    aria-label="Collapse Folders"
                    onClick={collapseAll}
                  >
                    {I.collapseAll}
                  </button>
                </div>
              </div>
              <div className="tree">
                {fileTree.length > 0 ? (
                  renderFileTree(fileTree)
                ) : (
                  <div className="empty">
                    {I.files}
                    <p>No files yet.</p>
                  </div>
                )}
              </div>
              <ContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                visible={contextMenu.visible}
                target={contextMenu.target}
                onClose={() =>
                  setContextMenu((prev) => ({ ...prev, visible: false }))
                }
                onAction={handleMenuAction}
              />
            </div>
          )}

          {/* KAP AI rail */}
          {railTab === "kap" && (
            <div
              data-tour="kap"
              className="railKap"
              style={{ height: "100%", minHeight: 0 }}
            >
              <KapTutorPanel
                scope="project"
                projectId={project?.id}
                taskId={activeTask?.id}
                title={project?.title}
                intro="Hi — I'm Kap. I'll point you in the right direction, but I won't write the code for you. Ask about the task, an error, or what's failing."
                starterPrompts={[
                  "Why is my test failing?",
                  "How do I return 201?",
                  "Give me a hint",
                ]}
                onMessageSent={() => track(PLAYGROUND_EVENTS.kapMessageSent)}
                demoMode={isDemo}
              />
            </div>
          )}
        </div>
        <div
          className="resizer"
          onMouseDown={startResize("rail")}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
        />

        {/* CENTER */}
        <div className="center col">
          {/* file tabs — only when a file is open (welcome screen stays clean) */}
          {openFiles.length > 0 && (
            <div
              className="tabs border-b border-border"
              ref={editorMenuRef}
              style={{ boxShadow: "inset 0 -1px 0 var(--line)" }}
            >
              {openFiles.map((filePath) => (
                <div
                  key={filePath}
                  className={cn("tab", activeFile === filePath && "on")}
                  onClick={() => {
                    const file = findFile(fileTree, filePath);
                    if (file) openFile(file);
                  }}
                >
                  {getFileName(filePath)}
                  <span
                    className="x"
                    role="button"
                    aria-label={`Close ${getFileName(filePath)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      closeFile(filePath);
                    }}
                  >
                    {I.x}
                  </span>
                </div>
              ))}
              <div className="spacer" />
              <button
                className="btn ghost tab-opts"
                aria-label="Editor options"
                onClick={(e) =>
                  setEditorContextMenu((prev) => ({
                    visible: !prev.visible,
                    x: e.clientX,
                    y: e.clientY,
                  }))
                }
              >
                <svg className="i" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>
              {editorContextMenu.visible && editorMenu()}
            </div>
          )}

          {/* editor OR welcome. Item 10: once started, no start page at all —
              the auto-open effect lands the learner straight in the editor.
              Uses the `onStartPage` variable (not a re-derived inline
              expression) so terminal mode's widened definition applies here
              too — otherwise a fresh terminal-mode project would still show
              this welcome card above the terminal instead of the terminal
              filling the pane. */}
          {onStartPage ? (
            <div className="welcome">
              <div className="wcard">
                <div className="weyebrow">
                  <span className="wlogo">M</span> PROJECT · Backend
                </div>
                <h1>{project?.title}</h1>
                {project?.summary && (
                  <p
                    className="wsum"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(project.summary),
                    }}
                  />
                )}

                <div className="wmeta">
                  <span className="wchip">
                    {I.clock}{" "}
                    {project?.duration
                      ? `~${project.duration} hrs`
                      : "Self-paced"}
                  </span>
                  <span className="wchip">
                    {I.bars} {project?.level || "Intermediate"}
                  </span>
                  <span className="wchip">
                    {I.list} {tasks?.length ?? 0} tasks
                  </span>
                  <span className="wchip wchip-xp">
                    {I.spark} {totalPts} MB
                  </span>
                </div>
                {project?.technologies && project.technologies.length > 0 && (
                  <div className="wtags">
                    {(tagsExpanded
                      ? project.technologies
                      : project.technologies.slice(0, 8)
                    ).map((t: string) => (
                      <span className="wtag" key={t}>
                        {t}
                      </span>
                    ))}
                    {project.technologies.length > 8 && (
                      <button
                        type="button"
                        className="wtag wtag-more"
                        onClick={() => setTagsExpanded((v) => !v)}
                      >
                        {tagsExpanded
                          ? "Show less"
                          : `+${project.technologies.length - 8} more`}
                      </button>
                    )}
                  </div>
                )}

                <h4 className="wh">How it works</h4>
                <div className="wsteps">
                  {[
                    {
                      t: "Read the task",
                      d: "Each task defines an endpoint: method, URL, request & expected response.",
                    },
                    {
                      t: "Build it in the editor",
                      d: "Write the route in your sandbox project — Kap can nudge you, but won't write it.",
                    },
                    {
                      t: "Run the test",
                      d: "We call your live endpoint and check every assertion. Pass = task complete.",
                    },
                    {
                      t: "See it work",
                      d: "Open the Preview to watch the predefined frontend use your API in real time.",
                    },
                  ].map((s, i) => (
                    <div className="wstep" key={i}>
                      <span className="wn">{i + 1}</span>
                      <div>
                        <b>{s.t}</b>
                        <i>{s.d}</i>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="wcta">
                  <button className="btn run" onClick={startBuilding}>
                    {I.play} Start building
                  </button>
                  <button className="btn" onClick={() => setRailTab("tasks")}>
                    {I.list} View tasks
                  </button>
                </div>
                <p className="whint">
                  Tip: open a file from <b>Files</b>, or pick a task on the left
                  to begin.
                </p>
              </div>
            </div>
          ) : isBlocked ? (
            <div className="blocked-view">Preview not supported</div>
          ) : (
            <div data-tour="editor" className="editor-host">
              <Editor
                height="100%"
                language={currentLanguage}
                theme={editorTheme}
                value={code}
                onChange={handleTyping}
                beforeMount={(monaco) => {
                  // Branded dark editor — surface matches our --background
                  // (#171B26), exactly like the exercise playground.
                  monaco.editor.defineTheme("mb-dark", {
                    base: "vs-dark",
                    inherit: true,
                    rules: [],
                    colors: {
                      "editor.background": "#171B26",
                      "editorGutter.background": "#171B26",
                      "minimap.background": "#171B26",
                      "editorWidget.background": "#1E2330",
                      "editor.lineHighlightBackground": "#1E2330",
                    },
                  });
                  monaco.editor.defineTheme("mb-light", {
                    base: "vs",
                    inherit: true,
                    rules: [],
                    colors: {
                      "editor.background": "#ffffff",
                      "editorGutter.background": "#ffffff",
                    },
                  });
                }}
                onMount={handleEditorDidMount}
                options={{
                  fontSize: fontSize,
                  fontFamily:
                    "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                  fontLigatures: true,
                  lineHeight: 1.7,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  automaticLayout: true,
                  tabSize: 2,
                  insertSpaces: true,
                  padding: { top: 14, bottom: 14 },
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  renderLineHighlight: "all",
                  scrollbar: {
                    verticalScrollbarSize: 9,
                    horizontalScrollbarSize: 9,
                  },
                  renderWhitespace: "selection",
                  bracketPairColorization: { enabled: true },
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: true,
                  parameterHints: { enabled: true },
                  formatOnPaste: true,
                  formatOnType: true,
                }}
              />
            </div>
          )}

          {/* Item 11: no terminal on the start page — only once the learner is
              actually in the workspace. */}
          {!onStartPage && (
            <>
              {showTerminal && (
                <div
                  className="resizer row"
                  onMouseDown={startResize("term")}
                  role="separator"
                  aria-orientation="horizontal"
                  aria-label="Resize terminal"
                />
              )}
              <div
                data-tour="terminal"
                className={cn(
                  "term border-t border-border",
                  !showTerminal && "collapsed",
                )}
                ref={termRef}
                style={{ boxShadow: "inset 0 1px 0 var(--line)" }}
              >
                <Terminal
                  ref={terminalRunRef}
                  collapsed={!showTerminal}
                  onToggle={toggleTerminal}
                  onClose={() => toggleTerminal()}
                  ctx={pgCtx}
                  jail={project?.playgroundConfig?.terminalJail !== false}
                  output={terminalOutput}
                />
              </div>
            </>
          )}
        </div>

        {/* RIGHT — Preview / Tests (toggleable) */}
        {isRightPanelVisible && (
          <>
            <div
              className="resizer"
              onMouseDown={startResize("right")}
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize preview panel"
            />
            <div
              data-tour="preview"
              className="right col border-l border-border"
              ref={rightRef}
              style={{ boxShadow: "inset 1px 0 0 var(--line)" }}
            >
              <div
                className="rtabs border-b border-border"
                style={{ boxShadow: "inset 0 -1px 0 var(--line)" }}
              >
                {!isTerminalMode && (
                  <button
                    className={cn("seg-b", rightTab === "preview" && "on")}
                    onClick={() => setRightTab("preview")}
                  >
                    {I.monitor} Preview
                  </button>
                )}
                <button
                  className={cn("seg-b", rightTab === "tests" && "on")}
                  onClick={() => setRightTab("tests")}
                >
                  {I.checkCircle} Tests
                </button>
                <div className="spacer" />
                <button
                  className="btn ghost"
                  aria-label="Close preview"
                  onClick={() => setIsRightPanelVisible(false)}
                >
                  {I.x}
                </button>
              </div>

              {/* preview */}
              {rightTab === "preview" && (
                <div className="rbody pv-pane">
                  <div
                    className="pv-bar border-b border-border"
                    style={{ boxShadow: "inset 0 -1px 0 var(--line)" }}
                  >
                    <input
                      className="pv-url"
                      type="text"
                      value={baseURL || ""}
                      onChange={(e) => setPreviewUrl(e.target.value)}
                      placeholder="Sandbox URL appears here after Run server"
                      aria-label="Preview URL"
                      readOnly={!baseURL}
                    />
                    {frontendEnabled && (
                      <div
                        className="pv-seg"
                        role="tablist"
                        aria-label="Preview mode"
                      >
                        <button
                          role="tab"
                          aria-selected={previewMode === "app"}
                          className={cn("pvbtn", previewMode === "app" && "on")}
                          onClick={() => {
                            track(PLAYGROUND_EVENTS.previewModeSwitched, {
                              mode: "app",
                            });
                            setPreviewMode("app");
                          }}
                        >
                          App
                        </button>
                        <button
                          role="tab"
                          aria-selected={previewMode === "api"}
                          className={cn("pvbtn", previewMode === "api" && "on")}
                          onClick={() => {
                            track(PLAYGROUND_EVENTS.previewModeSwitched, {
                              mode: "api",
                            });
                            setPreviewMode("api");
                          }}
                        >
                          API
                        </button>
                      </div>
                    )}
                    <button
                      className="pvbtn"
                      title="Refresh preview"
                      aria-label="Refresh preview"
                      disabled={!baseURL}
                      onClick={() => setPreviewNonce((n) => n + 1)}
                    >
                      {I.refresh}
                    </button>
                    <button
                      className="pvbtn"
                      title="Copy server URL"
                      aria-label="Copy server URL"
                      disabled={!baseURL}
                      onClick={() => {
                        if (!baseURL) return;
                        navigator.clipboard
                          ?.writeText(baseURL)
                          .then(() => toast.success("Server URL copied"))
                          .catch(() => toast.error("Couldn't copy"));
                      }}
                    >
                      {I.copy}
                    </button>
                    <a
                      className="pvbtn"
                      target="_blank"
                      rel="noreferrer"
                      href={resolvedPreviewUrl}
                      title="Open frontend in a new tab"
                      aria-label="Open preview in new tab"
                    >
                      {I.external}
                    </a>
                  </div>
                  <div className="pv-frame">
                    {baseURL ? (
                      <iframe
                        src={isDemo ? undefined : resolvedPreviewUrl}
                        srcDoc={isDemo ? DEMO_FRONTEND_HTML : undefined}
                        title="Project preview"
                        // Defense-in-depth: the preview serves learner-authored
                        // code from the sandbox. Sandbox the frame so a misbehaving
                        // app can't reach the parent. allow-same-origin is kept so
                        // the previewed API can use its own cookies/storage; the
                        // preview is a distinct origin from academy regardless.
                        sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
                      />
                    ) : (
                      <div className="empty pv-empty">
                        {I.monitor}
                        <p>Run the server to see your app here.</p>
                        <span>
                          A live preview of the predefined frontend, served by
                          your endpoints.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* tests */}
              {rightTab === "tests" && (
                <div className="rbody">
                  {tasks && tasks.length > 0 ? (
                    tasks.map((task: any, i: number) => {
                      const isDone = task?.userTask?.isCompleted;
                      const doing = !isDone && task?.id === currentTaskId;
                      return (
                        <div
                          key={task.id + i}
                          className="tline"
                          role="button"
                          tabIndex={0}
                          onClick={() => openTaskDrawer(task)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openTaskDrawer(task);
                            }
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <div
                            className={cn(
                              "st",
                              isDone && "done",
                              doing && "doing",
                            )}
                          >
                            {isDone && I.check}
                          </div>
                          <span className="ttl" style={{ flex: 1 }}>
                            <span className="tnum">
                              {taskNumber[task.id]} ·
                            </span>{" "}
                            {task?.title}
                          </span>
                          {task?.method && (
                            <span
                              className={cn("meth", methClass(task.method))}
                            >
                              {task.method}
                            </span>
                          )}
                          <span
                            className={cn(
                              "badge",
                              isDone ? "b-pass" : "b-todo",
                            )}
                          >
                            {isDone ? "PASS" : "not run"}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty">
                      {I.checkCircle}
                      <p>No tests defined for this project.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── TASK DRAWER (slides over) ── */}
        {showTask && (
          <button
            aria-label="Close task"
            className="drawer-scrim"
            onClick={() => setShowTask(false)}
          />
        )}
        <div className={cn("drawer", showTask && "open")}>
          {activeTask && (
            <>
              <div
                className="dh border-b border-border"
                style={{ boxShadow: "inset 0 -1px 0 var(--line)" }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  {tMethod && tUrl && (
                    <div className="endpoint">
                      <span
                        className={cn(
                          "meth",
                          {
                            GET: "m-get",
                            POST: "m-post",
                            PUT: "m-put",
                            PATCH: "m-put",
                            DELETE: "m-del",
                          }[(tMethod as string)?.toUpperCase()] || "m-post",
                        )}
                      >
                        {tMethod}
                      </span>
                      <span className="u">{tUrl}</span>
                    </div>
                  )}
                  <h2>{activeTask?.title}</h2>
                  <div className="dmeta">
                    <span className="tag">
                      {String(activeTask?.type || "TASK").toLowerCase()}
                    </span>
                    {activeTask?.required && (
                      <span className="tag">required</span>
                    )}
                  </div>
                </div>
                {activeTask?.userTask?.isCompleted ? (
                  <span className="pts done">{I.check} Completed</span>
                ) : activeTask?.mb ? (
                  <span className="pts gold">
                    {I.spark} {activeTask.mb} MB
                  </span>
                ) : null}
                <button
                  className="btn ghost"
                  aria-label="Close task"
                  title="Close"
                  onClick={() => setShowTask(false)}
                >
                  {I.x}
                </button>
              </div>

              <div className="db">
                <div className="sec">
                  <h4>Instructions</h4>
                  <div className="task-desc">
                    {fmtInstr(activeTask?.description || activeTask?.summary)}
                  </div>
                </div>

                {activeTask?.terminalSpec && (
                  <div className="sec">
                    <h4>Inputs</h4>
                    <div className="task-desc" style={{ marginBottom: 8 }}>
                      This program reads {testStdin.length} input
                      {testStdin.length === 1 ? "" : "s"} from the terminal.
                      Edit them if you want, then hit Run test.
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {testStdin.map((v, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <label
                            htmlFor={`test-stdin-${i}`}
                            style={{
                              fontSize: 12,
                              color: "var(--muted)",
                              width: 20,
                              flexShrink: 0,
                            }}
                          >
                            {i + 1}.
                          </label>
                          <Input
                            id={`test-stdin-${i}`}
                            aria-label={`Input ${i + 1}`}
                            value={v}
                            onChange={(e) =>
                              setTestStdin((prev) =>
                                prev.map((p, pi) =>
                                  pi === i ? e.target.value : p,
                                ),
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="sec">
                  <h4>Test results</h4>
                  <div className="checks">
                    {testRun.status === "idle" && (
                      <div className="chk">
                        <div className="ci">·</div>
                        <span className="lab muted">
                          Not run yet — hit Run test.
                        </span>
                      </div>
                    )}
                    {testRun.status === "running" && (
                      <div className="chk">
                        <div className="ci run">
                          <svg className="i spin" viewBox="0 0 24 24">
                            <path d="M21 12a9 9 0 1 1-6.2-8.6" />
                          </svg>
                        </div>
                        <span className="lab">
                          Running your endpoint in the sandbox…
                        </span>
                      </div>
                    )}
                    {(testRun.status === "pass" || testRun.status === "fail") &&
                      testRun.checks.map((c, i) => (
                        <div key={i} className={cn("chk", c.ok ? "ok" : "no")}>
                          <div className="ci">{c.ok ? I.check : I.x}</div>
                          <span className="lab">{c.label}</span>
                          <span className="ex">
                            {c.ok ? "match" : "expected ↔ actual"}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="df">
                {activeTask?.apiSpec || activeTask?.terminalSpec ? (
                  <>
                    <span className="hint">
                      {activeTask?.apiSpec && !baseURL
                        ? "Run your server first to test this endpoint."
                        : "Runs your code in the sandbox and checks the output."}
                    </span>
                    <button
                      data-tour="run-test"
                      className="btn run"
                      onClick={() => runTaskTest(activeTask)}
                      disabled={
                        testRun.status === "running" ||
                        activeTask?.userTask?.isCompleted ||
                        (!!activeTask?.apiSpec && !baseURL)
                      }
                    >
                      {I.play}{" "}
                      {activeTask?.userTask?.isCompleted
                        ? "Passed"
                        : testRun.status === "running"
                          ? "Running…"
                          : "Run test"}
                    </button>
                  </>
                ) : (
                  <>
                    <span className="hint">
                      This task has no automated test — mark it complete when
                      you&apos;ve finished it.
                    </span>
                    <button
                      className="btn run"
                      onClick={() => markTaskManually(activeTask)}
                      disabled={activeTask?.userTask?.isCompleted}
                    >
                      {I.check}{" "}
                      {activeTask?.userTask?.isCompleted
                        ? "Completed"
                        : "Mark as complete"}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile pane switcher — shows one full-width pane at a time (≤900px) */}
      <div className="mtabs" role="tablist" aria-label="Workspace panes">
        <button
          role="tab"
          aria-selected={mobilePane === "rail"}
          data-on={mobilePane === "rail"}
          onClick={() => setMobilePane("rail")}
        >
          {I.files}
          <span>Panel</span>
        </button>
        <button
          role="tab"
          aria-selected={mobilePane === "editor"}
          data-on={mobilePane === "editor"}
          onClick={() => setMobilePane("editor")}
        >
          {I.fileIco}
          <span>Editor</span>
        </button>
        <button
          role="tab"
          aria-selected={mobilePane === "right"}
          data-on={mobilePane === "right"}
          onClick={() => {
            setIsRightPanelVisible(true);
            setMobilePane("right");
          }}
        >
          {I.preview}
          <span>Preview</span>
        </button>
      </div>

      <Dialog
        open={markAsCompleted}
        onOpenChange={() => setMarkAsCompleted(false)}
      >
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">
              Mark as completed
            </DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to mark this task{" "}
              <span className="italic text-gray-300 bg-gray-700 p-1">
                {activeTask?.title}
              </span>{" "}
              as completed? Only mark task you've actually completed.
            </DialogDescription>
          </DialogHeader>

          <Button
            onClick={() => handleMarkAsCompleted(activeTask?.id)}
            variant="default"
            disabled={marking}
            className="w-full gap-2"
          >
            {marking ? (
              "Marking..."
            ) : (
              <>
                <Check className="h-4 w-4" />
                Mark As Completed
              </>
            )}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteFile?.name}
        onOpenChange={() => setDeleteFile(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete file</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Are you sure you want to delete '{deleteFile?.name}'?.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFile(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteFile(deleteFile!)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── GitHub sync conflict resolver ── */}
      <Dialog
        open={conflict.open}
        onOpenChange={(open) => setConflict((c) => ({ ...c, open }))}
      >
        <DialogContent className="sm:max-w-[480px] w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Sync conflict
            </DialogTitle>
            <DialogDescription>
              This project changed on GitHub since your last sync — likely from
              another device or tab. Choose which version to keep. This
              can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              variant="outline"
              className="w-full"
              disabled={resolvingConflict}
              onClick={async () => {
                if (!syncRef.current) return;
                track(PLAYGROUND_EVENTS.githubConflictResolved, {
                  resolution: "reload",
                });
                setResolvingConflict(true);
                try {
                  await syncRef.current.resolveReload();
                  toast.success("Reloaded the latest version from GitHub");
                } catch {
                  toast.error("Couldn't reload from GitHub. Try again.");
                } finally {
                  setResolvingConflict(false);
                  setConflict({ open: false });
                }
              }}
            >
              Reload from GitHub (discard local)
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              disabled={resolvingConflict}
              onClick={async () => {
                if (!syncRef.current) return;
                track(PLAYGROUND_EVENTS.githubConflictResolved, {
                  resolution: "overwrite",
                });
                setResolvingConflict(true);
                try {
                  await syncRef.current.resolveOverwrite();
                  toast.success("Overwrote GitHub with your version");
                } catch {
                  toast.error("Couldn't overwrite GitHub. Try again.");
                } finally {
                  setResolvingConflict(false);
                  setConflict({ open: false });
                }
              }}
            >
              Overwrite GitHub with my version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfettiCelebration
        onComplete={() => setCelebration(false)}
        isVisible={celebration}
        celebrationType="completion"
        courseName={activeTask?.title!}
      />

      <Dialog open={restart} onOpenChange={setRestart}>
        <DialogContent className="sm:max-w-[500px] w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Restart this project?
            </DialogTitle>
            <DialogDescription>
              This wipes your sandbox back to the base template — all your code
              is deleted and cannot be recovered.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-1 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">This will:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Delete everything in your sandbox and reset to the starter.
              </li>
              {ghConnected ? (
                <li>
                  Overwrite your connected GitHub repo
                  {repoFullName ? (
                    <>
                      {" "}
                      (<b>{repoFullName}</b>)
                    </>
                  ) : null}{" "}
                  with the base template.
                </li>
              ) : null}
            </ul>
            <p className="mt-3">
              Your task progress is kept. This can’t be undone.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRestart(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleRestart()}>
              Wipe & restart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoader} onOpenChange={setShowLoader}>
        <DialogContent className="sm:max-w-[500px] w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-amber-400" />
              Downloading your Project...
            </DialogTitle>
            <DialogDescription>
              Relax! Let Kap AI do the hard work.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-6 w-full">
            <p className="capitalize pb-1 italic text-sm w-full">
              {progressText}...
            </p>

            <Progress value={downloadProgress} />
          </div>

          {progressValue >= 100 && (
            <a href={baseURL} target="_blank">
              <Button variant="outline" className="w-full">
                <Play className="mr-2 h-4 w-4" />
                Open Base URL
              </Button>
            </a>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showProgress} onOpenChange={setShowProgress}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-amber-400" />
              Setting up Project...
            </DialogTitle>
            <DialogDescription>
              Relax while Kap set up your project playground
            </DialogDescription>
          </DialogHeader>
          <div className="pt-6">
            <p className="capitalize pb-1 italic text-sm">{progressText}...</p>
            <Progress value={progressValue} />
          </div>

          {progressValue >= 100 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowProgress(false)}
            >
              <Play className="mr-2 h-4 w-4" />
              Close
            </Button>
          )}
        </DialogContent>
      </Dialog>

      <PaymentDialog
        disableMB={false}
        disableOnetime={true}
        onClose={() => setShowPayment(false)}
        open={showPayment}
        data={{ ...project, type: "project" }}
        onHandlePreview={() => {}}
        onHandlePurchase={async (_id: string, _type: any, success: boolean) => {
          setShowPayment(false);
          if (!success) return;
          // Entitlement was granted server-side (MB redeem / subscription) —
          // re-fetch so the playground reflects unlocked access without a reload.
          const fresh = await store.getProject(slug);
          if (fresh) setProject(fresh);
          toast.success("Unlocked — enjoy the full project.");
        }}
      />

      <Dialog
        open={showGithubRequiredModal}
        onOpenChange={setShowGithubRequiredModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect GitHub to run your project</DialogTitle>
            <DialogDescription>
              Running requires a connected GitHub repository so your work is
              always backed up. Connect GitHub, then click Run again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGithubRequiredModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                // Skip for demo mode
                if (isDemo) {
                  setShowGithubRequiredModal(false);
                  return;
                }
                try {
                  const s = await store.getProjectGithub(slug);
                  if (s?.installUrl) {
                    openPopupOrWarn(withReturn(s.installUrl), () => {
                      setShowGithubRequiredModal(false);
                    });
                  }
                } catch {
                  toast.error(
                    "Couldn't start connecting GitHub. Please try again.",
                  );
                }
              }}
            >
              <Github className="mr-2 h-4 w-4" />
              Connect GitHub
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        /* ── tokens: copied verbatim from the mock :root (exact hex) ── */
        .pg-root {
          /* Theme-aware: follows the app's dark/light tokens. */
          --bg: hsl(var(--mb-sidebar));
          --surface: hsl(var(--background));
          --panel: hsl(var(--card));
          --panel-2: hsl(var(--secondary));
          --line: hsl(var(--border));
          --border-soft: hsl(var(--border) / 0.5);
          --text: hsl(var(--foreground));
          --muted: hsl(var(--muted-foreground));
          --muted-2: hsl(var(--muted-foreground) / 0.6);
          --cyan: hsl(var(--mb-blue));
          --cyan-2: hsl(var(--mb-light-blue));
          --teal: #5fb0b0;
          --teal-deep: #347474;
          --gold: #f2c94c;
          --red: hsl(var(--destructive));
          --mono: "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace;
          --ui: system-ui, -apple-system, "Segoe UI", sans-serif;
          --editor: hsl(var(--background));
          --editor-line: hsl(var(--muted-foreground) / 0.55);
          --green: #5fb0b0;

          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0;
          font-family: var(--ui);
          font-size: 13px;
          color: var(--text);
          background: var(--bg);
          overflow: hidden;
        }
        .pg-root * {
          box-sizing: border-box;
        }
        .pg-root svg.i {
          /* Sane default size so any icon whose context lacks an explicit rule
             never balloons to the SVG default. Per-context rules override. */
          width: 16px;
          height: 16px;
          flex: 0 0 auto;
          vertical-align: middle;
          stroke: currentColor;
          fill: none;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        /* ── top bar ── */
        .topbar {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 48px;
          flex: 0 0 48px;
          padding: 0 12px;
          border-bottom: 1px solid var(--line);
          background: var(--surface);
        }
        .pg-root .topbar.embedded-bar {
          height: 44px;
          flex: 0 0 44px;
        }
        /* GitHub not-connected banner — full-width, solid red, between the top
           bar and the workspace. No dismiss; Run is hard-blocked while it shows. */
        .pg-root .gh-connect-banner {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex: 0 0 auto;
          padding: 10px 16px;
          background: #dc2626;
          border-bottom: 1px solid #b91c1c;
        }
        .pg-root .gh-connect-banner-msg {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #fff;
        }
        .pg-root .gh-connect-banner-btn {
          width: auto;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          background: #fff;
          color: #dc2626;
          border: none;
        }
        .pg-root .gh-connect-banner-btn:hover {
          background: #fef2f2;
        }
        /* GitHub connect nudge / sync strip — sits under the top bar (or stands
           in for it in embedded mode). */
        .pg-root .gh-nudge {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex: 0 0 auto;
          padding: 8px 14px;
          border-bottom: 1px solid var(--line);
          background: var(--panel-2);
        }
        .pg-root .gh-nudge.gh-nudge-synced {
          justify-content: flex-end;
        }
        .pg-root .gh-nudge-msg {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 600;
          color: var(--muted);
        }
        .pg-root .gh-nudge-msg svg {
          color: var(--gold);
          flex: 0 0 auto;
        }
        /* Error variant — the strip only ever renders on a real problem. */
        .pg-root .gh-nudge.gh-nudge-error {
          background: rgba(220, 38, 38, 0.08);
          border-bottom-color: rgba(220, 38, 38, 0.35);
        }
        .pg-root .gh-nudge-msg-error {
          color: #dc2626;
        }
        .pg-root .gh-nudge-msg-error svg {
          color: #dc2626;
        }
        .pg-root .gh-retry {
          width: auto;
          padding: 4px 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .pg-root .logo {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          background: rgba(19, 174, 206, 0.12);
          border: 1px solid rgba(19, 174, 206, 0.3);
          color: var(--cyan);
          font-weight: 800;
          font-size: 13px;
          font-family: inherit;
          padding: 0;
          cursor: pointer;
          flex: 0 0 28px;
        }
        .pg-root .logo:hover {
          background: rgba(19, 174, 206, 0.2);
        }
        .pg-root .crumb {
          color: var(--muted);
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pg-root .crumb b {
          color: var(--text);
          font-weight: 600;
        }
        .pg-root .spacer {
          flex: 1;
        }
        .pg-root .status {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          color: var(--muted);
          padding: 5px 10px;
          border: 1px solid var(--line);
          border-radius: 999px;
          background: var(--panel);
          white-space: nowrap;
        }
        .pg-root .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--green);
          box-shadow: 0 0 10px var(--green);
        }
        .pg-root .dot.off {
          background: var(--muted-2);
          box-shadow: none;
        }
        .pg-root .btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          height: 32px;
          padding: 0 13px;
          border-radius: 8px;
          border: 1px solid var(--line);
          background: var(--panel);
          color: var(--text);
          font: inherit;
          font-size: 12px;
          cursor: pointer;
          font-weight: 600;
          transition: 0.15s;
          white-space: nowrap;
        }
        .pg-root .btn:hover {
          border-color: var(--muted-2);
          background: var(--panel-2);
        }
        .pg-root .btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .pg-root .btn svg.i {
          width: 15px;
          height: 15px;
          flex: 0 0 auto;
        }
        .pg-root .btn.run {
          background: linear-gradient(135deg, var(--cyan), var(--cyan-2));
          border: 0;
          color: #06222b;
          font-weight: 800;
        }
        .pg-root .btn.run:hover {
          filter: brightness(1.08);
        }
        .pg-root .btn.ghost {
          background: transparent;
          border-color: transparent;
          color: var(--muted);
          width: 32px;
          justify-content: center;
          padding: 0;
        }
        /* Labeled stop button — same footprint as Run (icon + text), red accent. */
        .pg-root .btn.stop {
          background: var(--panel);
          border-color: var(--line);
          color: #ef5d6b;
        }
        .pg-root .btn.stop:hover {
          border-color: #ef5d6b;
          background: rgba(239, 93, 107, 0.08);
        }
        .pg-root .btn.stop svg.i {
          color: currentColor;
        }
        .pg-root .btn.ghost:hover {
          color: var(--text);
          background: var(--panel);
        }
        .pg-root .btn.ghost svg.i {
          width: 16px;
          height: 16px;
        }
        .pg-root .btn.on {
          background: rgba(19, 174, 206, 0.12);
          border-color: rgba(19, 174, 206, 0.4);
          color: var(--cyan);
        }
        .pg-root .btn:focus-visible,
        .pg-root .seg button:focus-visible,
        .pg-root .exact:focus-visible,
        .pg-root .seg-b:focus-visible,
        .pg-root .task:focus-visible,
        .pg-root .tline:focus-visible,
        .pg-root .pvbtn:focus-visible,
        .pg-root .sugg button:focus-visible {
          outline: 2px solid var(--cyan);
          outline-offset: 1px;
        }

        /* ── workspace ── */
        .ws {
          flex: 1;
          display: flex;
          min-height: 0;
          position: relative;
        }
        .pg-root .col {
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 0;
        }
        .pg-root .resizer {
          flex: 0 0 6px;
          cursor: col-resize;
          position: relative;
        }
        .pg-root .resizer::after {
          content: "";
          position: absolute;
          inset: 0 2px;
          background: var(--line);
          transition: 0.15s;
        }
        .pg-root .resizer:hover::after {
          background: var(--cyan);
        }
        .pg-root .resizer.row {
          flex-basis: 6px;
          cursor: row-resize;
          width: 100%;
        }
        .pg-root .resizer.row::after {
          inset: 2px 0;
        }

        /* ── mobile: one pane at a time + bottom switcher (≤900px) ── */
        .pg-root .mtabs {
          display: none;
        }
        @media (max-width: 900px) {
          .pg-root .ws {
            display: block;
            position: relative;
          }
          .pg-root .resizer {
            display: none !important;
          }
          .pg-root .rail,
          .pg-root .center,
          .pg-root .right {
            position: absolute;
            inset: 0;
            width: 100% !important;
            max-width: 100% !important;
            flex: 1 1 auto !important;
            border-left: 0 !important;
            border-right: 0 !important;
            box-shadow: none !important;
          }
          .pg-root .ws .rail,
          .pg-root .ws .center,
          .pg-root .ws .right {
            display: none;
          }
          .pg-root .ws[data-mp="rail"] .rail {
            display: flex;
          }
          .pg-root .ws[data-mp="editor"] .center {
            display: flex;
          }
          .pg-root .ws[data-mp="right"] .right {
            display: flex;
          }
          .pg-root .mtabs {
            display: flex;
            flex: 0 0 auto;
            gap: 4px;
            padding: 6px;
            border-top: 1px solid var(--line);
            background: var(--panel-2);
          }
          .pg-root .mtabs button {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
            height: 46px;
            border: 0;
            border-radius: 9px;
            background: transparent;
            color: var(--muted);
            font: inherit;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
          }
          .pg-root .mtabs button svg.i {
            width: 18px;
            height: 18px;
          }
          .pg-root .mtabs button[data-on="true"] {
            background: rgba(19, 174, 206, 0.12);
            color: var(--cyan);
          }
        }

        /* ── left rail ── */
        .rail {
          flex: 0 0 350px;
          background: var(--bg);
          border-right: 1px solid var(--line);
          display: flex;
          flex-direction: column;
        }
        .pg-root .seg {
          display: flex;
          gap: 4px;
          padding: 8px;
          border-bottom: 1px solid var(--line);
          background: var(--panel-2);
        }
        .pg-root .seg button {
          flex: 1;
          height: 36px;
          border-radius: 9px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--muted);
          font: inherit;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          transition: 0.14s;
        }
        .pg-root .seg button svg.i {
          width: 15px;
          height: 15px;
          flex: 0 0 15px;
        }
        .pg-root .seg button span {
          line-height: 1;
        }
        .pg-root .seg button:hover {
          color: var(--text);
          background: var(--panel);
        }
        .pg-root .seg button.on {
          background: rgba(19, 174, 206, 0.12);
          border-color: rgba(19, 174, 206, 0.32);
          color: var(--cyan);
        }
        .pg-root .seg button.on svg.i {
          color: var(--cyan);
        }
        .pg-root .railbody {
          flex: 1;
          overflow: auto;
          padding: 6px;
        }
        .pg-root .empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 64px 16px;
          text-align: center;
          color: var(--muted);
        }
        .pg-root .pv-empty {
          gap: 6px;
        }
        .pg-root .pv-empty svg.i {
          width: 34px;
          height: 34px;
          color: var(--muted-2);
          margin-bottom: 4px;
        }
        .pg-root .pv-empty p {
          margin: 0;
          font-size: 13.5px;
          font-weight: 600;
          color: var(--text);
        }
        .pg-root .pv-empty span {
          font-size: 12px;
          color: var(--muted);
          max-width: 260px;
          line-height: 1.5;
        }
        .pg-root .empty svg.i {
          width: 24px;
          height: 24px;
        }
        .pg-root .empty p {
          font-size: 13px;
          margin: 0;
        }

        /* explorer */
        .explorer-pane {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .pg-root .exhead {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 9px 10px 7px;
          border-bottom: 1px solid var(--line);
          background: var(--panel-2);
        }
        .pg-root .exttl {
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--muted-2);
          font-weight: 700;
          margin-right: auto;
        }
        .pg-root .exacts {
          display: flex;
          align-items: center;
          gap: 1px;
        }
        .pg-root .exact {
          width: 26px;
          height: 24px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--muted);
          border-radius: 7px;
          cursor: pointer;
          display: grid;
          place-items: center;
        }
        .pg-root .exact:hover {
          color: var(--text);
          background: var(--panel);
        }
        .pg-root .exact svg.i {
          width: 14px;
          height: 14px;
        }
        .pg-root .tree {
          flex: 1;
          overflow: auto;
          padding: 6px 6px 14px;
        }
        .pg-root .node {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 28px;
          padding: 0 8px 0 6px;
          border-radius: 7px;
          cursor: pointer;
          color: var(--text);
          white-space: nowrap;
          position: relative;
        }
        .pg-root .node:hover {
          background: var(--panel);
        }
        .pg-root .node.active {
          background: rgba(19, 174, 206, 0.13);
          color: var(--cyan);
        }
        .pg-root .node.active::before {
          content: "";
          position: absolute;
          left: 0;
          top: 5px;
          bottom: 5px;
          width: 2.5px;
          border-radius: 2px;
          background: var(--cyan);
        }
        .pg-root .chev {
          flex: 0 0 14px;
          width: 14px;
          color: var(--muted-2);
          transition: transform 0.14s ease;
          display: grid;
          place-items: center;
        }
        .pg-root .chev svg.i {
          width: 13px;
          height: 13px;
        }
        .pg-root .node.folder.open .chev {
          transform: rotate(90deg);
        }
        .pg-root .node .ico {
          flex: 0 0 17px;
          width: 17px;
          display: grid;
          place-items: center;
        }
        .pg-root .node .ico svg.i {
          width: 15px;
          height: 15px;
        }
        .pg-root .fi-folder {
          color: #7aa2cf;
        }
        .pg-root .fi-js {
          color: #e7c46b;
        }
        .pg-root .fi-json {
          color: var(--teal);
        }
        .pg-root .fi-env {
          color: #caa000;
        }
        .pg-root .fi-default {
          color: #8fb6ee;
        }
        .pg-root .node .nm {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 12.5px;
        }
        .pg-root .node .nm.blocked {
          color: var(--muted-2);
        }
        .pg-root .node .acts {
          display: none;
          align-items: center;
          gap: 1px;
          flex: 0 0 auto;
        }
        .pg-root .node:hover .acts {
          display: flex;
        }
        .pg-root .node .acts button {
          width: 22px;
          height: 21px;
          border: 0;
          background: transparent;
          color: var(--muted);
          border-radius: 6px;
          cursor: pointer;
          display: grid;
          place-items: center;
        }
        .pg-root .node .acts button svg.i {
          width: 13px;
          height: 13px;
        }
        .pg-root .node .acts button:hover {
          color: var(--text);
          background: var(--panel-2);
        }
        .pg-root .node .acts button.del:hover {
          color: var(--red);
        }
        .pg-root .ren-in {
          flex: 1;
          min-width: 0;
          background: var(--bg);
          border: 1px solid var(--cyan);
          border-radius: 6px;
          color: var(--text);
          font: inherit;
          font-size: 12.5px;
          padding: 3px 7px;
          outline: none;
        }
        .pg-root .ren-in.ren-err {
          border-color: var(--red);
        }

        /* tasks */
        .ms {
          margin-bottom: 4px;
        }
        .pg-root .ms-h {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 8px;
          border-radius: 7px;
        }
        .pg-root .ms-h .ic {
          color: var(--muted);
          display: grid;
          place-items: center;
        }
        .pg-root .ms-h .ic svg.i {
          width: 13px;
          height: 13px;
        }
        .pg-root .ms-h .name {
          flex: 1;
          font-weight: 600;
          font-size: 12px;
        }
        .pg-root .ms-h .frac {
          font-size: 11px;
          color: var(--muted);
          font-family: var(--mono);
        }
        .pg-root .task {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 7px 8px 7px 26px;
          border-radius: 7px;
          cursor: pointer;
          font-size: 12px;
          color: var(--muted);
        }
        .pg-root .task:hover {
          background: var(--panel);
          color: var(--text);
        }
        .pg-root .task.sel {
          background: rgba(19, 174, 206, 0.1);
          color: var(--cyan);
        }
        .pg-root .st {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 10px;
          flex: 0 0 16px;
          border: 1.5px solid var(--muted-2);
        }
        .pg-root .st svg.i {
          width: 11px;
          height: 11px;
        }
        .pg-root .st.done {
          background: var(--teal-deep);
          border-color: var(--teal);
          color: #fff;
        }
        @keyframes pg-spin {
          to {
            transform: rotate(360deg);
          }
        }
        .pg-root .tnum {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--muted-2);
          flex: 0 0 auto;
        }
        .pg-root .ttl {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pg-root .meth {
          font-family: var(--mono);
          font-size: 9px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 4px;
          letter-spacing: 0.04em;
        }
        .pg-root .m-get {
          background: rgba(95, 176, 176, 0.16);
          color: var(--teal);
        }
        .pg-root .m-post {
          background: rgba(19, 174, 206, 0.16);
          color: var(--cyan);
        }
        .pg-root .m-put {
          background: rgba(242, 201, 76, 0.16);
          color: var(--gold);
        }
        .pg-root .m-del {
          background: rgba(239, 93, 107, 0.16);
          color: var(--red);
        }
        .pg-root .prog {
          margin: 10px 8px 4px;
          height: 5px;
          border-radius: 99px;
          background: var(--panel);
          overflow: hidden;
        }
        .pg-root .prog > i {
          display: block;
          height: 100%;
          background: linear-gradient(90deg, var(--teal-deep), var(--teal));
        }
        .pg-root .prog-l {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--muted);
          margin: 0 8px;
        }

        /* ── center ── */
        .center {
          flex: 1;
          background: var(--editor);
        }
        .pg-root .tabs {
          display: flex;
          align-items: center;
          height: 38px;
          flex: 0 0 38px;
          background: var(--panel-2);
          border-bottom: 1px solid var(--line);
          overflow: auto;
          position: relative;
        }
        .pg-root .tab {
          display: flex;
          align-items: center;
          gap: 7px;
          height: 100%;
          padding: 0 12px;
          border-right: 1px solid var(--border-soft);
          color: var(--muted);
          cursor: pointer;
          font-size: 12px;
          font-family: var(--mono);
          white-space: nowrap;
        }
        .pg-root .tab.on {
          color: var(--text);
          background: var(--editor);
          border-bottom: 2px solid var(--cyan);
        }
        .pg-root .tab .x {
          opacity: 0.5;
          display: grid;
          place-items: center;
        }
        .pg-root .tab .x svg.i {
          width: 12px;
          height: 12px;
        }
        .pg-root .tab .x:hover {
          opacity: 1;
          color: var(--red);
        }
        .pg-root .tab-opts {
          flex: 0 0 auto;
          margin-right: 2px;
        }
        .pg-root .editor-host {
          flex: 1;
          min-height: 0;
          background: var(--editor);
        }
        .pg-root .blocked-view {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--muted);
          background: var(--editor);
        }

        /* welcome */
        .welcome {
          flex: 1;
          min-height: 0;
          overflow: auto;
          display: flex;
          justify-content: center;
          background:
            radial-gradient(
              900px 400px at 50% -10%,
              rgba(19, 174, 206, 0.1),
              transparent 60%
            ),
            var(--editor);
        }
        .pg-root .wcard {
          width: 100%;
          max-width: 620px;
          padding: 46px 28px 40px;
          animation: pg-rise 0.5s ease both;
        }
        @keyframes pg-rise {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        .pg-root .weyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          color: var(--muted-2);
        }
        .pg-root .wlogo {
          width: 22px;
          height: 22px;
          border-radius: 7px;
          display: grid;
          place-items: center;
          background: rgba(19, 174, 206, 0.16);
          border: 1px solid rgba(19, 174, 206, 0.35);
          color: var(--cyan);
          font-weight: 800;
        }
        .pg-root .wcard h1 {
          margin: 14px 0 8px;
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -0.01em;
          color: var(--text);
        }
        .pg-root .wsum {
          margin: 0;
          color: var(--muted);
          line-height: 1.65;
          font-size: 14px;
        }
        .pg-root .wsum b {
          color: var(--text);
        }
        .pg-root .wmeta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 18px 0 10px;
        }
        .pg-root .wchip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text);
          background: var(--panel-2);
          border: 1px solid var(--line);
          border-radius: 99px;
          padding: 5px 12px;
        }
        .pg-root .wchip svg.i {
          width: 14px;
          height: 14px;
          color: var(--teal);
          flex: 0 0 auto;
        }
        .pg-root .wchip-xp {
          color: var(--gold);
          background: rgba(242, 201, 76, 0.08);
          border-color: rgba(242, 201, 76, 0.3);
          font-weight: 700;
        }
        .pg-root .wchip-xp svg.i {
          color: var(--gold);
        }
        .pg-root .wtags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 0 0 26px;
        }
        .pg-root .wtag {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--teal);
          background: rgba(95, 176, 176, 0.1);
          border: 1px solid rgba(95, 176, 176, 0.25);
          border-radius: 6px;
          padding: 3px 8px;
        }
        .pg-root .wtag-more {
          cursor: pointer;
          font-weight: 700;
        }
        .pg-root .wtag-more:hover {
          background: rgba(95, 176, 176, 0.2);
        }
        .pg-root .wh {
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted-2);
          margin: 0 0 12px;
          font-weight: 700;
        }
        .pg-root .wsteps {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 28px;
        }
        .pg-root .wstep {
          display: flex;
          gap: 13px;
          align-items: flex-start;
          padding: 13px 14px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: var(--panel);
          box-shadow: 0 1px 2px rgba(2, 6, 23, 0.04);
        }
        .pg-root .wstep .wn {
          flex: 0 0 26px;
          width: 26px;
          height: 26px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          font-weight: 800;
          font-size: 12px;
          color: #06222b;
          background: linear-gradient(135deg, var(--cyan), var(--cyan-2));
        }
        .pg-root .wstep b {
          display: block;
          font-size: 13.5px;
          color: var(--text);
          margin-bottom: 2px;
        }
        .pg-root .wstep i {
          font-style: normal;
          font-size: 12.5px;
          color: var(--muted);
          line-height: 1.55;
        }
        .pg-root .wcta {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .pg-root .wcta .btn {
          height: 42px;
          padding: 0 20px;
          font-size: 13px;
          border-radius: 11px;
        }
        .pg-root .wcta .btn.run {
          box-shadow: 0 8px 22px -6px rgba(19, 174, 206, 0.5);
        }
        .pg-root .whint {
          margin: 16px 0 0;
          font-size: 12px;
          color: var(--muted);
        }
        .pg-root .whint b {
          color: var(--text);
        }

        /* terminal slot */
        .term {
          flex: 0 0 150px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--bg);
          border-top: 1px solid var(--line);
        }
        .term.collapsed {
          flex: 0 0 32px;
        }
        /* ── right ── */
        .right {
          flex: 0 0 420px;
          background: var(--bg);
          border-left: 1px solid var(--line);
          display: flex;
          flex-direction: column;
        }
        .pg-root .rtabs {
          display: flex;
          gap: 4px;
          align-items: center;
          padding: 8px;
          border-bottom: 1px solid var(--line);
          background: var(--panel-2);
        }
        .pg-root .seg-b {
          height: 28px;
          padding: 0 12px;
          border-radius: 7px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--muted);
          font: inherit;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pg-root .seg-b svg.i {
          width: 14px;
          height: 14px;
          flex: 0 0 auto;
        }
        .pg-root .seg-b.on {
          background: var(--panel);
          color: var(--text);
          border-color: var(--line);
        }
        .pg-root .rbody {
          flex: 1;
          overflow: auto;
          min-height: 0;
        }
        .pg-root .pv-pane {
          display: flex;
          flex-direction: column;
        }
        .pg-root .pv-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-bottom: 1px solid var(--line);
          background: var(--panel-2);
        }
        .pg-root .pv-url {
          flex: 1;
          font-family: var(--mono);
          font-size: 11px;
          color: var(--muted);
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 6px;
          padding: 5px 9px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          outline: none;
        }
        .pg-root .pvbtn {
          flex: 0 0 auto;
          width: 28px;
          height: 26px;
          border: 1px solid var(--line);
          background: var(--bg);
          color: var(--muted);
          border-radius: 7px;
          cursor: pointer;
          display: grid;
          place-items: center;
        }
        .pg-root .pvbtn:hover {
          color: var(--text);
        }
        .pg-root .pv-seg {
          display: inline-flex;
          gap: 2px;
        }
        .pg-root .pv-seg .pvbtn {
          width: auto;
          padding: 0 8px;
          font-size: 11px;
          font-weight: 600;
        }
        .pg-root .pvbtn.on {
          color: var(--teal);
          background: rgba(95, 176, 176, 0.12);
        }
        .pg-root .pvbtn svg.i {
          width: 14px;
          height: 14px;
        }
        .pg-root .pv-frame {
          flex: 1;
          min-height: 0;
          background: #fff;
        }
        .pg-root .pv-frame iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
        .pg-root .pv-frame .empty {
          background: var(--surface);
          height: 100%;
        }

        /* tests tab */
        .tline {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 12px;
          border-bottom: 1px solid var(--border-soft);
          font-size: 12px;
          color: var(--text);
        }
        .pg-root .tline .badge {
          margin-left: auto;
        }
        .pg-root .badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 99px;
        }
        .pg-root .b-pass {
          background: rgba(95, 176, 176, 0.16);
          color: var(--teal);
        }
        .pg-root .b-todo {
          background: var(--panel);
          color: var(--muted);
        }

        /* ── task drawer ── */
        .drawer-scrim {
          position: absolute;
          inset: 0;
          z-index: 20;
          background: rgba(0, 0, 0, 0.4);
          border: 0;
          cursor: pointer;
        }
        .pg-root .drawer {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 560px;
          max-width: 88vw;
          background: var(--surface);
          border-left: 1px solid var(--line);
          box-shadow: -24px 0 50px -28px rgba(2, 6, 23, 0.28);
          transform: translateX(105%);
          transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
          display: flex;
          flex-direction: column;
          z-index: 30;
        }
        .pg-root .drawer.open {
          transform: none;
        }
        .pg-root .dh {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px 18px;
          border-bottom: 1px solid var(--line);
          background: var(--panel-2);
        }
        .pg-root .dh .pts {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-left: auto;
          font-family: var(--mono);
          font-size: 11px;
          font-weight: 700;
          color: var(--gold);
          background: rgba(242, 201, 76, 0.12);
          border: 1px solid rgba(242, 201, 76, 0.28);
          padding: 4px 10px;
          border-radius: 99px;
          white-space: nowrap;
        }
        .pg-root .dh .pts svg.i {
          width: 12px;
          height: 12px;
          color: var(--gold);
        }
        .pg-root .dh .pts.done {
          color: var(--teal);
          background: rgba(95, 176, 176, 0.14);
          border-color: rgba(95, 176, 176, 0.35);
        }
        .pg-root .dh .pts.done svg.i {
          color: var(--teal);
        }
        .pg-root .dmeta {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .pg-root .tag {
          font-size: 10px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          font-weight: 700;
          color: var(--muted);
          background: var(--panel-2);
          border: 1px solid var(--line);
          border-radius: 6px;
          padding: 2px 7px;
        }
        .pg-root .task-desc code {
          font-family: var(--mono);
          font-size: 12px;
          color: var(--cyan-2);
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 6px;
          padding: 1px 6px;
          white-space: pre-wrap;
          word-break: break-word;
        }
        /* request/expected two-column inputs */
        .pg-root .two {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        /* test results */
        .pg-root .checks {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .pg-root .chk {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border: 1px solid var(--line);
          border-radius: 9px;
          font-size: 13px;
          color: var(--text);
        }
        .pg-root .chk .ci {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          flex: 0 0 18px;
          font-size: 12px;
          background: var(--panel-2);
          color: var(--muted);
        }
        .pg-root .chk .ci svg.i {
          width: 11px;
          height: 11px;
        }
        .pg-root .chk.ok {
          border-color: rgba(95, 176, 176, 0.35);
        }
        .pg-root .chk.ok .ci {
          background: var(--teal-deep);
          color: #fff;
        }
        .pg-root .chk.no {
          border-color: rgba(239, 93, 107, 0.3);
        }
        .pg-root .chk.no .ci {
          background: rgba(239, 93, 107, 0.18);
          color: var(--red);
        }
        .pg-root .chk .lab {
          flex: 1;
          min-width: 0;
        }
        .pg-root .chk .lab.muted {
          color: var(--muted);
        }
        .pg-root .chk .ex {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--teal);
          white-space: nowrap;
        }
        .pg-root .chk.no .ex {
          color: var(--red);
        }
        .pg-root .ci.run svg.i {
          width: 14px;
          height: 14px;
          color: var(--cyan);
        }
        .pg-root .spin {
          animation: pg-spin 1s linear infinite;
        }
        .pg-root .dh h2 {
          margin: 2px 0 6px;
          font-size: 17px;
        }
        .pg-root .endpoint {
          display: flex;
          align-items: center;
          gap: 9px;
          font-family: var(--mono);
          font-size: 13px;
        }
        .pg-root .endpoint .meth {
          font-size: 11px;
        }
        .pg-root .endpoint .u {
          color: var(--text);
        }
        .pg-root .db {
          flex: 1;
          overflow: auto;
          padding: 16px 18px;
        }
        .pg-root .sec {
          margin-bottom: 18px;
        }
        .pg-root .sec h4 {
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted-2);
          margin: 0 0 8px;
          font-weight: 700;
        }
        .pg-root .spec {
          margin: 0;
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 12px 14px;
          font-family: var(--mono);
          font-size: 12px;
          line-height: 1.7;
          color: var(--text);
          overflow: auto;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .pg-root .task-desc {
          color: var(--text);
          line-height: 1.6;
          font-size: 13px;
        }
        .pg-root .task-desc p {
          margin: 0 0 8px;
        }
        .pg-root .task-desc pre {
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 12px 14px;
          overflow: auto;
          font-family: var(--mono);
          font-size: 12px;
        }
        .pg-root .task-desc code {
          font-family: var(--mono);
          font-size: 12px;
          background: rgba(127, 140, 170, 0.18);
          padding: 1px 5px;
          border-radius: 5px;
        }
        .pg-root .task-desc a {
          color: var(--gold);
        }
        .pg-root .task-desc h3,
        .pg-root .task-desc h4 {
          margin: 14px 0 6px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
        }
        .pg-root .task-desc ul,
        .pg-root .task-desc ol {
          margin: 0 0 8px;
          padding-left: 20px;
        }
        .pg-root .task-desc ul {
          list-style: disc;
        }
        .pg-root .task-desc ol {
          list-style: decimal;
        }
        .pg-root .task-desc li {
          margin: 2px 0;
        }
        .pg-root .task-desc pre code {
          background: none;
          padding: 0;
          font-size: inherit;
        }
        .pg-root .df {
          display: flex;
          gap: 10px;
          padding: 14px 18px;
          border-top: 1px solid var(--line);
          align-items: center;
        }
        .pg-root .df .hint {
          font-size: 11px;
          color: var(--muted);
          flex: 1;
        }

        /* ── Kap AI chat ── */
        .railKap {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }
        .pg-root .chat {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0;
        }
        .pg-root .chat-b {
          flex: 1;
          overflow: auto;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .pg-root .msg {
          display: flex;
          gap: 9px;
          max-width: 92%;
        }
        .pg-root .msg.me {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .pg-root .msg.ai {
          align-self: flex-start;
        }
        .pg-root .msg .av {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          flex: 0 0 26px;
          display: grid;
          place-items: center;
          font-weight: 800;
          font-size: 11px;
          overflow: hidden;
        }
        .pg-root .msg .av .av-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 8px;
        }
        .pg-root .msg.ai .av {
          background: rgba(19, 174, 206, 0.15);
          color: var(--cyan);
          border: 1px solid rgba(19, 174, 206, 0.3);
        }
        .pg-root .msg.me .av {
          background: var(--panel-2);
          color: var(--muted);
          border: 1px solid var(--line);
        }
        .pg-root .bub {
          padding: 9px 12px;
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.6;
        }
        .pg-root .msg.ai .bub {
          background: var(--panel);
          border: 1px solid var(--line);
          border-top-left-radius: 3px;
          color: var(--text);
        }
        .pg-root .msg.me .bub {
          background: linear-gradient(135deg, var(--cyan), var(--cyan-2));
          color: #06222b;
          border-top-right-radius: 3px;
          font-weight: 500;
        }
        .pg-root .kapnote {
          display: flex;
          gap: 8px;
          margin: 12px 12px 4px;
          padding: 8px 10px;
          border-radius: 9px;
          font-size: 11.5px;
          line-height: 1.5;
          color: #e3c77a;
          background: rgba(242, 201, 76, 0.08);
          border: 1px solid rgba(242, 201, 76, 0.25);
        }
        .pg-root .kapnote svg.i {
          width: 16px;
          height: 16px;
          flex: 0 0 16px;
          margin-top: 1px;
          color: var(--gold);
        }
        .pg-root .kapnote b {
          color: var(--gold);
        }
        .pg-root .sugg {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          padding: 0 14px 10px;
        }
        .pg-root .sugg button {
          font: inherit;
          font-size: 11.5px;
          color: var(--muted);
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 99px;
          padding: 6px 11px;
          cursor: pointer;
        }
        .pg-root .sugg button:hover {
          color: var(--text);
        }
        .pg-root .typing {
          display: flex;
          gap: 4px;
          padding: 2px;
        }
        .pg-root .typing i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--muted);
          animation: pg-bounce 1s infinite;
        }
        .pg-root .typing i:nth-child(2) {
          animation-delay: 0.15s;
        }
        .pg-root .typing i:nth-child(3) {
          animation-delay: 0.3s;
        }
        @keyframes pg-bounce {
          0%,
          60%,
          100% {
            opacity: 0.3;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }
      `}</style>
    </div>
  );
}
