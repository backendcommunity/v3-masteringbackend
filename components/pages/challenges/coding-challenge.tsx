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
  BookOpen,
  Target,
  Trophy,
  Clock,
  Code,
  TestTube,
} from "lucide-react";
import Editor from "@monaco-editor/react";

interface CodingChallengeProps {
  challenge: {
    id: string;
    title: string;
    description: string;
    difficulty: "Easy" | "Medium" | "Hard";
    timeLimit: number;
    points: number;
    requirements: string[];
    testCases: Array<{
      input: string;
      expectedOutput: string;
      description: string;
    }>;
    starterCode: string;
    language: string;
  };
  onComplete: () => void;
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

export function CodingChallengeComponent({
  challenge,
  onComplete,
}: CodingChallengeProps) {
  const [activeFile, setActiveFile] = useState("solution.js");
  const [openFiles, setOpenFiles] = useState(["solution.js"]);
  const [editorTheme, setEditorTheme] = useState<"vs-dark" | "light">(
    "vs-dark"
  );
  const [fontSize, setFontSize] = useState(14);
  const [terminalOutput, setTerminalOutput] = useState([
    "Welcome to Coding Challenge Terminal",
    "Ready to test your solution...",
    "",
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const [testResults, setTestResults] = useState<
    Array<{
      passed: boolean;
      input: string;
      expected: string;
      actual: string;
      description: string;
    }>
  >([]);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(challenge.timeLimit * 60);
  const [isRunning, setIsRunning] = useState(false);
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
      case "py":
        return "python";
      case "java":
        return "java";
      case "cpp":
      case "c":
        return "cpp";
      case "cs":
        return "csharp";
      case "go":
        return "go";
      case "rs":
        return "rust";
      case "php":
        return "php";
      case "rb":
        return "ruby";
      default:
        return "javascript";
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
          name: "solution.js",
          type: "file",
          icon: "📄",
          language: challenge.language.toLowerCase(),
          content: challenge.starterCode,
        },
        {
          name: "test.js",
          type: "file",
          icon: "🧪",
          language: "javascript",
          content: `// Test cases for ${challenge.title}
const { solution } = require('./solution');

const testCases = ${JSON.stringify(challenge.testCases, null, 2)};

function runTests() {
  let passed = 0;
  const results = [];
  
  testCases.forEach((testCase, index) => {
    try {
      const result = solution(${challenge.testCases
        .map((tc) => tc.input)
        .join(", ")});
      const expected = ${challenge.testCases[0]?.expectedOutput || "null"};
      const success = JSON.stringify(result) === JSON.stringify(expected);
      
      results.push({
        test: index + 1,
        passed: success,
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: result,
        description: testCase.description
      });
      
      if (success) passed++;
    } catch (error) {
      results.push({
        test: index + 1,
        passed: false,
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: error.message,
        description: testCase.description
      });
    }
  });
  
  return { passed, total: testCases.length, results };
}

module.exports = { runTests };`,
        },
      ],
    },
    {
      name: "README.md",
      type: "file",
      icon: "📖",
      language: "markdown",
      content: `# ${challenge.title}

## Description
${challenge.description}

## Difficulty
${challenge.difficulty}

## Time Limit
${challenge.timeLimit} minutes

## MB
${challenge.points} MB

## Requirements
${challenge.requirements.map((req) => `- ${req}`).join("\n")}

## Test Cases
${challenge.testCases
  .map(
    (tc, i) => `
### Test Case ${i + 1}
- **Input:** ${tc.input}
- **Expected Output:** ${tc.expectedOutput}
- **Description:** ${tc.description}
`
  )
  .join("\n")}`,
    },
  ]);

  const [code, setCode] = useState(challenge.starterCode);
  const [currentLanguage, setCurrentLanguage] = useState(
    challenge.language.toLowerCase()
  );

  // Timer effect
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isRunning, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
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

      switch (command) {
        case "run":
        case "test":
          output = "Running tests...";
          runTests();
          break;
        case "clear":
          setTerminalOutput(["Welcome to Coding Challenge Terminal"]);
          setTerminalInput("");
          return;
        case "help":
          output = "Available commands: run, test, clear, help";
          break;
        default:
          output = `Command '${command}' not found. Type 'help' for available commands.`;
      }

      setTerminalOutput((prev) => [...prev, `$ ${command}`, output, ""]);
      setTerminalInput("");
      setTimeout(() => {
        terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight);
      }, 100);
    }
  };

  const runTests = () => {
    setIsRunning(true);

    setTimeout(() => {
      const mockResults = challenge.testCases.map((testCase, index) => ({
        passed: Math.random() > 0.3,
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: testCase.expectedOutput,
        description: testCase.description,
      }));

      setTestResults(mockResults);
      const passedTests = mockResults.filter((r) => r.passed).length;
      const newScore = Math.round(
        (passedTests / mockResults.length) * challenge.points
      );
      setScore(newScore);

      setTerminalOutput((prev) => [
        ...prev,
        `Tests completed: ${passedTests}/${mockResults.length} passed`,
        `Score: ${newScore}/${challenge.points} MB`,
        "",
      ]);

      // Call onComplete if all tests pass
      if (passedTests === mockResults.length) {
        onComplete();
      }

      setIsRunning(false);
    }, 2000);
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
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

  return (
    <div className="flex-1 h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  challenge.difficulty === "Hard"
                    ? "destructive"
                    : challenge.difficulty === "Medium"
                    ? "default"
                    : "secondary"
                }
              >
                {challenge.difficulty}
              </Badge>
              <Badge
                variant="outline"
                className="border-primary text-primary"
              >
                <Trophy className="w-3 h-3 mr-1" />
                {challenge.points} MB
              </Badge>
              <Badge
                variant="outline"
                className={
                  timeRemaining < 300
                    ? "border-red-600 text-red-600"
                    : "border-green-600 text-green-600"
                }
              >
                <Clock className="w-3 h-3 mr-1" />
                {formatTime(timeRemaining)}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {challenge.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
          <Button size="sm" onClick={runTests} disabled={isRunning}>
            <Play className="mr-2 h-4 w-4" />
            {isRunning ? "Running..." : "Run Tests"}
          </Button>
        </div>
      </div>

      {/* Score Progress */}
      <div className="px-4 py-2 border-b">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Score Progress</span>
          <span>
            {score}/{challenge.points} MB
          </span>
        </div>
        <Progress value={(score / challenge.points) * 100} className="h-1" />
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
                  CHALLENGE
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

          {/* Right Panel - Instructions, Tests, Terminal, Score */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
            <div className="h-full flex flex-col">
              <Tabs
                defaultValue="instructions"
                className="h-full flex flex-col"
              >
                <TabsList className="grid w-full grid-cols-4 h-10">
                  <TabsTrigger
                    value="instructions"
                    className="flex items-center gap-1 px-2"
                  >
                    <BookOpen className="h-3 w-3" />
                    <span className="text-xs">Instructions</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="tests"
                    className="flex items-center gap-1 px-2"
                  >
                    <TestTube className="h-3 w-3" />
                    <span className="text-xs">Tests</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="terminal"
                    className="flex items-center gap-1 px-2"
                  >
                    <Terminal className="h-3 w-3" />
                    <span className="text-xs">Terminal</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="score"
                    className="flex items-center gap-1 px-2"
                  >
                    <Trophy className="h-3 w-3" />
                    <span className="text-xs">Score</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="instructions" className="flex-1 m-0 p-0">
                  <div className="h-full flex flex-col border rounded-lg">
                    <div className="p-3 border-b bg-muted/30">
                      <h3 className="font-medium text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Challenge Instructions
                      </h3>
                    </div>
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Description
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {challenge.description}
                          </p>
                        </div>

                        <Separator />

                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Requirements
                          </h4>
                          <div className="space-y-2">
                            {challenge.requirements.map((req, index) => (
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
                            <Code className="h-4 w-4" />
                            Test Cases
                          </h4>
                          <div className="space-y-3">
                            {challenge.testCases.map((testCase, index) => (
                              <div
                                key={index}
                                className="p-3 bg-muted/30 rounded-lg"
                              >
                                <div className="text-xs font-medium text-muted-foreground mb-1">
                                  Test Case {index + 1}
                                </div>
                                <div className="space-y-1 text-sm">
                                  <div>
                                    <strong>Input:</strong> {testCase.input}
                                  </div>
                                  <div>
                                    <strong>Expected:</strong>{" "}
                                    {testCase.expectedOutput}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {testCase.description}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>

                <TabsContent value="tests" className="flex-1 m-0 p-0">
                  <div className="h-full flex flex-col border rounded-lg">
                    <div className="p-3 border-b bg-muted/30">
                      <h3 className="font-medium text-sm flex items-center gap-2">
                        <TestTube className="h-4 w-4" />
                        Test Results
                      </h3>
                    </div>
                    <ScrollArea className="flex-1 p-4">
                      {testResults.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <TestTube className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Run tests to see results</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {testResults.map((result, index) => (
                            <div
                              key={index}
                              className={`p-3 rounded-lg border ${
                                result.passed
                                  ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                                  : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2
                                  className={`h-4 w-4 ${
                                    result.passed
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                />
                                <span className="text-sm font-medium">
                                  Test {index + 1}{" "}
                                  {result.passed ? "Passed" : "Failed"}
                                </span>
                              </div>
                              <div className="text-xs space-y-1">
                                <div>
                                  <strong>Input:</strong> {result.input}
                                </div>
                                <div>
                                  <strong>Expected:</strong> {result.expected}
                                </div>
                                <div>
                                  <strong>Actual:</strong> {result.actual}
                                </div>
                                <div className="text-muted-foreground">
                                  {result.description}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </TabsContent>

                <TabsContent value="terminal" className="flex-1 m-0 p-0">
                  <div className="h-full flex flex-col bg-black text-green-400 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-2 bg-gray-800">
                      <span className="text-xs font-medium">Terminal</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400"
                        onClick={() =>
                          setTerminalOutput([
                            "Welcome to Coding Challenge Terminal",
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
                                : line.includes("passed") ||
                                  line.includes("Score:")
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
                          placeholder="Enter command (run, test, clear, help)..."
                        />
                      </div>
                    </form>
                  </div>
                </TabsContent>

                <TabsContent value="score" className="flex-1 m-0 p-0">
                  <div className="h-full flex flex-col border rounded-lg">
                    <div className="p-3 border-b bg-muted/30">
                      <h3 className="font-medium text-sm flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        Score & Progress
                      </h3>
                    </div>
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary mb-2">
                            {score}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            out of {challenge.points} MB
                          </div>
                          <Progress
                            value={(score / challenge.points) * 100}
                            className="mt-3"
                          />
                        </div>

                        <Separator />

                        <div className="text-center">
                          <div className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
                            <Clock className="h-4 w-4" />
                            Time Remaining
                          </div>
                          <div
                            className={`text-2xl font-mono ${
                              timeRemaining < 300
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {formatTime(timeRemaining)}
                          </div>
                        </div>

                        <Separator />

                        {testResults.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm mb-3">
                              Test Summary
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Tests Passed:</span>
                                <span className="font-medium text-green-600">
                                  {testResults.filter((r) => r.passed).length}/
                                  {testResults.length}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Success Rate:</span>
                                <span className="font-medium">
                                  {Math.round(
                                    (testResults.filter((r) => r.passed)
                                      .length /
                                      testResults.length) *
                                      100
                                  )}
                                  %
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        <Separator />

                        <div className="space-y-2">
                          <h4 className="font-medium text-sm mb-3">
                            Quick Actions
                          </h4>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            size="sm"
                            onClick={runTests}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Run All Tests
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            size="sm"
                          >
                            <Save className="mr-2 h-4 w-4" />
                            Save Progress
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            size="sm"
                            onClick={onComplete}
                          >
                            <Share className="mr-2 h-4 w-4" />
                            Submit Solution
                          </Button>
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
export default CodingChallengeComponent;
