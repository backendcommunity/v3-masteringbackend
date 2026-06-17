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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  Terminal,
  CheckCircle2,
  FolderOpen,
  File,
  ChevronRight,
  ChevronDown,
  X,
  Download,
  Moon,
  Sun,
  Settings,
  BookOpen,
  Target,
  ExternalLink,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Editor from "@monaco-editor/react";

interface InterviewProjectEditorProps {
  project: any;
  onNavigate: (route: string) => void;
}

interface FileNode {
  name: string;
  type: "file" | "folder";
  icon: string;
  children?: FileNode[];
  content?: string;
  isOpen?: boolean;
  language?: string;
}

function InterviewProjectEditor({
  project,
  onNavigate,
}: InterviewProjectEditorProps) {
  const [activeFile, setActiveFile] = useState("index.js");
  const [openFiles, setOpenFiles] = useState(["index.js"]);
  const [editorTheme, setEditorTheme] = useState<"vs-dark" | "light">(
    "vs-dark"
  );
  const [fontSize, setFontSize] = useState(14);
  const [terminalOutput, setTerminalOutput] = useState([
    "Welcome to MB Interview Terminal",
    "$ npm install",
    "✓ Dependencies installed successfully",
    "$ npm start",
    "Server running on http://localhost:3000",
    "",
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(3600); // 60 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState([
    {
      name: "Basic functionality test",
      status: "passed",
      message: "All basic features working correctly",
    },
    {
      name: "Edge case handling test",
      status: "failed",
      message: "Need to handle empty input arrays",
    },
    {
      name: "Performance test",
      status: "pending",
      message: "Test not yet executed",
    },
    {
      name: "Code quality test",
      status: "passed",
      message: "Code follows best practices",
    },
  ]);
  const [currentScore, setCurrentScore] = useState(75);
  const terminalRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);

  const getLanguageFromFileName = (fileName: string): string => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "js":
      case "jsx":
        return "javascript";
      case "ts":
      case "tsx":
        return "typescript";
      case "json":
        return "json";
      case "html":
        return "html";
      case "css":
        return "css";
      case "scss":
      case "sass":
        return "scss";
      case "md":
        return "markdown";
      case "py":
        return "python";
      case "java":
        return "java";
      case "cpp":
      case "c":
        return "cpp";
      case "php":
        return "php";
      case "rb":
        return "ruby";
      case "go":
        return "go";
      case "rs":
        return "rust";
      case "sql":
        return "sql";
      case "xml":
        return "xml";
      case "yaml":
      case "yml":
        return "yaml";
      default:
        return "plaintext";
    }
  };

  const [fileTree, setFileTree] = useState<FileNode[]>([
    {
      name: "src",
      type: "folder",
      icon: "📁",
      isOpen: true,
      children: [
        {
          name: "index.js",
          type: "file",
          icon: "📄",
          language: "javascript",
          content: `// Interview Project - Task Management System
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Task model
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  completed: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  dueDate: Date,
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', taskSchema);

// Routes
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// TODO: Implement PUT and DELETE endpoints
// TODO: Add input validation
// TODO: Add error handling middleware

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
});

module.exports = app;`,
        },
        {
          name: "components",
          type: "folder",
          icon: "📁",
          isOpen: false,
          children: [
            {
              name: "TaskList.js",
              type: "file",
              icon: "📄",
              language: "javascript",
              content: `// Task List Component
import React, { useState, useEffect } from 'react';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId) => {
    // TODO: Implement task toggle functionality
  };

  if (loading) return <div>Loading tasks...</div>;

  return (
    <div className="task-list">
      <h2>Task Management</h2>
      {tasks.length === 0 ? (
        <p>No tasks found. Create your first task!</p>
      ) : (
        <ul>
          {tasks.map(task => (
            <li key={task._id} className={task.completed ? 'completed' : ''}>
              <span>{task.title}</span>
              <button onClick={() => toggleTask(task._id)}>
                {task.completed ? 'Undo' : 'Complete'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TaskList;`,
            },
          ],
        },
      ],
    },
    {
      name: "package.json",
      type: "file",
      icon: "📦",
      language: "json",
      content: `{
  "name": "interview-task-manager",
  "version": "1.0.0",
  "description": "Task Management System - Interview Project",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "cors": "^2.8.5",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.4",
    "supertest": "^6.3.3"
  }
}`,
    },
    {
      name: "README.md",
      type: "file",
      icon: "📖",
      language: "markdown",
      content: `# Task Management System - Interview Project

## Overview
Build a full-stack task management application with the following features:

## Requirements
- [ ] Create, read, update, delete tasks
- [ ] Task priority levels (low, medium, high)
- [ ] Due date functionality
- [ ] Mark tasks as complete/incomplete
- [ ] Filter tasks by status and priority
- [ ] Search functionality
- [ ] Responsive design

## Technical Stack
- Backend: Node.js + Express + MongoDB
- Frontend: React
- Testing: Jest + Supertest

## Getting Started
1. Install dependencies: \`npm install\`
2. Start development server: \`npm run dev\`
3. Run tests: \`npm test\`

## API Endpoints
- GET /api/tasks - Get all tasks
- POST /api/tasks - Create new task
- PUT /api/tasks/:id - Update task
- DELETE /api/tasks/:id - Delete task

## Evaluation Criteria
- Code quality and organization
- Error handling
- Testing coverage
- UI/UX design
- Performance considerations`,
    },
  ]);

  const [code, setCode] = useState(fileTree[0].children?.[0]?.content || "");
  const [currentLanguage, setCurrentLanguage] = useState("javascript");

  useEffect(() => {
    const file = findFile(fileTree, activeFile);
    if (file) {
      setCurrentLanguage(file.language || getLanguageFromFileName(activeFile));
    }
  }, [activeFile, fileTree]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleFolder = (path: string[]) => {
    const updateTree = (
      nodes: FileNode[],
      currentPath: string[]
    ): FileNode[] => {
      return nodes.map((node) => {
        if (currentPath.length === 1 && node.name === currentPath[0]) {
          return { ...node, isOpen: !node.isOpen };
        } else if (
          currentPath.length > 1 &&
          node.name === currentPath[0] &&
          node.children
        ) {
          return {
            ...node,
            children: updateTree(node.children, currentPath.slice(1)),
          };
        }
        return node;
      });
    };
    setFileTree(updateTree(fileTree, path));
  };

  const findFile = (nodes: FileNode[], fileName: string): FileNode | null => {
    for (const node of nodes) {
      if (node.name === fileName && node.type === "file") {
        return node;
      }
      if (node.children) {
        const found = findFile(node.children, fileName);
        if (found) return found;
      }
    }
    return null;
  };

  const openFile = (fileName: string) => {
    const file = findFile(fileTree, fileName);
    if (file && file.content) {
      setActiveFile(fileName);
      setCode(file.content);
      setCurrentLanguage(file.language || getLanguageFromFileName(fileName));
      if (!openFiles.includes(fileName)) {
        setOpenFiles([...openFiles, fileName]);
      }
    }
  };

  const closeFile = (fileName: string) => {
    const newOpenFiles = openFiles.filter((f) => f !== fileName);
    setOpenFiles(newOpenFiles);
    if (activeFile === fileName && newOpenFiles.length > 0) {
      setActiveFile(newOpenFiles[0]);
      const file = findFile(fileTree, newOpenFiles[0]);
      if (file?.content) {
        setCode(file.content);
        setCurrentLanguage(
          file.language || getLanguageFromFileName(newOpenFiles[0])
        );
      }
    }
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (terminalInput.trim()) {
      const command = terminalInput.trim();
      let output = "";

      // Simulate some basic commands
      switch (command) {
        case "npm install":
          output = "✓ Dependencies installed successfully";
          break;
        case "npm start":
          output = "Server running on http://localhost:3000";
          break;
        case "npm test":
          output = "✓ Running test suite...";
          setTimeout(() => {
            setTerminalOutput((prev) => [
              ...prev,
              "✓ 4 tests passed, 1 test failed",
            ]);
          }, 1000);
          break;
        case "npm run dev":
          output = "✓ Development server started on http://localhost:3000";
          break;
        case "ls":
          output = "src/  package.json  README.md  node_modules/";
          break;
        case "pwd":
          output = "/workspace/interview-task-manager";
          break;
        case "clear":
          setTerminalOutput(["Welcome to MB Interview Terminal"]);
          setTerminalInput("");
          return;
        default:
          output = `Command '${command}' not found`;
      }

      setTerminalOutput((prev) => [...prev, `$ ${command}`, output, ""]);
      setTerminalInput("");
      setTimeout(() => {
        terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight);
      }, 100);
    }
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

  const handleRunTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      setTestResults([
        {
          name: "Basic functionality test",
          status: "passed",
          message: "All basic features working correctly",
        },
        {
          name: "Edge case handling test",
          status: "passed",
          message: "Empty input arrays handled correctly",
        },
        {
          name: "Performance test",
          status: "passed",
          message: "Response time under 100ms",
        },
        {
          name: "Code quality test",
          status: "failed",
          message: "Missing error handling in some functions",
        },
      ]);
      setCurrentScore(85);
      setIsRunning(false);
    }, 2000);
  };

  const renderFileTree = (nodes: FileNode[], path: string[] = []) => {
    return nodes.map((node) => (
      <div key={node.name} className="select-none">
        <div
          className={`flex items-center gap-2 px-2 py-1 rounded text-sm cursor-pointer hover:bg-muted/50 ${
            activeFile === node.name ? "bg-muted" : ""
          }`}
          style={{ paddingLeft: `${(path.length + 1) * 12}px` }}
          onClick={() => {
            if (node.type === "folder") {
              toggleFolder([...path, node.name]);
            } else {
              openFile(node.name);
            }
          }}
        >
          {node.type === "folder" && (
            <span className="w-4 h-4 flex items-center justify-center">
              {node.isOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </span>
          )}
          <span className="text-xs">{node.icon}</span>
          <span className="truncate">{node.name}</span>
        </div>
        {node.type === "folder" && node.isOpen && node.children && (
          <div>{renderFileTree(node.children, [...path, node.name])}</div>
        )}
      </div>
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="flex-1 h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Interview</Badge>
              <Badge
                variant="outline"
                className="border-primary text-primary"
              >
                In Progress
              </Badge>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span
                  className={`font-mono ${
                    timeRemaining < 600
                      ? "text-red-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              {project?.title || "Task Management System"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Editor Settings */}
          <div className="flex items-center gap-2 mr-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setEditorTheme(editorTheme === "vs-dark" ? "light" : "vs-dark")
              }
            >
              {editorTheme === "vs-dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Select
              value={fontSize.toString()}
              onValueChange={(value) => setFontSize(Number.parseInt(value))}
            >
              <SelectTrigger className="w-16 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="14">14</SelectItem>
                <SelectItem value="16">16</SelectItem>
                <SelectItem value="18">18</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm">
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button size="sm">
            <Play className="mr-2 h-4 w-4" />
            Run
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-2 border-b">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Interview Progress</span>
          <span>{currentScore}%</span>
        </div>
        <Progress value={currentScore} className="h-1" />
      </div>

      {/* Main Editor Layout */}
      <div className="flex-1 flex">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Sidebar - File Explorer */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full flex flex-col border-r bg-muted/20">
              <div className="p-3 border-b bg-muted/30">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  EXPLORER
                </h3>
              </div>
              <div className="p-2 border-b bg-muted/10">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  INTERVIEW PROJECT
                </p>
              </div>
              <ScrollArea className="flex-1 p-2">
                {renderFileTree(fileTree)}
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Center - Code Editor */}
          <ResizablePanel defaultSize={55} minSize={40}>
            <div className="h-full flex flex-col">
              {/* File Tabs */}
              <div className="flex items-center border-b bg-muted/20">
                {openFiles.map((fileName) => (
                  <div
                    key={fileName}
                    className={`flex items-center gap-2 px-3 py-2 text-sm border-r cursor-pointer hover:bg-muted/50 ${
                      activeFile === fileName ? "bg-background" : ""
                    }`}
                    onClick={() => {
                      setActiveFile(fileName);
                      const file = findFile(fileTree, fileName);
                      if (file?.content) {
                        setCode(file.content);
                        setCurrentLanguage(
                          file.language || getLanguageFromFileName(fileName)
                        );
                      }
                    }}
                  >
                    <File className="h-3 w-3" />
                    <span>{fileName}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeFile(fileName);
                      }}
                      className="hover:bg-muted rounded p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Monaco Editor */}
              <div className="flex-1 relative">
                <Editor
                  height="100%"
                  language={currentLanguage}
                  theme={editorTheme}
                  value={code}
                  onChange={(value) => setCode(value || "")}
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
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Panel - Instructions & Tools */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
            <div className="h-full flex flex-col">
              <Tabs
                defaultValue="instructions"
                className="h-full flex flex-col"
              >
                <TabsList className="grid w-full grid-cols-4 h-12">
                  <TabsTrigger
                    value="instructions"
                    className="flex flex-col items-center gap-1 py-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span className="text-xs">Instructions</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="tests"
                    className="flex flex-col items-center gap-1 py-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs">Tests</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="terminal"
                    className="flex flex-col items-center gap-1 py-2"
                  >
                    <Terminal className="h-4 w-4" />
                    <span className="text-xs">Terminal</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="score"
                    className="flex flex-col items-center gap-1 py-2"
                  >
                    <Star className="h-4 w-4" />
                    <span className="text-xs">Score</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="instructions" className="flex-1 m-0">
                  <div className="h-full flex flex-col border rounded-lg">
                    <div className="p-3 border-b bg-muted/30">
                      <h3 className="font-medium text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Project Requirements
                      </h3>
                    </div>
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Overview
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Build a full-stack task management application with
                            CRUD operations, priority levels, and search
                            functionality.
                          </p>
                        </div>

                        <Separator />

                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Requirements
                          </h4>
                          <div className="space-y-2">
                            {[
                              "Create, read, update, delete tasks",
                              "Task priority levels (low, medium, high)",
                              "Due date functionality",
                              "Mark tasks as complete/incomplete",
                              "Filter tasks by status and priority",
                              "Search functionality",
                              "Responsive design",
                              "Error handling",
                              "Input validation",
                              "Unit tests",
                            ].map((req, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-2 text-sm"
                              >
                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-muted-foreground">
                                  {req}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Technologies
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {[
                              "Node.js",
                              "Express",
                              "MongoDB",
                              "React",
                              "Jest",
                            ].map((tech) => (
                              <Badge
                                key={tech}
                                variant="outline"
                                className="text-xs"
                              >
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <ExternalLink className="h-4 w-4" />
                            Evaluation Criteria
                          </h4>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div>• Code quality and organization</div>
                            <div>• Error handling and validation</div>
                            <div>• Testing coverage</div>
                            <div>• UI/UX design</div>
                            <div>• Performance considerations</div>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>

                <TabsContent value="tests" className="flex-1 m-0">
                  <div className="h-full flex flex-col border rounded-lg">
                    <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                      <h3 className="font-medium text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Test Results
                      </h3>
                      <Button
                        size="sm"
                        onClick={handleRunTests}
                        disabled={isRunning}
                      >
                        <Play className="mr-2 h-3 w-3" />
                        {isRunning ? "Running..." : "Run Tests"}
                      </Button>
                    </div>
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-3">
                        {testResults.map((test, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border ${
                              test.status === "passed"
                                ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                                : test.status === "failed"
                                ? "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                                : "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusIcon(test.status)}
                              <span className="font-medium text-sm">
                                {test.name}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground pl-6">
                              {test.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>

                <TabsContent value="terminal" className="flex-1 m-0">
                  <div className="h-full flex flex-col bg-black text-green-400 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-2 bg-gray-800">
                      <span className="text-xs font-medium">Terminal</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400"
                        onClick={() =>
                          setTerminalOutput([
                            "Welcome to MB Interview Terminal",
                          ])
                        }
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <ScrollArea className="flex-1 p-3" ref={terminalRef}>
                      <div className="space-y-1 font-mono text-xs">
                        {terminalOutput.map((line, index) => (
                          <div
                            key={index}
                            className={
                              line?.startsWith("$")
                                ? "text-yellow-400"
                                : line?.startsWith("✓")
                                ? "text-green-400"
                                : "text-gray-300"
                            }
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <form
                      onSubmit={handleTerminalSubmit}
                      className="p-3 border-t border-gray-700"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-400 font-mono text-xs">
                          $
                        </span>
                        <input
                          type="text"
                          value={terminalInput}
                          onChange={(e) => setTerminalInput(e.target.value)}
                          className="flex-1 bg-transparent border-none outline-none text-green-400 font-mono text-xs"
                          placeholder="Enter command..."
                        />
                      </div>
                    </form>
                  </div>
                </TabsContent>

                <TabsContent value="score" className="flex-1 m-0">
                  <div className="h-full flex flex-col border rounded-lg">
                    <div className="p-3 border-b bg-muted/30">
                      <h3 className="font-medium text-sm flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Interview Score
                      </h3>
                    </div>
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Current Score</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-semibold">
                              {currentScore}/100
                            </span>
                          </div>
                        </div>
                        <Progress value={currentScore} className="h-2" />

                        <Separator />

                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">
                            Scoring Breakdown
                          </h4>
                          {[
                            {
                              criteria: "Code Quality",
                              score: 22,
                              maxScore: 25,
                            },
                            {
                              criteria: "Functionality",
                              score: 20,
                              maxScore: 25,
                            },
                            { criteria: "Testing", score: 18, maxScore: 20 },
                            {
                              criteria: "Error Handling",
                              score: 15,
                              maxScore: 20,
                            },
                            {
                              criteria: "UI/UX Design",
                              score: 10,
                              maxScore: 10,
                            },
                          ].map((item, index) => (
                            <div key={index} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                  {item.criteria}
                                </span>
                                <span className="text-xs">
                                  {item.score}/{item.maxScore}
                                </span>
                              </div>
                              <Progress
                                value={(item.score / item.maxScore) * 100}
                                className="h-1"
                              />
                            </div>
                          ))}
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Feedback</h4>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                              <span>Good code structure and organization</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                              <span>
                                Proper use of React hooks and state management
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <XCircle className="h-3 w-3 text-red-600 mt-1 flex-shrink-0" />
                              <span>Missing error handling in API calls</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-3 w-3 text-yellow-600 mt-1 flex-shrink-0" />
                              <span>Could improve input validation</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

// Export both named and default for compatibility
export { InterviewProjectEditor };
export default InterviewProjectEditor;
