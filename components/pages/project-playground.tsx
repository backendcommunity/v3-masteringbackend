"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { getUser, Project, updateUser } from "@/lib/data";
import Editor, { OnChange } from "@monaco-editor/react";
import { useAppStore } from "@/lib/store";
import { usePlaygroundControls } from "@/lib/playground-controls-store";
import { Loader } from "../ui/loader";
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
import socket from "@/lib/socketIo";
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
import { Terminal } from "../atoms/Terminal";
import { ChatInput } from "../pages/mock-interviews/chat/chat-input";
import { usePathname, useSearchParams } from "next/navigation";
import { fetchUser } from "@/lib/auth";
import { Label } from "../ui/label";
import { useIsMobile } from "@/hooks/use-mobile";

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

// Render a task description: turn `backtick` spans into <code>, preserve
// newlines via white-space:pre-wrap on the container. Plain text in → JSX out.
const fmtInstr = (raw?: string) => {
  const s = (raw || "").trim();
  if (!s) return "No description yet.";
  return s.split("`").map((seg, i) =>
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
  const [previewUrl, setPreviewUrl] = useState("http://localhost:3000");
  const [showTerminal, setShowTerminal] = useState(false); // collapsed to header by default
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [markAsCompleted, setMarkAsCompleted] = useState(false);
  const [activeTask, setActiveTask] = useState<any>();
  const [testRun, setTestRun] = useState<{
    status: "idle" | "running" | "pass" | "fail";
    checks: { label: string; ok: boolean }[];
  }>({ status: "idle", checks: [] });
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
  const [activeTab, setActiveTab] = useState("tasks");
  const [railTab, setRailTab] = useState<"tasks" | "explorer" | "kap">("tasks");
  const [rightTab, setRightTab] = useState<"preview" | "tests">("preview");
  const [kapMessages, setKapMessages] = useState<
    { role: "ai" | "me"; text: string }[]
  >([
    {
      role: "ai",
      text: "Hi — I'm Kap. I'll point you in the right direction, but I won't write the code for you — that's your build. Ask about the task, an error, or what's failing.",
    },
  ]);
  const [kapThinking, setKapThinking] = useState(false);
  const [code, setCode] = useState(fileTree?.[0]?.children?.[0]?.content || "");
  const [currentLanguage, setCurrentLanguage] = useState("javascript");
  const [showPayment, setShowPayment] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [connected, setConnected] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [language, setLanguage] = useState("");
  const [restart, setRestart] = useState(false);
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
  const editorRef = useRef<any>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const editorMenuRef = useRef<HTMLDivElement>(null);
  // ── refs for the mock's flex-basis drag resizers (rail / right / terminal) ──
  const railRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const lastTermH = useRef("150px"); // remembers expanded height across collapse
  const fileBuffer: Record<string, NodeJS.Timeout> = {};
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

  useEffect(() => {
    setLoading(true);
    async function findProject(slug: string) {
      const project = await store.getProject(slug);
      setProject(project);
      setLoading(false);
    }
    setConnected(!!user?.githubInstallationId || !!user?.github);
    findProject(slug);
  }, [slug, user?.github, user?.githubInstallationId]);

  // The socket auto-connects at import — before the user is known — so its
  // handshake has no userId and mb-executor rejects it. Once the user loads,
  // force a fresh handshake so the auth callback re-sends the real userId.
  // Buffered emits (e.g. folder:read) flush automatically on (re)connect.
  useEffect(() => {
    if (!user?.id) return;
    if (!socket.connected) {
      socket.disconnect();
      socket.connect();
    }
  }, [user?.id]);

  // Embedded in a path step → publish Run/Preview state + handlers so the path
  // top bar can render them (this component's own header is hidden).
  useEffect(() => {
    if (!embedded) return;
    setPgControls({
      active: true,
      connected,
      isRunning,
      previewVisible: isRightPanelVisible,
      runServer: () => runServerRef.current?.(),
      togglePreview: () => togglePreviewRef.current?.(),
    });
  }, [
    embedded,
    connected,
    isRunning,
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

  useEffect(() => {
    socket.emit("folder:read", {
      userId: user?.id,
      projectName: slug,
      // Project-root, relative to the sandbox dir. The executor's
      // safeResolvePath rejects an absolute "/", so root must be "".
      path: "",
      installationId: user?.githubInstallationId,
      github: user?.github,
    });

    socket.on("folder:response", (data) => {
      setLoadingFiles(true);
      // Do NOT auto-open a file — land on the welcome/get-started card (matches
      // the design). The user opens a file from Files or starts a task.
      setFileTree(data.files);
      setLoadingFiles(false);
    });

    socket.on("folder:restart", (data) => {
      setLoadingFiles(true);
      setRestart(true);
      console.log(data);
      setLoadingFiles(false);
    });

    socket.on("project:commit:result", (data) => {
      console.log(data);
      setIsSaving(false);
    });

    socket.on("project:run:error", (data) => {
      setTerminalOutput((prev) => {
        if (prev === data?.message) return prev;
        return [...prev, data?.message];
      });
      setIsRunning(false);
    });

    socket.on("project:running", (data) => {
      setBaseURL(data?.url);
      setTerminalOutput((prev) => {
        if (prev === data?.message) return prev;
        return [...prev, `[BASE_URL]: ${data?.url}`];
      });
      setProgressValue(100);
      setIsRunning(false);
    });

    let chunks: any = [];
    let downloadFilename = "download.zip";
    socket.on("project:download:start", ({ filename }) => {
      chunks = [];
      downloadFilename = filename;
      setDownloadProgress(0);
    });

    socket.on("project:download:chunk", (chunk) => {
      chunks.push(chunk);
    });

    socket.on("project:download:progress", ({ percent }) => {
      setProgressText(`Downloading your project... ${percent}%`);
      setTerminalOutput((prev) => {
        return [...prev, `Downloading your project... ${percent}%`];
      });
      setDownloadProgress(percent);
    });

    socket.on("project:download:end", () => {
      const blob = new Blob(chunks, { type: "application/zip" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = downloadFilename;
      a.click();

      URL.revokeObjectURL(url);
      setDownloadProgress(100);
      setProgressText(`Project downloaded successfull... ${100}%`);
      setTerminalOutput((prev) => {
        return [...prev, `Project downloaded successfull... ${100}%`];
      });
    });

    socket.on("project:download:error", (data) => {
      toast.error(data.message);
      setTerminalOutput((prev) => {
        if (prev === data?.message) return prev;
        return [...prev, data?.message];
      });
    });

    socket.on("project:run:status", (data) => {
      setTerminalOutput((prev) => {
        if (prev === data?.message) return prev;
        return [...prev, data?.message];
      });
    });
  }, []);

  useEffect(() => {
    const file = findFile(fileTree, activeFile);
    if (file) {
      setCurrentLanguage(file.language || getLanguageFromFileName(file.name));
    }
  }, [activeFile, fileTree]);

  // Drag-resize for rail / right pane / terminal (ported from the mock).
  // MUST stay above the early returns below — hooks run unconditionally.
  const startResize = useCallback(
    (kind: "rail" | "right" | "term") =>
      (e: React.MouseEvent) => {
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
        const start =
          kind === "term" ? target.offsetHeight : target.offsetWidth;
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

  if (loading || loadingFiles) return <Loader isLoader={false} />;
  if (!project?.enrolled)
    return (
      <div className="container max-w-4xl py-12">
        <Card>
          <CardHeader>
            <CardTitle>Not enrolled</CardTitle>
            <CardDescription>
              You need to enroll to access the playground.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => onNavigate(`/projects/${slug}`)}>
              View Project
            </Button>
          </CardFooter>
        </Card>
      </div>
    );

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
  const currentTaskId = tasks?.find(
    (t: any) => !t?.userTask?.isCompleted,
  )?.id;
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
  const handleProjectSetup = () => {
    socket.emit("project:start", {
      userId: user?.id,
      template: language,
      projectName: slug,
      installationId: user?.githubInstallationId,
      github: user?.github,
    });

    socket.on("clone:progress", (data) => {
      setShowProgress(true);
      setProgressText(data.message);
      setProgressValue(Math.min(Math.max(data.percent, 0), 100));
    });

    socket.on("project:error", (data) => {
      console.log(data);
    });

    socket.on("clone:done", (data) => {
      // Update userproject if cloned successfully
      setShowProgress(true);
      setProgressText(data.message);
      setProgressValue(100);
      setRestart(false);

      // Read file again
      socket.emit("folder:read", {
        userId: user?.id,
        projectName: slug,
        path: "",
        installationId: user?.githubInstallationId,
        github: user?.github,
      });
    });
  };

  const handleEnrollNow = async () => {
    try {
      if (!user?.isPremium && project.isPremium && !project.enrolled) {
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
  const refreshTree = () => {
    socket.emit("folder:read", {
      userId: user?.id,
      projectName: slug,
      path: "",
      installationId: user?.githubInstallationId,
      github: user?.github,
    });
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

  const autoSaveAndCommit = () => {
    const now = Date.now();

    // Throttle commits: only every 2 min
    if (now - lastAutoCommit.current < AUTO_COMMIT_INTERVAL) return;

    if (!fileTree || fileTree.length === 0) return;

    setIsSaving(true);
    lastAutoCommit.current = now;

    socket.emit("project:save", {
      userId: user?.id,
      projectSlug: project?.slug,
      token: user?.github,
      installationId: user?.githubInstallationId,
      files: fileTree,
    });
  };

  const manualSave = () => {
    clearTimeout(idleTimer?.current!); // cancel pending autosave

    if (!fileTree || fileTree.length === 0) return;

    setIsSaving(true);
    lastAutoCommit.current = Date.now();

    socket.emit("project:save", {
      userId: user?.id,
      projectSlug: project?.slug,
      token: user?.github,
      installationId: user?.githubInstallationId,
      files: fileTree,
    });
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

  const addItem = (name: string) => {
    if (!creatingItem?.parentPath || !creatingItem.type) return;

    const language = getLanguageFromFileName(name);

    let newItem: FileNode | any = {
      name,
      type: creatingItem.type,
      icon: creatingItem.type === "folder" ? "" : "📄",
      path: `${creatingItem.parentPath}/${name}`,
    };

    if (creatingItem.type.includes("file"))
      socket.emit("file:create", {
        userId: user?.id,
        name,
        path: toRel(`${creatingItem.parentPath}/${name}`),
      });
    else
      socket.emit("folder:create", {
        userId: user?.id,
        path: toRel(`${creatingItem.parentPath}/${name}`),
      });

    socket.on("file:created", (data) => {
      setLoadingFiles(true);

      newItem = {
        ...data,
        name,
        type: creatingItem.type,
        language,
      };

      setFileTree((prev) => addToTree(prev, newItem));
      if (creatingItem?.type?.includes("file")) openFile(newItem);

      setActiveFile(newItem.path);
      setOpenFiles([newItem.path]);
      setLoadingFiles(false);
    });

    socket.on("folder:created", (data) => {
      setLoadingFiles(true);

      newItem = {
        ...data,
      };

      setFileTree((prev) => addToTree(prev, newItem));
      setLoadingFiles(false);
    });

    socket.on("file:error", (data) => {
      setLoadingFiles(true);
      toast.error(data);
      console.log(data);
      setLoadingFiles(false);
    });

    setCreatingItem(null);
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

  const openFile = (file: FileNode) => {
    const filePath = file.path;
    socket.emit("file:open", { userId: user?.id, path: toRel(filePath) });
    socket.once("file:opened", ({ content }) => {
      const fileName = file.name;
      const _file = findFile(fileTree, filePath);
      if (_file) {
        setActiveFile(filePath);
        setCode(content);
        setCurrentLanguage(_file.language || getLanguageFromFileName(fileName));
        if (!openFiles.includes(filePath)) {
          setOpenFiles([...openFiles, filePath]);
        }
      }
    });
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

  const handleDownloadProject = () => {
    if (!user?.isPremium) return;
    socket.emit("project:download:stream", {
      projectName: slug,
      userId: user?.id,
    });

    setShowLoader(true);
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
    clearTimeout(fileBuffer[activeFile]);

    fileBuffer[activeFile] = setTimeout(async () => {
      socket.emit("file:flush", {
        userId: user?.id,
        path: toRel(activeFile),
        content: value,
      });
    }, 300); // Wait 300ms after last change

    // clearTimeout(idleTimer?.current!);
    idleTimer.current = setTimeout(
      () => autoSaveAndCommit(),
      AUTO_COMMIT_INTERVAL,
    ) as any;
    setCode(value ?? "");
  };

  const handleDeleteFile = (file: FileNode) => {
    if (!file) return;

    const event = file.type === "file" ? "file:delete" : "folder:delete";
    socket.emit(event, {
      userId: user?.id,
      path: toRel(file.path),
    });

    // Recursively remove deleted file/folder from the tree
    const removeNode = (nodes: FileNode[], targetPath: string): FileNode[] => {
      return nodes
        .filter((node) => node.path !== targetPath)
        .map((node) =>
          node.children
            ? { ...node, children: removeNode(node.children, targetPath) }
            : node,
        );
    };

    socket.on("file:deleted", (data) => {
      if (!data.success) return;
      setFileTree((prevTree) => removeNode(prevTree, file.path));
      setDeleteFile(null);
    });

    socket.on("folder:deleted", (data) => {
      if (!data.success) return;
      setFileTree((prevTree) => removeNode(prevTree, file.path));
      setDeleteFile(null);
    });
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
                <span className="nm">
                  {depth === 0 ? project?.title || "Project files" : node.name}
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

  // Run the task's test: hits the (manual, for now) completion endpoint, shows a
  // running state, then renders the pass/fail assertion rows. Keeps the drawer
  // open so the learner sees the result.
  const runTaskTest = async (t: any) => {
    if (!t) return;
    setTestRun({ status: "running", checks: [] });
    try {
      // Ensure the learner is enrolled (path steps may land here un-enrolled),
      // then mark/verify the task.
      let completed;
      try {
        completed = await store.markProjectTaskAsCompleted(slug, t.id);
      } catch {
        await store.handleProjectEnrollment(slug);
        completed = await store.markProjectTaskAsCompleted(slug, t.id);
      }
      setProject((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          projectTasks: prev.projectTasks.map((pt: any) => ({
            ...pt,
            tasks: pt.tasks.map((task: any) =>
              task?.id === completed.taskId
                ? { ...task, userTask: { ...task.userTask, isCompleted: true } }
                : task,
            ),
          })),
        };
      });
      setActiveTask((p: any) =>
        p ? { ...p, userTask: { ...p.userTask, isCompleted: true } } : p,
      );
      setTestRun({ status: "pass", checks: synthChecks(t) });
      setCelebration(true);
      toast.success("All assertions passed — task complete");
      // Only advance the path step once EVERY task in the project is done —
      // a single task passing keeps the drawer + results on screen.
      const allTasks = (project?.projectTasks ?? []).flatMap(
        (pt: any) => pt.tasks ?? [],
      );
      const allDone = allTasks.every(
        (task: any) => task?.userTask?.isCompleted || task?.id === t.id,
      );
      if (allDone) onComplete?.();
    } catch {
      setTestRun({
        status: "fail",
        checks: [{ label: "Could not verify — try again", ok: false }],
      });
      toast.error("Test run failed. Try again.");
    }
  };

  const kapReply = (q: string) => {
    const s = q.toLowerCase();
    if (s.includes("fail") || s.includes("email"))
      return "Re-read your failing assertion. The test compares the response to what it sent — are you echoing the value from the request body, or altering it? Fix that and re-run.";
    if (s.includes("201") || s.includes("status"))
      return "The test expects a specific status code. Look up how your framework sets a status on a JSON response (it's a method on the response object, before sending the body).";
    if (s.includes("hint"))
      return "Break it into steps: read the inputs from the request, build the record, persist it, then return it with the right status. Try one step at a time and run the test.";
    if (
      s.includes("write") ||
      s.includes("code") ||
      s.includes("solution") ||
      s.includes("do it")
    )
      return "I won't write it for you — that's the whole point of the build. Tell me which part you're stuck on and I'll nudge you.";
    return "Re-read the task contract: method, URL, request, and expected response. Which step are you on?";
  };

  const handleKapSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setKapMessages((prev) => [...prev, { role: "me", text: trimmed }]);
    setKapThinking(true);
    setTimeout(() => {
      setKapMessages((prev) => [
        ...prev,
        { role: "ai", text: kapReply(trimmed) },
      ]);
      setKapThinking(false);
    }, 850);
  };

  const openTaskDrawer = (task: any) => {
    setActiveTask(task);
    setShowTask(true);
    setTestRun(
      task?.userTask?.isCompleted
        ? { status: "pass", checks: synthChecks(task) }
        : { status: "idle", checks: [] },
    );
  };

  const handleRunProject = () => {
    setIsRunning(true);
    socket.emit("project:run", {
      language: project?.template ?? "node",
      projectName: slug,
      userId: user?.id,
      installationId: user?.githubInstallationId,
    });

    setTerminalOutput(terminalSample);
  };

  // Keep the refs the path top bar calls pointed at the live handlers.
  runServerRef.current = handleRunProject;
  togglePreviewRef.current = () => setIsRightPanelVisible((p) => !p);

  const connectGitHub = () => {
    window.location.href = `https://github.com/login/oauth/authorize?client_id=Ov23li2TmT8axelh1vDq&scope=repo,user&state=githupapp+${encodeURIComponent(
      window.location.origin + pathname,
    )}+${user?.email}`;
  };

  // Collapse the terminal to just its 32px header (keep it on screen), expand
  // back to the last height. The .term panel is shrunk via flex-basis; its
  // overflow:hidden clips the body so only the header shows.
  const toggleTerminal = () => {
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
        action: () =>
          setEditorTheme((t) => (t === "mb-dark" ? "mb-light" : "mb-dark")),
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
      { label: "separator", action: () => {} },
      {
        label: "Open in new tab",
        action: () => baseURL && window.open(baseURL, "_blank"),
      },
    ];

    const close = () =>
      setEditorContextMenu((p) => ({ ...p, visible: false }));

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
        className="absolute top-5 left-1 bg-secondary text-white shadow-lg rounded-lg py-1 w-40 z-50"
        onClick={(e) => e.stopPropagation()}
      >
        {menuItems?.map((item: any, i: number) => {
          return item.label === "separator" ? (
            <div key={i} className="my-0.5 bg-gray-700 h-[1px]"></div>
          ) : (
            <div
              key={i}
              onClick={() => item.action()}
              className="px-3 my- py-2 hover:bg-primary cursor-pointer text-sm"
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
  const resolvedPreviewUrl = baseURL || previewUrl;

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
    restart: (
      <svg className="i" viewBox="0 0 24 24">
        <path d="M3 12a9 9 0 1 0 2.6-6.3" />
        <path d="M3 4v4h4" />
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
  } as const;

  const railBtns = [
    { k: "tasks" as const, label: "Tasks", icon: I.tasks },
    { k: "explorer" as const, label: "Files", icon: I.files },
    { k: "kap" as const, label: "Kap", icon: I.kap },
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
  const tReq = tSpec.request || activeTask?.request;
  const tRes = tSpec.response || activeTask?.response;

  return (
    <div className="pg-root">
      {/* ── TOP BAR (standalone only — in the path step the controls move to
          the PathTopBar and this header is hidden) ── */}
      {!embedded && (
      <div className="topbar">
          <button
            className="logo"
            aria-label="Back to project"
            title="Back to project"
            onClick={() => onNavigate("/projects/" + slug)}
          >
            M
          </button>
          <div className="crumb">
            Build&nbsp;&nbsp;›&nbsp;&nbsp;<b>{project?.title}</b>
          </div>
          <div className="spacer" />
          <div className="status" aria-live="polite">
            <span className={cn("dot", !sandboxLive && "off")} />
            <span>
              {sandboxLive ? "sandbox live · :3000" : "sandbox idle"}
            </span>
          </div>
          <button
            className="btn run"
            onClick={handleRunProject}
            disabled={isSaving || isRunning || !connected}
          >
            {I.play} {isRunning ? "Running…" : "Run server"}
          </button>
          <button
            className={cn("btn", isRightPanelVisible && "on")}
            onClick={() => setIsRightPanelVisible((p) => !p)}
            title="Toggle preview & tests"
            aria-pressed={isRightPanelVisible}
          >
            {I.preview} Preview
          </button>
          <button
            className="btn ghost"
            onClick={() => setRestart(true)}
            title="Restart project"
            aria-label="Restart project"
          >
            {I.restart}
          </button>
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
          {!connected && (
            <button
              className="btn ghost"
              onClick={connectGitHub}
              title="Connect GitHub"
              aria-label="Connect GitHub"
              style={{ color: "var(--red)" }}
            >
              {I.link}
            </button>
          )}
        </div>
      )}

      {/* ── WORKSPACE ── */}
      <div className="ws" data-mp={mobilePane}>
        {/* LEFT RAIL */}
        <div className="rail col border-r border-border" ref={railRef} style={{ boxShadow: "inset -1px 0 0 var(--line)" }}>
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
                      {doneCount}/{totalCount} · {earnedPts} pts
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
            <div className="explorer-pane">
              <div className="exhead border-b border-border" ref={fileMenuRef} style={{ boxShadow: "inset 0 -1px 0 var(--line)" }}>
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
            <div className="railKap">
              <div className="chat">
                <div className="kapnote">
                  {I.bolt}
                  <span>
                    Each time you ask Kap, it costs a little{" "}
                    <b>XP</b>. Kap <b>guides</b> you — it won't write the
                    solution for you. Try the task first.
                  </span>
                </div>
                <div className="chat-b">
                  {kapMessages.map((m, i) => (
                    <div key={i} className={cn("msg", m.role)}>
                      <div className="av">
                        {m.role === "ai" ? (
                          "✦"
                        ) : user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user?.name || "You"}
                            className="av-img"
                          />
                        ) : (
                          userInitials
                        )}
                      </div>
                      <div className="bub">{m.text}</div>
                    </div>
                  ))}
                  {kapThinking && (
                    <div className="msg ai">
                      <div className="av">✦</div>
                      <div className="bub">
                        <div className="typing">
                          <i />
                          <i />
                          <i />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="sugg">
                  {[
                    "Why is my test failing?",
                    "How do I return 201?",
                    "Give me a hint",
                  ].map((s) => (
                    <button key={s} onClick={() => handleKapSend(s)}>
                      {s}
                    </button>
                  ))}
                </div>
                <ChatInput
                  onSend={handleKapSend}
                  placeholder="Ask Kap for a hint…"
                />
              </div>
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
          <div className="tabs border-b border-border" ref={editorMenuRef} style={{ boxShadow: "inset 0 -1px 0 var(--line)" }}>
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

          {/* editor OR welcome */}
          {openFiles.length === 0 ? (
            <div className="welcome">
              <div className="wcard">
                <div className="weyebrow">
                  <span className="wlogo">M</span> PROJECT · Backend
                </div>
                <h1>{project?.title}</h1>
                {project?.summary && (
                  <p
                    className="wsum"
                    dangerouslySetInnerHTML={{ __html: project.summary }}
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
                    {I.spark} {totalPts} XP
                  </span>
                </div>
                {project?.technologies?.length > 0 && (
                  <div className="wtags">
                    {project.technologies.map((t: string) => (
                      <span className="wtag" key={t}>
                        {t}
                      </span>
                    ))}
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
                  <button
                    className="btn run"
                    onClick={() => {
                      const firstFile =
                        fileTree[0]?.children?.find(
                          (f) => f.type === "file" && !f.isBlocked,
                        ) || fileTree.find((f) => f.type === "file");
                      if (firstFile) openFile(firstFile);
                      else setRailTab("explorer");
                    }}
                  >
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
            <div className="editor-host">
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
                  scrollbar: { verticalScrollbarSize: 9, horizontalScrollbarSize: 9 },
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
            className={cn(
              "term border-t border-border",
              !showTerminal && "collapsed",
            )}
            ref={termRef}
            style={{ boxShadow: "inset 0 1px 0 var(--line)" }}
          >
            <Terminal
              collapsed={!showTerminal}
              onToggle={toggleTerminal}
              onClose={() => toggleTerminal()}
              slug={slug}
              output={terminalOutput}
            />
          </div>
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
            <div className="right col border-l border-border" ref={rightRef} style={{ boxShadow: "inset 1px 0 0 var(--line)" }}>
              <div className="rtabs border-b border-border" style={{ boxShadow: "inset 0 -1px 0 var(--line)" }}>
                <button
                  className={cn("seg-b", rightTab === "preview" && "on")}
                  onClick={() => setRightTab("preview")}
                >
                  {I.monitor} Preview
                </button>
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
                  <div className="pv-bar border-b border-border" style={{ boxShadow: "inset 0 -1px 0 var(--line)" }}>
                    <input
                      className="pv-url"
                      type="text"
                      value={baseURL || ""}
                      onChange={(e) => setPreviewUrl(e.target.value)}
                      placeholder="Sandbox URL appears here after Run server"
                      aria-label="Preview URL"
                      readOnly={!baseURL}
                    />
                    <button
                      className="pvbtn"
                      title="Refresh preview"
                      aria-label="Refresh preview"
                      onClick={() => {
                        setPreviewUrl((prev) => {
                          const base = baseURL || prev;
                          const url = new URL(base, window.location.origin);
                          url.searchParams.set("_t", Date.now() + "");
                          return url.toString();
                        });
                      }}
                    >
                      {I.refresh}
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
                        src={resolvedPreviewUrl}
                        title="Project preview"
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
                            <span className="tnum">{taskNumber[task.id]} ·</span>{" "}
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
              <div className="dh border-b border-border" style={{ boxShadow: "inset 0 -1px 0 var(--line)" }}>
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
                    {I.spark} {activeTask.mb} XP
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

                {(tReq || tRes) && (
                  <div className="two">
                    <div className="sec">
                      <h4>Request we send</h4>
                      <div className="spec">{tReq || "—"}</div>
                    </div>
                    <div className="sec">
                      <h4>Expected response</h4>
                      <div className="spec">{tRes || "—"}</div>
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
                    {(testRun.status === "pass" ||
                      testRun.status === "fail") &&
                      testRun.checks.map((c, i) => (
                        <div
                          key={i}
                          className={cn("chk", c.ok ? "ok" : "no")}
                        >
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
                <span className="hint">
                  Runs your endpoint in the sandbox and checks each assertion.
                </span>
                <button
                  className="btn run"
                  onClick={() => runTaskTest(activeTask)}
                  disabled={
                    testRun.status === "running" ||
                    activeTask?.userTask?.isCompleted
                  }
                >
                  {I.play}{" "}
                  {activeTask?.userTask?.isCompleted
                    ? "Passed"
                    : testRun.status === "running"
                      ? "Running…"
                      : "Run test"}
                </button>
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
              <Settings className="h-5 w-5 text-amber-400" />
              Restart your Project...
            </DialogTitle>
            <DialogDescription>
              Relax! Let Kap AI do the hard work.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-3">
            <Label>Choose your preferred language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages
                  .filter((l) => l.supported)
                  .map((l) => (
                    <SelectItem key={l.code} value={l.code}>
                      {l.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {!language && (
              <p className="text-red-700 italic text-xs">
                This field is required
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onNavigate(`/projects/${project.slug}`)}
            >
              Back
            </Button>
            <Button variant="destructive" onClick={() => handleEnrollNow()}>
              Restart
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
        disableMB={true}
        disableOnetime={true}
        onClose={() => setShowPayment(false)}
        open={showPayment}
        data={{ ...project, type: "project" }}
        onHandlePreview={() => {}}
        onHandlePurchase={(id: string, type: any, success: boolean) => {}}
      />

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
        .pg-root :global(*) {
          box-sizing: border-box;
        }
        .pg-root :global(svg.i) {
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
        .pg-root .btn :global(svg.i) {
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
        .pg-root .btn.ghost:hover {
          color: var(--text);
          background: var(--panel);
        }
        .pg-root .btn.ghost :global(svg.i) {
          width: 16px;
          height: 16px;
        }
        .pg-root .btn.on {
          background: rgba(19, 174, 206, 0.12);
          border-color: rgba(19, 174, 206, 0.4);
          color: var(--cyan);
        }
        .pg-root .btn:focus-visible, .pg-root .seg button:focus-visible, .pg-root .exact:focus-visible, .pg-root .seg-b:focus-visible, .pg-root .task:focus-visible, .pg-root .tline:focus-visible, .pg-root .pvbtn:focus-visible, .pg-root .sugg button:focus-visible {
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
          .pg-root .mtabs button :global(svg.i) {
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
        .pg-root .seg button :global(svg.i) {
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
        .pg-root .seg button.on :global(svg.i) {
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
        .pg-root .pv-empty :global(svg.i) {
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
        .pg-root .empty :global(svg.i) {
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
        .pg-root .exact :global(svg.i) {
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
        .pg-root .chev :global(svg.i) {
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
        .pg-root .node .ico :global(svg.i) {
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
        .pg-root .node .acts button :global(svg.i) {
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
        .pg-root .ms-h .ic :global(svg.i) {
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
        .pg-root .st :global(svg.i) {
          width: 11px;
          height: 11px;
        }
        .pg-root .st.done {
          background: var(--teal-deep);
          border-color: var(--teal);
          color: #fff;
        }
        .pg-root .st.doing {
          border-color: rgba(19, 174, 206, 0.28);
          border-top-color: var(--cyan);
          animation: pg-spin 0.7s linear infinite;
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
        .pg-root .tab .x :global(svg.i) {
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
          background: radial-gradient(
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
        .pg-root .wsum :global(b) {
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
        .pg-root .wchip :global(svg.i) {
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
        .pg-root .wchip-xp :global(svg.i) {
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
        .pg-root .whint :global(b) {
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
        .pg-root .seg-b :global(svg.i) {
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
        .pg-root .pvbtn :global(svg.i) {
          width: 14px;
          height: 14px;
        }
        .pg-root .pv-frame {
          flex: 1;
          min-height: 0;
          background: #fff;
        }
        .pg-root .pv-frame :global(iframe) {
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
        .pg-root .dh .pts :global(svg.i) {
          width: 12px;
          height: 12px;
          color: var(--gold);
        }
        .pg-root .dh .pts.done {
          color: var(--teal);
          background: rgba(95, 176, 176, 0.14);
          border-color: rgba(95, 176, 176, 0.35);
        }
        .pg-root .dh .pts.done :global(svg.i) {
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
        .pg-root .task-desc :global(code) {
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
        .pg-root .chk .ci :global(svg.i) {
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
        .pg-root .ci.run :global(svg.i) {
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
        }
        .pg-root .task-desc {
          color: var(--text);
          line-height: 1.6;
          font-size: 13px;
        }
        .pg-root .task-desc :global(p) {
          margin: 0 0 8px;
        }
        .pg-root .task-desc :global(pre) {
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 12px 14px;
          overflow: auto;
          font-family: var(--mono);
          font-size: 12px;
        }
        .pg-root .task-desc :global(code) {
          font-family: var(--mono);
          font-size: 12px;
          background: rgba(127, 140, 170, 0.18);
          padding: 1px 5px;
          border-radius: 5px;
        }
        .pg-root .task-desc :global(a) {
          color: var(--gold);
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
        .pg-root .msg .av :global(.av-img) {
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
        .pg-root .kapnote :global(svg.i) {
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
