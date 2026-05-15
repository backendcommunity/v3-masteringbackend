"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Save,
  Share,
  FileText,
  CheckCircle2,
  FolderOpen,
  File,
  ChevronRight,
  ChevronDown,
  X,
  RotateCcw,
  Settings,
  Wrench,
  Check,
  ArrowLeft,
  AlertTriangle,
  Link,
  EllipsisVertical,
  Ellipsis,
} from "lucide-react";
import { getUser, Project, updateUser } from "@/lib/data";
import Editor, { OnChange } from "@monaco-editor/react";
import { Accordion, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { useAppStore } from "@/lib/store";
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
import { getLanguageFromFileName, terminalSample } from "@/lib/utils";
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
import { usePathname, useSearchParams } from "next/navigation";
import { fetchUser } from "@/lib/auth";
import { Label } from "../ui/label";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProjectPlaygroundPageProps {
  slug: string;
  onNavigate: Function;
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

export function ProjectPlaygroundPage({
  slug,
  onNavigate,
}: ProjectPlaygroundPageProps) {
  const lastAutoCommit = useRef(0);
  const idleTimer = useRef(null);
  const store = useAppStore();
  const user = useUser();
  const mobile = useIsMobile();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [project, setProject] = useState<Project>();
  const [activeFile, setActiveFile] = useState("");
  const [showProgress, setShowProgress] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<any[]>([
    "Welcome to MB Projects Terminal",
    "",
  ]);
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [fontSize, setFontSize] = useState(14);
  const [progressText, setProgressText] = useState("");
  const [previewUrl, setPreviewUrl] = useState("http://localhost:3000");
  const [showTerminal, setShowTerminal] = useState(true);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [markAsCompleted, setMarkAsCompleted] = useState(false);
  const [activeTask, setActiveTask] = useState<any>();
  const [celebration, setCelebration] = useState(false);
  const [showTask, setShowTask] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [deleteFile, setDeleteFile] = useState<FileNode | null>();
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(true);
  const [activeTab, setActiveTab] = useState("tasks");
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
      path: "/",
      installationId: user?.githubInstallationId,
      github: user?.github,
    });

    socket.on("folder:response", (data) => {
      setLoadingFiles(true);
      const active = data.files[0].children.find(
        (f: FileNode) => f.type === "file" && !f.isBlocked,
      );
      setActiveFile(active?.path);
      setCode(active?.content);
      setOpenFiles([active?.path]);
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
        path: "/",
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
        // projectName: "my-project",
        path: `${creatingItem.parentPath}/${name}`,
      });
    else
      socket.emit("folder:create", {
        userId: user?.id,
        // projectName: "my-project",
        path: `${creatingItem.parentPath}/${name}`,
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
    socket.emit("file:open", { userId: user?.id, path: filePath });
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
      lineHeight: 1.6,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: "on",
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      renderWhitespace: "selection",
      bracketPairColorization: { enabled: true },
    });
  };

  const handleTyping: OnChange = (value, v) => {
    clearTimeout(fileBuffer[activeFile]);

    fileBuffer[activeFile] = setTimeout(async () => {
      socket.emit("file:flush", {
        userId: user?.id,
        path: activeFile,
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
      path: file.path,
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

  const renderFileTree = (nodes: FileNode[], path: string[] = []) => {
    return nodes.map((node, i) => {
      return (
        <span
          key={node.path + i}
          onContextMenu={(e) => handleRightClick(e, node)}
          ref={treeRef}
        >
          <div className="select-none">
            <div
              className={`flex items-center gap-2 px-2  py-1 rounded text-sm cursor-pointer hover:bg-muted/50 ${
                activeFile === node.path ? "bg-muted" : ""
              }`}
              style={{ paddingLeft: `${(path.length + 1) * 12}px` }}
              onClick={() => {
                if (node.type === "folder") {
                  toggleFolder(node.name);
                } else {
                  openFile(node);
                }
              }}
            >
              {node.type === "folder" && (
                <span className="h-4 flex items-center">
                  {node.isOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </span>
              )}
              {node.type === "file" && (
                <span className="text-md">{node.icon}</span>
              )}

              {renamingItem?.parentPath === contextMenu.target?.path &&
              node.path == contextMenu.target?.path ? (
                <div className="w-full flex items-center">
                  <Input
                    value={renamingItem?.name}
                    autoFocus
                    onChange={(e) => {
                      const name = e.target.value.trim();
                      const exists = isFileExist(nodes, node, name);
                      setRenamingItem((prev) => ({
                        ...prev,
                        name,
                        exists,
                      }));
                    }}
                    className={`z-5 h-8 mb-2 mt-1 w-full border-primary !ring-offset-0 !ring-0 ${
                      renamingItem?.exists ? "border-red-500" : ""
                    }`}
                    onBlur={() => setRenamingItem({})}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !renamingItem?.exists) {
                        addItem((e.target as HTMLInputElement).value);
                      }
                    }}
                  />
                </div>
              ) : (
                <span
                  className={`truncate text-md ${
                    node.isBlocked ? "text-gray-500" : ""
                  }`}
                >
                  {node.name}
                </span>
              )}
            </div>

            {creatingItem?.parentPath === contextMenu.target?.path &&
              node.path == contextMenu.target?.path && (
                <div className="w-full pl-6 flex items-center gap-2">
                  <span>{creatingItem?.type === "folder" ? "📁" : "📄"}</span>

                  <Input
                    autoFocus
                    onChange={(e) => {
                      const name = e.target.value.trim();
                      const exists = isFileExist(nodes, node, name);
                      setCreatingItem((prev) => ({
                        ...prev,
                        name,
                        exists,
                      }));
                    }}
                    className={`z-5 h-8 mb-2 mt-1 w-full border-primary !ring-offset-0 !ring-0 ${
                      creatingItem?.exists ? "border-red-500" : ""
                    }`}
                    onBlur={() => setCreatingItem({})}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !creatingItem?.exists) {
                        addItem((e.target as HTMLInputElement).value);
                      }
                    }}
                  />
                </div>
              )}

            {node.type === "folder" && node.isOpen && node.children && (
              <div>{renderFileTree(node.children, [...path, node.path])}</div>
            )}
          </div>
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

      // House keeping
      const { data } = await getUser();
      updateUser(data);
    } catch (error) {
      toast.error("An error occurred. Please try again");
    } finally {
      setMarking(false);
    }
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

  const connectGitHub = () => {
    window.location.href = `https://github.com/login/oauth/authorize?client_id=Ov23li2TmT8axelh1vDq&scope=repo,user&state=githupapp+${encodeURIComponent(
      window.location.origin + pathname,
    )}+${user?.email}`;
  };

  const editorMenu = () => {
    const menuItems: any = [
      {
        label: "Close All",
        action: () =>
          user?.isPremium ? handleDownloadProject() : setShowPayment(true),
      },
      {
        label: "separator",
        action: () => {},
      },
      {
        label: "Select Theme",
        action: () => console.log("Open Folder in Terminal"),
      },

      {
        label: "Select Font",
        action: () => console.log("Open Folder in Terminal"),
      },
    ];

    return (
      <div
        className="absolute top-5 right-0 bg-secondary text-white shadow-lg rounded-lg py-1 w-40 z-50"
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

  return (
    <div className="flex-1 h-full flex flex-col w-full overflow-hidden">
      {/* Progress Bar */}
      <div className="flex items-center justify-between pb-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => onNavigate("/projects/" + slug)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {/* Back to Projects */}
          </Button>
        </div>
        {project?.status !== "Not Started" && (
          <div className="px-4  w-full">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{project?.progress}%</span>
            </div>
            <Progress value={project?.progress} className="h-1" />
          </div>
        )}

        <div className="flex items-right gap-2">
          <Button
            onClick={manualSave}
            disabled={isSaving || !connected}
            variant="outline"
            size="sm"
          >
            {isSaving ? (
              <i>Saving</i>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>

          <Button variant="outline" size="sm">
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button
            disabled={isSaving || isRunning || !connected}
            onClick={handleRunProject}
            size="sm"
          >
            {isRunning ? (
              <i>Running</i>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run
              </>
            )}
          </Button>

          <Button
            disabled={connected}
            onClick={connectGitHub}
            size="sm"
            variant={"destructive"}
          >
            {isRunning ? (
              <i>Connecting...</i>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                {connected ? "Connected" : "Connect GitHub"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Editor Layout */}
      <div className="flex-1 flex flex-col w-full h-full ">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Sidebar - File Explorer */}
          <ResizablePanel defaultSize={20} minSize={10} maxSize={30}>
            <div className="h-full  flex flex-col border-r bg-muted/20 ">
              <div
                ref={fileMenuRef}
                className="p-3 relative flex justify-between border-b bg-muted/30 "
              >
                <h3 className="font-medium text-sm flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  EXPLORER
                </h3>
                <Button
                  onClick={(e) => {
                    setFileMenu((prev) => {
                      return {
                        visible: !prev.visible,
                        x: e.clientX,
                        y: e.clientY,
                      };
                    });
                  }}
                  size={"sm"}
                  variant={"ghost"}
                  className="!p-0 gap-0 !hover:bg-destructive/90"
                >
                  <Ellipsis />
                </Button>
              </div>
              <div className="p-2 border-b bg-muted/10">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  WORKSPACE
                </p>
              </div>
              <ScrollArea className="flex-1 p-2 relative">
                <div>{renderFileTree(fileTree)}</div>
              </ScrollArea>

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
          </ResizablePanel>

          <ResizableHandle />

          {/* Center - Code Editor */}
          <ResizablePanel className="h-full relative">
            {fileMenu.visible && fileTreeMenu()}

            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={100}>
                <ResizablePanelGroup
                  direction="vertical"
                  className="relative h-full"
                >
                  {editorContextMenu.visible && editorMenu()}
                  <ResizablePanel
                    className=""
                    defaultSize={isRightPanelVisible ? 40 : 70}
                    minSize={30}
                  >
                    <div className="h-full flex flex-col">
                      {/* File Tabs */}
                      <div
                        ref={editorMenuRef}
                        className="flex items-center gap-2 justify-between border-b bg-muted/20"
                      >
                        <ScrollArea>
                          <ScrollBar orientation="horizontal" />

                          <div className="flex items-center">
                            {openFiles.map((filePath) => (
                              <div
                                key={filePath}
                                className={`flex  items-center gap-2 px-3 py-2 text-sm border-r cursor-pointer hover:bg-muted/50 ${
                                  activeFile === filePath ? "bg-background" : ""
                                }`}
                                onClick={() => {
                                  const file = findFile(fileTree, filePath);
                                  openFile(file!);
                                }}
                              >
                                <File className="h-3 w-3" />
                                <span>{getFileName(filePath)}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    closeFile(filePath);
                                  }}
                                  className="hover:bg-muted rounded p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        <Button
                          onClick={(e) =>
                            setEditorContextMenu((prev) => {
                              return {
                                visible: !prev.visible,
                                x: e.clientX,
                                y: e.clientY,
                              };
                            })
                          }
                          variant={"ghost"}
                        >
                          <EllipsisVertical />
                        </Button>
                      </div>

                      {/* Monaco Editor */}
                      <div className="flex-1 relative">
                        {isBlocked ? (
                          <div className="flex items-center justify-center w-full h-full bg-muted/20">
                            <div> Preview not supported </div>
                          </div>
                        ) : (
                          <Editor
                            height="100%"
                            language={currentLanguage}
                            theme={
                              theme?.includes("dark") ? "vs-dark" : "light"
                            }
                            value={code}
                            onChange={handleTyping}
                            onMount={handleEditorDidMount}
                            options={{
                              fontSize: fontSize,
                              fontFamily:
                                "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                              lineHeight: 1.6,
                              minimap: { enabled: true },
                              scrollBeyondLastLine: false,
                              wordWrap: "on",
                              automaticLayout: true,
                              tabSize: 2,
                              insertSpaces: true,
                              renderWhitespace: "selection",
                              bracketPairColorization: { enabled: true },
                              suggestOnTriggerCharacters: true,
                              quickSuggestions: true,
                              parameterHints: { enabled: true },
                              formatOnPaste: true,
                              formatOnType: true,
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </ResizablePanel>

                  {showTerminal && (
                    <>
                      <ResizableHandle />
                      <ResizablePanel defaultSize={15} minSize={10}>
                        {/* TERMINAL */}
                        <Terminal
                          onClose={() => setShowTerminal(false)}
                          slug={slug}
                          output={terminalOutput}
                        />
                      </ResizablePanel>
                    </>
                  )}
                </ResizablePanelGroup>
              </ResizablePanel>

              {/* Right Panel - Instructions & Tools */}
              {isRightPanelVisible && (
                <>
                  <ResizableHandle />
                  <ResizablePanel defaultSize={40} minSize={20}>
                    <div className="h-full flex flex-col">
                      <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        defaultValue="tasks"
                        className="h-full flex flex-col"
                      >
                        <TabsList className="grid w-full grid-cols-4 rounded-none">
                          <TabsTrigger
                            value="tasks"
                            className="flex items-center gap-1"
                          >
                            <span className="hidden sm:inline">Tasks</span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="preview"
                            className="flex items-center gap-1"
                          >
                            {/* <Globe className="h-3 w-3" /> */}
                            <span className="hidden sm:inline">Preview</span>
                          </TabsTrigger>

                          <TabsTrigger
                            value="tools"
                            className="flex items-center gap-1"
                          >
                            <span className="hidden sm:inline">Tools</span>
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent
                          value="tasks"
                          className="flex-1 m-0 max-h-screen overflow-y-auto"
                        >
                          <div className=" flex  flex-col border">
                            <div className="p-3 border-b bg-muted/30">
                              <h3 className="font-medium text-sm flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Project Tasks
                              </h3>
                            </div>
                            <div className="flex-1 p-4">
                              <Accordion type="single" collapsible>
                                {tasks?.map((task: any, i: number) => (
                                  <AccordionItem
                                    key={task.id + i}
                                    value={`week-${i + 1}`}
                                  >
                                    <AccordionTrigger
                                      onClick={() => {
                                        setActiveTask(task);
                                        setShowTask(true);
                                      }}
                                      className="hover:no-underline"
                                    >
                                      <div className="flex items-center justify-between w-full mr-4">
                                        <div className="text-left">
                                          <h3 className="font-semibold">
                                            <Badge
                                              variant="secondary"
                                              className="text-xs"
                                            >
                                              Task {i + 1}:
                                            </Badge>{" "}
                                            {task?.title}
                                          </h3>

                                          <article
                                            dangerouslySetInnerHTML={{
                                              __html: task?.summary,
                                            }}
                                            className="text-xs text-muted-foreground [&>*>span]:!text-muted-foreground"
                                          ></article>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {task?.userTask?.isCompleted && (
                                            <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                                          )}
                                        </div>
                                      </div>
                                    </AccordionTrigger>
                                  </AccordionItem>
                                ))}
                              </Accordion>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="preview" className="flex-1 m-0">
                          <div className="h-full flex flex-col border">
                            <div className="flex items-center justify-between p-2 border-b bg-muted/30">
                              <div className="flex items-center gap-2 flex-1">
                                <div className="flex gap-1">
                                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <input
                                  type="text"
                                  value={previewUrl}
                                  onChange={(e) =>
                                    setPreviewUrl(e.target.value)
                                  }
                                  className="flex-1 px-2 py-1 text-xs bg-background border rounded"
                                />
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  onClick={() => {
                                    setPreviewUrl((prev) => {
                                      const url = new URL(
                                        prev,
                                        window.location.origin,
                                      );
                                      url.searchParams.set(
                                        "_t",
                                        Date.now() + "",
                                      );
                                      return url.toString();
                                    });
                                  }}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                                <a target="_blank" href={previewUrl}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                  >
                                    <Link className="h-3 w-3" />
                                  </Button>
                                </a>
                              </div>
                            </div>
                            <div className="flex-1 bg-white">
                              <iframe
                                src={previewUrl}
                                className="w-full h-full border-none"
                                title="Preview"
                              />
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="tools" className="flex-1 m-0">
                          <div className="h-full flex flex-col border rounded-lg">
                            <div className="p-3 border-b bg-muted/30">
                              <h3 className="font-medium text-sm flex items-center gap-2">
                                <Wrench className="h-4 w-4" />
                                Development Tools
                              </h3>
                            </div>
                            <ScrollArea className="flex-1 p-4">
                              <div className="space-y-3">
                                <Select
                                  value={fontSize.toString()}
                                  onValueChange={(value) =>
                                    setFontSize(Number.parseInt(value))
                                  }
                                >
                                  <SelectTrigger className="w-full h-8">
                                    <SelectValue placeholder="Select size" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="12">12</SelectItem>
                                    <SelectItem value="14">14</SelectItem>
                                    <SelectItem value="16">16</SelectItem>
                                    <SelectItem value="18">18</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </ScrollArea>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>

        <div className="bg-muted/20 border-t">
          <div className="flex w-full justify-start text-gray-400 px- gap- text-sm">
            <button
              onClick={() => setShowTerminal((prev) => !prev)}
              className="border-x rounded px-2 h-full hover:bg-secondary border-gray-800 py-1"
            >
              Terminal
            </button>
            <button
              onClick={() => {
                setIsRightPanelVisible((prev) => !prev);
                setActiveTab("tasks");
              }}
              className={`border-x rounded px-2 h-full hover:bg-secondary border-gray-800 py-1 ${
                activeTab === "tasks" ? "bg-secondary" : ""
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => {
                setIsRightPanelVisible((prev) => !prev);
                setActiveTab("preview");
              }}
              className={`border-x rounded px-2 h-full hover:bg-secondary border-gray-800 py-1 ${
                activeTab === "preview" ? "bg-secondary" : ""
              }`}
            >
              Browser
            </button>
          </div>
        </div>
      </div>

      <Dialog open={showTask} onOpenChange={() => setShowTask(false)}>
        <DialogContent className="w-full max-w-[60vw] sm:max-w-3xl md:max-w-5xl lg:max-w-7xl  max-h-[80vh] sm:max-h-[90vh] overflow-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{activeTask?.title}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            <div className="space-y-3 pt-4 w-full ">
              <div
                className={`flex items-center space-x-4 rounded-lg border p-4 transition-colors w-full`}
              >
                <div className="flex-1 space-y-1 min-w-0">
                  <article
                    dangerouslySetInnerHTML={{
                      __html: activeTask?.description,
                    }}
                    className="text-muted-foreground leading-relaxed [&>*>table]:p-3 [&>*>table]:border [&>*>code]:rounded-xl [&>*>code]:bg-zinc-800 [&>*>code]:p-1 [&>*>code]:text-sm [&>*>code]:font-medium [&>*>code]:text-zinc-100 [&>*>code]:overflow-x-auto w-full [&>*>li>pre]:mt-5 [&>*>li>pre]:rounded-xl [&>*>li>pre]:bg-zinc-800 [&>*>li>pre]:p-4 [&>*>li>pre]:text-sm [&>*>li>pre]:font-medium [&>*>li>pre]:text-zinc-100 [&>*>li>pre]:overflow-x-auto [&>*>li>a]:text-amber-300 [&>p>a]:text-amber-300 mx-auto w-full text-zinc-700 dark:text-zinc-300 [&>pre]:overflow-x-auto [&>h2]:text-2xl [&>h2]:font-bold [&>h3]:text-xl [&>h3]:font-bold [&>p]:mt-2 [&>p]:leading-relaxed [&>pre]:mt-5 [&>pre]:rounded-xl [&>pre]:bg-zinc-800 [&>pre]:p-4 [&>pre]:text-sm [&>pre]:font-medium [&>pre]:text-zinc-100 [&>ul]:mt-5 [&>ul]:flex [&>ul]:list-disc [&>ul]:flex-col [&>ul]:gap-2 [&>ul]:pl-6 [&>ol]:mt-5 [&>ol]:flex [&>ol]:list-decimal [&>ol]:flex-col [&>ol]:gap-2 [&>ol]:pl-6"
                  ></article>
                </div>
              </div>
            </div>
          </DialogDescription>

          <DialogFooter className="sticky bottom-0  pt-4 sm:pt-6">
            <Button variant="outline" onClick={() => setShowTask(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => setMarkAsCompleted(activeTask!)}
            >
              Mark Completed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <Settings className="h-5 w-5 text-[#F2C94C]" />
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
              <Settings className="h-5 w-5 text-[#F2C94C]" />
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
              <Settings className="h-5 w-5 text-[#F2C94C]" />
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
    </div>
  );
}
