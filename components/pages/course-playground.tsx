"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Play,
  Save,
  Download,
  Share,
  Plus,
  X,
  File,
  Folder,
} from "lucide-react";
import { routes } from "@/lib/routes";
import { executeCode } from "@/lib/executor";

interface CoursePlaygroundPageProps {
  courseId: string;
  playgroundId: string;
  onNavigate: (path: string) => void;
}

export function CoursePlaygroundPage({
  courseId,
  playgroundId,
  onNavigate,
}: CoursePlaygroundPageProps) {
  const [activeFile, setActiveFile] = useState("index.js");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [files, setFiles] = useState<Record<string, string>>({
    "index.js": `// Welcome to the JavaScript Playground!
// Write your code here and click "Run" to see the output


// Try some JavaScript basics:
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);

// Create a simple function
function greet(name) {
  return \`Hello, \${name}! Welcome to the playground.\`;
}

console.log(greet("Developer"));`,
    "utils.js": `// Utility functions
export function formatDate(date) {
  return date.toLocaleDateString();
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}`,
    "package.json": `{
  "name": "javascript-playground",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "lodash": "^4.17.21"
  }
}`,
  });

  // Mock playground data
  const playground = {
    id: playgroundId,
    title: "🚀 JavaScript Basics Sandbox",
    description: "Experiment with JavaScript fundamentals",
    language: "JavaScript",
    isOwned: true,
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput("Running code...\n");
    try {
      const lang = playground.language.toLowerCase().replace("javascript", "node");
      const result = await executeCode(files[activeFile], lang);
      if (!result.success) {
        setOutput(`Error: ${result.error ?? "Execution failed"}`);
      } else {
        const out = result.raw?.stdout || result.raw?.stderr || "";
        setOutput(out || "✅ Code executed with no output");
      }
    } catch {
      setOutput("Failed to connect to execution service");
    } finally {
      setIsRunning(false);
    }
  };

  const savePlayground = () => {
    // Playground is auto-saved via local state; explicit save TBD
  };

  const addNewFile = () => {
    const fileName = prompt("Enter file name:");
    if (fileName && !files[fileName]) {
      setFiles((prev) => ({
        ...prev,
        [fileName]: "// New file\n",
      }));
      setActiveFile(fileName);
    }
  };

  const deleteFile = (fileName: string) => {
    if (Object.keys(files).length > 1) {
      const newFiles = { ...files };
      delete newFiles[fileName];
      setFiles(newFiles);

      if (activeFile === fileName) {
        setActiveFile(Object.keys(newFiles)[0]);
      }
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith(".json")) return "📄";
    if (fileName.endsWith(".js") || fileName.endsWith(".ts")) return "📜";
    if (fileName.endsWith(".css")) return "🎨";
    if (fileName.endsWith(".html")) return "🌐";
    return "📄";
  };

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(routes.coursePlaygrounds(courseId))}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Playgrounds
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{playground.title}</h1>
            <p className="text-gray-600">{playground.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-yellow-100 text-yellow-800">
            {playground.language}
          </Badge>
          <Button variant="outline" size="sm" onClick={savePlayground}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-250px)]">
        {/* File Explorer */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Folder className="h-5 w-5" />
                  Files
                </CardTitle>
                <Button size="sm" variant="ghost" onClick={addNewFile}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.keys(files).map((fileName) => (
                <div
                  key={fileName}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                    activeFile === fileName
                      ? "bg-primary/10 text-blue-800"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => setActiveFile(fileName)}
                >
                  <div className="flex items-center gap-2">
                    <span>{getFileIcon(fileName)}</span>
                    <span className="text-sm font-medium">{fileName}</span>
                  </div>
                  {Object.keys(files).length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFile(fileName);
                      }}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Code Editor */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <File className="h-5 w-5" />
                  {activeFile}
                </CardTitle>
                <Button
                  onClick={runCode}
                  disabled={isRunning}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  {isRunning ? "Running..." : "Run Code"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="h-[calc(100%-80px)]">
              <textarea
                value={files[activeFile] || ""}
                onChange={(e) =>
                  setFiles((prev) => ({
                    ...prev,
                    [activeFile]: e.target.value,
                  }))
                }
                className="w-full h-full p-3 font-mono text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Write your code here..."
              />
            </CardContent>
          </Card>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Console Output</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-80px)]">
              <div className="bg-black text-green-400 p-3 rounded font-mono text-sm h-full overflow-auto">
                {output || 'Click "Run Code" to see output...'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Toolbar */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Language: {playground.language}</span>
          <span>Files: {Object.keys(files).length}</span>
          <span>Auto-save: Enabled</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            Reset to Template
          </Button>
        </div>
      </div>
    </div>
  );
}
